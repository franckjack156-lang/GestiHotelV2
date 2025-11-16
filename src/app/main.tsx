import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from '@/features/auth/contexts/AuthProvider';
import { ErrorBoundary } from '@/shared/components/error';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { initSentry } from '@/core/config/sentry';
import { initGA4 } from '@/core/config/analytics';
import { initPerformanceMonitoring } from '@/core/utils/performanceMonitoring';
import '@/styles/globals.css';
import '@/shared/i18n/config'; // Initialiser i18n

// Initialiser les services de monitoring (avant React)
initSentry();
initGA4();
initPerformanceMonitoring();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
