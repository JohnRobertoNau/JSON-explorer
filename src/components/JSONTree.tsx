import React, { useState } from 'react';

interface JSONTreeProps {
  data: any;
  name?: string;
  level?: number;
}

const JSONTree: React.FC<JSONTreeProps> = ({ data, name, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand primele 2 niveluri

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
        <div style={{ marginLeft: `${indent}px` }}>
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
                  />
                ))
              ) : (
                Object.entries(value).map(([childKey, childValue]) => (
                  <JSONTree 
                    key={childKey} 
                    data={childValue} 
                    name={childKey} 
                    level={level + 1} 
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
        >
          <span className="mr-2">📄</span>
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
    <div className="text-sm">
      {renderValue(data, name)}
    </div>
  );
};

export default JSONTree;
