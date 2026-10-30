import { create } from 'zustand';
import {
  getRoomBySlugApi,
  createRoomApi,
  deleteRoomApi,
  updateRoomApi,
} from '../api/rooms.js';

const getInitialPreference = (key, fallback) => {
  try {
    const val = localStorage.getItem(`codetogether:${key}`);
    return val !== null ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
};

const setStoredPreference = (key, val) => {
  try {
    localStorage.setItem(`codetogether:${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Failed to store preference', e);
  }
};

export const useRoomStore = create((set, get) => ({
  room: null,
  role: null,
  language: 'javascript',
  editorCode: '// Welcome to CodeTogether!\n// Start coding collaboratively here.\n\nfunction hello() {\n  console.log("Hello, world!");\n}\n\nhello();\n',
  isLoading: false,
  error: null,
  members: [],
  awarenessUsers: [],
  connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'

  preferences: {
    theme: getInitialPreference('theme', 'vs-dark'),
    fontSize: getInitialPreference('fontSize', 14),
    minimap: getInitialPreference('minimap', false),
  },

  setTheme: (theme) => {
    setStoredPreference('theme', theme);
    set((state) => ({
      preferences: { ...state.preferences, theme },
    }));
  },

  setFontSize: (fontSize) => {
    setStoredPreference('fontSize', fontSize);
    set((state) => ({
      preferences: { ...state.preferences, fontSize },
    }));
  },

  setMinimap: (minimap) => {
    setStoredPreference('minimap', minimap);
    set((state) => ({
      preferences: { ...state.preferences, minimap },
    }));
  },

  setLanguage: (language) => {
    const { room } = get();
    set({
      language,
      room: room ? { ...room, language } : null,
    });
  },

  setEditorCode: (editorCode) => set({ editorCode }),

  setMembers: (members) => set({ members }),

  setAwarenessUsers: (awarenessUsers) => set({ awarenessUsers }),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRoom: (room, role) =>
    set({
      room,
      role,
      language: room?.language || 'javascript',
      members: room?.members || get().members,
    }),

  loadRoom: async (slug, query = {}) => {
    set({ isLoading: true, error: null });
    try {
      const data = await getRoomBySlugApi(slug, query);
      set({
        room: data.room,
        role: data.role,
        language: data.room.language || 'javascript',
        isLoading: false,
        error: null,
      });
      return data;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to load room';
      const code = err.response?.data?.error?.code || 'ERROR';
      set({ isLoading: false, error: { message, code } });
      throw err;
    }
  },

  createRoom: async (roomData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await createRoomApi(roomData);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({
        isLoading: false,
        error: err.response?.data?.error?.message || 'Failed to create room',
      });
      throw err;
    }
  },

  updateRoomLanguage: async (language) => {
    const { room } = get();
    if (!room) return;
    try {
      await updateRoomApi(room.id, { language });
      set({ language, room: { ...room, language } });
    } catch (err) {
      console.error('Failed to update language', err);
    }
  },

  deleteRoom: async (id) => {
    await deleteRoomApi(id);
    if (get().room?.id === id) {
      set({ room: null, role: null, members: [] });
    }
  },
}));
