// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Important - this applies Tailwind!
import App from './App';
// import { BrowserRouter } from 'react-router-dom'; // <-- REMOVE THIS IMPORT

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* REMOVE <BrowserRouter> AND </BrowserRouter> TAGS */}
    <App />
  </React.StrictMode>
);
