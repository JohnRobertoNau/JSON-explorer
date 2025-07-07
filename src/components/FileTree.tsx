import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { FileText, X } from 'lucide-react';

interface JSONFile {
  id: string;
  name: string;
  content: any;
  isModified: boolean;
}

interface FileTreeProps {
  files: JSONFile[];
  activeFile: string | null;
  onFileSelect: (fileId: string) => void;
  onFileClose: (fileId: string) => void;
}

interface DraggedFile {
  id: string;
  type: string;
}

const FileItem: React.FC<{
  file: JSONFile;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onMove: (draggedId: string, targetId: string) => void;
}> = ({ file, isActive, onSelect, onClose, onMove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'file',
    item: { id: file.id, type: 'file' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'file',
    drop: (item: DraggedFile) => {
      if (item.id !== file.id) {
        onMove(item.id, file.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const ref = (node: HTMLDivElement | null) => {
    drag(drop(node));
  };

  return (
    <div
      ref={ref}
      className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white' 
          : 'hover:bg-gray-700 text-gray-300'
      } ${isDragging ? 'opacity-50' : ''} ${isOver ? 'bg-blue-500 bg-opacity-30' : ''}`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <FileText className="h-4 w-4 flex-shrink-0" />
        <span className="truncate text-sm">{file.name}</span>
        {file.isModified && (
          <span className="text-orange-400 text-xs">●</span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

const FileTree: React.FC<FileTreeProps> = ({ files, activeFile, onFileSelect, onFileClose }) => {
  const handleFileMove = (draggedId: string, targetId: string) => {
    // Implementează reordonarea fișierelor prin drag & drop
    console.log(`Moving file ${draggedId} to ${targetId}`);
  };

  if (files.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Niciun fișier încărcat</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Fișiere ({files.length})
        </h3>
      </div>
      <div className="p-2 space-y-1">
        {files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            isActive={activeFile === file.id}
            onSelect={() => onFileSelect(file.id)}
            onClose={() => onFileClose(file.id)}
            onMove={handleFileMove}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;
