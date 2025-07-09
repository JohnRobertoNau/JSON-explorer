import React, { useState } from 'react';

interface JSONTreeProps {
  data: any;
  name?: string;
  level?: number;
  isEditing?: boolean; // Am adăugat noua proprietate opțională
  onDataChange?: (newData: any) => void; // Callback pentru propagarea modificărilor
  onPathBasedChange?: (path: (string | number)[], newValue: any) => void; // Nou callback pentru modificări bazate pe path
  // Props-uri noi pentru tooltip:
  onMouseEnter?: (name: string, type: string, value: any) => void;
  onMouseLeave?: () => void;
  onMouseMove?: (event: React.MouseEvent) => void;
  // Props pentru path-based operations:
  path?: (string | number)[]; // Calea către acest element în structura JSON
  onDeleteElement?: (path: (string | number)[]) => void; // Callback pentru ștergere
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
  path = [], // Calea implicită este un array gol (root)
  onDeleteElement
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand primele 2 niveluri
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; value: any; key?: string } | null>(null);
  const [typeSelectionMenu, setTypeSelectionMenu] = useState<{ x: number; y: number; targetType: 'object' | 'array' | 'primitive'; targetKey?: string } | null>(null);

  // Handler pentru click-dreapta
  const handleContextMenu = (event: React.MouseEvent, value: any, key?: string) => {
    if (!isEditing) return; // Activăm meniul doar în modul de editare

    event.preventDefault();
    event.stopPropagation();
    
    const type = getValueType(value);
    
    // Calculăm poziția pentru meniu bazat pe poziția cursorului
    // Adăugăm logică pentru a evita ieșirea din ecran
    const menuWidth = 180; // Lățimea aproximativă a meniului (mai mare pentru siguranță)
    const menuHeight = type === 'object' ? 120 : type === 'array' ? 120 : 160; // Înălțimea variabilă în funcție de tipul meniului
    const padding = 20; // Padding mai mare de la marginea ecranului
    
    let x = event.clientX;
    let y = event.clientY;
    
    // Verificăm dacă meniul ar ieși din partea dreaptă a ecranului
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    // Verificăm dacă meniul ar ieși din partea de jos a ecranului
    if (y + menuHeight > window.innerHeight - padding) {
      // Încercăm să îl poziționăm deasupra cursorului
      y = event.clientY - menuHeight - 10;
      
      // Dacă nici deasupra nu încape, îl punem cât mai sus posibil
      if (y < padding) {
        y = window.innerHeight - menuHeight - padding;
      }
    }
    
    // Nu lăsăm meniul să iasă din partea de sus sau stânga
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

  // Handler pentru a închide meniul
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
    // Folosim typeSelectionMenu pentru a obține informațiile despre context
    const currentContext = typeSelectionMenu || contextMenu;
    if (!currentContext) return;

    let fieldName = '';
    let newValue: any;

    // Determinăm tipul contextului
    const contextType = typeSelectionMenu ? typeSelectionMenu.targetType : contextMenu!.type;

    // Pentru array-uri, nu avem nevoie de nume de câmp
    if (contextType === 'array') {
      // Pentru array-uri, creăm direct valoarea în funcție de tip
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
        // Pentru array-uri, modificăm array-ul întreg la path-ul curent
        const newArray = [...data, newValue];
        onPathBasedChange(path, newArray); // Modificăm array-ul întreg la path-ul curent
      } else if (onDataChange) {
        const newData = [...data, newValue];
        onDataChange(newData);
      }
    } 
    // Pentru obiecte și primitive, avem nevoie de nume de câmp
    else {
      fieldName = prompt(`Enter the name of the new field:`) || '';
      if (!fieldName.trim()) {
        return; // Anulează dacă nu e introdus un nume valid
      }

      // Verifică dacă câmpul există deja
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
        // Pentru obiecte, calculăm path-ul către noul câmp
        const newFieldPath = [...path, fieldName];
        onPathBasedChange(newFieldPath, newValue); // Adăugăm noul câmp la path-ul specificat
      } else if (onDataChange) {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          const newData = { ...data, [fieldName]: newValue };
          onDataChange(newData);
        }
      }
    }
  };

  const showTypeSelectionMenu = (x: number, y: number) => {
    const typeMenuWidth = 150; // Lățimea meniului de tip (mai mare)
    const typeMenuHeight = 200; // Înălțimea meniului de tip (6 opțiuni * ~33px fiecare)
    const padding = 20; // Padding mai mare
    
    // Calculăm poziția inițială (alături de meniul contextual)
    let typeMenuX = x + 200; // Poziționează meniul alături de cel contextual
    let typeMenuY = y;
    
    // Verificăm dacă meniul de tip ar ieși din partea dreaptă a ecranului
    if (typeMenuX + typeMenuWidth > window.innerWidth - padding) {
      // Dacă nu încape în dreapta, îl punem în stânga meniului contextual
      typeMenuX = x - typeMenuWidth - 20;
      
      // Dacă nici în stânga nu încape, îl punem cât mai aproape de marginea stângă
      if (typeMenuX < padding) {
        typeMenuX = padding;
      }
    }
    
    // Verificăm dacă meniul de tip ar ieși din partea de jos a ecranului
    if (typeMenuY + typeMenuHeight > window.innerHeight - padding) {
      // Încercăm să îl poziționăm deasupra
      typeMenuY = y - typeMenuHeight - 10;
      
      // Dacă nici deasupra nu încape, îl punem cât mai sus posibil
      if (typeMenuY < padding) {
        typeMenuY = window.innerHeight - typeMenuHeight - padding;
      }
    }
    
    // Nu lăsăm meniul să iasă din partea de sus
    if (typeMenuY < padding) typeMenuY = padding;
    
    // Nu mai resetăm contextMenu aici, ci doar afișăm meniul de selecție
    setTypeSelectionMenu({ 
      x: typeMenuX,
      y: typeMenuY,
      targetType: contextMenu?.type as 'object' | 'array' | 'primitive',
      targetKey: contextMenu?.key 
    });
  };

  // Handler pentru opțiunile din meniu
  const handleMenuOption = (action: string) => {
    if (!contextMenu) return;
    
    const { type, value, key } = contextMenu;
    
    // Acțiuni pentru OBIECTE
    if (type === 'object') {
      switch (action) {
        case 'rename':
          // Închide meniul mai întâi
          setContextMenu(null);
          const newObjectName = prompt(`Enter the new name for object "${key}":`);
          if (newObjectName !== null && newObjectName.trim() !== '') {
            console.log(`Renaming object from "${key}" to "${newObjectName}"`);
            // TODO: Implementare: modifică cheia obiectului și apelează onDataChange
          }
          break;
        case 'delete':
          // Închide meniul mai întâi
          setContextMenu(null);
          const confirmObjectDelete = confirm(`Are you sure you want to delete the object "${key}"?`);
          if (confirmObjectDelete) {
            console.log(`Deleting object "${key}" at path:`, path);
            // Implementare: șterge obiectul folosind path-ul
            if (onDeleteElement && path.length > 0) {
              onDeleteElement(path);
            }
          }
          break;
        case 'add-element':
          showTypeSelectionMenu(contextMenu.x, contextMenu.y);
          // Nu închide contextMenu aici pentru a păstra referința
          break;
      }
    }

    // Acțiuni pentru ARRAY-URI
    else if (type === 'array') {
      switch (action) {
        case 'rename':
          // Închide meniul mai întâi
          setContextMenu(null);
          const newArrayName = prompt(`Enter the new name for array "${key}":`);
          if (newArrayName !== null && newArrayName.trim() !== '') {
            console.log(`Renaming array from "${key}" to "${newArrayName}"`);
            // TODO: Implementare: modifică cheia array-ului și apelează onDataChange
          }
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
          // Nu închide contextMenu aici pentru a păstra referința
          break;
      }
    }
    // Acțiuni pentru VALORI PRIMITIVE
    else {
      switch (action) {
        case 'change-field-name':
          // Închide meniul mai întâi
          setContextMenu(null);
          const newFieldName = prompt(`Enter the new name for field "${key}":`);
          if (newFieldName !== null && newFieldName.trim() !== '') {
            console.log(`Renaming field from "${key}" to "${newFieldName}"`);
            // TODO: Implementare: modifică cheia câmpului și apelează onDataChange
          }
          break;
        case 'change-value':
          // Închide meniul mai întâi
          setContextMenu(null);
          const currentValue = JSON.stringify(value);
          const newValue = prompt(`Enter the new value for "${key}":`, currentValue);
          if (newValue !== null) {
            try {
              // Încearcă să parseze ca JSON pentru a păstra tipul
              JSON.parse(newValue);
              console.log(`Changing value of "${key}" from ${currentValue} to ${newValue}`);
              // TODO: Implementare: modifică valoarea câmpului și apelează onDataChange
            } catch (error) {
              // Tratează ca string dacă nu e JSON valid
              console.log(`Changing value of "${key}" from ${currentValue} to "${newValue}" (as string)`);
              // TODO: Implementare: modifică valoarea câmpului și apelează onDataChange
            }
          }
          break;
        case 'add-field':
          showTypeSelectionMenu(contextMenu.x, contextMenu.y);
          // Nu închide contextMenu aici pentru a păstra referința
          break;
        case 'delete':
          // Închide meniul mai întâi
          setContextMenu(null);
          const confirmFieldDelete = confirm(`Are you sure you want to delete the field "${key}"?`);
          if (confirmFieldDelete) {
            console.log(`Deleting field "${key}" at path:`, path);
            // Implementare: șterge câmpul folosind path-ul
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
                value.map((item, index) => (
                  <JSONTree 
                    key={index} 
                    data={item} 
                    name={`[${index}]`} 
                    level={level + 1} 
                    isEditing={isEditing} // Pasăm proprietatea mai departe
                    onDataChange={onDataChange} // Pasăm și callback-ul mai departe
                    onPathBasedChange={onPathBasedChange} // Pasăm noul callback
                    onMouseEnter={onMouseEnter} // Pasăm și handler-ele pentru tooltip
                    onMouseLeave={onMouseLeave}
                    onMouseMove={onMouseMove}
                    path={[...path, index]} // Calculăm path-ul pentru elementul din array
                    onDeleteElement={onDeleteElement} // Pasăm callback-ul pentru delete
                  />
                ))
              ) : (
                Object.entries(value).map(([childKey, childValue]) => (
                  <JSONTree 
                    key={childKey} 
                    data={childValue} 
                    name={childKey} 
                    level={level + 1} 
                    isEditing={isEditing} // Pasăm proprietatea mai departe
                    onDataChange={onDataChange} // Pasăm și callback-ul mai departe
                    onPathBasedChange={onPathBasedChange} // Pasăm noul callback
                    onMouseEnter={onMouseEnter} // Pasăm și handler-ele pentru tooltip
                    onMouseLeave={onMouseLeave}
                    onMouseMove={onMouseMove}
                    path={[...path, childKey]} // Calculăm path-ul pentru proprietatea obiectului
                    onDeleteElement={onDeleteElement} // Pasăm callback-ul pentru delete
                  />
                ))
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
          {/* Overlay pentru a prinde click-urile în afara meniului */}
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
            {/* Opțiuni pentru OBIECTE */}
            {contextMenu.type === 'object' ? (
              <>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('rename')}
                >
                  📝 Rename
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('add-element')}
                >
                  ➕ Add Element
                </div>
                <div 
                  className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                  onClick={() => handleMenuOption('delete')}
                >
                  🗑️ Delete
                </div>
              </>
            ) 
            /* Opțiuni pentru ARRAY-URI */
            : contextMenu.type === 'array' ? (
              <>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('rename')}
                >
                  📝 Rename
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('add-element')}
                >
                  ➕ Add Element
                </div>
                <div 
                  className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                  onClick={() => handleMenuOption('delete')}
                >
                  🗑️ Delete
                </div>
              </>
            ) 
            /* Opțiuni pentru VALORI PRIMITIVE */
            : (
              <>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('change-field-name')}
                >
                  Change Field Name
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('change-value')}
                >
                  Change Value
                </div>
                <div 
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer text-sm"
                  onClick={() => handleMenuOption('add-field')}
                >
                  ➕ Add Element
                </div>
                <div 
                  className="px-4 py-2 hover:bg-red-100 text-red-600 cursor-pointer text-sm border-t border-gray-200"
                  onClick={() => handleMenuOption('delete')}
                >
                  🗑️ Delete
                </div>
              </>
            )}
          </div>
        </>
      )}
      
      {/* Meniul de selecție tip pentru adăugare elemente */}
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
