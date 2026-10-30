import React, { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { useRoomStore } from '../../store/roomStore.js';
import { getSocket } from '../../lib/socket.js';
import { SocketIOProvider } from '../../lib/SocketIOProvider.js';

export function CodeEditor() {
  const { room, language, preferences, role } = useRoomStore();
  const [isSynced, setIsSynced] = useState(false);
  const [providerStatus, setProviderStatus] = useState('connecting');

  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  const isReadOnly = role === 'viewer';

  const setupBinding = (editor) => {
    const socket = getSocket();
    if (!socket || !room?.id) return;

    // Clean up previous binding if any
    if (bindingRef.current) bindingRef.current.destroy();
    if (providerRef.current) providerRef.current.destroy();
    if (ydocRef.current) ydocRef.current.destroy();

    const doc = new Y.Doc();
    const provider = new SocketIOProvider(socket, room.id, doc);
    const yText = doc.getText('monaco');
    const model = editor.getModel();

    const binding = new MonacoBinding(
      yText,
      model,
      new Set([editor])
    );

    provider.on('synced', (synced) => setIsSynced(synced));
    provider.on('status', ({ status }) => setProviderStatus(status));

    ydocRef.current = doc;
    providerRef.current = provider;
    bindingRef.current = binding;
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    setupBinding(editor);
  };

  // Rebind if room changes
  useEffect(() => {
    if (editorRef.current && room?.id) {
      setupBinding(editorRef.current);
    }

    return () => {
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
