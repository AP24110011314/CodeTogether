import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Room from './pages/Room.jsx';
import NotFound from './pages/NotFound.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/room/:slug',
    element: (
      <ProtectedRoute>
        <Room />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

