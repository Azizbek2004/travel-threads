"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { followUser, unfollowUser } from "../../services/firestore";

interface UserCardProps {
  user: {
    id: string;
    displayName: string;
    photoURL: string;
    bio: string;
    followers?: string[];
    following?: string[];
    threadCount?: number;
  };
}

const UserCard = ({ user }: UserCardProps) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followerCount, setFollowerCount] = useState<number>(
    user.followers?.length || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if current user is following this user
  useEffect(() => {
    if (currentUser && user.followers) {
      setIsFollowing(user.followers.includes(currentUser.uid));
    }
  }, [currentUser, user.followers]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(currentUser.uid, user.id);
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        await followUser(currentUser.uid, user.id);
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card
      elevation={2}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar
            src={user.photoURL}
            alt={user.displayName}
            sx={{ width: 60, height: 60, mr: 2 }}
            component={Link}
            to={`/profile/${user.id}`}
          />
          <Box>
            <Typography
              variant="h6"
              component={Link}
              to={`/profile/${user.id}`}
              sx={{ textDecoration: "none", color: "text.primary" }}
            >
              {user.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.threadCount || 0} threads
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            height: "4.5em",
          }}
        >
          {user.bio || "No bio available"}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2">
            <strong>{followerCount}</strong> followers
          </Typography>
          <Typography variant="body2">
            <strong>{user.following?.length || 0}</strong> following
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between" }}>
        {currentUser && currentUser.uid === user.id ? (
          <Button
            variant="outlined"
            component={Link}
            to={`/profile/${user.id}`}
            fullWidth
          >
            View Profile
          </Button>
        ) : (
          <>
            <Button
              variant={isFollowing ? "outlined" : "contained"}
              color="primary"
              onClick={handleFollowToggle}
              disabled={isLoading}
              sx={{ flexGrow: 1, mr: 1 }}
            >
              {isLoading
                ? "Processing..."
                : isFollowing
                ? "Unfollow"
                : "Follow"}
            </Button>

            <Button
              variant="outlined"
              component={Link}
              to={`/messages/${user.id}`}
              sx={{ flexGrow: 1 }}
            >
              Message
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default UserCard;
