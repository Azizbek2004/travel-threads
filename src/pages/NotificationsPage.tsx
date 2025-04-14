"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material";
import { ArrowBack, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  type Notification,
} from "../services/notifications";

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const notificationsData = await getUserNotifications(currentUser.uid, 50); // Get more notifications for the full page
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id) return;

    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(notification.id);

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    }

    // Navigate based on notification type
    if (notification.entityId && notification.entityType) {
      switch (notification.entityType) {
        case "post":
          navigate(`/post/${notification.entityId}`);
          break;
        case "event":
          navigate(`/event/${notification.entityId}`);
          break;
        case "user":
          navigate(`/profile/${notification.entityId}`);
          break;
        case "message":
          navigate(`/messages/${notification.entityId}`);
          break;
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDeleteNotification = async (
    event: React.MouseEvent,
    notificationId: string
  ) => {
    event.stopPropagation(); // Prevent triggering the parent click handler

    if (!notificationId) return;

    try {
      await deleteNotification(notificationId);

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((n) => n.id !== notificationId)
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  return (
    <Box sx={{ pb: 4, maxWidth: "800px", mx: "auto" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            Notifications
          </Typography>
          {notifications.length > 0 && (
            <Button color="primary" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification) => (
              <Box key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 2,
                    borderLeft: notification.read ? "none" : "4px solid",
                    borderColor: "primary.main",
                    bgcolor: notification.read ? "transparent" : "action.hover",
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) =>
                        notification.id &&
                        handleDeleteNotification(e, notification.id)
                      }
                    >
                      <Delete />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      src={notification.actorPhotoURL}
                      alt={notification.actorName || ""}
                    >
                      {notification.actorName
                        ? notification.actorName.charAt(0).toUpperCase()
                        : "N"}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {notification.createdAt &&
                        typeof notification.createdAt.toDate === "function"
                          ? new Date(
                              notification.createdAt.toDate()
                            ).toLocaleString()
                          : "Just now"}
                      </Typography>
                    }
                    primaryTypographyProps={{
                      variant: "body1",
                      color: notification.read
                        ? "text.secondary"
                        : "text.primary",
                    }}
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default NotificationsPage;
