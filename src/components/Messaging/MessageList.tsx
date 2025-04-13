"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import {
  Box,
  Typography,
  Avatar,
  CircularProgress,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { markMessagesAsRead, getUserProfile } from "../../services/firestore"
import { useAuth } from "../../hooks/useAuth"
import { onSnapshot, collection, query, where, orderBy } from "firebase/firestore"
import { db } from "../../firebase"
import dayjs from "dayjs"
import { MoreVert, ContentCopy, Reply, Delete } from "@mui/icons-material"
import { useMobile } from "../../hooks/use-mobile"

interface MessageListProps {
  conversationId: string
  otherUserId: string
  onReply?: (text: string) => void
}

const MessageList = ({ conversationId, otherUserId, onReply }: MessageListProps) => {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedMessage, setSelectedMessage] = useState<any>(null)
  const { isMobileOrTablet } = useMobile()

  // Fetch other user's profile
  useEffect(() => {
    const fetchOtherUser = async () => {
      try {
        const profile = await getUserProfile(otherUserId)
        setOtherUser(profile)
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchOtherUser()
  }, [otherUserId])

  // Set up real-time listener for messages
  useEffect(() => {
    if (!conversationId || !currentUser) return

    setLoading(true)

    const messagesQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "asc"),
    )

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setMessages(messagesData)
        setLoading(false)

        // Mark messages as read
        if (messagesData.some((msg) => msg.senderId !== currentUser.uid && !msg.read)) {
          markMessagesAsRead(conversationId, currentUser.uid)
        }
      },
      (error) => {
        console.error("Error fetching messages:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [conversationId, currentUser])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: any) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedMessage(message)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
    setSelectedMessage(null)
  }

  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.text)
    }
    handleMenuClose()
  }

  const handleReplyToMessage = () => {
    if (selectedMessage && onReply) {
      onReply(selectedMessage.text)
    }
    handleMenuClose()
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message: any) => {
    const date = dayjs(message.timestamp).format("YYYY-MM-DD")
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(message)
    return groups
  }, {})

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (messages.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "300px" }}>
        <Typography color="text.secondary">No messages yet. Start the conversation!</Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: isMobileOrTablet ? "calc(100vh - 200px)" : "60vh",
        overflow: "auto",
        px: 2,
        py: 1,
      }}
    >
      {Object.entries(groupedMessages).map(([date, msgs]: [string, any]) => (
        <Box key={date}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              my: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                bgcolor: "background.paper",
                px: 2,
                py: 0.5,
                borderRadius: 4,
                boxShadow: 1,
              }}
            >
              {dayjs(date).format("MMMM D, YYYY")}
            </Typography>
          </Box>

          {msgs.map((message: any) => {
            const isCurrentUser = message.senderId === currentUser?.uid

            return (
              <Box
                key={message.id}
                sx={{
                  display: "flex",
                  justifyContent: isCurrentUser ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                {!isCurrentUser && (
                  <Avatar
                    src={otherUser?.photoURL}
                    alt={otherUser?.displayName}
                    sx={{ mr: 1, width: 32, height: 32, mt: 0.5 }}
                  >
                    {otherUser?.displayName?.charAt(0) || "U"}
                  </Avatar>
                )}

                <Box sx={{ maxWidth: "75%" }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isCurrentUser ? "primary.main" : "background.paper",
                      color: isCurrentUser ? "primary.contrastText" : "text.primary",
                      position: "relative",
                    }}
                  >
                    <Typography variant="body1">{message.text}</Typography>

                    <IconButton
                      size="small"
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        bgcolor: "background.paper",
                        opacity: 0.7,
                        "&:hover": { opacity: 1, bgcolor: "background.paper" },
                        display: "none",
                        ".MuiPaper-root:hover &": { display: "flex" },
                      }}
                      onClick={(e) => handleMenuOpen(e, message)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Paper>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      textAlign: isCurrentUser ? "right" : "left",
                      mt: 0.5,
                      fontSize: "0.7rem",
                    }}
                  >
                    {dayjs(message.timestamp).format("h:mm A")}
                    {isCurrentUser && (
                      <Box component="span" sx={{ ml: 0.5 }}>
                        {message.read ? " • Read" : ""}
                      </Box>
                    )}
                  </Typography>
                </Box>

                {isCurrentUser && (
                  <Avatar
                    src={currentUser?.photoURL || undefined}
                    alt={currentUser?.displayName || "User"}
                    sx={{ ml: 1, width: 32, height: 32, mt: 0.5 }}
                  >
                    {currentUser?.displayName?.charAt(0) || "U"}
                  </Avatar>
                )}
              </Box>
            )
          })}
        </Box>
      ))}

      <div ref={messagesEndRef} />

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleCopyMessage}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleReplyToMessage}>
          <ListItemIcon>
            <Reply fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reply</ListItemText>
        </MenuItem>
        {selectedMessage?.senderId === currentUser?.uid && (
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <Delete fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default MessageList
