"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
} from "@mui/material"
import { useAuth } from "../hooks/useAuth"
import { createPost } from "../services/firestore"
import { uploadImage } from "../services/storage"
import { useNavigate, useLocation, Navigate } from "react-router-dom"
import { Image, Close, LocationOn, ArrowBack } from "@mui/icons-material"
import { useMobile } from "../hooks/use-mobile"

const CreatePostPage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobileOrTablet } = useMobile()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [locationName, setLocationName] = useState("")
  const [geoLocation, setGeoLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success")

  // State to track if geolocation is supported
  const [geolocationAvailable, setGeolocationAvailable] = useState(false)

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: "/create-post" }} />
  }

  useEffect(() => {
    // Check if geolocation is supported
    if (navigator.geolocation) {
      setGeolocationAvailable(true)
    } else {
      setGeolocationAvailable(false)
      setError("Geolocation is not supported by your browser.")
      setUseCurrentLocation(false)
    }
  }, [])

  useEffect(() => {
    // Effect to handle location fetching
    if (useCurrentLocation && geolocationAvailable) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })

          // Try to get location name using reverse geocoding
          fetchLocationName(position.coords.latitude, position.coords.longitude)
        },
        (err) => {
          setError("Failed to get current location: " + err.message)
          setUseCurrentLocation(false)
        },
      )
    } else if (!useCurrentLocation) {
      setGeoLocation(null)
      setLocationName("")
    }
  }, [useCurrentLocation, geolocationAvailable])

  const fetchLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCX4xwYTwIDjj64ZULpmz-Osy4NNfRrSiE`,
      )
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        // Get a readable address (usually the first result is the most specific)
        const address = data.results[0].formatted_address
        setLocationName(address)
      }
    } catch (error) {
      console.error("Error fetching location name:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0]
      setImage(selectedImage)

      // Create preview
      const reader = new FileReader()
      reader.onload = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(selectedImage)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      setSnackbarSeverity("error")
      setSnackbarMessage("You must be logged in to post.")
      setSnackbarOpen(true)
      return
    }

    if (!title.trim() && !content.trim() && !image) {
      setSnackbarSeverity("error")
      setSnackbarMessage("Please add some content to your post.")
      setSnackbarOpen(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let imageUrl = ""
      if (image) {
        imageUrl = await uploadImage(image)
      }

      const postData: any = {
        title: title.trim(),
        content: content.trim(),
        authorId: currentUser.uid,
        imageUrl,
      }

      // Add location if available
      if (useCurrentLocation && geoLocation) {
        postData.location = {
          ...geoLocation,
          name: locationName,
        }
      }

      await createPost(postData)

      // Show success message
      setSnackbarSeverity("success")
      setSnackbarMessage("Post created successfully!")
      setSnackbarOpen(true)

      // Reset form
      setTitle("")
      setContent("")
      setImage(null)
      setImagePreview(null)
      setUseCurrentLocation(false)

      // Navigate to home after a short delay
      setTimeout(() => {
        navigate("/")
      }, 1500)
    } catch (err: any) {
      setError(`Failed to create post: ${err.message}`)
      setSnackbarSeverity("error")
      setSnackbarMessage(`Failed to create post: ${err.message}`)
      setSnackbarOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  // Mobile layout
  if (isMobileOrTablet) {
    return (
      <Box sx={{ pb: 8 }}>
        <AppBar position="sticky" color="default" elevation={0}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Create Post
            </Typography>
            <Button
              variant="contained"
              color="primary"
              disabled={loading || (!title.trim() && !content.trim() && !image)}
              onClick={handleSubmit}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Post"}
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
            <Avatar
              src={currentUser?.photoURL || undefined}
              alt={currentUser?.displayName || "User"}
              sx={{ mr: 2, mt: 1 }}
            />

            <Box sx={{ flexGrow: 1 }}>
              <TextField
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                variant="outlined"
                size="small"
                sx={{ mb: 2 }}
              />

              <TextField
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>

          {/* Image preview */}
          {imagePreview && (
            <Box sx={{ position: "relative", mb: 2 }}>
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
              <IconButton
                onClick={removeImage}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  bgcolor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": {
                    bgcolor: "rgba(0,0,0,0.7)",
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <input
                type="file"
                id="image-upload"
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: "none" }}
              />
              <label htmlFor="image-upload">
                <IconButton component="span" color="primary">
                  <Image />
                </IconButton>
              </label>

              <IconButton
                color={useCurrentLocation ? "primary" : "default"}
                onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              >
                <LocationOn />
              </IconButton>
            </Box>
          </Box>

          {useCurrentLocation && locationName && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Location: {locationName}
            </Typography>
          )}
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    )
  }

  // Desktop layout
  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Create a New Post
      </Typography>

      <Card sx={{ width: "100%" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              src={currentUser?.photoURL || undefined}
              alt={currentUser?.displayName || "User"}
              sx={{ width: 50, height: 50, mr: 2 }}
            />
            <Typography variant="h6">{currentUser?.displayName || "Anonymous"}</Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <TextField
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            {/* Image preview */}
            {imagePreview && (
              <Box sx={{ position: "relative", mb: 2 }}>
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
                <IconButton
                  onClick={removeImage}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.5)",
                    color: "white",
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.7)",
                    },
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box>
                <input
                  type="file"
                  id="image-upload"
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
                <label htmlFor="image-upload">
                  <Button component="span" startIcon={<Image />} variant="outlined" size="medium">
                    Add Photo
                  </Button>
                </label>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocationOn color={useCurrentLocation ? "primary" : "action"} sx={{ mr: 1 }} />
                <FormControlLabel
                  control={
                    <Switch checked={useCurrentLocation} onChange={(e) => setUseCurrentLocation(e.target.checked)} />
                  }
                  label="Add Current Location"
                />
              </Box>
            </Box>

            {useCurrentLocation && locationName && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Location: {locationName}
              </Typography>
            )}

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} sx={{ flexGrow: 1 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ flexGrow: 1 }}
                disabled={loading || (!title.trim() && !content.trim() && !image)}
              >
                {loading ? <CircularProgress size={24} /> : "Create Post"}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default CreatePostPage
