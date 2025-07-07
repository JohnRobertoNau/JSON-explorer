import React, { useState, useRef } from 'react';
import './index.css';
import JSONTree from './components/JSONTree';

function App() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<any>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Funcția pentru procesarea fișierului (folosită și pentru input și pentru drag&drop)
    const processFile = (file: File) => {
        setSelectedFile(file);
        
        // Citește conținutul fișierului
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const content = JSON.parse(result);
                    setFileContent(content);
                    console.log('Fișier încărcat cu succes:', file.name);
                }
            } catch (error) {
                alert('Fișierul nu este un JSON valid!');
            }
        };
        reader.readAsText(file);
    };

    // Funcția pentru procesarea fișierului selectat prin input
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    // Funcția pentru deschiderea File Explorer-ului
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    // Funcții pentru Drag & Drop
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            
            // Verifică dacă e fișier JSON
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                processFile(file);
            } else {
                alert('Te rog selectează doar fișiere JSON!');
            }
        }
    };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col">
      {/* Input invizibil pentru selectarea fișierelor */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Conținutul principal */}
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-grow">
        <h1 className="text-4xl font-bold text-center mb-4 text-blue-400">
          JSON Explorer
        </h1>
        <p className="text-center text-gray-400 mb-8">
          A graphic editor for JSON files.
        </p>
        
        <div className={`bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col ${fileContent ? 'flex-grow' : ''}`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
        >
          <h2 className="text-2xl font-semibold mb-4 text-green-400 text-center">
            {isDragActive 
              ? 'Drop the file here! 🎯' 
              : 'Please select your file to edit or drag and drop it here.'
            }
          </h2>
    
          <div 
            onClick={handleButtonClick}
            className={`p-4 rounded-lg text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'bg-green-500 border-2 border-green-300 border-dashed text-white scale-105' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <p className="font-semibold">
              {isDragActive 
                ? '📁 Drop the JSON file here!' 
                : 'Click here to browse from your computer'
              }
            </p>
          </div>

          {/* Zonă de Drag & Drop vizuală */}
          <div className={`mt-6 p-8 border-2 border-dashed rounded-lg text-center transition-all duration-200 ${
            isDragActive 
              ? 'border-green-400 bg-green-500 bg-opacity-20 scale-105' 
              : 'border-gray-600 hover:border-gray-500'
          }`}>
            <div className="text-4xl mb-4">
              {isDragActive ? '🎯' : '📁'}
            </div>
            <p className="text-gray-400">
              {isDragActive 
                ? 'Drop the file here!' 
                : 'Or drag and drop the file here'
              }
            </p>
          </div>

          {/* Afișează informații despre fișierul selectat */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                File selected:
              </h3>
              <p className="text-gray-300">Nume: {selectedFile.name}</p>
              <p className="text-gray-300">Dimensiune: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {/* Afișează conținutul JSON cu Tree View */}
          {fileContent && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg flex flex-col flex-grow">
              <h3 className="text-lg font-semibold text-green-400 mb-4">
                📊 JSON Explorer - Tree View:
              </h3>
              <div className="bg-gray-800 p-4 rounded-lg overflow-auto flex-grow">
                <JSONTree data={fileContent} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
