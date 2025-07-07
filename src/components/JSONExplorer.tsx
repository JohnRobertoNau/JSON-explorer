import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Download, Edit3, Save, X } from 'lucide-react';
import JSONViewer from './JSONViewer';
import JSONEditor from './JSONEditor';
import FileTree from './FileTree';

interface JSONFile {
  id: string;
  name: string;
  content: any;
  isModified: boolean;
}

const JSONExplorer: React.FC = () => {
  const [files, setFiles] = useState<JSONFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('view');
  const [editContent, setEditContent] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const content = JSON.parse(reader.result as string);
          const newFile: JSONFile = {
            id: Date.now().toString(),
            name: file.name,
            content,
            isModified: false
          };
          setFiles(prev => [...prev, newFile]);
        } catch (error) {
          alert('Fișierul nu este un JSON valid!');
        }
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    }
  });

  const activeFileData = files.find(f => f.id === activeFile);

  const handleSave = () => {
    if (activeFile && viewMode === 'edit') {
      try {
        const newContent = JSON.parse(editContent);
        setFiles(prev => prev.map(f => 
          f.id === activeFile 
            ? { ...f, content: newContent, isModified: false }
            : f
        ));
        setViewMode('view');
      } catch (error) {
        alert('JSON invalid! Verifică sintaxa.');
      }
    }
  };

  const handleEdit = () => {
    if (activeFileData) {
      setEditContent(JSON.stringify(activeFileData.content, null, 2));
      setViewMode('edit');
    }
  };

  const handleDownload = () => {
    if (activeFileData) {
      const blob = new Blob([JSON.stringify(activeFileData.content, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = activeFileData.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCloseFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (activeFile === fileId) {
      setActiveFile(null);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="json-sidebar w-64 flex-shrink-0">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">JSON Explorer</h1>
        </div>
        
        {/* File Upload Area */}
        <div 
          {...getRootProps()} 
          className={`m-4 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-500 bg-opacity-10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-400">
              {isDragActive
                ? 'Eliberează fișierele aici...'
                : 'Drag & drop sau click pentru a încărca fișiere JSON'}
            </p>
          </div>
        </div>

        {/* File Tree */}
        <FileTree
          files={files}
          activeFile={activeFile}
          onFileSelect={setActiveFile}
          onFileClose={handleCloseFile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="json-toolbar">
          <div className="flex items-center space-x-2">
            {activeFileData && (
              <>
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="font-medium">{activeFileData.name}</span>
                {activeFileData.isModified && (
                  <span className="text-orange-400 text-sm">●</span>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFileData && (
              <>
                {viewMode === 'view' ? (
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded hover:bg-gray-700 transition-colors"
                    title="Editează"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-2 rounded hover:bg-gray-700 transition-colors text-green-400"
                      title="Salvează"
                    >
                      <Save className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('view')}
                      className="p-2 rounded hover:bg-gray-700 transition-colors text-red-400"
                      title="Anulează"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleDownload}
                  className="p-2 rounded hover:bg-gray-700 transition-colors"
                  title="Descarcă"
                >
                  <Download className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="json-main flex-1 overflow-auto">
          {!activeFileData ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">
                  Selectează un fișier JSON pentru a începe explorarea
                </p>
              </div>
            </div>
          ) : viewMode === 'view' ? (
            <JSONViewer data={activeFileData.content} />
          ) : (
            <JSONEditor
              content={editContent}
              onChange={setEditContent}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default JSONExplorer;
