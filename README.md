# JSON Explorer

JSON Explorer is a modern, interactive web application for viewing, editing, and managing JSON files. It provides a graphical interface for working with JSON data, making it easy to visualize, modify, and organize complex structures. The application is built with React and TypeScript, and includes advanced features such as drag-and-drop editing, version history, and AI-powered assistance.

## Features

- **Visual JSON Tree Editor**: View and edit JSON files in a tree structure. Easily modify values, add or remove elements, and rename keys.
- **Drag & Drop Support**: Reorder elements within arrays and objects using intuitive drag-and-drop interactions.
- **File Management**: Open, create, and save JSON files directly from your browser. Supports file selection and drag-and-drop upload.
- **Version History**: Automatically tracks changes and allows you to restore previous versions of your JSON files.
- **Text Editor for New Files**: Create new JSON files using a built-in text editor with live preview and syntax validation.
- **AI Assistant**: Integrated AI assistant (Gemini, OpenAI, Claude) to help explain, validate, and modify your JSON data using natural language queries.
- **Tooltips and Hover Info**: Get detailed information about each element in your JSON structure by hovering over nodes.
- **Auto-Scroll and Indentation**: Smart auto-scroll and indentation features for efficient editing and navigation.

## How It Works

1. **Open or Create a File**: Select a JSON file from your computer or create a new one using the text editor.
2. **Edit in Tree View**: Use the graphical tree to explore and modify your JSON data. Drag elements to reorder, right-click for context menus, and use tooltips for details.
3. **Save and Download**: Save your changes and download the updated file. All versions are tracked in the history panel for easy recovery.
4. **AI Assistance**: Ask questions or request modifications in natural language. The AI assistant can explain structures, validate data, and perform edits automatically.

## About files

src/components/JSONTree.tsx is the main component for rendering the JSON tree structure. It handles the display of nodes, drag-and-drop functionality, and context menus for editing.

src/hooks/useAI.ts is responsible for managing interactions with the AI assistant, including sending queries and processing responses.

src/App.tsx is the main entry point of the application, integrating all components and managing state.