import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';
import JSONExplorer from './components/JSONExplorer';

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <JSONExplorer />
      </div>
    </DndProvider>
  );
}

export default App;
