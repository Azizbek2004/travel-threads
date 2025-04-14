"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  Button,
  CircularProgress,
  ListItemAvatar,
  ListItemText,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useAuth } from "../../../hooks/useAuth";
import {
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  Notification,
} from "../../../services/notifications";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications when the component mounts
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const notificationsData = await getUserNotifications(currentUser.uid);

      // Ensure we have valid notification data
      if (Array.isArray(notificationsData)) {
        setNotifications(notificationsData);

        // Count unread notifications
        const unread = notificationsData.filter(
          (notification) => !notification.read
        ).length;
        setUnreadCount(unread);
      } else {
        // Handle case where notifications aren't returned as expected
        console.error("Unexpected notification data format");
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Set empty notifications on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
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
      setUnreadCount((prev) => Math.max(0, prev - 1));
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

    handleCloseMenu();
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await markAllNotificationsAsRead(currentUser.uid);

      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Render notification icon with badge
  return (
    <>
      <IconButton color="inherit" onClick={handleOpenMenu}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            overflow: "auto",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: notification.read ? "none" : "3px solid",
                borderColor: "primary.main",
                bgcolor: notification.read ? "transparent" : "action.hover",
              }}
            >
              <ListItemAvatar>
                <Avatar
                  src={notification.actorPhotoURL}
                  alt={notification.actorName || ""}
                >
                  {notification.actorName ? (
                    notification.actorName.charAt(0).toUpperCase()
                  ) : (
                    <NotificationsIcon />
                  )}
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
              />
            </MenuItem>
          ))
        )}

        {notifications.length > 0 && (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Button size="small" onClick={() => navigate("/notifications")}>
              View All
            </Button>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;
