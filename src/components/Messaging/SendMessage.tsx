'use client';

import type React from 'react';
import { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { sendMessage } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';

const SendMessage = ({ toUserId }: { toUserId: string }) => {
  const { currentUser } = useAuth();
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    await sendMessage({ from: currentUser.uid, to: toUserId, text });
    setText('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
      <TextField
        label="Message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        fullWidth
        multiline
        rows={2}
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Send
      </Button>
    </Box>
  );
};

export default SendMessage;
