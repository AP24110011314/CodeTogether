import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useRoomStore } from '../../store/roomStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { getSocket } from '../../lib/socket.js';
import { SocketIOProvider } from '../../lib/SocketIOProvider.js';
import { updateCursorStyles, cleanupCursorStyles } from '../../lib/cursorStyles.js';

export function CodeEditor({ onEditorMount }) {
  const { room, language, preferences, role } = useRoomStore();
  const user = useAuthStore((state) => state.user);
  const [isSynced, setIsSynced] = useState(false);
  const [providerStatus, setProviderStatus] = useState('connecting');

  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingListenerRef = useRef(null);
  const awarenessListenerRef = useRef(null);

  const isReadOnly = role === 'viewer';

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

    // Set awareness local state: user info and initial typing false
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

    // MonacoBinding with awareness for remote cursors and selections
    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider.awareness
    );

    provider.on('synced', (synced) => setIsSynced(synced));
    provider.on('status', ({ status }) => setProviderStatus(status));

    // Handle awareness change: dynamic cursor styles and roomStore awarenessUsers
    const handleAwarenessChange = () => {
      updateCursorStyles(provider.awareness);

      const awarenessList = [];
      provider.awareness.getStates().forEach((state, clientID) => {
        if (state?.user) {
          awarenessList.push({
            clientId: clientID,
            user: state.user,
            typing: Boolean(state.typing),
            isLocal: clientID === provider.awareness.clientID,
          });
        }
      });
      useRoomStore.getState().setAwarenessUsers(awarenessList);
    };

    provider.awareness.on('change', handleAwarenessChange);
    awarenessListenerRef.current = handleAwarenessChange;
    handleAwarenessChange();

    // Typing activity indicator in Monaco editor
    const typingListener = editor.onDidChangeModelContent(() => {
      if (isReadOnly) return;
      if (!provider.awareness.getLocalState()?.typing) {
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

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
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

  return (
    <div style={styles.editorContainer}>
      {isReadOnly && (
        <div style={styles.readOnlyBanner}>
          You are viewing this room with read-only permissions. Code editing is disabled.
        </div>
      )}
      {!isSynced && providerStatus === 'connected' && (
        <div style={styles.syncingBanner}>Synchronizing document state...</div>
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
          theme={preferences.theme}
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
            padding: { top: 12, bottom: 12 },
          }}
          loading={
            <div style={styles.loadingContainer}>
              <span>Loading Monaco Editor...</span>
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
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    backgroundColor: '#1e1e1e',
  },
  readOnlyBanner: {
    backgroundColor: '#854d0e',
    color: '#fef08a',
    fontSize: '12px',
    padding: '6px 12px',
    textAlign: 'center',
    fontWeight: '500',
    borderBottom: '1px solid #a16207',
  },
  syncingBanner: {
    backgroundColor: '#1e3a8a',
    color: '#93c5fd',
    fontSize: '12px',
    padding: '4px 12px',
    textAlign: 'center',
    fontWeight: '500',
  },
  disconnectedBanner: {
    backgroundColor: '#991b1b',
    color: '#fecaca',
    fontSize: '12px',
    padding: '4px 12px',
    textAlign: 'center',
    fontWeight: '500',
  },
  editorWrapper: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#94a3b8',
    fontSize: '14px',
  },
};
