'use client';

import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Avatar, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { Add as AddIcon } from '@mui/icons-material';
import { useMobile } from '../../hooks/use-mobile';

interface CreatePostProps {
  onPostCreated?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { isMobileOrTablet } = useMobile();

  const handleCreatePost = () => {
    navigate('/create-post');
  };

  if (!currentUser) return null;

  if (isMobileOrTablet) {
    return null; // We use a floating action button in mobile view, so no need for this component
  }

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <Avatar
        src={currentUser?.photoURL || undefined}
        alt={currentUser?.displayName || 'User'}
        sx={{ mr: 2 }}
      />
      <Button
        variant="outlined"
        fullWidth
        sx={{
          borderRadius: 5,
          px: 3,
          py: 1,
          justifyContent: 'flex-start',
          color: 'text.secondary',
        }}
        onClick={handleCreatePost}
        startIcon={<AddIcon />}
      >
        <Typography variant="body1">What's on your mind?</Typography>
      </Button>
    </Box>
  );
};

export default CreatePost;
