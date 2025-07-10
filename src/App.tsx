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

    // Stare pentru hover și tooltip
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredElementInfo, setHoveredElementInfo] = useState<{
        name: string;
        type: string;
        value: any;
    } | null>(null);

    /**
     * Callback pentru a primi modificările din JSONTree și a actualiza editedContent.
     * @param newData - Noile date JSON modificate de către JSONTree
     */
    const handleDataChange = (newData: any) => {
        setEditedContent(newData);
        console.log("Datele au fost modificate în JSONTree:", newData);
    };

    /**
     * Funcție pentru a modifica un element specific din structura JSON bazată pe path
     * @param path - Calea către elementul care trebuie modificat
     * @param newValue - Noua valoare pentru element
     */
    const handlePathBasedChange = (path: (string | number)[], newValue: any) => {
        // Creez o copie profundă a datelor pentru a nu modifica originalul
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        if (path.length === 0) {
            // Dacă path-ul este gol, înlocuiesc întreaga structură (root)
            setEditedContent(newValue);
            return;
        }
        
        // Navighează către părintele elementului de modificat
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        
        // Modifică valoarea la path-ul specificat
        const lastKey = path[path.length - 1];
        current[lastKey] = newValue;
        
        // Actualizez starea cu noile date
        setEditedContent(newData);
        console.log(`Element modified at path: [${path.join(', ')}]`, newValue);
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
     * Descarcă fișierul JSON modificat pe calculatorul utilizatorului.
     */
    const handleSaveChanges = () => {
        if (!editedContent || !selectedFile) {
            alert("Nu există date de salvat!");
            return;
        }

        try {
            // Convertesc obiectul JSON modificat înapoi în string formatat
            const jsonString = JSON.stringify(editedContent, null, 2); // null, 2 = formatare frumoasă cu 2 spații
            
            // Creez un Blob (obiect binary) cu conținutul JSON
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Creez un URL temporar pentru blob
            const url = URL.createObjectURL(blob);
            
            // Creez un element <a> invizibil pentru a declanșa descărcarea
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            
            // Generez numele fișierului (adaug "_modified" înainte de extensie)
            const originalName = selectedFile.name;
            const nameWithoutExtension = originalName.replace('.json', '');
            const newFileName = `${nameWithoutExtension}_modified.json`;
            
            downloadLink.download = newFileName;
            
            // Adaug elementul în DOM, fac click pe el, apoi îl șterg
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Curăț URL-ul temporar pentru a elibera memoria
            URL.revokeObjectURL(url);
            
            // Actualizez datele originale cu cele modificate (pentru a preveni reset-ul)
            setFileContent(editedContent);
            
            console.log(`Fișierul "${newFileName}" a fost descărcat cu succes!`);
            alert(`Fișierul "${newFileName}" a fost salvat cu succes!\nVerifică folderul de descărcări.`);
            
        } catch (error) {
            console.error("Eroare la salvarea fișierului:", error);
            alert("A apărut o eroare la salvarea fișierului!");
        }
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


/*
    ** Implementare hover și tooltip

*/
    // Funcție care se execută când mouse-ul INTRĂ peste un element
    const handleMouseEnter = (elementName: string, elementType: string, elementValue: any) => {
        setIsHovered(true); // Marchează că mouse-ul este peste ceva
        setHoveredElementInfo({ // Salvează informațiile despre element
            name: elementName,
            type: elementType,
            value: elementValue
        });
    };

    // Funcție care se execută când mouse-ul PĂRĂSETE un element
    const handleMouseLeave = () => {
        setIsHovered(false); // Marchează că mouse-ul nu mai este peste nimic
        setHoveredElementInfo(null); // Șterge informațiile
    };

    // Stare pentru poziția tooltip-ului (unde să apară pe ecran)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0});

    // Funcție care se execută când mouse-ul SE MIȘCĂ peste un element
    const handleMouseMove = (event: React.MouseEvent) => {
        setTooltipPosition({
            x: event.clientX + 10, // Poziția X a mouse-ului + 10 pixeli (să nu fie exact pe cursor)
            y: event.clientY - 30  // Poziția Y a mouse-ului - 30 pixeli (să fie deasupra cursor-ului)
        });
    };

    /**
     * Funcție pentru ștergerea unui element din structura JSON bazată pe path
     * @param pathToDelete - Calea către elementul care trebuie șters
     */
    const handleDeleteElement = (pathToDelete: (string | number)[]) => {
        if (pathToDelete.length === 0) {
            alert("Cannot delete root element!");
            return;
        }

        // Creez o copie profundă a datelor pentru a nu modifica originalul
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculez calea către părintele elementului de șters
        const parentPath = pathToDelete.slice(0, -1); // Toate elementele mai puțin ultimul
        const keyToDelete = pathToDelete[pathToDelete.length - 1]; // Ultimul element = cheia de șters
        
        // Navighează către părintele elementului de șters
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Șterge elementul în funcție de tipul părintelui
        if (Array.isArray(parent)) {
            // Pentru array-uri, folosesc splice pentru a șterge elementul la index
            parent.splice(keyToDelete as number, 1);
        } else {
            // Pentru obiecte, folosesc delete pentru a șterge proprietatea
            delete parent[keyToDelete];
        }
        
        // Actualizez starea cu noile date
        setEditedContent(newData);
        console.log(`Element deleted at path: [${pathToDelete.join(', ')}]`);
    };

    /**
     * Funcție pentru redenumirea unui element din structura JSON bazată pe path
     * @param pathToRename - Calea către elementul care trebuie redenumit
     * @param newKey - Noul nume (cheie) pentru element
     */
    const handleRenameElement = (pathToRename: (string | number)[], newKey: string) => {
        if (pathToRename.length === 0) {
            alert("Cannot rename root element!");
            return;
        }

        // Validare: verifică dacă noul nume este valid
        if (!newKey || newKey.trim() === '') {
            alert("New name cannot be empty!");
            return;
        }

        // Creez o copie profundă a datelor pentru a nu modifica originalul
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculez calea către părintele elementului de redenumit
        const parentPath = pathToRename.slice(0, -1); // Toate elementele mai puțin ultimul
        const oldKey = pathToRename[pathToRename.length - 1]; // Ultimul element = cheia veche
        
        // Navighează către părintele elementului de redenumit
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Redenumirea se poate face doar pentru obiecte (nu pentru array-uri)
        if (Array.isArray(parent)) {
            alert("Cannot rename array elements! Array elements are accessed by index.");
            return;
        }
        
        // Verifică dacă noul nume există deja
        if (parent.hasOwnProperty(newKey)) {
            const overwrite = confirm(`Key "${newKey}" already exists. Do you want to overwrite it?`);
            if (!overwrite) return;
        }
        
        // Salvează valoarea veche
        const value = parent[oldKey];
        
        // Reconstruiește obiectul păstrând ordinea originală
        const newParent: any = {};
        for (const key in parent) {
            if (key === oldKey) {
                // Când ajungem la cheia veche, o înlocuim cu cea nouă
                newParent[newKey] = value;
            } else {
                // Pentru toate celelalte chei, le copiem așa cum sunt
                newParent[key] = parent[key];
            }
        }
        
        // Înlocuiește obiectul părinte cu versiunea reordonată
        Object.keys(parent).forEach(key => delete parent[key]);
        Object.assign(parent, newParent);
        
        // Actualizez starea cu noile date
        setEditedContent(newData);
        console.log(`Element renamed from "${oldKey}" to "${newKey}" at path: [${parentPath.join(', ')}]`);
    };

    /**
     * Funcție pentru modificarea valorii unui element din structura JSON bazată pe path
     * @param pathToChange - Calea către elementul a cărui valoare trebuie modificată
     * @param newValue - Noua valoare pentru element
     */
    const handleChangeValue = (pathToChange: (string | number)[], newValue: any) => {
        if (pathToChange.length === 0) {
            alert("Cannot change root element value directly!");
            return;
        }

        // Creez o copie profundă a datelor pentru a nu modifica originalul
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculez calea către părintele elementului de modificat
        const parentPath = pathToChange.slice(0, -1); // Toate elementele mai puțin ultimul
        const keyToChange = pathToChange[pathToChange.length - 1]; // Ultimul element = cheia de modificat
        
        // Navighează către părintele elementului de modificat
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Modifică valoarea
        parent[keyToChange] = newValue;
        
        // Actualizez starea cu noile date
        setEditedContent(newData);
        console.log(`Value changed at path: [${pathToChange.join(', ')}], New value:`, newValue);
    };

    /**
     * Funcție pentru crearea unui fișier JSON nou
     */
    const handleCreateNewFile = () => {
        const newFileName = prompt(`Enter the name for the new file (without .json extension):`);
        if (newFileName && newFileName.trim() !== '') {
            // Creez un obiect JSON de bază gol
            const emptyJSON = {};
            
            // Simulez un fișier cu numele dat
            const simulatedFile = new File(['{}'], `${newFileName.trim()}.json`, {
                type: 'application/json'
            });
            
            // Setez starea aplicației cu noul fișier
            setSelectedFile(simulatedFile);
            setFileContent(emptyJSON);
            setEditedContent(emptyJSON);
            setIsEditing(true); // Intru direct în modul de editare
            
            console.log(`New file created: ${newFileName}.json`);
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

              <button 
                onClick={handleCreateNewFile}
                className='text-2xl mb-4 text-center mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-200 cursor-pointer w-full'
              >
                ✨ Click here to create a new file
              </button>
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
                        📥 Download changes
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
                <JSONTree 
                  data={editedContent} 
                  isEditing={isEditing} 
                  onDataChange={handleDataChange}
                  onPathBasedChange={handlePathBasedChange}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                  path={[]} // Calea inițială pentru root este un array gol
                  onDeleteElement={handleDeleteElement} // Pasez funcția de delete
                  onRenameElement={handleRenameElement} // Pasez funcția de redenumire
                  onChangeValue={handleChangeValue} // Pasez funcția de modificare valori
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip-ul care se afișează când mouse-ul este peste un element */}
      {isHovered && hoveredElementInfo && (
        <div
          style={{
            position: 'fixed',        // Se poziționează față de fereastra browser-ului
            left: tooltipPosition.x,  // Poziția pe orizontală
            top: tooltipPosition.y,   // Poziția pe verticală
            zIndex: 1000,            // Să fie deasupra tuturor elementelor
            pointerEvents: 'none'     // Mouse-ul să treacă prin el (să nu interfereze)
          }}
          className="bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs border border-gray-600 shadow-lg"
        >
          <div className="font-semibold">{hoveredElementInfo.name}</div>
          <div className="text-gray-300">Type: {hoveredElementInfo.type}</div>
          {hoveredElementInfo.type === 'string' && (
            <div className="text-gray-400 max-w-xs truncate">
              Value: "{hoveredElementInfo.value}"
            </div>
          )}
          {hoveredElementInfo.type === 'number' && (
            <div className="text-blue-300">
              Value: {hoveredElementInfo.value}
            </div>
          )}
          {hoveredElementInfo.type === 'boolean' && (
            <div className="text-yellow-300">
              Value: {hoveredElementInfo.value ? 'true' : 'false'}
            </div>
          )}
          {hoveredElementInfo.type === 'object' && (
            <div className="text-purple-300">
              Object with {Object.keys(hoveredElementInfo.value || {}).length} properties
            </div>
          )}
          {hoveredElementInfo.type === 'array' && (
            <div className="text-orange-300">
              Array with {(hoveredElementInfo.value || []).length} elements
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Exportă componenta App pentru a putea fi folosită în alte părți ale aplicației (ex: main.tsx)
export default App;
