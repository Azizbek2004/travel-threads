"use client"

import { Box, Typography, Paper } from "@mui/material"
import ConversationList from "../components/Messaging/ConversationList"
import { useAuth } from "../hooks/useAuth"
import { Navigate } from "react-router-dom"

const ConversationsPage = () => {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return <Navigate to="/login" />
  }

  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Paper elevation={1}>
        <ConversationList />
      </Paper>
    </Box>
  )
}

export default ConversationsPage
