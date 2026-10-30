import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ToastContainer } from './components/common/ToastContainer.jsx';
import { BackgroundMesh } from './components/common/BackgroundMesh.jsx';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
    initAuth();
  }, [initAuth, initTheme]);

  return (
    <ErrorBoundary>
      <BackgroundMesh />
      <RouterProvider router={router} />
      <ToastContainer />
    </ErrorBoundary>
  );
}
