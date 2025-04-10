'use client';

import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getMessages } from '../../services/firestore';

const MessageList = ({ userId }: { userId: string }) => {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await getMessages(userId);
      setMessages(msgs);
    };
    fetchMessages();
  }, [userId]);

  return (
    <Box>
      {messages.map((msg) => (
        <Box key={msg.id} sx={{ mb: 2 }}>
          <Typography variant="body1">{msg.text}</Typography>
          <Typography variant="caption">From: {msg.from}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default MessageList;
