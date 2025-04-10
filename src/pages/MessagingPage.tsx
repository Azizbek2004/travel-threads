import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { getMessages, sendMessage } from '../services/firestore';

const MessagingPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || !userId) return;

    const fetchMessages = async () => {
      try {
        const fetchedMessages = await getMessages(currentUser.uid);
        setMessages(
          fetchedMessages.filter(
            (msg) => msg.from === userId || msg.to === userId
          )
        );
      } catch (err: any) {
        setError('Failed to load messages: ' + err.message);
      }
    };
    fetchMessages();
  }, [currentUser, userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userId || !newMessage.trim()) return;

    try {
      await sendMessage({
        from: currentUser.uid,
        to: userId,
        text: newMessage,
      });
      setNewMessage('');
      // Refresh messages
      const updatedMessages = await getMessages(currentUser.uid);
      setMessages(
        updatedMessages.filter(
          (msg) => msg.from === userId || msg.to === userId
        )
      );
    } catch (err: any) {
      setError('Failed to send message: ' + err.message);
    }
  };

  if (!currentUser) {
    return <Typography>Please log in to view messages.</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Messages with User {userId}
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <List sx={{ maxHeight: '50vh', overflow: 'auto', mb: 2 }}>
        {messages.map((msg) => (
          <ListItem key={msg.id}>
            <ListItemText
              primary={msg.text}
              secondary={`From: ${
                msg.from === currentUser.uid ? 'You' : msg.from
              } - ${new Date(msg.timestamp).toLocaleString()}`}
              sx={{
                bgcolor: msg.from === currentUser.uid ? 'grey.200' : 'white',
                p: 1,
                borderRadius: 1,
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box component="form" onSubmit={handleSendMessage}>
        <TextField
          label="Type a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          fullWidth
          multiline
          rows={2}
          margin="normal"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default MessagingPage;
