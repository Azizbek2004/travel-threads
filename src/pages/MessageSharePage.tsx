"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  IconButton,
  AppBar,
  Toolbar,
} from "@mui/material"
import { useAuth } from "../hooks/useAuth"
import { useLocation, useNavigate, Navigate } from "react-router-dom"
import { getConversations, getUserProfile, getOrCreateConversation, sendMessage } from "../services/firestore"
import { ArrowBack, Article, Event } from "@mui/icons-material"
import { useMobile } from "../hooks/use-mobile"

const MessageSharePage = () => {
  const { currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()
  const [conversations, setConversations] = useState<any[]>([])
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Get shared content from location state
  const sharePost = location.state?.sharePost
  const shareEvent = location.state?.shareEvent

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return

      try {
        setLoading(true)
        const conversationsData = await getConversations(currentUser.uid)
        setConversations(conversationsData)

        // Fetch user profiles for each conversation
        const profiles: { [key: string]: any } = {}
        for (const convo of conversationsData) {
          const otherUserId = convo.participants.find((id: string) => id !== currentUser.uid)
          if (otherUserId) {
            const profile = await getUserProfile(otherUserId)
            if (profile) {
              profiles[otherUserId] = profile
            }
          }
        }

        setUserProfiles(profiles)
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [currentUser])

  const handleShareWithUser = async (userId: string) => {
    if (!currentUser) return
    if (!sharePost && !shareEvent) return

    try {
      setSending(true)

      // Get or create conversation with this user
      const conversationId = await getOrCreateConversation([currentUser.uid, userId])

      // Create default text message
      let text = ""
      if (sharePost) {
        text = "I'm sharing a post with you"
      } else if (shareEvent) {
        text = "I'm sharing an event with you"
      }

      // Send message with shared content
      await sendMessage(conversationId, currentUser.uid, text, undefined, sharePost, shareEvent)

      // Navigate to the conversation
      navigate(`/messages/${userId}`)
    } catch (error) {
      console.error("Error sharing content:", error)
    } finally {
      setSending(false)
    }
  }

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  if (!sharePost && !shareEvent) {
    return <Navigate to="/messages" />
  }

  return (
    <Box sx={{ pb: isMobileOrTablet ? 8 : 0 }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
            Share with
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 2, maxWidth: "800px", mx: "auto" }}>
        {/* Shared content preview */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Sharing:
          </Typography>

          {sharePost && (
            <Box sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}>
              <Article sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2">{sharePost.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sharePost.content.substring(0, 100)}...
                </Typography>
              </Box>
            </Box>
          )}

          {shareEvent && (
            <Box sx={{ display: "flex", alignItems: "flex-start", mt: 1 }}>
              <Event sx={{ mr: 1, color: "primary.main" }} />
              <Box>
                <Typography variant="subtitle2">{shareEvent.title}</Typography>
                {shareEvent.startDate && (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(shareEvent.startDate).toLocaleDateString()}
                  </Typography>
                )}
                {shareEvent.location?.name && (
                  <Typography variant="body2" color="text.secondary">
                    {shareEvent.location.name}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Paper>

        <Typography variant="h6" gutterBottom>
          Select a contact
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : conversations.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ p: 4 }}>
            You don't have any conversations yet.
          </Typography>
        ) : (
          <Paper>
            <List>
              {conversations.map((conversation) => {
                const otherUserId = conversation.participants.find((id: string) => id !== currentUser.uid)
                if (!otherUserId) return null

                const otherUser = userProfiles[otherUserId]
                if (!otherUser) return null

                return (
                  <ListItem
                    key={conversation.id}
                    onClick={() => handleShareWithUser(otherUserId)}
                    disabled={sending}
                    sx={{ cursor: "pointer" }}
                  >
                    <ListItemAvatar>
                      <Avatar src={otherUser.photoURL} alt={otherUser.displayName}>
                        {otherUser.displayName?.charAt(0) || "U"}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={otherUser.displayName} secondary={otherUser.email || ""} />
                  </ListItem>
                )
              })}
            </List>
          </Paper>
        )}
      </Box>
    </Box>
  )
}

export default MessageSharePage
