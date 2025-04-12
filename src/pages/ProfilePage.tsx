"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Avatar,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from "@mui/material"
import { useAuth } from "../hooks/useAuth"
import { getUserProfile, getUserPosts, getFollowers, getFollowing } from "../services/firestore"
import Post from "../components/Post/Post"
import { EditProfile, ProfileInfo } from "../components/Profile"
import { useMobile } from "../hooks/use-mobile"
import { Settings, LocationOn } from "@mui/icons-material"

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>()
  const { currentUser } = useAuth()
  const { isMobileOrTablet } = useMobile()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [tabValue, setTabValue] = useState(0) // 0 for Posts, 1 for Followers, 2 for Following

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      const userProfile = await getUserProfile(userId)
      setProfile(userProfile)

      // Fetch posts for the initial tab
      const userPosts = await getUserPosts(userId)
      setPosts(userPosts)
    }
    fetchData()
  }, [userId])

  useEffect(() => {
    const fetchTabData = async () => {
      if (!userId) return

      if (tabValue === 0) {
        const userPosts = await getUserPosts(userId)
        setPosts(userPosts)
      } else if (tabValue === 1) {
        const userFollowers = await getFollowers(userId)
        setFollowers(userFollowers)
      } else if (tabValue === 2) {
        const userFollowing = await getFollowing(userId)
        setFollowing(userFollowing)
      }
    }

    fetchTabData()
  }, [tabValue, userId])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (!profile) return <div>Loading...</div>

  // Mobile profile layout
  if (isMobileOrTablet) {
    return (
      <Box sx={{ pb: 8 }}>
        {/* Profile Header */}
        <Box
          sx={{
            p: 2,
            position: "sticky",
            top: 0,
            bgcolor: "background.paper",
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6">{profile.displayName}</Typography>
            {currentUser?.uid === userId ? (
              <IconButton onClick={() => setIsEditing(true)}>
                <Settings />
              </IconButton>
            ) : null}
          </Box>
        </Box>

        {isEditing ? (
          <EditProfile profile={profile} onSave={() => setIsEditing(false)} />
        ) : (
          <>
            {/* Profile Info */}
            <Box sx={{ px: 2, pb: 2 }}>
              <Box sx={{ display: "flex", mb: 3 }}>
                <Avatar src={profile.photoURL} alt={profile.displayName} sx={{ width: 80, height: 80, mr: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="body1" fontWeight="bold">
                    {profile.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{profile.id.slice(0, 8)}
                  </Typography>

                  {profile.location && (
                    <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                      <LocationOn fontSize="small" sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      <Typography variant="body2" color="text.secondary">
                        {profile.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mb: 2 }}>
                {profile.bio || "No bio yet."}
              </Typography>

              <Box sx={{ display: "flex", gap: 3, mb: 2 }}>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {profile.threadCount || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Threads
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {followers.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Followers
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {following.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Following
                  </Typography>
                </Box>
              </Box>

              {currentUser && currentUser.uid !== profile.id && (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="contained" color="primary" fullWidth size="small">
                    Follow
                  </Button>

                  <Button variant="outlined" component={Link} to={`/messages/${profile.id}`} fullWidth size="small">
                    Message
                  </Button>
                </Box>
              )}
            </Box>

            <Divider />

            {/* Tabs */}
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                "& .MuiTabs-indicator": {
                  height: 3,
                },
              }}
            >
              <Tab label="Threads" />
              <Tab label="Followers" />
              <Tab label="Following" />
            </Tabs>

            {/* Posts Tab */}
            {tabValue === 0 && (
              <Box>
                {posts.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>No threads yet</Typography>
                ) : (
                  posts.map((post) => <Post key={post.id} post={post} />)
                )}
              </Box>
            )}

            {/* Followers Tab */}
            {tabValue === 1 && (
              <List disablePadding>
                {followers.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>No followers yet</Typography>
                ) : (
                  followers.map((follower) => (
                    <ListItem
                      key={follower.id}
                      component={Link}
                      to={`/profile/${follower.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "inherit",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={follower.photoURL} alt={follower.displayName} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={follower.displayName}
                        secondary={
                          follower.bio
                            ? follower.bio.substring(0, 60) + (follower.bio.length > 60 ? "..." : "")
                            : "No bio"
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}

            {/* Following Tab */}
            {tabValue === 2 && (
              <List disablePadding>
                {following.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>Not following anyone yet</Typography>
                ) : (
                  following.map((follow) => (
                    <ListItem
                      key={follow.id}
                      component={Link}
                      to={`/profile/${follow.id}`}
                      sx={{
                        textDecoration: "none",
                        color: "inherit",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={follow.photoURL} alt={follow.displayName} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={follow.displayName}
                        secondary={
                          follow.bio ? follow.bio.substring(0, 60) + (follow.bio.length > 60 ? "..." : "") : "No bio"
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </>
        )}
      </Box>
    )
  }

  // Desktop profile layout
  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      {isEditing ? (
        <EditProfile profile={profile} onSave={() => setIsEditing(false)} />
      ) : (
        <>
          <ProfileInfo profile={profile} />
          {currentUser?.uid === userId && (
            <Button variant="contained" onClick={() => setIsEditing(true)} sx={{ mt: 2 }}>
              Edit Profile
            </Button>
          )}

          <Box sx={{ mt: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="Threads" />
              <Tab label="Followers" />
              <Tab label="Following" />
            </Tabs>

            {/* Posts Tab */}
            {tabValue === 0 && (
              <Box sx={{ mt: 2 }}>
                {posts.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>No threads yet</Typography>
                ) : (
                  posts.map((post) => <Post key={post.id} post={post} />)
                )}
              </Box>
            )}

            {/* Followers Tab */}
            {tabValue === 1 && (
              <Box sx={{ mt: 2 }}>
                {followers.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>No followers yet</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {followers.map((follower) => (
                      <Grid item xs={12} key={follower.id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Avatar src={follower.photoURL} alt={follower.displayName} sx={{ mr: 2 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{follower.displayName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {follower.bio
                                ? follower.bio.substring(0, 60) + (follower.bio.length > 60 ? "..." : "")
                                : "No bio"}
                            </Typography>
                          </Box>
                          <Button variant="outlined" component={Link} to={`/profile/${follower.id}`} size="small">
                            View
                          </Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}

            {/* Following Tab */}
            {tabValue === 2 && (
              <Box sx={{ mt: 2 }}>
                {following.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>Not following anyone yet</Typography>
                ) : (
                  <Grid container spacing={2}>
                    {following.map((follow) => (
                      <Grid item xs={12} key={follow.id}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          <Avatar src={follow.photoURL} alt={follow.displayName} sx={{ mr: 2 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1">{follow.displayName}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {follow.bio
                                ? follow.bio.substring(0, 60) + (follow.bio.length > 60 ? "..." : "")
                                : "No bio"}
                            </Typography>
                          </Box>
                          <Button variant="outlined" component={Link} to={`/profile/${follow.id}`} size="small">
                            View
                          </Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  )
}

export default ProfilePage
