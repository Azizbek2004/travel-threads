"use client";

import type React from "react";

import { Routes, Route, Navigate } from "react-router-dom";
import {
  Home,
  ProfilePage,
  PostPage,
  CreatePostPage,
  SearchPage,
  MessagingPage,
  AdminPage,
} from "../pages";
import ConversationsPage from "../pages/ConversationsPage";
import EventsPage from "../pages/Eventspage";
import EventDetailPage from "../pages/EventDetailPage";
import CreateEventPage from "../pages/CreateEventPage";
import { Login, Signup } from "../components/Auth";
import { useAuth } from "../hooks/useAuth";
import MessageSharePage from "../pages/MessageSharePage";
import NotificationsPage from "../pages/NotificationsPage";
import EditEventPage from "../pages/EditEventPage";

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

// Admin route protection
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check if user is logged in and has admin privileges
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check for admin status
  if (!currentUser.isAdmin) {
    console.log("User is not an admin, redirecting to home");
    return <Navigate to="/" replace />;
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
      path="/messages/share"
      element={
        <ProtectedRoute>
          <MessageSharePage />
        </ProtectedRoute>
      }
    />
    <Route path="/events" element={<EventsPage />} />
    <Route path="/event/:id" element={<EventDetailPage />} />
    <Route
      path="/create-event"
      element={
        <ProtectedRoute>
          <CreateEventPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/edit-event/:id"
      element={
        <ProtectedRoute>
          <EditEventPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin"
      element={
        <AdminRoute>
          <AdminPage />
        </AdminRoute>
      }
    />
    <Route
      path="/notifications"
      element={
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      }
    />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
  </Routes>
);

export default AppRoutes;
