import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from '@/app/providers';
import { AppRouter } from '@/routes';
import '@/styles/globals.css';

// Apply saved theme before first render to avoid flash
(function () {
  try {
    const stored = JSON.parse(localStorage.getItem('autopro-theme') ?? '{}') as { state?: { theme?: string } };
    const savedTheme = stored?.state?.theme;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme ?? (systemDark ? 'dark' : 'light');
    document.documentElement.classList.add(theme === 'dark' ? 'dark' : 'light');
  } catch {
    document.documentElement.classList.add('dark');
  }
}());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
