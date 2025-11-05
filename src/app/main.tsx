import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // ✅ Avec les accolades
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
