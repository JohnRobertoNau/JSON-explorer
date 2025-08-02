import React, { useState } from 'react';

interface JSONTreeProps {
  data: any;
  name?: string;
  level?: number;
  isEditing?: boolean; // Added the new optional property
  onDataChange?: (newData: any) => void; // Callback for propagating changes
  onPathBasedChange?: (path: (string | number)[], newValue: any) => void; // New callback for path-based changes
  // New props for tooltip:
  onMouseEnter?: (name: string, type: string, value: any) => void;
  onMouseLeave?: () => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  // Props for path-based operations:
  path?: (string | number)[]; // The path to this element in the JSON structure
  onDeleteElement?: (path: (string | number)[]) => void; // Callback for deletion
  onRenameElement?: (path: (string | number)[], newKey: string) => void; // Callback for renaming
  onChangeValue?: (path: (string | number)[], newValue: any) => void; // Callback for value changes
  // Props for drag & drop reordering:
  onDragStart?: (path: (string | number)[], key: string | number, value: any, parentType: 'object' | 'array', originalIndex: number) => void;
  onDragEnd?: () => void;
  onReorderElements?: (sourcePath: (string | number)[], targetIndex: number) => void;
  draggedElement?: { path: (string | number)[]; key: string | number; value: any; parentType: 'object' | 'array'; originalIndex: number } | null;
  isDragging?: boolean;
  onAutoScroll?: (event: React.DragEvent, container: HTMLElement) => void;
  onStopAutoScroll?: () => void;
}

const JSONTree: React.FC<JSONTreeProps> = ({ 
  data, 
  name, 
  level = 0, 
  isEditing = false, 
  onDataChange,
  onPathBasedChange,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  path = [], // The default path is an empty array (root)
  onDeleteElement,
  onRenameElement,
  onChangeValue,
  // Drag & drop props:
  onDragStart,
  onDragEnd,
  onReorderElements,
  draggedElement,
  isDragging,
  onAutoScroll,
  onStopAutoScroll
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; value: any; key?: string } | null>(null);
  const [typeSelectionMenu, setTypeSelectionMenu] = useState<{ x: number; y: number; targetType: 'object' | 'array' | 'primitive'; targetKey?: string } | null>(null);
  
  // Local state for drag over index - each JSONTree instance has its own state
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);


  const renameFunction = (value: any, key?: string) => {
    if (!isEditing) return; // Enable function only in edit mode
    if (!key) return; // Cannot rename element without a key

    const type = getValueType(value);
    let promptMessage = '';
    
    // Determine the message based on type
    if (type === 'object') {
      promptMessage = `Enter the new name for object "${key}":`;
    } else if (type === 'array') {
      promptMessage = `Enter the new name for array "${key}":`;
    } else {
      promptMessage = `Enter the new name for field "${key}":`;
    }

    const newName = prompt(promptMessage, key);
    
    if (newName !== null && newName.trim() !== '' && newName !== key) {
      console.log(`Renaming "${key}" to "${newName}"`);
      
      // Complete implementation with onRenameElement
      if (onRenameElement && path.length > 0) {
        onRenameElement(path, newName);
      } else {
        console.warn('onRenameElement callback is not available or path is empty');
        console.log(`Path: [${path.join(', ')}], Old key: "${key}", New key: "${newName}"`);
      }
    }
  };

  // Handler for right-click
  const handleContextMenu = (event: React.MouseEvent, value: any, key?: string) => {
    if (!isEditing) return; // Enable menu only in edit mode

    event.preventDefault();
    event.stopPropagation();
    
    const type = getValueType(value);
    
    // Calculate position for menu based on cursor position
    // Add logic to avoid going off screen
    const menuWidth = 180; // Approximate menu width (larger for safety)
    const menuHeight = type === 'object' ? 120 : type === 'array' ? 120 : 160; // Variable height based on menu type
    const padding = 20; // Larger padding from screen edge
    
    let x = event.clientX;
    let y = event.clientY;
    
    // Check if menu would go off the right side of screen
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    // Check if menu would go off the bottom of screen
    if (y + menuHeight > window.innerHeight - padding) {
      // Try to position it above the cursor
      y = event.clientY - menuHeight - 10;
      
      // If it doesn't fit above either, put it as high as possible
      if (y < padding) {
        y = window.innerHeight - menuHeight - padding;
      }
    }
    
    // Don't let menu go off the top or left
    if (x < padding) x = padding;
    if (y < padding) y = padding;
    
    setContextMenu({ 
      x: x, 
      y: y,
      type: type,
      value: value,
      key: key
    });
  };

  // Handler to close the menu
  const handleCloseContextMenu = (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); 
    }
    setContextMenu(null);
    setTypeSelectionMenu(null);
  };

  const addElement = (
    elementType: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'
  ): void => {
    // Use typeSelectionMenu to get context information
    const currentContext = typeSelectionMenu || contextMenu;
    if (!currentContext) return;

    let fieldName = '';
    let newValue: any;

    // Determine the context type
    const contextType = typeSelectionMenu ? typeSelectionMenu.targetType : contextMenu!.type;

    // For arrays, we don't need field names
    if (contextType === 'array') {
      // For arrays, create the value directly based on type
      switch(elementType) {
        case 'object':
          newValue = {};
          break;
        case 'array':
          newValue = [];
          break;
        case 'string':
          const stringValue = prompt(`Enter the string value:`) || '';
          newValue = stringValue;
          break;
        case 'number':
          const numberValue = prompt(`Enter the number value:`);
          if (numberValue === null) return;
          const parsedNumber = parseFloat(numberValue);
          if (isNaN(parsedNumber)) {
            alert('Invalid number format');
            return;
          }
          newValue = parsedNumber;
          break;
        case 'boolean':
          const boolValue = confirm(`Set value to true? (Cancel for false)`);
          newValue = boolValue;
          break;
        case 'null':
          newValue = null;
          break;
        default:
          console.error(`Unknown element type: ${elementType}`);
          return;
      }

      console.log(`Adding ${elementType} to array with value:`, newValue);
      
      if (onPathBasedChange) {
        // For arrays, modify the entire array at the current path
        const newArray = [...data, newValue];
        onPathBasedChange(path, newArray); // Modify the entire array at the current path
      } else if (onDataChange) {
        const newData = [...data, newValue];
        onDataChange(newData);
      }
    } 
    // For objects and primitives, we need field names
    else {
      fieldName = prompt(`Enter the name of the new field:`) || '';
      if (!fieldName.trim()) {
        return; // Cancel if no valid name is entered
      }

      // Check if the field already exists
      if (typeof data === 'object' && data !== null && data.hasOwnProperty(fieldName)) {
        const overwrite = confirm(`Field "${fieldName}" already exists. Do you want to overwrite it?`);
        if (!overwrite) return;
      }

      switch(elementType) {
        case 'object':
          newValue = {};
          break;
        case 'array':
          newValue = [];
          break;
        case 'string':
          const stringValue = prompt(`Enter the string value for "${fieldName}":`) || '';
          newValue = stringValue;
          break;
        case 'number':
          const numberValue = prompt(`Enter the number value for "${fieldName}":`);
          if (numberValue === null) return;
          const parsedNumber = parseFloat(numberValue);
          if (isNaN(parsedNumber)) {
            alert('Invalid number format');
            return;
          }
          newValue = parsedNumber;
          break;
        case 'boolean':
          const boolValue = confirm(`Set "${fieldName}" to true? (Cancel for false)`);
          newValue = boolValue;
          break;
        case 'null':
          newValue = null;
          break;
        default:
          console.error(`Unknown element type: ${elementType}`);
          return;
      }

      console.log(`Adding ${elementType} "${fieldName}" with value:`, newValue);
      
      if (onPathBasedChange) {
        // For objects, calculate the path to the new field
        const newFieldPath = [...path, fieldName];
        onPathBasedChange(newFieldPath, newValue); // Add the new field at the specified path
      } else if (onDataChange) {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          const newData = { ...data, [fieldName]: newValue };
          onDataChange(newData);
        }
      }
    }
  };

  const showTypeSelectionMenu = (x: number, y: number) => {
    const typeMenuWidth = 150; // Type menu width (larger)
    const typeMenuHeight = 200; // Type menu height (6 options * ~33px each)
    const padding = 20; // Larger padding
    
    // Calculate initial position (next to context menu)
    let typeMenuX = x + 200; // Position menu next to the contextual one
    let typeMenuY = y;
    
    // Check if type menu would go off the right side of screen
    if (typeMenuX + typeMenuWidth > window.innerWidth - padding) {
      // If it doesn't fit on the right, put it to the left of context menu
      typeMenuX = x - typeMenuWidth - 20;
      
      // If it doesn't fit on the left either, put it as close to left edge as possible
      if (typeMenuX < padding) {
        typeMenuX = padding;
      }
    }
    
    // Check if type menu would go off the bottom of screen
    if (typeMenuY + typeMenuHeight > window.innerHeight - padding) {
      // Try to position it above
      typeMenuY = y - typeMenuHeight - 10;
      
      // If it doesn't fit above either, put it as high as possible
      if (typeMenuY < padding) {
        typeMenuY = window.innerHeight - typeMenuHeight - padding;
      }
    }
    
    // Don't let menu go off the top
    if (typeMenuY < padding) typeMenuY = padding;
    
    // Don't reset contextMenu here, just show selection menu
    setTypeSelectionMenu({ 
      x: typeMenuX,
      y: typeMenuY,
      targetType: contextMenu?.type as 'object' | 'array' | 'primitive',
      targetKey: contextMenu?.key 
    });
  };

  // Handler for menu options
  const handleMenuOption = (action: string) => {
    if (!contextMenu) return;
    
    const { type, value, key } = contextMenu;
    
    // Actions for OBJECTS
    if (type === 'object') {
      switch (action) {
        case 'rename':
          // Close menu first
          setContextMenu(null);
          renameFunction(value, key);
          break;
        case 'delete':
          // Close menu first
          setContextMenu(null);
          const confirmObjectDelete = confirm(`Are you sure you want to delete the object "${key}"?`);
          if (confirmObjectDelete) {
            console.log(`Deleting object "${key}" at path:`, path);
            // Implementation: delete object using path
            if (onDeleteElement && path.length > 0) {
              onDeleteElement(path);
            }
          }
          break;
        case 'add-element':
          showTypeSelectionMenu(contextMenu.x, contextMenu.y);
          // Don't close contextMenu here to keep reference
          break;
      }
    }

    // Actions for ARRAYS
    else if (type === 'array') {
      switch (action) {
        case 'rename':
          // Close menu first
          setContextMenu(null);
          renameFunction(value, key);
          break;
        case 'delete':
          // Închide meniul mai întâi
          setContextMenu(null);
          const confirmArrayDelete = confirm(`Are you sure you want to delete the array "${key}"?`);
          if (confirmArrayDelete) {
            console.log(`Deleting array "${key}" at path:`, path);
            // Implementare: șterge array-ul folosind path-ul
            if (onDeleteElement && path.length > 0) {
              onDeleteElement(path);
            }
          }
          break;
        case 'add-element':
          showTypeSelectionMenu(contextMenu.x, contextMenu.y);
          // Don't close contextMenu here to keep reference
          break;
      }
    }
    // Actions for PRIMITIVE VALUES
    else {
      switch (action) {
        case 'change-field-name':
          // Close menu first
          setContextMenu(null);
          renameFunction(value, key);
          break;
        case 'change-value':
          // Close menu first
          setContextMenu(null);
          const currentValue = JSON.stringify(value);
          const newValue = prompt(`Enter the new value for "${key}":`, currentValue);
          if (newValue !== null && newValue.trim() !== '') {
            try {
              // Try to parse as JSON to preserve type
              const parsedValue = JSON.parse(newValue);
              console.log(`Changing value of "${key}" from ${currentValue} to ${newValue}`);
              
              // Complete implementation with onChangeValue
              if (onChangeValue && path.length > 0) {
                onChangeValue(path, parsedValue);
              } else {
                console.warn('onChangeValue callback is not available or path is empty');
                console.log(`Path: [${path.join(', ')}], Old value: ${currentValue}, New value: ${newValue}`);
              }
            } catch (error) {
              // Treat as string if it's not valid JSON
              console.log(`Changing value of "${key}" from ${currentValue} to "${newValue}" (as string)`);
              
              // Complete implementation with onChangeValue for string
              if (onChangeValue && path.length > 0) {
                onChangeValue(path, newValue);
              } else {
                console.warn('onChangeValue callback is not available or path is empty');
                console.log(`Path: [${path.join(', ')}], Old value: ${currentValue}, New value: "${newValue}"`);
              }
            }
          }
          break;
        case 'add-field':
          showTypeSelectionMenu(contextMenu.x, contextMenu.y);
          // Don't close contextMenu here to keep reference
          break;
        case 'delete':
          // Close menu first
          setContextMenu(null);
          const confirmFieldDelete = confirm(`Are you sure you want to delete the field "${key}"?`);
          if (confirmFieldDelete) {
            console.log(`Deleting field "${key}" at path:`, path);

            // sterge campul folosind path-ul
            if (onDeleteElement && path.length > 0) {
              onDeleteElement(path);
            }
          }
          break;
      }
    }
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValueColor = (value: any): string => {
    const type = getValueType(value);
    switch (type) {
      case 'string': return 'text-green-400';
      case 'number': return 'text-blue-400';
      case 'boolean': return 'text-yellow-400';
      case 'null': return 'text-gray-400';
      default: return 'text-gray-300';
    }
  };

  const getIcon = (value: any, expanded: boolean): string => {
    if (Array.isArray(value)) {
      return expanded ? '📂' : '📁';
    } else if (typeof value === 'object' && value !== null) {
      return expanded ? '📂' : '📁';
    }
    return '📄';
  };

  const renderValue = (value: any, key?: string) => {
    const type = getValueType(value);
    const indent = level * 20;

    if (type === 'object' || type === 'array') {
      const itemCount = Array.isArray(value) ? value.length : Object.keys(value).length;
      
      return (
        <div style={{ marginLeft: `${indent}px` }} onContextMenu={(e) => handleContextMenu(e, value, key)}>
          <div 
            className="flex items-center py-1 hover:bg-gray-700 rounded cursor-pointer transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
            onMouseEnter={() => onMouseEnter?.(key || 'unknown', getValueType(value), value)}
            onMouseLeave={() => onMouseLeave?.()}
            onMouseMove={onMouseMove}
          >
            <span className="mr-2 text-lg">{getIcon(value, isExpanded)}</span>
            <span className="font-semibold text-blue-300">
              {key && `${key}: `}
            </span>
            <span className="text-gray-400 text-sm">
              {type === 'array' ? `[${itemCount} items]` : `{${itemCount} properties}`}
            </span>
            <span className="ml-2 text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
          
          {isExpanded && (
            <div className="ml-4 border-l-2 border-gray-600 pl-2">
              {Array.isArray(value) ? (
                value.map((item, index) => {
                  const isDraggedElement = draggedElement && 
                    draggedElement.path.length === path.length + 1 && 
                    draggedElement.path[draggedElement.path.length - 1] === index &&
                    draggedElement.path.slice(0, -1).every((p, i) => p === path[i]);
                  
                  // Check that drag over happens at the correct level (same parent)
                  const isAtCorrectLevel = draggedElement && 
                    draggedElement.path.length === path.length + 1 &&
                    draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                    draggedElement.parentType === 'array';
                  
                  const isDragOver = dragOverIndex === index && isAtCorrectLevel;
                  
                  return (
                    <div
                      key={index}
                      draggable={isEditing}
                      className={`
                        ${isDraggedElement ? 'opacity-50' : ''}
                        ${isDragOver ? 'border-t-2 border-blue-400' : ''}
                        ${isEditing ? 'cursor-move' : ''}
                      `}
                      onDragStart={(e) => {
                        if (!isEditing || !onDragStart) return;
                        e.stopPropagation();
                        onDragStart([...path, index], index, item, 'array', index);
                      }}
                      onDragOver={(e) => {
                        if (!isEditing) return;
                        e.preventDefault();
                        
                        // Set drag over only if at the correct level
                        if (draggedElement && 
                            draggedElement.path.length === path.length + 1 &&
                            draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                            draggedElement.parentType === 'array') {
                          setDragOverIndex(index);
                          e.stopPropagation();
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!isEditing) return;
                        e.stopPropagation();
                        
                        // Reset drag over only if at the correct level
                        if (draggedElement && 
                            draggedElement.path.length === path.length + 1 &&
                            draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                            draggedElement.parentType === 'array') {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (!isEditing || !onReorderElements || !draggedElement) return;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check that the drag is in the same parent
                        const parentPath = path;
                        const draggedParentPath = draggedElement.path.slice(0, -1);
                        const isSameParent = parentPath.length === draggedParentPath.length &&
                          parentPath.every((p, i) => p === draggedParentPath[i]);
                        
                        if (isSameParent && draggedElement.parentType === 'array') {
                          onReorderElements(draggedElement.path, index);
                        }
                        
                        setDragOverIndex(null);
                      }}
                      onDragEnd={(e) => {
                        if (!isEditing) return;
                        e.stopPropagation();
                        if (onDragEnd) {
                          onDragEnd();
                        }
                      }}
                    >
                      <JSONTree 
                        data={item} 
                        name={`[${index}]`} 
                        level={level + 1} 
                        isEditing={isEditing}
                        onDataChange={onDataChange}
                        onPathBasedChange={onPathBasedChange}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onMouseMove={onMouseMove}
                        path={[...path, index]}
                        onDeleteElement={onDeleteElement}
                        onRenameElement={onRenameElement}
                        onChangeValue={onChangeValue}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onReorderElements={onReorderElements}
                        draggedElement={draggedElement}
                        isDragging={isDragging}
                        onAutoScroll={onAutoScroll}
                        onStopAutoScroll={onStopAutoScroll}
                      />
                    </div>
                  );
                })
              ) : (
                Object.entries(value).map(([childKey, childValue], index) => {
                  const isDraggedElement = draggedElement && 
                    draggedElement.path.length === path.length + 1 && 
                    draggedElement.path[draggedElement.path.length - 1] === childKey &&
                    draggedElement.path.slice(0, -1).every((p, i) => p === path[i]);
                  
                  // Check that drag over happens at the correct level (same parent)
                  const isAtCorrectLevel = draggedElement && 
                    draggedElement.path.length === path.length + 1 &&
                    draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                    draggedElement.parentType === 'object';
                  
                  const isDragOver = dragOverIndex === index && isAtCorrectLevel;
                  
                  return (
                    <div
                      key={childKey}
                      draggable={isEditing}
                      className={`
                        ${isDraggedElement ? 'opacity-50' : ''}
                        ${isDragOver ? 'border-t-2 border-blue-400' : ''}
                        ${isEditing ? 'cursor-move' : ''}
                      `}
                      onDragStart={(e) => {
                        if (!isEditing || !onDragStart) return;
                        e.stopPropagation();
                        onDragStart([...path, childKey], childKey, childValue, 'object', index);
                      }}
                      onDragOver={(e) => {
                        if (!isEditing) return;
                        e.preventDefault();
                        
                        // Set drag over only if at the correct level
                        if (draggedElement && 
                            draggedElement.path.length === path.length + 1 &&
                            draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                            draggedElement.parentType === 'object') {
                          setDragOverIndex(index);
                          e.stopPropagation();
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!isEditing) return;
                        e.stopPropagation();
                        
                        // Reset drag over only if at the correct level
                        if (draggedElement && 
                            draggedElement.path.length === path.length + 1 &&
                            draggedElement.path.slice(0, -1).every((p, i) => p === path[i]) &&
                            draggedElement.parentType === 'object') {
                          setDragOverIndex(null);
                        }
                      }}
                      onDrop={(e) => {
                        if (!isEditing || !onReorderElements || !draggedElement) return;
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Check that the drag is in the same parent
                        const parentPath = path;
                        const draggedParentPath = draggedElement.path.slice(0, -1);
                        const isSameParent = parentPath.length === draggedParentPath.length &&
                          parentPath.every((p, i) => p === draggedParentPath[i]);
                        
                        if (isSameParent && draggedElement.parentType === 'object') {
                          onReorderElements(draggedElement.path, index);
                        }
                        
                        setDragOverIndex(null);
                      }}
                      onDragEnd={(e) => {
                        if (!isEditing) return;
                        e.stopPropagation();
                        if (onDragEnd) {
                          onDragEnd();
                        }
                      }}
                    >
                      <JSONTree 
                        data={childValue} 
                        name={childKey} 
                        level={level + 1} 
                        isEditing={isEditing}
                        onDataChange={onDataChange}
                        onPathBasedChange={onPathBasedChange}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        onMouseMove={onMouseMove}
                        path={[...path, childKey]}
                        onDeleteElement={onDeleteElement}
                        onRenameElement={onRenameElement}
                        onChangeValue={onChangeValue}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        onReorderElements={onReorderElements}
                        draggedElement={draggedElement}
                        isDragging={isDragging}
                        onAutoScroll={onAutoScroll}
                        onStopAutoScroll={onStopAutoScroll}
                      />
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      );
    } else {
      // Primitive value
      return (
        <div 
          style={{ marginLeft: `${indent}px` }} 
          className="flex items-center py-1 hover:bg-gray-700 rounded px-2"
          onContextMenu={(e) => handleContextMenu(e, value, key)}
          onMouseEnter={() => onMouseEnter?.(key || 'unknown', getValueType(value), value)}
          onMouseLeave={() => onMouseLeave?.()}
          onMouseMove={onMouseMove}
        >
          <span className="font-medium text-gray-300">
            {key && `${key}: `}
          </span>
          <span className={getValueColor(value)}>
            {type === 'string' ? value : String(value)}
          </span>
          <span className="ml-2 text-xs text-gray-500">
            ({type})
          </span>
        </div>
      );
    }
  };

  return (
    <div className="text-sm" onClick={handleCloseContextMenu}>
      {renderValue(data, name)}
      {contextMenu && (
        <>
          {/* Overlay to catch clicks outside the menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={handleCloseContextMenu}
          />
          {/* Meniul contextual */}
          <div
            style={{ 
              position: 'fixed',
              top: contextMenu.y, 
              left: contextMenu.x,
              zIndex: 20
            }}
            className="bg-white text-black rounded shadow-lg py-1 min-w-[150px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Options for OBJECTS */}
            {contextMenu.type === 'object' ? (
              <>
                {/* Show rename option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                    onClick={() => handleMenuOption('rename')}
                  >
                    📝 Rename
                  </div>
                )}
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('add-element')}
                >
                  ➕ Add Element
                </div>
                {/* Show delete option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                    onClick={() => handleMenuOption('delete')}
                  >
                    🗑️ Delete
                  </div>
                )}
              </>
            ) 
            /* Options for ARRAYS */
            : contextMenu.type === 'array' ? (
              <>
                {/* Show rename option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                    onClick={() => handleMenuOption('rename')}
                  >
                    📝 Rename
                  </div>
                )}
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('add-element')}
                >
                  ➕ Add Element
                </div>
                {/* Show delete option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                    onClick={() => handleMenuOption('delete')}
                  >
                    🗑️ Delete
                  </div>
                )}
              </>
            ) 
            /* Options for PRIMITIVE VALUES */
            : (
              <>
                {/* Show change name option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                    onClick={() => handleMenuOption('change-field-name')}
                  >
                    Change Field Name
                  </div>
                )}
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('change-value')}
                >
                  Change Value
                </div>
                {/* Show delete option only if we're not at root */}
                {path.length > 0 && (
                  <div 
                    className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                    onClick={() => handleMenuOption('delete')}
                  >
                    🗑️ Delete
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
      
      {/* Type selection menu for adding elements */}
      {typeSelectionMenu && (
        <div
          style={{ 
            position: 'fixed',
            top: typeSelectionMenu.y, 
            left: typeSelectionMenu.x,
            zIndex: 25
          }}
          className="bg-gray-100 text-black rounded shadow-lg py-1 min-w-[120px] border-2 border-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-xs font-semibold text-gray-600 border-b border-gray-300">
            Select Type
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('object');
            }}
          >
            📦 Object
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('array');
            }}
          >
            📋 Array
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('string');
            }}
          >
            📝 String
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('number');
            }}
          >
            🔢 Number
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('boolean');
            }}
          >
            ✅ Boolean
          </div>
          <div 
            className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm"
            onClick={() => {
              setTypeSelectionMenu(null);
              setContextMenu(null);
              addElement('null');
            }}
          >
            ❌ Null
          </div>
        </div>
      )}
    </div>
  );
};

export default JSONTree;