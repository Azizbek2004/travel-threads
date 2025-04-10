'use client';

import type React from 'react';

import { Routes, Route, Navigate } from 'react-router-dom';
import {
  Home,
  ProfilePage,
  PostPage,
  CreatePostPage,
  SearchPage,
  MessagingPage,
  AdminPage,
} from '../pages';
import ConversationsPage from '../pages/ConversationsPage';
import { Login, Signup } from '../components/Auth';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/profile/:userId" element={<ProfilePage />} />
    <Route path="/post/:id" element={<PostPage />} />
    <Route
      path="/create-post"
      element={
        <ProtectedRoute>
          <CreatePostPage />
        </ProtectedRoute>
      }
    />
    <Route path="/search" element={<SearchPage />} />
    <Route
      path="/messages"
      element={
        <ProtectedRoute>
          <ConversationsPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/messages/:userId"
      element={
        <ProtectedRoute>
          <MessagingPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <ProtectedRoute>
          <AdminPage />
        </ProtectedRoute>
      }
    />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
  </Routes>
);

export default AppRoutes;
