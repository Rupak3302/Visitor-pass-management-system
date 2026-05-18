import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'
import './index.css' // Import our tailwind CSS rule

// Importing our global tools
import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from 'react-hot-toast';

// Inject our entire React app into it
ReactDOM.createRoot(document.getElementById('root')).render(

  // <React.StrictMode>

    <AuthProvider>
      <App />

      {/* Put the toster here at the top level.
        This allows any page in the app to trigger popup notify! */}
      <Toaster position="top-right" />
    </AuthProvider>

  // </React.StrictMode>
);


