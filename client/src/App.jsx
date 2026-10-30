import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { useAuthStore } from './store/authStore.js';

export default function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <RouterProvider router={router} />;
}
