import React from 'react';
import Editor from '@monaco-editor/react';
import { useRoomStore } from '../../store/roomStore.js';

export function CodeEditor() {
  const { language, editorCode, setEditorCode, preferences, role } = useRoomStore();

  const isReadOnly = role === 'viewer';

  const handleEditorChange = (value) => {
    setEditorCode(value || '');
  };

  return (
    <div style={styles.editorContainer}>
      {isReadOnly && (
        <div style={styles.readOnlyBanner}>
          You are viewing this room with read-only permissions. Code editing is disabled.
        </div>
      )}
      <div style={styles.editorWrapper}>
        <Editor
          height="100%"
          language={language}
          value={editorCode}
          theme={preferences.theme}
          onChange={handleEditorChange}
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
