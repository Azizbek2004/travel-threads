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
import { MoreVert, ContentCopy, Reply, Delete, Event } from "@mui/icons-material"
import { useMobile } from "../../hooks/use-mobile"
import { Link } from "react-router-dom"

interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
  mediaUrl?: string
  sharedPost?: {
    id: string
    title: string
    content: string
    authorId: string
  }
  sharedEvent?: {
    id: string
    title: string
    startDate: string
    location?: {
      name: string
    }
  }
  reactions?: {
    [userId: string]: string
  }
}

interface MessageListProps {
  conversationId: string
  otherUserId: string
  onReply?: (text: string) => void
}

const MessageList = ({ conversationId, otherUserId, onReply }: MessageListProps) => {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [otherUser, setOtherUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
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
        })) as Message[]

        setMessages(messagesData)
        setLoading(false)

        // Mark messages as read if there are unread messages from the other user
        const unreadMessages = messagesData.filter((msg) => msg.senderId !== currentUser.uid && !msg.read)

        if (unreadMessages.length > 0) {
          markMessagesAsRead(conversationId, currentUser.uid).catch((error) =>
            console.error("Error marking messages as read:", error),
          )
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, message: Message) => {
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
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message: Message) => {
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
      {Object.entries(groupedMessages).map(([date, msgs]) => (
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

          {msgs.map((message) => {
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

                    {message.sharedPost && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: "background.default",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                        component={Link}
                        to={`/post/${message.sharedPost.id}`}
                      >
                        <Typography variant="subtitle2" color="primary">
                          Shared Post: {message.sharedPost.title}
                        </Typography>
                        <Typography variant="body2" noWrap>
                          {message.sharedPost.content.substring(0, 60)}...
                        </Typography>
                      </Paper>
                    )}

                    {message.sharedEvent && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 1,
                          p: 1,
                          bgcolor: "background.default",
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                        component={Link}
                        to={`/event/${message.sharedEvent.id}`}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Event fontSize="small" sx={{ mr: 1, color: "primary.main" }} />
                          <Typography variant="subtitle2" color="primary">
                            {message.sharedEvent.title}
                          </Typography>
                        </Box>
                        {message.sharedEvent.startDate && (
                          <Typography variant="caption" display="block">
                            {new Date(message.sharedEvent.startDate).toLocaleDateString()}
                          </Typography>
                        )}
                        {message.sharedEvent.location?.name && (
                          <Typography variant="caption" display="block">
                            {message.sharedEvent.location.name}
                          </Typography>
                        )}
                      </Paper>
                    )}

                    {message.mediaUrl && (
                      <Box sx={{ mt: 1, maxWidth: "100%" }}>
                        <img
                          src={message.mediaUrl || "/placeholder.svg"}
                          alt="Shared media"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "200px",
                            borderRadius: "8px",
                            cursor: "pointer",
                          }}
                          onClick={() => window.open(message.mediaUrl, "_blank")}
                        />
                      </Box>
                    )}

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
