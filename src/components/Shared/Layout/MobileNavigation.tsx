'use client';

import type React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import { Home, Search, Person, Message, Add, Event } from '@mui/icons-material';
import { useAuth } from '../../../hooks/useAuth';

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [createMenuAnchorEl, setCreateMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  // Determine active tab based on current path
  const getCurrentValue = () => {
    const path = location.pathname;
    if (path === '/') return 0;
    if (path.startsWith('/search')) return 1;
    if (path.startsWith('/create')) return 2;
    if (path.startsWith('/messages')) return 3;
    if (path.startsWith('/profile') || path.startsWith('/events')) return 4;
    return 0;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/');
        break;
      case 1:
        navigate('/search');
        break;
      case 2:
        handleCreateButtonClick(event as React.MouseEvent<HTMLElement>);
        break;
      case 3:
        navigate('/messages');
        break;
      case 4:
        navigate(currentUser ? `/profile/${currentUser.uid}` : '/login');
        break;
    }
  };

  const handleCreateButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setCreateMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setCreateMenuAnchorEl(null);
  };

  const handleCreatePost = () => {
    if (currentUser) {
      navigate('/create-post');
    } else {
      navigate('/login', { state: { from: '/create-post' } });
    }
    handleMenuClose();
  };

  const handleCreateEvent = () => {
    if (currentUser) {
      navigate('/create-event');
    } else {
      navigate('/login', { state: { from: '/create-event' } });
    }
    handleMenuClose();
  };

  return (
    <>
      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleChange}
          showLabels
        >
          <BottomNavigationAction label="Home" icon={<Home />} />
          <BottomNavigationAction label="Search" icon={<Search />} />
          <BottomNavigationAction label="Create" icon={<Add />} />
          <BottomNavigationAction label="Messages" icon={<Message />} />
          <BottomNavigationAction label="Profile" icon={<Person />} />
        </BottomNavigation>
      </Paper>

      {/* Create Menu */}
      <Menu
        anchorEl={createMenuAnchorEl}
        open={Boolean(createMenuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleCreatePost}>
          <span className="material-icons-outlined" style={{ marginRight: 8 }}>
            post_add
          </span>
          Create Post
        </MenuItem>
        <MenuItem onClick={handleCreateEvent}>
          <Event sx={{ mr: 1 }} />
          Create Event
        </MenuItem>
      </Menu>
    </>
  );
};

export default MobileNavigation;
