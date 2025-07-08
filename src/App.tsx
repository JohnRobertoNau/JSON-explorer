// Importarea bibliotecilor și componentelor necesare
import React, { useState, useRef } from 'react'; // React și hook-urile pentru state și referințe
import './index.css'; // Stilurile globale (inclusiv Tailwind CSS)
import JSONTree from './components/JSONTree'; // Componenta pentru afișarea arborescentă a JSON-ului

// Definirea componentei principale a aplicației
function App() {
    // --- STATE MANAGEMENT ---

    // Starea pentru fișierul selectat (obiectul File)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Starea pentru conținutul JSON parsat din fișier (original, neschimbat)
    const [fileContent, setFileContent] = useState<any>(null);

    // Starea pentru conținutul JSON modificat (doar în modul de editare)
    const [editedContent, setEditedContent] = useState<any>(null);

    // Starea pentru a detecta dacă un fișier este tras deasupra zonei de drop
    const [isDragActive, setIsDragActive] = useState(false);

    // Stare nouă pentru a controla modul de editare
    const [isEditing, setIsEditing] = useState(false);

    /**
     * Callback pentru a primi modificările din JSONTree și a actualiza editedContent.
     * @param newData - Noile date JSON modificate de către JSONTree
     */
    const handleDataChange = (newData: any) => {
        setEditedContent(newData);
        console.log("Datele au fost modificate în JSONTree:", newData);
    };

    /**
     * Handler pentru a intra în modul de editare.
     */
    const handleEditFile = () => {
      // Nu mai resetăm starea, ci activăm modul de editare
      setIsEditing(true);
      console.log("S-a intrat în modul de editare.");
    }

    /**
     * Handler pentru a ieși din modul de editare.
     */
    const handleExitEditMode = () => {
      setIsEditing(false);
      // Resetăm editedContent la valorile originale pentru a anula modificările nesalvate
      setEditedContent(fileContent);
      console.log("S-a ieșit din modul de editare și modificările nesalvate au fost anulate.");
    }

    /**
     * Handler pentru salvarea modificărilor.
     */
    const handleSaveChanges = () => {
      // TODO
      alert("Funcționalitatea de salvare va fi implementată în viitor!");
      console.log("Se salvează modificările...");
    }

    const handleDeletionFile = () => {
      setSelectedFile(null);
      setFileContent(null);
      setEditedContent(null); // Resetăm și conținutul de editare
      setIsEditing(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }

      console.log("Starea a fost resetata");
    }

    // --- REFS ---
    // Referință către elementul de input (de tip 'file') pentru a-l putea accesa programatic
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- LOGIC FUNCTIONS ---

    /**
     * Funcția centrală pentru procesarea unui fișier.
     * Citește fișierul, îl parsează ca JSON și actualizează starea aplicației.
     * @param file - Fișierul care trebuie procesat.
     */
    const processFile = (file: File) => {
        setSelectedFile(file); // Salvează informațiile despre fișier
        
        const reader = new FileReader(); // Inițializează un cititor de fișiere
        // Setează ce se întâmplă după ce fișierul este citit
        reader.onload = (e) => {
            try {
                const result = e.target?.result; // Extrage conținutul citit
                if (typeof result === 'string') {
                    const content = JSON.parse(result); // Parsează string-ul ca JSON
                    setFileContent(content); // Actualizează starea cu obiectul JSON original
                    setEditedContent(content); // Inițializează și versiunea de editare
                    console.log('Fișier încărcat cu succes:', file.name);
                }
            } catch (error) {
                // Gestionează eroarea în cazul în care fișierul nu este un JSON valid
                alert('Fișierul nu este un JSON valid!');
                setFileContent(null); // Resetează conținutul original
                setEditedContent(null); // Resetează și conținutul de editare
                setSelectedFile(null); // Resetează fișierul selectat
            }
        };
        // Pornește citirea fișierului ca text
        reader.readAsText(file);
    };

    /**
     * Handler pentru evenimentul de selectare a unui fișier prin input-ul clasic.
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; // Preia primul fișier selectat
        if (file) {
            processFile(file); // Procesează fișierul
        }
    };

    /**
     * Handler pentru click-ul pe buton; deschide fereastra de selecție a fișierelor.
     */
    const handleButtonClick = () => {
        fileInputRef.current?.click(); // Simulează un click pe input-ul ascuns
    };

    // --- DRAG & DROP HANDLERS ---

    /**
     * Handler pentru când un fișier este tras deasupra zonei de drop.
     */
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault(); // Previne comportamentul default al browser-ului
        setIsDragActive(true); // Activează starea vizuală de drag
    };

    /**
     * Handler pentru când un fișier părăsește zona de drop.
     */
    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false); // Dezactivează starea vizuală de drag
    };

    /**
     * Handler pentru când un fișier este eliberat (dropped) în zona specificată.
     */
    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);
        
        const files = event.dataTransfer.files; // Preia fișierele din eveniment
        if (files.length > 0) {
            const file = files[0];
            
            // Verifică dacă fișierul este de tip JSON
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                processFile(file); // Procesează fișierul
            } else {
                alert('Te rog selectează doar fișiere JSON!');
            }
        }
    };

  // --- RENDERED COMPONENT (JSX) ---
  return (
    // Containerul principal al aplicației, stilizat cu Flexbox pentru aliniere
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col">
      
      {/* Input de tip 'file' ascuns, folosit pentru a deschide fereastra de selecție */}
      <input
        type="file"
        ref={fileInputRef} // Legătura cu referința creată mai sus
        accept=".json" // Acceptă doar fișiere .json
        style={{ display: 'none' }} // Ascunde elementul
        onChange={handleFileSelect} // Atașează handler-ul pentru selecție
      />

      {/* Container pentru conținutul principal, centrat și cu lățime maximă */}
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-grow">
        <h1 className="text-4xl font-bold text-center mb-4 text-blue-400">
          JSON Explorer
        </h1>
        <p className="text-center text-gray-400 mb-8">
          A graphic editor for JSON files.
        </p>
        
        {/* Containerul principal pentru interacțiune (dropzone) */}
        {/* Clasa 'flex-grow' este adăugată condiționat doar dacă există conținut de afișat */}
        <div className={`bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col ${fileContent ? 'flex-grow' : ''}`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
        >
          {/* --- ZONA DE SELECTARE FIȘIER (Afișată doar dacă nu avem conținut) --- */}
          {!fileContent && (
            <>
              {/* Titlul dinamic care se schimbă în funcție de starea de drag */}
              <h2 className="text-2xl font-semibold mb-4 text-green-400 text-center">
                {isDragActive 
                  ? 'Drop the file here! 🎯' 
                  : 'Please select your file to edit or drag and drop it here.'
                }
              </h2>
        
              {/* Butonul vizibil pentru a selecta un fișier */}
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

              {/* Zona vizuală de Drag & Drop, cu stiluri dinamice */}
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
            </>
          )}

          {/* --- ZONA DE AFIȘARE CONȚINUT (Afișată doar dacă avem fișier selectat) --- */}

          {/* Secțiune care se afișează doar dacă un fișier a fost selectat */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                File selected:
              </h3>
              <p className="text-gray-300">Nume: {selectedFile.name}</p>
              <p className="text-gray-300">Dimensiune: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {/* Secțiune care se afișează doar dacă un fișier JSON a fost parsat cu succes */}
          {fileContent && (
            // Containerul pentru tree view, care crește pentru a umple spațiul rămas
            <div className="mt-6 p-4 bg-gray-700 rounded-lg flex flex-col flex-grow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-green-400">
                  📊 JSON Explorer - Tree View:
                </h3>
                {/* Container pentru a grupa butoanele */}
                <div className="flex gap-2">
                  {/* Butoanele pentru modul de editare */}
                  {isEditing ? (
                    <>
                      {/* Butonul pentru salvarea modificărilor */}
                      <button
                        className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                        onClick={handleSaveChanges}
                      >
                        💾 Save Changes
                      </button>
                      {/* Butonul pentru ieșirea din modul de editare */}
                      <button
                        className='px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                        onClick={handleExitEditMode}
                      >
                        🚪 Exit Edit Mode
                      </button>
                    </>
                  ) : (
                    /* Butonul de Editare (doar când nu suntem în edit mode) */
                    <button
                      className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                      onClick={handleEditFile}
                    >
                      Edit File
                    </button>
                  )}
                  {/* Butonul pentru a selecta un alt fisier (tot timpul vizibil) */}
                  <button
                    className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                    onClick={handleDeletionFile}
                  >
                    Choose another file
                  </button>
                </div>
              </div>

              {/* Container cu scroll pentru conținutul JSON, care se extinde */}
              <div className="bg-gray-800 p-4 rounded-lg overflow-auto flex-grow">
                {/* Afișăm un indicator visual când suntem în modul de editare */}
                {isEditing && (
                  <div className="mb-3 p-2 bg-yellow-600 bg-opacity-20 rounded border border-yellow-500">
                    <p className="text-yellow-400 text-sm">
                      🖊️ Modul de editare activ - Fă click-dreapta pe elementele din arbore pentru opțiuni
                    </p>
                  </div>
                )}
                {/* Componenta JSONTree primește datele parsate și starea de editare */}
                <JSONTree data={editedContent} isEditing={isEditing} onDataChange={handleDataChange} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Exportă componenta App pentru a putea fi folosită în alte părți ale aplicației (ex: main.tsx)
export default App;
