"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
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
  Chip,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { logOut } from "../../../services/auth";
import Logo from "./Logo";
import {
  Message,
  Menu as MenuIcon,
  Add as AddIcon,
  Event as EventIcon,
  Search as SearchIcon,
  ArrowBack,
} from "@mui/icons-material";
import { useMobile } from "../../../hooks/use-mobile";
import NotificationBell from "../Notifications/NotificationBell";

const Header = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [createMenuAnchorEl, setCreateMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const isSearchPage = location.pathname.startsWith("/search");
  const { isMobileOrTablet } = useMobile();
  const [isMobileView, setIsMobileView] = useState(isMobileOrTablet);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Update mobile view state when isMobileOrTablet changes
  useEffect(() => {
    setIsMobileView(isMobileOrTablet);
  }, [isMobileOrTablet]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        const updatedSearches = [searchQuery, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
        // Could save to localStorage here
        localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      }

      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  // Add useEffect to load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recentSearches");
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error("Error parsing recent searches:", e);
      }
    }
  }, []);

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
      navigate("/create-post");
    } else {
      navigate("/login", { state: { from: "/create-post" } });
    }
    handleMenuClose();
  };

  const handleCreateEvent = () => {
    if (currentUser) {
      navigate("/create-event");
    } else {
      navigate("/login", { state: { from: "/create-event" } });
    }
    handleMenuClose();
  };

  if (isMobileView) {
    return (
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          maxWidth: "100vw",
          overflow: "hidden",
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            height: 56,
            minHeight: 56,
            px: 2,
            maxWidth: "100%",
          }}
        >
          <Logo isMobileOrTablet={true} asLink={true} />

          {/* Right side actions */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isSearchPage ? (
              <IconButton edge="start" onClick={() => navigate(-1)}>
                <ArrowBack />
              </IconButton>
            ) : (
              <></>
            )}

            {currentUser ? (
              <>
                <NotificationBell />

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
                  <MenuItem
                    component={Link}
                    to="/messages"
                    onClick={handleMenuClose}
                  >
                    Messages
                  </MenuItem>
                  <MenuItem
                    component={Link}
                    to="/search"
                    onClick={handleMenuClose}
                  >
                    Search
                  </MenuItem>
                  {currentUser.isAdmin && (
                    <MenuItem
                      component={Link}
                      to="/admin"
                      onClick={handleMenuClose}
                    >
                      Admin Panel
                    </MenuItem>
                  )}
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
    <AppBar
      position="static"
      sx={{
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "background.paper",
        color: "text.primary",
        width: "100%",
        maxWidth: "100vw",
        overflow: "hidden",
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        <Logo isMobileOrTablet={false} asLink={true} />

        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center" }}>
          {!isSearchPage && (
            <form onSubmit={handleSearch}>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  backgroundColor: "white",
                  borderRadius: 1,
                  width: "300px",
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Recent searches */}
              {recentSearches.length > 0 && searchQuery === "" && (
                <Box
                  sx={{
                    position: "absolute",
                    zIndex: 1000,
                    width: 300,
                    mt: 0.5,
                    p: 1,
                    bgcolor: "background.paper",
                    borderRadius: 1,
                    boxShadow: 3,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                  }}
                >
                  {recentSearches.map((search, index) => (
                    <Chip
                      key={index}
                      label={search}
                      size="small"
                      onClick={() => {
                        navigate(`/search?query=${encodeURIComponent(search)}`);
                      }}
                      onDelete={() => {
                        const updatedSearches = recentSearches.filter(
                          (s) => s !== search
                        );
                        setRecentSearches(updatedSearches);
                        localStorage.setItem(
                          "recentSearches",
                          JSON.stringify(updatedSearches)
                        );
                      }}
                    />
                  ))}
                </Box>
              )}
            </form>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
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
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
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

              <NotificationBell />

              <IconButton
                color="inherit"
                onClick={handleProfileMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar
                  src={currentUser.photoURL || undefined}
                  alt={currentUser.displayName || "User"}
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
                {currentUser.isAdmin && (
                  <MenuItem
                    component={Link}
                    to="/admin"
                    onClick={handleMenuClose}
                  >
                    Admin Panel
                  </MenuItem>
                )}
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
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
