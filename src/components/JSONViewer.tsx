import React from 'react';
import ReactJson from 'react-json-view';

interface JSONViewerProps {
  data: any;
}

const JSONViewer: React.FC<JSONViewerProps> = ({ data }) => {
  return (
    <div className="p-4 h-full overflow-auto">
      <ReactJson
        src={data}
        theme="monokai"
        displayDataTypes={false}
        displayObjectSize={false}
        enableClipboard={true}
        indentWidth={2}
        collapsed={false}
        style={{
          backgroundColor: '#1e1e1e',
          fontSize: '14px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          borderRadius: '8px',
          padding: '16px'
        }}
        iconStyle="triangle"
        quotesOnKeys={false}
        sortKeys={false}
        validationMessage="JSON invalid"
        name={false}
      />
    </div>
  );
};

export default JSONViewer;
