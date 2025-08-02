// Import necessary libraries and components
import React, { useState, useRef, useEffect } from 'react'; // React and hooks for state and references
import './index.css'; // Global styles (including Tailwind CSS)
import JSONTree from './components/JSONTree'; // Component for displaying JSON as a tree
import FormattedAIResponse from './components/FormattedAIResponse'; // Component for formatting AI responses
import { AIService } from './services/aiService';

// Main app component definition
function App() {
    // --- STATE MANAGEMENT ---

    // State for the selected file (File object)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // State for parsed JSON content from file (original, unchanged)
    const [fileContent, setFileContent] = useState<any>(null);

    // State for edited JSON content (only in edit mode)
    const [editedContent, setEditedContent] = useState<any>(null);

    // State to detect if a file is dragged over the drop zone
    const [isDragActive, setIsDragActive] = useState(false);

    // New state to control edit mode
    const [isEditing, setIsEditing] = useState(false);

    // State to detect if the file is newly created
    const [isNewFile, setIsNewFile] = useState(false);

    // States for new file creation mode with text editor
    const [isCreatingNewFile, setIsCreatingNewFile] = useState(false);
    const [jsonTextInput, setJsonTextInput] = useState('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
    const [previewData, setPreviewData] = useState<any>(null);
    const [hasJsonError, setHasJsonError] = useState(false);
    const [jsonErrorMessage, setJsonErrorMessage] = useState('');

    // State for hover and tooltip
    const [isHovered, setIsHovered] = useState(false);
    const [hoveredElementInfo, setHoveredElementInfo] = useState<{
        name: string;
        type: string;
        value: any;
    } | null>(null);


    // STATES FOR REORDERING FILES IN HIERARCHY WITH CLICK
    const [draggedElement, setDraggedElement] = useState<{
        path: (string | number)[];
        key: string | number;
        value: any;
        parentType: 'object' | 'array';
        originalIndex: number;
    } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // State for auto-scroll during drag
    const [autoScrollInterval, setAutoScrollInterval] = useState<number | null>(null);

    // STATES FOR VERSION HISTORY
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
    // Reference to the input element (type 'file') for programmatic access
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Reference to scroll container for auto-scroll during drag
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // Reference for auto-scroll in chat
    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- REACT EFFECTS ---
    
    // Load file history on app start
    React.useEffect(() => {
        loadFileHistory();
    }, []);

    // Auto-scroll for chat
    // useEffect(() => {
    //     chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [aiChatHistory]);

    // FUNCTIONS FOR VERSION HISTORY MANAGEMENT

    /**
     * Function for loading history from localStorage
     */
    const loadFileHistory = () => {
      try {
        const saved = localStorage.getItem('jsonExplorerHistory');
        if (saved) {
          const history = JSON.parse(saved);
          // Convert timestamps back to Date objects
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
     * Function for saving history to localStorage
     */
    const saveFileHistory = (history: any[]) => {
      try {
        localStorage.setItem('jsonExplorerHistory', JSON.stringify(history));
      } catch (error) {
        console.error('Error saving file history:', error);
      }
    };

    /**
     * Function for adding a new version to history
     */
    const addToHistory = (fileName: string, content: any) => {
      const newEntry = {
        id: Date.now().toString(),
        name: fileName,
        originalName: fileName, // Use the file name directly
        content: content,
        timestamp: new Date(),
        size: JSON.stringify(content).length,
        version: 1 // Initialize with 1, will be updated below
      };

      setFileHistory(prev => {
        console.log('Current history before adding:', prev);
        console.log('Looking for existing versions of:', fileName);
        
        // Find other versions of the same file
        const sameFileVersions = prev.filter(item => {
          const matches = item.originalName === newEntry.originalName;
          console.log(`Comparing "${item.originalName}" with "${newEntry.originalName}": ${matches}`);
          return matches;
        });
        
        console.log('Found same file versions:', sameFileVersions);
        
        // Calculate the version number (number of existing versions + 1)
        newEntry.version = sameFileVersions.length + 1;
        
        console.log(`Adding ${fileName} as version ${newEntry.version}. Found ${sameFileVersions.length} existing versions.`);
        
        // Add the new version at the beginning
        const updated = [newEntry, ...prev];
        
        // Keep only the last 10 versions
        const trimmed = updated.slice(0, 10);
        
        // Save to localStorage
        saveFileHistory(trimmed);
        
        console.log('Updated history:', trimmed);
        
        return trimmed;
      });
    };

    /**
     * Function for loading a version from history
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
     * Function for deleting a version from history
     */
    const removeFromHistory = (itemId: string) => {
      setFileHistory(prev => {
        const updated = prev.filter(item => item.id !== itemId);
        saveFileHistory(updated);
        return updated;
      });
    };

    /**
     * Function for clearing the entire history
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
     * Callback to receive changes from JSONTree and update editedContent.
     * @param newData - The new modified JSON data from JSONTree
     */
    const handleDataChange = (newData: any) => {
        setEditedContent(newData);
        console.log("Data has been modified in JSONTree:", newData);
    };

    /**
     * Function to modify a specific element in the JSON structure based on path
     * @param path - The path to the element to be modified
     * @param newValue - The new value for the element
     */
    const handlePathBasedChange = (path: (string | number)[], newValue: any) => {
        // Create a deep copy of the data to avoid modifying the original
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        if (path.length === 0) {
            // If the path is empty, replace the entire structure (root)
            setEditedContent(newValue);
            return;
        }
        
        // Navigate to the parent of the element to be modified
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        
        // Modify the value at the specified path
        const lastKey = path[path.length - 1];
        current[lastKey] = newValue;
        
        // Update the state with the new data
        setEditedContent(newData);
        console.log(`Element modified at path: [${path.join(', ')}]`, newValue);
    };

    /**
     * Handler to enter edit mode.
     */
    const handleEditFile = () => {
      // No longer reset state, just activate edit mode
      setIsEditing(true);
      console.log("Entered edit mode.");
    }

    /**
     * Handler to exit edit mode.
     */
    const handleExitEditMode = () => {
      setIsEditing(false);
      // For newly created files, keep the modified content as the original
      if (isNewFile) {
        setFileContent(editedContent);
        setIsNewFile(false); // Mark that the file is no longer "new"
        console.log("Exited edit mode and kept the new file content.");
      } else {
        // For existing files, reset to original values to cancel unsaved changes
        setEditedContent(fileContent);
        console.log("Exited edit mode and unsaved changes were cancelled.");
      }
    }

    /**
     * Handler for saving changes.
     * Downloads the modified JSON file to the user's computer.
     */
    const handleSaveChanges = () => {
        if (!editedContent || !selectedFile) {
            alert("No data to save!");
            return;
        }

        try {
            // Convert the modified JSON object back to formatted string
            const jsonString = JSON.stringify(editedContent, null, 2); // null, 2 = beautiful formatting with 2 spaces
            
            // Create a Blob (binary object) with the JSON content
            const blob = new Blob([jsonString], { type: 'application/json' });
            
            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob);
            
            // Create an invisible <a> element to trigger the download
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            
            // Use the original file name
            const originalName = selectedFile.name;
            const newFileName = originalName;
            
            downloadLink.download = newFileName;
            
            // Add the element to DOM, click it, then remove it
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the temporary URL to free memory
            URL.revokeObjectURL(url);
            
            // Update the original data with the modified one (to prevent reset)
            setFileContent(editedContent);
            
            // Add the modified version to history
            addToHistory(newFileName, editedContent);
            
            console.log(`File "${newFileName}" was downloaded successfully!`);
            alert(`File "${newFileName}" was saved successfully!\nCheck your downloads folder.`);
            
        } catch (error) {
            console.error("Error saving file:", error);
            alert("An error occurred while saving the file!");
        }
    }

    const handleDeletionFile = () => {
      setSelectedFile(null);
      setFileContent(null);
      setEditedContent(null); // Reset the edit content as well
      setIsEditing(false);
      setIsNewFile(false); // Reset the flag for new files

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }

      console.log("State was reset");
    }

    // --- LOGIC FUNCTIONS ---

    /**
     * The central function for processing a file.
     * Reads the file, parses it as JSON and updates the application state.
     * @param file - The file to be processed.
     */
    const processFile = (file: File) => {
        setSelectedFile(file); // Save file information
        
        const reader = new FileReader(); // Initialize a file reader
        // Set what happens after the file is read
        reader.onload = (e) => {
            try {
                const result = e.target?.result; // Extract the read content
                if (typeof result === 'string') {
                    const content = JSON.parse(result); // Parse the string as JSON
                    setFileContent(content); // Update state with the original JSON object
                    setEditedContent(content); // Initialize the edit version as well
                    setIsNewFile(false); // Reset the flag for new files
                    
                    // Add the file to history
                    addToHistory(file.name, content);
                    
                    console.log('File loaded successfully:', file.name);
                }
            } catch (error) {
                // Handle error if the file is not valid JSON
                alert('The file is not a valid JSON!');
                setFileContent(null); // Reset original content
                setEditedContent(null); // Reset edit content as well
                setSelectedFile(null); // Reset selected file
            }
        };
        // Start reading the file as text
        reader.readAsText(file);
    };

    /**
     * Handler for file selection event through the classic input.
     */
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]; // Get the first selected file
        if (file) {
            processFile(file); // Process the file
        }
    };

    /**
     * Handler for button click; opens the file selection window.
     */
    const handleButtonClick = () => {
        fileInputRef.current?.click(); // Simulate a click on the hidden input
    };

    // --- DRAG & DROP HANDLERS ---

    /**
     * Handler for when a file is dragged over the drop zone.
     */
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault(); // Prevent the browser's default behavior
        setIsDragActive(true); // Activate the visual drag state
    };

    /**
     * Handler for when a file leaves the drop zone.
     */
    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false); // Deactivate the visual drag state
    };

    /**
     * Handler for when a file is dropped in the specified zone.
     */
    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragActive(false);
        
        const files = event.dataTransfer.files; // Get files from the event
        if (files.length > 0) {
            const file = files[0];
            
            // Check if the file is JSON type
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                processFile(file); // Process the file
            } else {
                alert('Please select only JSON files!');
            }
        }
    };


/*
    ** Hover and tooltip implementation

*/
    // Function that executes when the mouse ENTERS over an element
    const handleMouseEnter = (elementName: string, elementType: string, elementValue: any) => {
        setIsHovered(true); // Mark that the mouse is over something
        setHoveredElementInfo({ // Save information about the element
            name: elementName,
            type: elementType,
            value: elementValue
        });
    };

    // Function that executes when the mouse LEAVES an element
    const handleMouseLeave = () => {
        setIsHovered(false); // Mark that the mouse is no longer over anything
        setHoveredElementInfo(null); // Clear the information
    };

    // State for tooltip position (where it should appear on screen)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0});

    // HOOK FOR AI ASSISTANT - direct configuration
    const aiService = React.useMemo(() => {
        // The API key is taken from the .env file
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

    // Auto-scroll for chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiChatHistory]);

    const clearError = () => {
        setAiError(null);
    };

    // Function that executes when the mouse MOVES over an element
    const handleMouseMove = (event: React.MouseEvent) => {
        setTooltipPosition({
            x: event.clientX + 10, // Mouse X position + 10 pixels (so it's not exactly on the cursor)
            y: event.clientY - 30  // Mouse Y position - 30 pixels (so it's above the cursor)
        });
    };

    /**
     * Function for deleting an element from the JSON structure based on path
     * @param pathToDelete - The path to the element to be deleted
     */
    const handleDeleteElement = (pathToDelete: (string | number)[]) => {
        if (pathToDelete.length === 0) {
            alert("Cannot delete root element!");
            return;
        }

        // Create a deep copy of the data to avoid modifying the original
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculate the path to the parent of the element to be deleted
        const parentPath = pathToDelete.slice(0, -1); // All elements except the last one
        const keyToDelete = pathToDelete[pathToDelete.length - 1]; // Last element = key to delete
        
        // Navigate to the parent of the element to be deleted
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Delete the element based on the parent type
        if (Array.isArray(parent)) {
            // For arrays, use splice to delete the element at index
            parent.splice(keyToDelete as number, 1);
        } else {
            // For objects, use delete to remove the property
            delete parent[keyToDelete];
        }
        
        // Update the state with the new data
        setEditedContent(newData);
        console.log(`Element deleted at path: [${pathToDelete.join(', ')}]`);
    };

    /**
     * Function for renaming an element in the JSON structure based on path
     * @param pathToRename - The path to the element to be renamed
     * @param newKey - The new name (key) for the element
     */
    const handleRenameElement = (pathToRename: (string | number)[], newKey: string) => {
        if (pathToRename.length === 0) {
            alert("Cannot rename root element!");
            return;
        }

        // Validation: check if the new name is valid
        if (!newKey || newKey.trim() === '') {
            alert("New name cannot be empty!");
            return;
        }

        // Create a deep copy of the data to avoid modifying the original
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculate the path to the parent of the element to rename
        const parentPath = pathToRename.slice(0, -1); // All elements except the last one
        const oldKey = pathToRename[pathToRename.length - 1]; // Last element = old key
        
        // Navigate to the parent of the element to rename
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Renaming can only be done for objects (not for arrays)
        if (Array.isArray(parent)) {
            alert("Cannot rename array elements! Array elements are accessed by index.");
            return;
        }
        
        // Check if the new name already exists
        if (parent.hasOwnProperty(newKey)) {
            const overwrite = confirm(`Key "${newKey}" already exists. Do you want to overwrite it?`);
            if (!overwrite) return;
        }
        
        // Save the old value
        const value = parent[oldKey];
        
        // Rebuild the object preserving the original order
        const newParent: any = {};
        for (const key in parent) {
            if (key === oldKey) {
                // When we reach the old key, replace it with the new one
                newParent[newKey] = value;
            } else {
                // For all other keys, copy them as they are
                newParent[key] = parent[key];
            }
        }
        
        // Replace the parent object with the reordered version
        Object.keys(parent).forEach(key => delete parent[key]);
        Object.assign(parent, newParent);
        
        // Update the state with the new data
        setEditedContent(newData);
        console.log(`Element renamed from "${oldKey}" to "${newKey}" at path: [${parentPath.join(', ')}]`);
    };

    /**
     * Function for changing the value of an element in the JSON structure based on path
     * @param pathToChange - The path to the element whose value needs to be changed
     * @param newValue - The new value for the element
     */
    const handleChangeValue = (pathToChange: (string | number)[], newValue: any) => {
        if (pathToChange.length === 0) {
            alert("Cannot change root element value directly!");
            return;
        }

        // Create a deep copy of the data to avoid modifying the original
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Calculate the path to the parent of the element to be changed
        const parentPath = pathToChange.slice(0, -1); // All elements except the last one
        const keyToChange = pathToChange[pathToChange.length - 1]; // Last element = key to change
        
        // Navigate to the parent of the element to be changed
        let parent = newData;
        for (const key of parentPath) {
            parent = parent[key];
        }
        
        // Change the value
        parent[keyToChange] = newValue;
        
        // Update the state with the new data
        setEditedContent(newData);
        console.log(`Value changed at path: [${pathToChange.join(', ')}], New value:`, newValue);
    };

    /**
     * Function for creating a new JSON file (main method - with text editor)
     */
    const handleCreateNewFile = () => {
        handleCreateNewFileWithEditor();
    };

    /**
     * Function for creating a new JSON file with text editor
     */
    const handleCreateNewFileWithEditor = () => {
        setIsCreatingNewFile(true);
        setJsonTextInput('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
        setPreviewData(null);
        setHasJsonError(false);
        setJsonErrorMessage('');
        console.log("New file creation mode with editor was activated");
    };

    /**
     * Function for canceling new file creation
     */
    const handleCancelNewFileCreation = () => {
        setIsCreatingNewFile(false);
        setJsonTextInput('{\n  "name": "example",\n  "value": 42,\n  "active": true\n}');
        setPreviewData(null);
        setHasJsonError(false);
        setJsonErrorMessage('');
        console.log("New file creation was cancelled");
    };

    /**
     * Function for explicit compilation and error display (only when button is pressed)
     */
    const handleCompileJson = () => {
        try {
            const parsedJson = JSON.parse(jsonTextInput);
            setPreviewData(parsedJson);
            setHasJsonError(false);
            setJsonErrorMessage('');
            console.log("JSON compiled successfully:", parsedJson);
        } catch (error) {
            // Display error ONLY when the button is pressed
            setHasJsonError(true);
            setJsonErrorMessage(error instanceof Error ? error.message : 'Invalid JSON');
            setPreviewData(null);
            console.error("Error compiling JSON:", error);
        }
    };

    /**
     * Function for confirming and saving the created file
     */
    const handleConfirmNewFile = () => {
        if (!previewData) {
            alert("First compile the JSON to be able to save it!");
            return;
        }

        const newFileName = prompt(`Enter the name for the new file (without .json extension):`);
        if (newFileName && newFileName.trim() !== '') {
            // Simulate a file with the given name
            const simulatedFile = new File([jsonTextInput], `${newFileName.trim()}.json`, {
                type: 'application/json'
            });
            
            // Set the application state with the new file
            setSelectedFile(simulatedFile);
            setFileContent(previewData);
            setEditedContent(previewData);
            setIsEditing(true);
            setIsNewFile(true);
            
            // Add the new file to history
            addToHistory(simulatedFile.name, previewData);
            
            // Exit creation mode
            setIsCreatingNewFile(false);
            setJsonTextInput('{\n  \n}');
            setPreviewData(null);
            setHasJsonError(false);
            setJsonErrorMessage('');
            
            console.log(`New file created: ${newFileName}.json`);
        }
    };

    /**
     * Function for updating JSON text input with live compilation
     */
    const handleJsonTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = event.target.value;
        setJsonTextInput(newText);
        
        // Reset errors only if they were displayed
        if (hasJsonError) {
            setHasJsonError(false);
            setJsonErrorMessage('');
        }
        
        // Live compilation - try to parse JSON in real time
        try {
            const parsedJson = JSON.parse(newText);
            setPreviewData(parsedJson); // Update preview if JSON is valid
        } catch (error) {
            // If JSON is not valid, just clear the preview, don't show error
            setPreviewData(null);
        }
    };

    /**
     * Function for auto-completion of brackets and quotes
     */
    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = event.target as HTMLTextAreaElement;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        let value = event.target.value;
        
        // Check if the user typed an opening bracket
        if (start === end && start > 0) {
            const lastChar = value[start - 1];
            const nextChar = value[start]; // Character after cursor
            
            const pairs: { [key: string]: string } = {
                '{': '}',
                '[': ']',
                '"': '"'
            };
            
            // For quotes, handle specially
            if (lastChar === '"') {
                // If the next character is already a quote, don't add another
                if (nextChar === '"') {
                    // Normal processing without auto-completion
                    handleJsonTextChange(event);
                    return;
                }
                // Otherwise, add closing quote
                const newValue = 
                    value.substring(0, start) + 
                    '"' + 
                    value.substring(start);
                
                setJsonTextInput(newValue);
                
                // Position cursor between quotes
                setTimeout(() => {
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start;
                }, 0);
                
                // Trigger live compilation
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
            
            // For parentheses and brackets
            if (pairs[lastChar] && lastChar !== '"') {
                // Check if the next character is already the closing bracket
                if (nextChar === pairs[lastChar]) {
                    // Don't add another, normal processing
                    handleJsonTextChange(event);
                    return;
                }
                
                // Add closing bracket
                const newValue = 
                    value.substring(0, start) + 
                    pairs[lastChar] + 
                    value.substring(start);
                
                setJsonTextInput(newValue);
                
                // Position cursor between brackets
                setTimeout(() => {
                    textarea.selectionStart = start;
                    textarea.selectionEnd = start;
                }, 0);
                
                // Trigger live compilation
                setTimeout(() => {
                    try {
                        const parsedJson = JSON.parse(newValue);
                        setPreviewData(parsedJson);
                    } catch (error) {
                        setPreviewData(null);
                    }
                }, 0);
                
                return; // Don't continue with normal processing
            }
        }
        
        // Normal processing
        handleJsonTextChange(event);
    };

    /**
     * Function for handling Tab and Enter keys in textarea for automatic indentation
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
            event.preventDefault(); // Prevent default behavior (focus change)
            
            if (event.shiftKey) {
                // Shift+Tab: Unindent
                const lines = value.substring(0, start).split('\n');
                const currentLine = lines[lines.length - 1];
                
                if (currentLine.startsWith('  ')) {
                    // Remove 2 spaces from the beginning of the line
                    const lineStart = start - currentLine.length;
                    const newValue = 
                        value.substring(0, lineStart) + 
                        currentLine.substring(2) + 
                        value.substring(start);
                    
                    setJsonTextInput(newValue);
                    
                    // Position cursor
                    setTimeout(() => {
                        textarea.selectionStart = start - 2;
                        textarea.selectionEnd = end - 2;
                    }, 0);
                }
            } else {
                // Tab: Indent with 2 spaces
                const newValue = 
                    value.substring(0, start) + 
                    '  ' + 
                    value.substring(end);
                
                setJsonTextInput(newValue);
                
                // Position cursor after indentation
                setTimeout(() => {
                    textarea.selectionStart = start + 2;
                    textarea.selectionEnd = start + 2;
                }, 0);
            }
            
            // Trigger live compilation
            setTimeout(() => {
                try {
                    const parsedJson = JSON.parse(textarea.value);
                    setPreviewData(parsedJson);
                } catch (error) {
                    setPreviewData(null);
                }
            }, 0);
        } else if (event.key === 'Enter') {
            // Auto-indentation on Enter
            event.preventDefault();
            
            const lines = value.substring(0, start).split('\n');
            const currentLine = lines[lines.length - 1];
            
            // Calculate current indentation
            let indent = '';
            for (let i = 0; i < currentLine.length; i++) {
                if (currentLine[i] === ' ') {
                    indent += ' ';
                } else {
                    break;
                }
            }
            
            // If line ends with { or [, add extra indentation
            const trimmedLine = currentLine.trim();
            if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[')) {
                indent += '  ';
            }
            
            const newValue = 
                value.substring(0, start) + 
                '\n' + indent + 
                value.substring(end);
            
            setJsonTextInput(newValue);
            
            // Position cursor after indentation
            setTimeout(() => {
                textarea.selectionStart = start + 1 + indent.length;
                textarea.selectionEnd = start + 1 + indent.length;
            }, 0);
            
            // Trigger live compilation
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
     * Handler for the start of dragging a JSON element
     * @param path - The path to the element being dragged
     * @param key - The key/index of the element in its parent
     * @param value - The value of the element
     * @param parentType - The type of the parent ('object' or 'array')
     * @param originalIndex - The original index of the element in the list
     */
    const handleDragStart = (
        path: (string | number)[], 
        key: string | number, 
        value: any, 
        parentType: 'object' | 'array',
        originalIndex: number
    ) => {
        if (!isEditing) return; // Enable dragging only in edit mode
        
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
     * Handler for the end of dragging
     */
    const handleDragEnd = () => {
        setDraggedElement(null);
        setIsDragging(false);
        stopAutoScroll(); // Stop auto-scroll when dragging ends
        console.log("Drag operation ended");
    };

    /**
     * Handler for effective element reordering
     * @param sourcePath - The path to the source element
     * @param targetIndex - The target index where the element should be moved
     */
    const handleReorderElements = (sourcePath: (string | number)[], targetIndex: number) => {
        if (!draggedElement) {
            console.warn("No dragged element found for reordering");
            return;
        }

        // Check if the move is at the same level (we don't allow moving between different levels)
        const sourceParentPath = sourcePath.slice(0, -1);
        
        // Create a deep copy of the data to avoid modifying the original
        const newData = JSON.parse(JSON.stringify(editedContent));
        
        // Navigate to the parent of the element
        let parent = newData;
        for (const key of sourceParentPath) {
            parent = parent[key];
        }

        if (Array.isArray(parent)) {
            // For arrays: reordering through splice
            const fromIndex = draggedElement.originalIndex;
            if (fromIndex !== targetIndex && targetIndex >= 0 && targetIndex < parent.length) {
                const [movedElement] = parent.splice(fromIndex, 1);
                parent.splice(targetIndex, 0, movedElement);
                
                // Update the state with the new data
                setEditedContent(newData);
                console.log(`Array element moved from index ${fromIndex} to ${targetIndex}`);
            }
        } else if (typeof parent === 'object' && parent !== null) {
            // For objects: reordering through object reconstruction
            const entries = Object.entries(parent);
            const fromIndex = entries.findIndex(([key]) => key === draggedElement.key);
            
            // Check if the source index is valid and if the target index is within array limits
            if (fromIndex !== -1 && targetIndex >= 0 && targetIndex < entries.length && fromIndex !== targetIndex) {
                const [movedEntry] = entries.splice(fromIndex, 1);
                entries.splice(targetIndex, 0, movedEntry); // Move entry to new index
                
                // Rebuild the object with new order
                const reorderedObject = Object.fromEntries(entries);
                
                // Replace the parent object with the reordered version
                if (sourceParentPath.length === 0) {
                    // If it's the root object
                    setEditedContent(reorderedObject);
                } else {
                    // If it's a nested object
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

    // Function for auto-scroll during dragging
    const handleAutoScroll = (event: React.DragEvent, container: HTMLElement) => {
        const rect = container.getBoundingClientRect();
        const scrollThreshold = 220; 
        const scrollSpeed = 8; 

        const mouseY = event.clientY;
        const containerTop = rect.top;
        const containerBottom = rect.bottom;

        // Calculate if we need to scroll
        let scrollDirection = 0;
        
        if (mouseY - containerTop < scrollThreshold) {
            // Scroll up
            scrollDirection = -scrollSpeed;
        } else if (containerBottom - mouseY < scrollThreshold) {
            // Scroll down
            scrollDirection = scrollSpeed;
        }

        if (scrollDirection !== 0) {
            // Start auto-scroll if not already active
            if (!autoScrollInterval) {
                const interval = setInterval(() => {
                    container.scrollTop += scrollDirection;
                }, 16); // ~60fps
                setAutoScrollInterval(interval);
            }
        } else {
            // Stop auto-scroll
            if (autoScrollInterval) {
                clearInterval(autoScrollInterval);
                setAutoScrollInterval(null);
            }
        }
    };

    // Function to stop auto-scroll
    const stopAutoScroll = () => {
        if (autoScrollInterval) {
            clearInterval(autoScrollInterval);
            setAutoScrollInterval(null);
        }
    };

    // --- REACT EFFECTS ---
    
    // Load file history on application startup
    React.useEffect(() => {
        loadFileHistory();
    }, []);













    
  // --- RENDERED COMPONENT (JSX) ---
  return (
    // Main application container, styled with Flexbox for alignment
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col">
      
      {/* Hidden 'file' type input, used to open the selection window */}
      <input
        type="file"
        ref={fileInputRef} // Link with the reference created above
        accept=".json" // Accept only .json files
        style={{ display: 'none' }} // Hide the element
        onChange={handleFileSelect} // Attach the handler for selection
      />

      {/* Container for main content, centered and with maximum width */}
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow">
        <h1 className="text-4xl font-bold text-center mb-4 text-blue-400">
          JSON Explorer
        </h1>
        <p className="text-center text-gray-400 mb-8">
          A graphic editor for JSON files.
        </p>
        
        {/* Main container for interaction (dropzone) */}
        {/* The 'flex-grow' class is added conditionally only if there is content to display */}
        <div className={`bg-gray-800 rounded-lg p-8 shadow-lg flex flex-col ${fileContent ? 'flex-grow' : ''}`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
        >
          {/* --- FILE SELECTION AREA (Displayed only if we have no content and we're not in create mode) --- */}
          {!fileContent && !isCreatingNewFile && (
            <>
              {/* Dynamic title that changes based on drag state */}
              <h2 className="text-2xl font-semibold mb-4 text-green-400 text-center">
                {isDragActive 
                  ? 'Drop the file here! 🎯' 
                  : 'Please select your file to edit or drag and drop it here.'
                }
              </h2>
        
              {/* Visible button to select a file */}
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

              {/* Visual Drag & Drop area with dynamic styles */}
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

              {/* Buttons for creating new file and viewing history */}
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handleCreateNewFile}
                  className='w-full text-2xl text-center bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-all duration-200 cursor-pointer'
                >
                  ✨ Create New File
                </button>
              </div>

              {/* HISTORY SECTION - Always displayed under buttons */}
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

          {/* --- NEW FILE CREATION AREA WITH TEXT EDITOR --- */}
          {!fileContent && isCreatingNewFile && (
            <div className="flex flex-col h-full">
              {/* Header with title and buttons */}
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

              {/* Container for split view */}
              <div className="flex flex-1 gap-6 min-h-0">
                {/* Left panel - Text editor */}
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

          {/* --- CONTENT DISPLAY AREA (Displayed only if we have selected file) --- */}

          {/* Section that displays only if a file has been selected */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                File selected:
              </h3>
              <p className="text-gray-300">Nume: {selectedFile.name}</p>
              <p className="text-gray-300">Dimensiune: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          {/* Section that displays only if a JSON file has been successfully parsed */}
          {fileContent && (
            // Main container that will have flex layout for JSON + AI
            <div className="mt-6 flex gap-6 h-[75vh]">
              {/* Left panel - JSON Explorer */}
              <div className="flex-1 min-w-0 p-4 bg-gray-700 rounded-lg flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-green-400">
                    📊 JSON Explorer - Tree View:
                  </h3>
                  {/* Container to group buttons */}
                  <div className="flex gap-2">
                    {/* Buttons for edit mode */}
                    {isEditing ? (
                      <>
                        {/* Button for saving changes */}
                        <button
                          className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                          onClick={handleSaveChanges}
                        >
                          📥 Download changes
                        </button>
                        {/* Button for exiting edit mode */}
                        <button
                          className='px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                          onClick={handleExitEditMode}
                        >
                          🚪 Exit Edit Mode
                        </button>
                      </>
                    ) : (
                      /* Edit Button (only when we're not in edit mode) */
                      <button
                        className='px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                        onClick={handleEditFile}
                      >
                        Edit File
                      </button>
                    )}
                    {/* Button to select another file (always visible) */}
                    <button
                      className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200'
                      onClick={handleDeletionFile}
                    >
                      Choose another file
                    </button>
                  </div>
                </div>

                {/* Container with scroll for JSON content, which expands */}
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
                  {/* Display a visual indicator when we're in edit mode */}
                  {isEditing && (
                    <div className="mb-3 p-2 bg-yellow-600 bg-opacity-20 rounded border border-yellow-500">
                      <p className="text-yellow-400 text-sm">
                        🖊️ Edit mode active - Right-click on tree elements for options
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
                    path={[]} // Initial path for root is an empty array
                    onDeleteElement={handleDeleteElement} // Pass the delete function
                    onRenameElement={handleRenameElement} // Pass the rename function
                    onChangeValue={handleChangeValue} // Pass the value modification function
                    onDragStart={handleDragStart} // Pass the drag start handler
                    onDragEnd={handleDragEnd} // Pass the drag end handler
                    onReorderElements={handleReorderElements} // Pass the reordering function
                    draggedElement={draggedElement} // Pass the element being dragged
                    isDragging={isDragging} // Pass the dragging state
                    onAutoScroll={handleAutoScroll} // Pass the auto-scroll function
                    onStopAutoScroll={stopAutoScroll} // Pass the function to stop auto-scroll
                  />
                </div>
              </div>

              {/* Right panel - AI Assistant */}
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

      {/* Tooltip that displays when the mouse is over an element */}
      {isHovered && hoveredElementInfo && (
        <div
          style={{
            position: 'fixed',        // Positioned relative to the browser window
            left: tooltipPosition.x,  // Horizontal position
            top: tooltipPosition.y,   // Vertical position
            zIndex: 1000,            // To be above all other elements
            pointerEvents: 'none'     // Mouse passes through it (doesn't interfere)
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

// Export the App component to be used in other parts of the application (e.g., main.tsx)
export default App; 