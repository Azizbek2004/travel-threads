"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TextField, Button, Box, IconButton, Paper, CircularProgress, Tooltip, Collapse } from "@mui/material"
import { Send, AttachFile, InsertEmoticon, Close } from "@mui/icons-material"
import { sendMessage } from "../../services/firestore"
import { useAuth } from "../../hooks/useAuth"
import { uploadImage } from "../../services/storage"
import { useMobile } from "../../hooks/use-mobile"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface SendMessageProps {
  conversationId: string
  otherUserId: string
  replyText?: string
  onClearReply?: () => void
}

const SendMessage = ({ conversationId, otherUserId, replyText, onClearReply }: SendMessageProps) => {
  const { currentUser } = useAuth()
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textFieldRef = useRef<HTMLInputElement>(null)
  const { isMobileOrTablet } = useMobile()

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

      await sendMessage(conversationId, currentUser.uid, text.trim(), mediaUrl)

      setText("")
      setImage(null)
      setImagePreview(null)
      if (onClearReply) onClearReply()
      setShowEmojiPicker(false)
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
    </Box>
  )
}

export default SendMessage
