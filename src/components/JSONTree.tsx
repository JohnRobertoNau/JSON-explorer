import React, { useState } from 'react';

interface JSONTreeProps {
  data: any;
  name?: string;
  level?: number;
  isEditing?: boolean; // Am adăugat noua proprietate opțională
  onDataChange?: (newData: any) => void; // Callback pentru propagarea modificărilor
}

const JSONTree: React.FC<JSONTreeProps> = ({ data, name, level = 0, isEditing = false, onDataChange }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand primele 2 niveluri
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: string; value: any; key?: string } | null>(null);

  // Handler pentru click-dreapta
  const handleContextMenu = (event: React.MouseEvent, value: any, key?: string) => {
    if (!isEditing) return; // Activăm meniul doar în modul de editare

    event.preventDefault();
    event.stopPropagation();
    
    const type = getValueType(value);
    
    // Calculăm poziția pentru meniu bazat pe poziția cursorului
    setContextMenu({ 
      x: event.clientX, 
      y: event.clientY,
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
  };

  // Handler pentru opțiunile din meniu
  const handleMenuOption = (action: string) => {
    if (!contextMenu) return;
    
    const { type, value, key } = contextMenu;
    
    // Închide meniul mai întâi
    setContextMenu(null);
    
    // Acțiuni pentru OBIECTE
    if (type === 'object') {
      switch (action) {
        case 'rename':
          const newValue1 = prompt(`Enter the new name for "${key}":`);
          // alert(`Redenumește obiectul: "${key}"`);
          if (newValue1 != null) {
            console.log(`The name has changed ` + newValue1);
            // TODO: save the change
          }
          // TODO: Implementare: modifică cheia obiectului și apelează onDataChange
          break;
        case 'delete':
          // TODO: Implementare: șterge obiectul și apelează onDataChange
          break;
        case 'add-element':
          alert(`Adaugă element nou în obiectul: "${key || 'root'}"`);
          // TODO: Implementare: adaugă element în obiect și apelează onDataChange
          break;
      }
    }
    
    // Acțiuni pentru ARRAY-URI
    else if (type === 'array') {
      switch (action) {
        case 'rename':
          alert(`Redenumește array-ul: "${key}"`);
          // TODO: Implementare: modifică cheia array-ului și apelează onDataChange
          break;
        case 'delete':
          alert(`Șterge array-ul: "${key}"`);
          // TODO: Implementare: șterge array-ul și apelează onDataChange
          break;
        case 'add-element':
          alert(`Adaugă element nou în array-ul: "${key || 'root'}"`);
          // TODO: Implementare: adaugă element în array și apelează onDataChange
          break;
      }
    }
    // Acțiuni pentru VALORI PRIMITIVE
    else {
      switch (action) {
        case 'change-field-name':
          alert(`Schimbă numele câmpului: "${key}"`);
          // TODO: Implementare: modifică cheia câmpului și apelează onDataChange
          break;
        case 'change-value':
          alert(`Schimbă valoarea: "${key}" = ${JSON.stringify(value)} (${type})`);
          // TODO: Implementare: modifică valoarea câmpului și apelează onDataChange
          break;
        case 'add-field':
          alert(`Adaugă câmp nou lângă: "${key}"`);
          // TODO: Implementare: adaugă câmp nou și apelează onDataChange
          break;
        case 'delete':
          alert(`Șterge câmpul: "${key}"`);
          // TODO: Implementare: șterge câmpul și apelează onDataChange
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
                  ➕ Add Field
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
    </div>
  );
};

export default JSONTree;
