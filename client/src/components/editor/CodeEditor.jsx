import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { getSocket } from '../../lib/socket.js';
import { SocketIOProvider } from '../../lib/SocketIOProvider.js';
import { updateCursorStyles, cleanupCursorStyles } from '../../lib/cursorStyles.js';
import { Loader2, Eye, RefreshCw } from 'lucide-react';

export function CodeEditor({ onEditorMount }) {
  const { room, language, preferences, role } = useRoomStore();
  const user = useAuthStore((state) => state.user);
  const appTheme = useThemeStore((state) => state.theme);
  const [isSynced, setIsSynced] = useState(false);
  const [providerStatus, setProviderStatus] = useState('connecting');

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingListenerRef = useRef(null);
  const awarenessListenerRef = useRef(null);

  const isReadOnly = role === 'viewer';

  const registerCustomThemes = (monaco) => {
    monaco.editor.defineTheme('codetogether-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '627199', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'F472B6', fontStyle: 'bold' },
        { token: 'string', foreground: '6EE7B7' },
        { token: 'number', foreground: 'FBBF24' },
        { token: 'type', foreground: '38BDF8' },
        { token: 'function', foreground: '7C93FF' },
      ],
      colors: {
        'editor.background': '#0B1020',
        'editor.foreground': '#E8ECF8',
        'editorCursor.foreground': '#7C93FF',
        'editor.lineHighlightBackground': '#11193677',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#7C93FF',
        'editor.selectionBackground': '#4F6BF640',
        'editor.inactiveSelectionBackground': '#4F6BF620',
        'editorIndentGuide.background': '#1E293B',
        'editorIndentGuide.activeBackground': '#4F6BF6',
      },
    });

    monaco.editor.defineTheme('codetogether-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'D946EF', fontStyle: 'bold' },
        { token: 'string', foreground: '0D9488' },
        { token: 'number', foreground: 'D97706' },
        { token: 'type', foreground: '0284C7' },
        { token: 'function', foreground: '4F6BF6' },
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#0F172A',
        'editorCursor.foreground': '#4F6BF6',
        'editor.lineHighlightBackground': '#EEF2FF99',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#4F6BF6',
        'editor.selectionBackground': '#4F6BF626',
        'editor.inactiveSelectionBackground': '#4F6BF614',
        'editorIndentGuide.background': '#E2E8F0',
        'editorIndentGuide.activeBackground': '#4F6BF6',
      },
    });
  };

  const cleanupSession = () => {
    if (typingListenerRef.current) {
      typingListenerRef.current.dispose();
      typingListenerRef.current = null;
    }
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (awarenessListenerRef.current && providerRef.current?.awareness) {
      providerRef.current.awareness.off('change', awarenessListenerRef.current);
      awarenessListenerRef.current = null;
    }
    cleanupCursorStyles();
    useRoomStore.getState().setAwarenessUsers([]);

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
  };

  const setupBinding = (editor) => {
    const socket = getSocket();
    if (!socket || !room?.id) return;

    cleanupSession();

    const doc = new Y.Doc();
    const provider = new SocketIOProvider(socket, room.id, doc);
    const yText = doc.getText('monaco');
    const model = editor.getModel();

    if (user) {
      provider.awareness.setLocalState({
        user: {
          id: user.id,
          name: user.name,
          color: user.avatarColor || '#38bdf8',
        },
        typing: false,
      });
    }

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider.awareness
    );

    provider.on('synced', (synced) => setIsSynced(synced));
    provider.on('status', ({ status }) => setProviderStatus(status));

    const handleAwarenessChange = () => {
      updateCursorStyles(provider.awareness);

      const awarenessList = [];
      provider.awareness.getStates().forEach((state, clientID) => {
        if (state?.user) {
          awarenessList.push({
            clientId: clientID,
            user: state.user,
            typing: Boolean(state.typing),
            cursor: state.cursor,
          });
        }
      });
      useRoomStore.getState().setAwarenessUsers(awarenessList);
    };

    provider.awareness.on('change', handleAwarenessChange);
    awarenessListenerRef.current = handleAwarenessChange;

    const typingListener = editor.onDidChangeModelContent(() => {
      if (provider.awareness) {
        provider.awareness.setLocalStateField('typing', true);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (provider.awareness) {
          provider.awareness.setLocalStateField('typing', false);
        }
      }, 1500);
    });
    typingListenerRef.current = typingListener;

    ydocRef.current = doc;
    providerRef.current = provider;
    bindingRef.current = binding;
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    registerCustomThemes(monaco);

    if (typeof onEditorMount === 'function') {
      onEditorMount(editor);
    }
    setupBinding(editor);
  };

  // Rebind if room changes
  useEffect(() => {
    if (editorRef.current && room?.id) {
      setupBinding(editorRef.current);
    }
    return () => {
      cleanupSession();
    };
  }, [room?.id]);

  // Update read-only setting on live role changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ readOnly: isReadOnly });
    }
  }, [isReadOnly]);

  // Resolve active Monaco theme
  const activeMonacoTheme =
    preferences.theme === 'vs' || preferences.theme === 'light'
      ? 'codetogether-light'
      : preferences.theme === 'hc-black'
      ? 'hc-black'
      : preferences.theme === 'vs-dark'
      ? 'codetogether-dark'
      : appTheme === 'dark'
      ? 'codetogether-dark'
      : 'codetogether-light';

  return (
    <div style={styles.editorContainer}>
      {isReadOnly && (
        <div style={styles.readOnlyBanner}>
          <Eye size={15} style={{ flexShrink: 0 }} />
          <span>You are viewing this workspace with read-only permissions. Code editing is disabled.</span>
        </div>
      )}
      {!isSynced && providerStatus === 'connected' && (
        <div style={styles.syncingBanner}>
          <RefreshCw size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Synchronizing document state...</span>
        </div>
      )}
      {providerStatus === 'disconnected' && (
        <div style={styles.disconnectedBanner}>
          Disconnected from document server. Reconnecting...
        </div>
      )}
      <div style={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language}
          theme={activeMonacoTheme}
          onMount={handleEditorDidMount}
          options={{
            readOnly: isReadOnly,
            fontSize: preferences.fontSize,
            minimap: { enabled: preferences.minimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            padding: { top: 14, bottom: 14 },
            fontFamily: 'var(--font-mono)',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
          loading={
            <div style={styles.loadingContainer}>
              <Loader2 size={24} className="spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading Monaco Canvas...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}

const styles = {
  editorContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--editor-bg)',
  },
  readOnlyBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    color: 'var(--accent)',
    padding: '8px 16px',
    fontSize: '0.8125rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
    zIndex: 10,
  },
  syncingBanner: {
    backgroundColor: 'rgba(79, 107, 246, 0.1)',
    color: 'var(--primary)',
    padding: '6px 16px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(79, 107, 246, 0.2)',
    zIndex: 10,
  },
  disconnectedBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: 'var(--danger)',
    padding: '8px 16px',
    fontSize: '0.8125rem',
    textAlign: 'center',
    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
    zIndex: 10,
  },
  editorWrapper: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  loadingContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: 'var(--editor-bg)',
  },
};
