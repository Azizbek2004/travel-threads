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
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material"
import { Link } from "react-router-dom"
import { getUserProfile } from "../../services/firestore"
import { useAuth } from "../../hooks/useAuth"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import { Search, Clear } from "@mui/icons-material"
import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { db } from "../../firebase"

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime)

const ConversationList = () => {
  const { currentUser } = useAuth()
  const [conversations, setConversations] = useState<any[]>([])
  const [filteredConversations, setFilteredConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({})
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!currentUser) return

    setLoading(true)

    // Set up real-time listener for conversations
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("updatedAt", "desc"),
    )

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        const conversationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setConversations(conversationsData)
        setFilteredConversations(conversationsData)

        // Fetch user profiles for each conversation
        const profiles: { [key: string]: any } = { ...userProfiles }
        for (const convo of conversationsData) {
          const otherUserId = convo.participants.find((id: string) => id !== currentUser.uid)
          if (otherUserId && !profiles[otherUserId]) {
            try {
              const profile = await getUserProfile(otherUserId)
              if (profile) {
                profiles[otherUserId] = profile
              }
            } catch (error) {
              console.error(`Error fetching profile for user ${otherUserId}:`, error)
            }
          }
        }

        setUserProfiles(profiles)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching conversations:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [currentUser])

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter((conversation) => {
      const otherUserId = conversation.participants.find((id: string) => id !== currentUser?.uid)
      const otherUser = userProfiles[otherUserId]

      if (!otherUser) return false

      return otherUser.displayName.toLowerCase().includes(query)
    })

    setFilteredConversations(filtered)
  }, [searchQuery, conversations, userProfiles, currentUser])

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <TextField
          fullWidth
          placeholder="Search conversations"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      {filteredConversations.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {searchQuery ? "No conversations match your search" : "No conversations yet"}
          </Typography>
          {!searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start messaging by visiting a user's profile
            </Typography>
          )}
        </Box>
      ) : (
        <List sx={{ width: "100%", p: 0 }}>
          {filteredConversations.map((conversation) => {
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
                    "&:hover": {
                      bgcolor: unread ? "action.selected" : "action.hover",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge overlap="circular" variant="dot" color="primary" invisible={!unread}>
                      <Avatar src={otherUser.photoURL} alt={otherUser.displayName}>
                        {otherUser.displayName?.charAt(0) || "U"}
                      </Avatar>
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
                            {dayjs(lastMessage.timestamp).fromNow()}
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
      )}
    </Box>
  )
}

export default ConversationList
