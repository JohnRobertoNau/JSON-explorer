// Importarea bibliotecilor și componentelor necesare
import React, { useState, useRef, useEffect } from 'react'; // React și hook-urile pentru state și referințe
import './index.css'; // Stilurile globale (inclusiv Tailwind CSS)
import JSONTree from './components/JSONTree'; // Componenta pentru afișarea arborescentă a JSON-ului
import FormattedAIResponse from './components/FormattedAIResponse'; // Componenta pentru formatarea răspunsurilor AI
import { AIService } from './services/aiService';

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

    // Stare pentru a detecta dacă fișierul este nou creat
    const [isNewFile, setIsNewFile] = useState(false);

    // Stări pentru modul de creare fișier nou cu editor text
    const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
    const [jsonTextInput, setJsonTextInput] = useState('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
    const [previewData, setPreviewData] = useState<any>(null);
    const [hasJsonError, setHasJsonError] = useState(false);
    const [jsonErrorMessage, setJsonErrorMessage] = useState('');

    // Stare pentru hover și tooltip
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredElementInfo, setHoveredElementInfo] = useState<{
        name: string;
        type: string;
        value: any;
    } | null>(null);


    // STARTI PENTRU REORDONAREA FISIERELOR IN IERARHIE CU CLICK
    const [draggedElement, setDraggedElement] = useState<{
        path: (string | number)[];
        key: string | number;
        value: any;
        parentType: 'object' | 'array';
        originalIndex: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Stare pentru auto-scroll în timpul drag-ului
    const [autoScrollInterval, setAutoScrollInterval] = useState<number | null>(null);

    // STĂRI PENTRU ISTORICUL VERSIUNILOR
    const [fileHistory, setFileHistory] = useState<Array<{
      id: string;
      name: string;
      originalName: string;
      content: any;
      timestamp: Date;
      size: number;
      version: number;
    }>>([]);

    // --- REFS ---
    // Referință către elementul de input (de tip 'file') pentru a-l putea accesa programatic
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Referință către containerul de scroll pentru auto-scroll în timpul drag-ului
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Referință pentru auto-scroll în chat
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- REACT EFFECTS ---
    
    // Încarcă istoricul fișierelor la pornirea aplicației
    React.useEffect(() => {
        loadFileHistory();
    }, []);

    // Auto-scroll pentru chat
    // useEffect(() => {
    //     chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [aiChatHistory]);

    // FUNCȚII PENTRU GESTIONAREA ISTORICULUI VERSIUNILOR

    /**
     * Funcție pentru încărcarea istoricului din localStorage
     */
    const loadFileHistory = () => {
      try {
        const saved = localStorage.getItem('jsonExplorerHistory');
        if (saved) {
          const history = JSON.parse(saved);
          // Convertim timestamp-urile înapoi în Date objects
          const processedHistory = history.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
          setFileHistory(processedHistory);
        }
      } catch (error) {
        console.error('Error loading file history:', error);
      }
    };

    /**
     * Funcție pentru salvarea istoricului în localStorage
     */
    const saveFileHistory = (history: any[]) => {
      try {
        localStorage.setItem('jsonExplorerHistory', JSON.stringify(history));
      } catch (error) {
        console.error('Error saving file history:', error);
      }
    };

    /**
     * Funcție pentru adăugarea unei noi versiuni în istoric
     */
    const addToHistory = (fileName: string, content: any) => {
      const newEntry = {
        id: Date.now().toString(),
        name: fileName,
        originalName: fileName, // Folosim numele fișierului direct
        content: content,
        timestamp: new Date(),
        size: JSON.stringify(content).length,
        version: 1 // Inițializăm cu 1, va fi actualizat mai jos
      };

      setFileHistory(prev => {
        console.log('Current history before adding:', prev);
        console.log('Looking for existing versions of:', fileName);
        
        // Găsește alte versiuni ale aceluiași fișier
        const sameFileVersions = prev.filter(item => {
          const matches = item.originalName === newEntry.originalName;
          console.log(`Comparing "${item.originalName}" with "${newEntry.originalName}": ${matches}`);
          return matches;
        });
        
        console.log('Found same file versions:', sameFileVersions);
        
        // Calculează numărul versiunii (numărul de versiuni existente + 1)
        newEntry.version = sameFileVersions.length + 1;
        
        console.log(`Adding ${fileName} as version ${newEntry.version}. Found ${sameFileVersions.length} existing versions.`);
        
        // Adaugă noua versiune la început
        const updated = [newEntry, ...prev];
        
        // Păstrează doar ultimele 10 versiuni
        const trimmed = updated.slice(0, 10);
        
        // Salvează în localStorage
        saveFileHistory(trimmed);
        
        console.log('Updated history:', trimmed);
        
        return trimmed;
      });
    };

    /**
     * Funcție pentru încărcarea unei versiuni din istoric
     */
    const loadFromHistory = (historyItem: any) => {
      const simulatedFile = new File([JSON.stringify(historyItem.content)], historyItem.name, {
        type: 'application/json'
      });
      
      setSelectedFile(simulatedFile);
      setFileContent(historyItem.content);
      setEditedContent(historyItem.content);
      setIsEditing(true);
      setIsNewFile(false);
      
      console.log(`Loaded version ${historyItem.version} of ${historyItem.originalName}`);
    };

    /**
     * Funcție pentru ștergerea unei versiuni din istoric
     */
    const removeFromHistory = (itemId: string) => {
      setFileHistory(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        saveFileHistory(updated);
        return updated;
      });
    };

    /**
     * Funcție pentru ștergerea întregului istoric
     */
    const clearHistory = () => {
      const confirmClear = confirm("Are you sure you want to clear all file history?");
      if (confirmClear) {
        setFileHistory([]);
        localStorage.removeItem('jsonExplorerHistory');
        console.log("File history cleared");
      }
    };

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
      // Pentru fișierele nou create, păstrăm conținutul modificat ca fiind originalul
      if (isNewFile) {
        setFileContent(editedContent);
        setIsNewFile(false); // Marchează că fișierul nu mai este "nou"
        console.log("S-a ieșit din modul de editare și conținutul fișierului nou a fost păstrat.");
      } else {
        // Pentru fișierele existente, resetăm la valorile originale pentru a anula modificările nesalvate
        setEditedContent(fileContent);
        console.log("S-a ieșit din modul de editare și modificările nesalvate au fost anulate.");
      }
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
            
            // Folosesc numele original al fișierului
            const originalName = selectedFile.name;
            const newFileName = originalName;
            
            downloadLink.download = newFileName;
            
            // Adaug elementul în DOM, fac click pe el, apoi îl șterg
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Curăț URL-ul temporar pentru a elibera memoria
            URL.revokeObjectURL(url);
            
            // Actualizez datele originale cu cele modificate (pentru a preveni reset-ul)
            setFileContent(editedContent);
            
            // Adaugă versiunea modificată în istoric
            addToHistory(newFileName, editedContent);
            
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
      setIsNewFile(false); // Resetăm flag-ul pentru fișiere noi

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }

      console.log("Starea a fost resetata");
    }

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
                    setIsNewFile(false); // Resetează flag-ul pentru fișiere noi
                    
                    // Adaugă fișierul în istoric
                    addToHistory(file.name, content);
                    
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

    // HOOK PENTRU AI ASSISTANT - configurare directă
    const aiService = React.useMemo(() => {
        // Cheia API este luată din fișierul .env
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        return new AIService(apiKey);
    }, []);

    const [aiPrompt, setAiPrompt] = React.useState('');
    const [isAiLoading, setIsAiLoading] = React.useState(false);
    const [aiError, setAiError] = React.useState<string | null>(null);
    const [aiChatHistory, setAiChatHistory] = React.useState<Array<{
        id: string;
        message: string;
        isUser: boolean;
        timestamp: Date;
    }>>([]);

    const handleSendMessage = async (currentJson: any, fileName: string) => {
        if (!aiPrompt.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            message: aiPrompt,
            isUser: true,
            timestamp: new Date()
        };

        setAiChatHistory(prev => [...prev, userMessage]);
        setIsAiLoading(true);
        setAiError(null);
        setAiPrompt(''); // Clear the input immediately after sending

        try {
            const response = await aiService.sendMessage(aiPrompt, currentJson, fileName, aiChatHistory);
            
            if (response.modifiedJson) {
                setEditedContent(response.modifiedJson);
            }

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                message: response.response,
                isUser: false,
                timestamp: new Date()
            };

            setAiChatHistory(prev => [...prev, aiMessage]);
        } catch (error) {
            setAiError(error instanceof Error ? error.message : 'AI request failed');
        } finally {
            setIsAiLoading(false);
        }
    };

    const clearChatHistory = () => {
        setAiChatHistory([]);
    };

    // Auto-scroll pentru chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiChatHistory]);

    const clearError = () => {
        setAiError(null);
    };

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
     * Funcție pentru crearea unui fișier JSON nou (metoda principală - cu editor text)
     */
    const handleCreateNewFile = () => {
        handleCreateNewFileWithEditor();
    };

    /**
     * Funcție pentru crearea unui fișier JSON nou cu editor text
     */
    const handleCreateNewFileWithEditor = () => {
        setIsCreatingNewFile(true);
        setJsonTextInput('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
        setPreviewData(null);
        setHasJsonError(false);
        setJsonErrorMessage('');
        console.log("Modul de creare fișier nou cu editor a fost activat");
    };

    /**
     * Funcție pentru anularea creării fișierului nou
     */
    const handleCancelNewFileCreation = () => {
        setIsCreatingNewFile(false);
        setJsonTextInput('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
        setPreviewData(null);
        setHasJsonError(false);
        setJsonErrorMessage('');
        console.log("Crearea fișierului nou a fost anulată");
    };

    /**
     * Funcție pentru compilarea explicită și afișarea erorilor (doar la apăsarea butonului)
     */
    const handleCompileJson = () => {
        try {
            const parsedJson = JSON.parse(jsonTextInput);
            setPreviewData(parsedJson);
            setHasJsonError(false);
            setJsonErrorMessage('');
            console.log("JSON compilat cu succes:", parsedJson);
        } catch (error) {
            // Afișează eroarea DOAR când butonul este apăsat
            setHasJsonError(true);
            setJsonErrorMessage(error instanceof Error ? error.message : 'JSON invalid');
            setPreviewData(null);
            console.error("Eroare la compilarea JSON:", error);
        }
    };

    /**
     * Funcție pentru confirmarea și salvarea fișierului creat
     */
    const handleConfirmNewFile = () => {
        if (!previewData) {
            alert("Compilează mai întâi JSON-ul pentru a-l putea salva!");
            return;
        }

        const newFileName = prompt(`Enter the name for the new file (without .json extension):`);
        if (newFileName && newFileName.trim() !== '') {
            // Simulez un fișier cu numele dat
            const simulatedFile = new File([jsonTextInput], `${newFileName.trim()}.json`, {
                type: 'application/json'
            });
            
            // Setez starea aplicației cu noul fișier
            setSelectedFile(simulatedFile);
            setFileContent(previewData);
            setEditedContent(previewData);
            setIsEditing(true);
            setIsNewFile(true);
            
            // Adaugă noul fișier în istoric
            addToHistory(simulatedFile.name, previewData);
            
            // Ieși din modul de creare
            setIsCreatingNewFile(false);
            setJsonTextInput('{\n  \n}');
            setPreviewData(null);
            setHasJsonError(false);
            setJsonErrorMessage('');
            
            console.log(`New file created: ${newFileName}.json`);
        }
    };

    /**
     * Funcție pentru actualizarea text input-ului JSON cu compilare live
     */
    const handleJsonTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = event.target.value;
        setJsonTextInput(newText);
        
        // Resetează erorile doar dacă erau afișate
        if (hasJsonError) {
            setHasJsonError(false);
            setJsonErrorMessage('');
        }
        
        // Compilare live - încearcă să parseze JSON-ul în timp real
        try {
            const parsedJson = JSON.parse(newText);
            setPreviewData(parsedJson); // Actualizează preview-ul dacă JSON-ul este valid
        } catch (error) {
            // Dacă JSON-ul nu este valid, doar șterge preview-ul, nu afișa eroarea
            setPreviewData(null);
        }
    };

    /**
     * Funcție pentru auto-completarea parantezelor și ghilimelelor
     */
    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        let value = event.target.value;
        
        // Verifică dacă utilizatorul a tastat o paranteză deschisă
        if (start === end && start > 0) {
            const lastChar = value[start - 1];
            const nextChar = value[start]; // Caracterul după cursor
            
            const pairs: { [key: string]: string } = {
                '{': '}',
                '[': ']',
                '"': '"'
            };
            
            // Pentru ghilimele, tratează special
            if (lastChar === '"') {
                // Dacă următorul caracter este deja o ghilimea, nu adăuga alta
                if (nextChar === '"') {
                    // Procesare normală fără auto-completare
                    handleJsonTextChange(event);
                    return;
                }
                // Altfel, adaugă ghilimea de închidere
                const newValue = 
                    value.substring(0, start) + 
                    '"' + 
                    value.substring(start);
                
                setJsonTextInput(newValue);
                
                // Poziționează cursorul între ghilimele
                setTimeout(() => {
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start;
                }, 0);
                
                // Declanșează compilarea live
                setTimeout(() => {
                    try {
                        const parsedJson = JSON.parse(newValue);
                        setPreviewData(parsedJson);
                    } catch (error) {
                        setPreviewData(null);
                    }
                }, 0);
                
                return;
            }
            
            // Pentru paranteze și bracket-uri
            if (pairs[lastChar] && lastChar !== '"') {
                // Verifică dacă următorul caracter este deja paranteza de închidere
                if (nextChar === pairs[lastChar]) {
                    // Nu adăuga alta, procesare normală
                    handleJsonTextChange(event);
                    return;
                }
                
                // Adaugă paranteză închisă
                const newValue = 
                    value.substring(0, start) + 
                    pairs[lastChar] + 
                    value.substring(start);
                
                setJsonTextInput(newValue);
                
                // Poziționează cursorul între paranteze
                setTimeout(() => {
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start;
                }, 0);
                
                // Declanșează compilarea live
                setTimeout(() => {
                    try {
                        const parsedJson = JSON.parse(newValue);
                        setPreviewData(parsedJson);
                    } catch (error) {
                        setPreviewData(null);
                    }
                }, 0);
                
                return; // Nu continua cu procesarea normală
            }
        }
        
        // Procesare normală
        handleJsonTextChange(event);
    };

    /**
     * Funcție pentru gestionarea tastelor Tab și Enter în textarea pentru indentare automată
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        // Smart closing brackets/quotes - if user types a closing char that already exists, just move cursor
        if (start === end) {
            const nextChar = value[start];
            const typedChar = event.key;
            
            if ((typedChar === '}' || typedChar === ']' || typedChar === '"') && nextChar === typedChar) {
                event.preventDefault();
                textarea.selectionStart = start + 1;
                textarea.selectionEnd = start + 1;
                return;
            }
        }
        
        if (event.key === 'Tab') {
            event.preventDefault(); // Previne comportamentul default (schimbarea focus-ului)
            
            if (event.shiftKey) {
                // Shift+Tab: Deindentează
                const lines = value.substring(0, start).split('\n');
                const currentLine = lines[lines.length - 1];
                
                if (currentLine.startsWith('  ')) {
                    // Șterge 2 spații de la începutul liniei
                    const lineStart = start - currentLine.length;
                    const newValue = 
                        value.substring(0, lineStart) + 
                        currentLine.substring(2) + 
                        value.substring(start);
                    
                    setJsonTextInput(newValue);
                    
                    // Poziționează cursorul
                    setTimeout(() => {
                        textarea.selectionStart = start - 2;
                        textarea.selectionEnd = end - 2;
                    }, 0);
                }
            } else {
                // Tab: Indentează cu 2 spații
                const newValue = 
                    value.substring(0, start) + 
                    '  ' + 
                    value.substring(end);
                
                setJsonTextInput(newValue);
                
                // Poziționează cursorul după indentare
                setTimeout(() => {
                    textarea.selectionStart = start + 2;
                    textarea.selectionEnd = start + 2;
                }, 0);
            }
            
            // Declanșează compilarea live
            setTimeout(() => {
                try {
                    const parsedJson = JSON.parse(textarea.value);
                    setPreviewData(parsedJson);
                } catch (error) {
                    setPreviewData(null);
                }
            }, 0);
        } else if (event.key === 'Enter') {
            // Auto-indentare la Enter
            event.preventDefault();
            
            const lines = value.substring(0, start).split('\n');
            const currentLine = lines[lines.length - 1];
            
            // Calculează indentarea curentă
            let indent = '';
            for (let i = 0; i < currentLine.length; i++) {
                if (currentLine[i] === ' ') {
                    indent += ' ';
                } else {
                    break;
                }
            }
            
            // Dacă linia se termină cu { sau [, adaugă indentare extra
            const trimmedLine = currentLine.trim();
            if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
                indent += '  ';
            }
            
            const newValue = 
                value.substring(0, start) + 
                '\n' + indent + 
                value.substring(end);
            
            setJsonTextInput(newValue);
            
            // Poziționează cursorul după indentare
            setTimeout(() => {
                textarea.selectionStart = start + 1 + indent.length;
                textarea.selectionEnd = start + 1 + indent.length;
            }, 0);
            
            // Declanșează compilarea live
            setTimeout(() => {
                try {
                    const parsedJson = JSON.parse(textarea.value);
                    setPreviewData(parsedJson);
                } catch (error) {
                    setPreviewData(null);
                }
            }, 0);
        }
    };

  // --- DRAG & DROP ELEMENT REORDERING HANDLERS ---

    /**
     * Handler pentru începutul drag-ului unui element JSON
     * @param path - Calea către elementul care este tras
     * @param key - Cheia/indexul elementului în părintele său
     * @param value - Valoarea elementului
     * @param parentType - Tipul părintelui ('object' sau 'array')
     * @param originalIndex - Indexul original al elementului în listă
     */
    const handleDragStart = (
        path: (string | number)[], 
        key: string | number, 
        value: any, 
        parentType: 'object' | 'array',
        originalIndex: number
    ) => {
        if (!isEditing) return; // Activez drag-ul doar în modul de editare
        
        setDraggedElement({ 
            path, 
            key, 
            value, 
            parentType,
            originalIndex 
        });
        setIsDragging(true);
        console.log(`Started dragging element "${key}" at path: [${path.join(', ')}]`);
    };

    /**
     * Handler pentru sfârșitul drag-ului
     */
    const handleDragEnd = () => {
        setDraggedElement(null);
        setIsDragging(false);
        stopAutoScroll(); // Oprește auto-scroll-ul când drag-ul s-a terminat
        console.log("Drag operation ended");
    };

    /**
     * Handler pentru reordonarea efectivă a elementelor
     * @param sourcePath - Calea către elementul sursă
     * @param targetIndex - Indexul țintă unde să fie mutat elementul
     */
    const handleReorderElements = (sourcePath: (string | number)[], targetIndex: number) => {
        if (!draggedElement) {
            console.warn("No dragged element found for reordering");
            return;
        }

        // Verifică dacă mutarea este în același nivel (nu permitem mutarea între nivele diferite)
        const sourceParentPath = sourcePath.slice(0, -1);
        
        // Creez o copie profundă a datelor pentru a nu modifica originalul
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Navighează către părintele elementului
        let parent = newData;
        for (const key of sourceParentPath) {
            parent = parent[key];
        }

        if (Array.isArray(parent)) {
            // Pentru array-uri: reordonare prin splice
            const fromIndex = draggedElement.originalIndex;
            if (fromIndex !== targetIndex && targetIndex >= 0 && targetIndex < parent.length) {
                const [movedElement] = parent.splice(fromIndex, 1);
                parent.splice(targetIndex, 0, movedElement);
                
                // Actualizez starea cu noile date
                setEditedContent(newData);
                console.log(`Array element moved from index ${fromIndex} to ${targetIndex}`);
            }
        } else if (typeof parent === 'object' && parent !== null) {
            // Pentru obiecte: reordonare prin reconstrucția obiectului
            const entries = Object.entries(parent);
            const fromIndex = entries.findIndex(([key]) => key === draggedElement.key);
            
            // Verific dacă indexul sursă este valid și dacă indexul țintă este în limitele array-ului
            if (fromIndex !== -1 && targetIndex >= 0 && targetIndex < entries.length && fromIndex !== targetIndex) {
                const [movedEntry] = entries.splice(fromIndex, 1);
                entries.splice(targetIndex, 0, movedEntry); // Mută entry-ul la noul index
                
                // Reconstruiesc obiectul cu noua ordine
                const reorderedObject = Object.fromEntries(entries);
                
                // Înlocuiesc obiectul părinte cu versiunea reordonată
                if (sourceParentPath.length === 0) {
                    // Dacă este root object
                    setEditedContent(reorderedObject);
                } else {
                    // Dacă este un obiect nested
                    let current = newData;
                    for (let i = 0; i < sourceParentPath.length - 1; i++) {
                        current = current[sourceParentPath[i]];
                    }
                    current[sourceParentPath[sourceParentPath.length - 1]] = reorderedObject;
                    setEditedContent(newData);
                }
                
                console.log(`Object property "${draggedElement.key}" moved from position ${fromIndex} to ${targetIndex}`);
            }
        }

        // Reset drag state
        handleDragEnd();
    };

    // Funcție pentru auto-scroll în timpul drag-ului
    const handleAutoScroll = (event: React.DragEvent, container: HTMLElement) => {
        const rect = container.getBoundingClientRect();
        const scrollThreshold = 220; 
        const scrollSpeed = 8; 

        const mouseY = event.clientY;
        const containerTop = rect.top;
        const containerBottom = rect.bottom;

        // Calculează dacă trebuie să facem scroll
        let scrollDirection = 0;
        
        if (mouseY - containerTop < scrollThreshold) {
            // Scroll în sus
            scrollDirection = -scrollSpeed;
        } else if (containerBottom - mouseY < scrollThreshold) {
            // Scroll în jos
            scrollDirection = scrollSpeed;
        }

        if (scrollDirection !== 0) {
            // Începe auto-scroll daca nu este deja activ
            if (!autoScrollInterval) {
                const interval = setInterval(() => {
                    container.scrollTop += scrollDirection;
                }, 16); // ~60fps
                setAutoScrollInterval(interval);
            }
        } else {
            // Oprește auto-scroll
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                setAutoScrollInterval(null);
            }
        }
    };

    // Funcție pentru a opri auto-scroll
    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            setAutoScrollInterval(null);
        }
    };

    // --- REACT EFFECTS ---
    
    // Încarcă istoricul fișierelor la pornirea aplicației
    React.useEffect(() => {
        loadFileHistory();
    }, []);













    
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
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow">
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
          {/* --- ZONA DE SELECTARE FIȘIER (Afișată doar dacă nu avem conținut și nu suntem în modul de creare) --- */}
          {!fileContent && !isCreatingNewFile && (
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

              {/* Butoanele pentru creare fișier nou și vizualizare istoric */}
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handleCreateNewFile}
                  className='w-full text-2xl text-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-200 cursor-pointer'
                >
                  ✨ Create New File
                </button>
              </div>

              {/* SECȚIUNEA DE ISTORIC - Afișată întotdeauna sub butoane */}
              {fileHistory.length > 0 && (
                <div className="mt-8 p-6 bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-amber-400">
                      📚 Recent Files ({fileHistory.length}/10)
                    </h3>
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-md transition-all duration-200"
                    >
                      🗑️ Clear All
                    </button>
                  </div>
                  
                  <div className="grid gap-3">
                    {fileHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="bg-gray-800 rounded-lg p-3 border border-gray-600 hover:border-amber-500 hover:bg-gray-750 transition-all duration-200 cursor-pointer"
                        onClick={() => loadFromHistory(historyItem)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-white truncate">
                                {historyItem.name}
                              </h4>
                              <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold shrink-0">
                                v{historyItem.version}
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm truncate">
                              {historyItem.originalName}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(historyItem.id);
                            }}
                            className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-all duration-200"
                          >
                            ✕
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                          <span>📅 {historyItem.timestamp.toLocaleDateString()} {historyItem.timestamp.toLocaleTimeString()}</span>
                          <span>📦 {(historyItem.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* --- ZONA DE CREARE FIȘIER NOU CU EDITOR TEXT --- */}
          {!fileContent && isCreatingNewFile && (
            <div className="flex flex-col h-full">
              {/* Header cu titlu și butoane */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-600">
                <h2 className="text-2xl font-semibold text-green-400">
                  ✨ Create New JSON File
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCompileJson}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                  >
                    Compile
                  </button>
                  <button
                    onClick={handleConfirmNewFile}
                    disabled={!previewData}
                    className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-all duration-200 ${
                      previewData 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    ✅ Confirm & Save
                  </button>
                  <button
                    onClick={handleCancelNewFileCreation}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200"
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>

              {/* Container pentru split view */}
              <div className="flex flex-1 gap-6 min-h-0">
                {/* Panoul stâng - Editor text */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">
                    📝 JSON Editor
                  </h3>
                  <textarea
                    value={jsonTextInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none resize-none min-h-96"
                    placeholder="Enter your JSON here..."
                    spellCheck={false}
                  />
                  {hasJsonError && (
                    <div className="mt-2 p-2 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-400 text-sm">
                      <strong>❌ JSON Error:</strong> {jsonErrorMessage}
                    </div>
                  )}
                </div>

                {/* Panoul drept - Preview */}
                <div className="flex-1 flex flex-col min-w-0">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                    👁️ Live Preview
                  </h3>
                  <div className="flex-1 bg-gray-900 p-4 rounded-lg border border-gray-600 overflow-auto min-h-96">
                    {previewData ? (
                      <JSONTree 
                        data={previewData} 
                        isEditing={false}
                        path={[]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <div className="text-4xl mb-2">✨</div>
                          <p>Start typing JSON to see live preview</p>
                          <p className="text-sm mt-2">Click "Check for Errors" to validate syntax</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
            // Containerul principal care va avea layout flex pentru JSON + AI
            <div className="mt-6 flex gap-6 h-[75vh]">
              {/* Panoul stâng - JSON Explorer */}
              <div className="flex-1 min-w-0 p-4 bg-gray-700 rounded-lg flex flex-col">
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
                <div 
                  ref={scrollContainerRef}
                  className="bg-gray-800 p-4 rounded-lg overflow-auto flex-grow max-h-[60vh]"
                  onDragOver={(e) => {
                    if (isDragging && scrollContainerRef.current) {
                      handleAutoScroll(e, scrollContainerRef.current);
                    }
                  }}
                  onDragLeave={() => {
                    if (isDragging) {
                      stopAutoScroll();
                    }
                  }}
                >
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
                    onDragStart={handleDragStart} // Pasez handler-ul pentru începutul drag-ului
                    onDragEnd={handleDragEnd} // Pasez handler-ul pentru sfârșitul drag-ului
                    onReorderElements={handleReorderElements} // Pasez funcția de reordonare
                    draggedElement={draggedElement} // Pasez elementul care este tras
                    isDragging={isDragging} // Pasez starea de dragging
                    onAutoScroll={handleAutoScroll} // Pasez funcția de auto-scroll
                    onStopAutoScroll={stopAutoScroll} // Pasez funcția pentru oprirea auto-scroll-ului de scroll
                  />
                </div>
              </div>

              {/* Panoul drept - AI Assistant */}
              <div className="w-80 p-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg flex flex-col border border-gray-600">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-600">
                  <span className="text-yellow-400">🤖</span>
                  <h3 className="text-lg font-semibold text-yellow-300">Jason - JSON AI Assistant</h3>
                  {aiChatHistory.length > 0 && (
                    <button
                      onClick={clearChatHistory}
                      className="ml-auto px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-all duration-200"
                    >
                      Clear Chat
                    </button>
                  )}
                </div>
                
                {/* Intro text - only show when no chat history exists */}
                {aiChatHistory.length === 0 && (
                  <div className="text-sm text-gray-400 mb-4 p-2 bg-gray-700 rounded-lg">
                    <span className="text-yellow-300">💬</span> Hi! I'm Jason, your JSON specialist. Ask me anything about your JSON structure, 
                    or request modifications in natural language.
                  </div>
                )}

                {/* AI Configuration or Chat History */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-[500px] bg-gray-800 rounded-lg p-3">
                  {aiChatHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🤖</div>
                        <p className="text-sm">Ask me anything about your JSON!</p>
                        <p className="text-xs mt-1">I can help you modify, analyze, or understand your data structure.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {aiChatHistory.map((chat) => (
                        <div
                          key={chat.id}
                          className={`p-3 rounded-lg ${
                            chat.isUser
                              ? 'bg-blue-600 text-white ml-8'
                              : 'bg-gray-800 text-gray-100 mr-8 border-l-4 border-yellow-500'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">
                              {chat.isUser ? '👤 You' : '🤖 AI Assistant'}
                            </span>
                            <span className="text-xs opacity-60">
                              {chat.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-sm leading-relaxed">
                            {chat.isUser ? (
                              chat.message
                            ) : (
                              <FormattedAIResponse response={chat.message} />
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                  {isAiLoading && (
                    <div className="bg-gray-600 text-gray-100 mr-4 p-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                        <span className="text-sm">Jason is cooking... 🍳</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="space-y-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(editedContent, selectedFile?.name || 'untitled.json');
                      }
                    }}
                    placeholder="Confess you thoughts! 😌"
                    className="w-full bg-gray-800 text-white p-3 roFunded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none resize-none text-sm"
                    rows={3}
                    disabled={isAiLoading}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Press Enter to send, Shift+Enter for new line
                    </span>
                    <button
                      onClick={() => handleSendMessage(editedContent, selectedFile?.name || 'untitled.json')}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className={`px-4 py-2 font-semibold rounded-lg shadow-md transition-all duration-200 ${
                        isAiLoading || !aiPrompt.trim()
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {isAiLoading ? '⏳' : '📤'} Send
                    </button>
                  </div>
                  {aiError && (
                    <div className="p-2 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-400 text-sm">
                      <strong>Error:</strong> {aiError}
                      <button
                        onClick={clearError}
                        className="ml-2 text-red-300 hover:text-red-100"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
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
            <div className="text-yellow-300">
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