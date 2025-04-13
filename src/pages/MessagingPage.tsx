"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { ArrowBack, MoreVert } from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { getUserProfile, getOrCreateConversation } from "../services/firestore";
import MessageList from "../components/Messaging/MessageList";
import SendMessage from "../components/Messaging/SendMessage";
import { useMobile } from "../hooks/use-mobile";

const MessagingPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation()
  const theme = useTheme();
  const { isMobileOrTablet } = useMobile();
  const [otherUser, setOtherUser] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const isInitialMount = useRef(true);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!currentUser || !userId) {
      navigate("/login");
      return;
    }

    const initializeConversation = async () => {
      // Prevent duplicate initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      setLoading(true);
      try {
        // Get other user's profile
        const userProfile = await getUserProfile(userId);
        setOtherUser(userProfile);

        if (!userProfile) {
          setError("User not found");
          setLoading(false);
          return;
        }

        // Get or create conversation
        const convoId = await getOrCreateConversation([
          currentUser.uid,
          userId,
        ]);
        setConversationId(convoId);
      } catch (err: any) {
        console.error("Error initializing conversation:", err);
        setError("Failed to load conversation: " + err.message);
      } finally {
        setLoading(false);
        initializingRef.current = false;
      }
    };

    // Only run on initial mount or when userId changes
    if (isInitialMount.current || userId) {
      isInitialMount.current = false;
      initializeConversation();
    }
  }, [currentUser, userId, navigate]);

  const handleReply = (text: string) => {
    setReplyText(text);
  };

  const handleClearReply = () => {
    setReplyText("");
  };

  if (!currentUser) {
    return <Typography>Please log in to view messages.</Typography>;
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Mobile layout
  if (isMobileOrTablet) {
    return (
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => navigate(-1)}
            >
              <ArrowBack />
            </IconButton>

            {otherUser && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  ml: 1,
                  flexGrow: 1,
                }}
              >
                <Avatar
                  src={otherUser.photoURL}
                  alt={otherUser.displayName}
                  sx={{ width: 40, height: 40, mr: 1.5 }}
                >
                  {otherUser.displayName?.charAt(0) || "U"}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">
                    {otherUser.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {otherUser.isOnline ? "Online" : "Offline"}
                  </Typography>
                </Box>
              </Box>
            )}

            <IconButton edge="end" color="inherit">
              <MoreVert />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            bgcolor: theme.palette.grey[50],
          }}
        >
          {conversationId && (
            <MessageList
              conversationId={conversationId}
              otherUserId={userId || ""}
              onReply={handleReply}
            />
          )}
        </Box>

        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {conversationId && (
            <SendMessage
              conversationId={conversationId}
              otherUserId={userId || ""}
              replyText={replyText}
              onClearReply={handleClearReply}
            />
          )}
        </Box>
      </Box>
    );
  }

  // Desktop layout
  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <Paper
        elevation={2}
        sx={{ height: "75vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 1 }}
          >
            <ArrowBack />
          </IconButton>

          {otherUser && (
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Avatar
                src={otherUser.photoURL}
                alt={otherUser.displayName}
                sx={{ width: 48, height: 48, mr: 2 }}
              >
                {otherUser.displayName?.charAt(0) || "U"}
              </Avatar>
              <Box>
                <Typography variant="h6">{otherUser.displayName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {otherUser.isOnline ? "Online" : "Last seen recently"}
                </Typography>
              </Box>
            </Box>
          )}

          <Box>
            <IconButton color="inherit">
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Messages */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            bgcolor: theme.palette.grey[50],
          }}
        >
          {conversationId && (
            <MessageList
              conversationId={conversationId}
              otherUserId={userId || ""}
              onReply={handleReply}
            />
          )}
        </Box>

        {/* Message Input */}
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          {conversationId && (
            <SendMessage
              conversationId={conversationId}
              otherUserId={userId || ""}
              replyText={replyText}
              onClearReply={handleClearReply}
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default MessagingPage;
