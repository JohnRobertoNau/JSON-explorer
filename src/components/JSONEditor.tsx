import React from 'react';

interface JSONEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

const JSONEditor: React.FC<JSONEditorProps> = ({ content, onChange, onSave }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="p-4 h-full">
      <div className="h-full bg-gray-800 rounded-lg overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none outline-none"
          placeholder="Editează JSON-ul aici..."
          style={{
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            lineHeight: '1.5',
            tabSize: 2
          }}
        />
      </div>
      <div className="mt-4 text-sm text-gray-400">
        <p>💡 Tip: Folosește Ctrl+S pentru a salva rapid</p>
      </div>
    </div>
  );
};

export default JSONEditor;
