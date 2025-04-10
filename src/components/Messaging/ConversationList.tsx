"use client"

import { useState, useEffect } from "react"
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  Badge,
  CircularProgress,
} from "@mui/material"
import { Link } from "react-router-dom"
import { getConversations, getUserProfile } from "../../services/firestore"
import { useAuth } from "../../hooks/useAuth"
import dayjs from "dayjs" // Replace date-fns with dayjs
import relativeTime from "dayjs/plugin/relativeTime" // Import the relativeTime plugin

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime)

const ConversationList = () => {
  const { currentUser } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({})

  useEffect(() => {
    if (!currentUser) return

    const fetchConversations = async () => {
      try {
        const convos = await getConversations(currentUser.uid)
        setConversations(convos)

        // Fetch user profiles for each conversation
        const profiles: { [key: string]: any } = {}
        for (const convo of convos) {
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No conversations yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Start messaging by visiting a user's profile
        </Typography>
      </Box>
    )
  }

  return (
    <List sx={{ width: "100%" }}>
      {conversations.map((conversation) => {
        const otherUserId = conversation.participants.find((id: string) => id !== currentUser?.uid)
        const otherUser = userProfiles[otherUserId]
        const lastMessage = conversation.lastMessage

        if (!otherUser) return null

        const unread = lastMessage && lastMessage.senderId !== currentUser?.uid && !lastMessage.read

        return (
          <Box key={conversation.id}>
            <ListItem
              button
              component={Link}
              to={`/messages/${otherUserId}`}
              sx={{
                py: 2,
                bgcolor: unread ? "action.hover" : "transparent",
              }}
            >
              <ListItemAvatar>
                <Badge overlap="circular" variant="dot" color="primary" invisible={!unread}>
                  <Avatar src={otherUser.photoURL} alt={otherUser.displayName} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: unread ? "bold" : "normal",
                      color: unread ? "text.primary" : "text.secondary",
                    }}
                  >
                    {otherUser.displayName}
                  </Typography>
                }
                secondary={
                  lastMessage ? (
                    <Box component="span" sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "70%",
                          fontWeight: unread ? "bold" : "normal",
                        }}
                      >
                        {lastMessage.mediaUrl ? "📷 Image" : lastMessage.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(lastMessage.timestamp).fromNow()}{" "}
                        {/* Use dayjs fromNow instead of formatDistanceToNow */}
                      </Typography>
                    </Box>
                  ) : (
                    "No messages yet"
                  )
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </Box>
        )
      })}
    </List>
  )
}

export default ConversationList
