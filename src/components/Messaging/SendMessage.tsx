"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import {
  TextField,
  Button,
  Box,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Divider,
} from "@mui/material"
import { Send, AttachFile, InsertEmoticon, Close, Event, Article } from "@mui/icons-material"
import { sendMessage } from "../../services/firestore"
import { useAuth } from "../../hooks/useAuth"
import { uploadImage } from "../../services/storage"
import { useMobile } from "../../hooks/use-mobile"
import { getPosts } from "../../services/firestore"
import { getUpcomingEvents } from "../../services/events"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface SendMessageProps {
  conversationId: string
  otherUserId: string // Keeping this for future use even if not currently used
  replyText?: string
  onClearReply?: () => void
}

const SendMessage = ({ conversationId, replyText, onClearReply }: SendMessageProps) => {
  const { currentUser } = useAuth()
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textFieldRef = useRef<HTMLInputElement>(null)
  const { isMobileOrTablet } = useMobile()

  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareType, setShareType] = useState<"post" | "event" | null>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loadingSharedContent, setLoadingSharedContent] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  // Focus on text field when reply text changes
  useEffect(() => {
    if (replyText) {
      textFieldRef.current?.focus()
    }
  }, [replyText])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || (!text.trim() && !image)) return

    setSending(true)

    try {
      let mediaUrl = ""
      if (image) {
        mediaUrl = await uploadImage(image)
      }

      const messageData: any = {
        conversationId,
        senderId: currentUser.uid,
        text: text.trim(),
        mediaUrl,
      }

      // Add shared content if selected
      if (selectedPost) {
        messageData.sharedPost = {
          id: selectedPost.id,
          title: selectedPost.title,
          content: selectedPost.content,
          authorId: selectedPost.authorId,
        }
      }

      if (selectedEvent) {
        messageData.sharedEvent = {
          id: selectedEvent.id,
          title: selectedEvent.title,
          startDate: selectedEvent.startDate,
          location: selectedEvent.location,
        }
      }

      await sendMessage(
        conversationId,
        currentUser.uid,
        text.trim(),
        mediaUrl,
        messageData.sharedPost,
        messageData.sharedEvent,
      )

      setText("")
      setImage(null)
      setImagePreview(null)
      if (onClearReply) onClearReply()
      setShowEmojiPicker(false)
      setSelectedPost(null)
      setSelectedEvent(null)

      // Focus back on the text field after sending
      textFieldRef.current?.focus()
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    setText((prev) => prev + emoji.native)
  }

  const handleRemoveImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const fetchPosts = async () => {
    setLoadingSharedContent(true)
    try {
      const fetchedPosts = await getPosts()
      setPosts(fetchedPosts)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoadingSharedContent(false)
    }
  }

  const fetchEvents = async () => {
    setLoadingSharedContent(true)
    try {
      const fetchedEvents = await getUpcomingEvents(10)
      setEvents(fetchedEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoadingSharedContent(false)
    }
  }

  const openShareDialog = (type: "post" | "event") => {
    setShareType(type)
    setShowShareDialog(true)
    if (type === "post") {
      fetchPosts()
    } else {
      fetchEvents()
    }
  }

  const handleShareDialogClose = () => {
    setShowShareDialog(false)
    setShareType(null)
  }

  const handleSelectPost = (post: any) => {
    setSelectedPost(post)
    setShowShareDialog(false)
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
    setShowShareDialog(false)
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ position: "relative" }}>
      {/* Reply preview */}
      <Collapse in={Boolean(replyText)}>
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 1,
            borderLeft: 4,
            borderColor: "primary.main",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "text.secondary",
              fontSize: "0.875rem",
              fontStyle: "italic",
            }}
          >
            Replying to: {replyText}
          </Box>
          <IconButton size="small" onClick={onClearReply}>
            <Close fontSize="small" />
          </IconButton>
        </Paper>
      </Collapse>

      {/* Image preview */}
      <Collapse in={Boolean(imagePreview)}>
        <Box sx={{ position: "relative", mb: 1 }}>
          <img
            src={imagePreview || ""}
            alt="Preview"
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
          <IconButton
            size="small"
            onClick={handleRemoveImage}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": {
                bgcolor: "rgba(0,0,0,0.7)",
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </Collapse>

      {/* Selected shared content preview */}
      {selectedPost && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="subtitle2">Sharing post: {selectedPost.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedPost.content.substring(0, 60)}...
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelectedPost(null)}>
            <Close fontSize="small" />
          </IconButton>
        </Paper>
      )}

      {selectedEvent && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            mb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="subtitle2">Sharing event: {selectedEvent.title}</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {new Date(selectedEvent.startDate).toLocaleDateString()}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelectedEvent(null)}>
            <Close fontSize="small" />
          </IconButton>
        </Paper>
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          position: "relative",
        }}
      >
        <Tooltip title="Add emoji">
          <IconButton
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            color={showEmojiPicker ? "primary" : "default"}
          >
            <InsertEmoticon />
          </IconButton>
        </Tooltip>

        <Tooltip title="Attach file">
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <AttachFile />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share post">
          <IconButton onClick={() => openShareDialog("post")}>
            <Article />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share event">
          <IconButton onClick={() => openShareDialog("event")}>
            <Event />
          </IconButton>
        </Tooltip>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: "none" }}
        />

        <TextField
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          multiline
          maxRows={4}
          inputRef={textFieldRef}
          sx={{ ml: 1 }}
          InputProps={{
            endAdornment: (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={sending || (!text.trim() && !image)}
                sx={{
                  minWidth: 0,
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  p: 0,
                }}
              >
                {sending ? <CircularProgress size={24} color="inherit" /> : <Send />}
              </Button>
            ),
          }}
        />
      </Box>

      {/* Emoji picker */}
      <Collapse in={showEmojiPicker}>
        <Box
          sx={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            zIndex: 10,
            mb: 1,
            maxWidth: isMobileOrTablet ? "100%" : "360px",
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
          />
        </Box>
      </Collapse>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onClose={handleShareDialogClose} fullWidth maxWidth="sm">
        <DialogTitle>{shareType === "post" ? "Share a Post" : "Share an Event"}</DialogTitle>
        <DialogContent dividers>
          {loadingSharedContent ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {shareType === "post" ? (
                posts.length > 0 ? (
                  posts.map((post) => (
                    <React.Fragment key={post.id}>
                      <ListItem onClick={() => handleSelectPost(post)} sx={{ cursor: "pointer" }}>
                        <ListItemAvatar>
                          <Avatar>
                            <Article />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={post.title} secondary={post.content.substring(0, 60) + "..."} />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))
                ) : (
                  <Typography align="center" color="text.secondary" sx={{ p: 2 }}>
                    No posts available to share
                  </Typography>
                )
              ) : events.length > 0 ? (
                events.map((event) => (
                  <React.Fragment key={event.id}>
                    <ListItem onClick={() => handleSelectEvent(event)} sx={{ cursor: "pointer" }}>
                      <ListItemAvatar>
                        <Avatar>
                          <Event />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={event.title}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" display="block">
                              {new Date(event.startDate).toLocaleDateString()}
                            </Typography>
                            {event.location?.name && (
                              <Typography component="span" variant="body2">
                                {event.location.name}
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              ) : (
                <Typography align="center" color="text.secondary" sx={{ p: 2 }}>
                  No events available to share
                </Typography>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleShareDialogClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SendMessage
