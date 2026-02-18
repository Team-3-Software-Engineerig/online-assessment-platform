import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ExamProvider } from './context/ExamContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ExamProvider>
        <App />
      </ExamProvider>
    </ErrorBoundary>
  </StrictMode>,
);
