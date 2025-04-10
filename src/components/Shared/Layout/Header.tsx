'use client';

import type React from 'react';
import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Box,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { logOut } from '../../../services/auth';
import {
  Message,
  Notifications,
  Menu as MenuIcon,
  Add as AddIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useMobile } from '../../../hooks/use-mobile';

const Header = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [createMenuAnchorEl, setCreateMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const isSearchPage = location.pathname.startsWith('/search');
  const { isMobileOrTablet } = useMobile();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(''); // Clear input after search
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleCreateMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setCreateMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
    setCreateMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logOut();
    handleMenuClose();
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

  // Mobile header is simplified
  if (isMobileOrTablet) {
    return (
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar
          sx={{
            justifyContent: 'space-between',
            height: 56,
            minHeight: 56,
            px: 2,
          }}
        >
          {/* Logo */}
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            Travel Threads
          </Typography>

          {/* Right side actions */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {currentUser ? (
              <>
                <IconButton
                  color="inherit"
                  component={Link}
                  to="/messages"
                  sx={{ mr: 1 }}
                >
                  <Badge badgeContent={0} color="error">
                    <Message />
                  </Badge>
                </IconButton>

                <IconButton onClick={handleMobileMenuOpen}>
                  <MenuIcon />
                </IconButton>

                <Menu
                  anchorEl={mobileMenuAnchorEl}
                  open={Boolean(mobileMenuAnchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    component={Link}
                    to={`/profile/${currentUser.uid}`}
                    onClick={handleMenuClose}
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/events"
                    onClick={handleMenuClose}
                  >
                    Events
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                color="primary"
                variant="contained"
                size="small"
                component={Link}
                to="/login"
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  // Desktop header
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          Travel Threads
        </Typography>

        {!isSearchPage && (
          <form onSubmit={handleSearch}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                backgroundColor: 'white',
                borderRadius: 1,
                mr: 2,
                width: '200px',
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                   
                  </InputAdornment>
                ),
              }}
            />
          </form>
        )}

        {currentUser && (
          <Tooltip title="Create">
            <IconButton
              color="inherit"
              onClick={handleCreateMenuOpen}
              sx={{ mr: 1 }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        )}

        <Menu
          anchorEl={createMenuAnchorEl}
          open={Boolean(createMenuAnchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleCreatePost}>
            <span
              className="material-icons-outlined"
              style={{ marginRight: 8 }}
            >
              post_add
            </span>
            Create Post
          </MenuItem>
          <MenuItem onClick={handleCreateEvent}>
            <EventIcon sx={{ mr: 1 }} />
            Create Event
          </MenuItem>
        </Menu>

        <IconButton color="inherit" component={Link} to="/events">
          <EventIcon />
        </IconButton>

        {currentUser ? (
          <>
            <IconButton color="inherit" component={Link} to="/messages">
              <Badge badgeContent={0} color="error">
                <Message />
              </Badge>
            </IconButton>

            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                src={currentUser.photoURL || undefined}
                alt={currentUser.displayName || 'User'}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem
                component={Link}
                to={`/profile/${currentUser.uid}`}
                onClick={handleMenuClose}
              >
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/signup">
              Signup
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
