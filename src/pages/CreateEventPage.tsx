"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
} from "@mui/material"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { useAuth } from "../hooks/useAuth"
import { createEvent } from "../services/events"
import { uploadImage } from "../services/storage"
import { useNavigate, Navigate } from "react-router-dom"
import { Image, Close, LocationOn, ArrowBack, Add as AddIcon } from "@mui/icons-material"
import { useMobile } from "../hooks/use-mobile"
import type { EventCategoryType } from "../types/event"
import dayjs from "dayjs"

const eventCategories: EventCategoryType[] = [
  "travel",
  "food",
  "culture",
  "adventure",
  "nature",
  "workshop",
  "meetup",
  "festival",
  "concert",
  "sports",
  "other",
]

const CreateEventPage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()

  // Event details
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [startDate, setStartDate] = useState(dayjs())
  const [endDate, setEndDate] = useState(dayjs().add(1, "hour"))
  const [category, setCategory] = useState<EventCategoryType>("travel")
  const [isPublic, setIsPublic] = useState(true)
  const [maxAttendees, setMaxAttendees] = useState<string>("")
  const [price, setPrice] = useState<string>("")
  const [currency, setCurrency] = useState("USD")
  const [website, setWebsite] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")

  // Tags
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Image
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Location
  const [useCurrentLocation, setUseCurrentLocation] = useState(false)
  const [locationName, setLocationName] = useState("")
  const [geoLocation, setGeoLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)

  // UI states
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success")

  // State to track if geolocation is supported
  const [geolocationAvailable, setGeolocationAvailable] = useState(false)

  // Initialize geolocationAvailable state
  useEffect(() => {
    setGeolocationAvailable(!!navigator.geolocation)
  }, [])

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: "/create-event" }} />
  }

  const [locationFetchRequired, setLocationFetchRequired] = useState(false)

  const fetchLocationName = useCallback(async (lat: number, lng: number) => {
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
    } finally {
      setLocationFetchRequired(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true // Add a flag to track component mount status

    const getLocation = () => {
      if (useCurrentLocation && geolocationAvailable) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (isMounted) {
              // Check if component is still mounted before setting state
              setGeoLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              })

              setLocationFetchRequired(true)
            }
          },
          (err) => {
            if (isMounted) {
              // Check if component is still mounted before setting state
              setError("Failed to get current location: " + err.message)
              setUseCurrentLocation(false)
            }
          },
        )
      } else {
        setGeoLocation(null)
        setLocationName("")
      }
    }

    getLocation()

    return () => {
      isMounted = false // Set the flag to false when the component unmounts
    }
  }, [useCurrentLocation, geolocationAvailable])

  useEffect(() => {
    if (locationFetchRequired && geoLocation) {
      fetchLocationName(geoLocation.lat, geoLocation.lng)
    }
  }, [locationFetchRequired, geoLocation, fetchLocationName])

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

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      setSnackbarSeverity("error")
      setSnackbarMessage("You must be logged in to create an event.")
      setSnackbarOpen(true)
      return
    }

    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      setSnackbarSeverity("error")
      setSnackbarMessage("Please fill in all required fields.")
      setSnackbarOpen(true)
      return
    }

    if (startDate && endDate && startDate > endDate) {
      setSnackbarSeverity("error")
      setSnackbarMessage("End date must be after start date.")
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

      const eventData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        category,
        isPublic,
        authorId: currentUser.uid,
        imageUrl,
        tags,
        website: website.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
      } as any

      // Add optional fields if they exist
      if (maxAttendees && !isNaN(Number(maxAttendees))) {
        eventData.maxAttendees = Number(maxAttendees)
      }

      if (price && !isNaN(Number(price))) {
        eventData.price = Number(price)
        eventData.currency = currency
      }

      // Add location if available
      if (useCurrentLocation && geoLocation) {
        eventData.location = {
          ...geoLocation,
          name: locationName,
        }
      }

      await createEvent(eventData)

      // Show success message
      setSnackbarSeverity("success")
      setSnackbarMessage("Event created successfully!")
      setSnackbarOpen(true)

      // Navigate to events page after a short delay
      setTimeout(() => {
        navigate("/events")
      }, 1500)
    } catch (err: any) {
      setError(`Failed to create event: ${err.message}`)
      setSnackbarSeverity("error")
      setSnackbarMessage(`Failed to create event: ${err.message}`)
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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ pb: 8 }}>
          <AppBar position="sticky" color="default" elevation={0}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
                <ArrowBack />
              </IconButton>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Create Event
              </Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={loading || !title.trim() || !description.trim() || !startDate || !endDate}
                onClick={handleSubmit}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Create"}
              </Button>
            </Toolbar>
          </AppBar>

          <Box sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              label="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              margin="normal"
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
              margin="normal"
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <DateTimePicker
                label="Start Date & Time"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />

              <DateTimePicker
                label="End Date & Time"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
              />
            </Box>

            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value as EventCategoryType)}
              >
                {eventCategories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
                label="Public Event"
              />
            </Box>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  label="Max Attendees"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  type="number"
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <Select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        sx={{ width: 70 }}
                        size="small"
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                      </Select>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              label="Website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              fullWidth
              margin="normal"
            />

            <TextField
              label="Contact Email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              fullWidth
              margin="normal"
              type="email"
            />

            <TextField
              label="Contact Phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              fullWidth
              margin="normal"
            />

            {/* Tags input */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags"
                  size="small"
                  fullWidth
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <IconButton onClick={handleAddTag} disabled={!tagInput.trim()}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} size="small" />
                ))}
              </Box>
            </Box>

            {/* Image preview */}
            {imagePreview && (
              <Box sx={{ position: "relative", mb: 2, mt: 2 }}>
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
                mt: 2,
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
      </LocalizationProvider>
    )
  }

  // Desktop layout
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
        <Typography variant="h4" gutterBottom>
          Create a New Event
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
                label="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                required
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                variant="outlined"
                sx={{ mb: 2 }}
              />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="Start Date & Time"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label="End Date & Time"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={category}
                      label="Category"
                      onChange={(e) => setCategory(e.target.value as EventCategoryType)}
                    >
                      {eventCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={<Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
                    label="Public Event"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Max Attendees"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    type="number"
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <Select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          sx={{ width: 70 }}
                          size="small"
                        >
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="EUR">EUR</MenuItem>
                          <MenuItem value="GBP">GBP</MenuItem>
                        </Select>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} fullWidth />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    type="email"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contact Phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>

              {/* Tags input */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TextField
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tags"
                    size="small"
                    fullWidth
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button onClick={handleAddTag} disabled={!tagInput.trim()} variant="contained" sx={{ ml: 1 }}>
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
                  {tags.map((tag) => (
                    <Chip key={tag} label={tag} onDelete={() => handleRemoveTag(tag)} />
                  ))}
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
                  disabled={loading || !title.trim() || !description.trim() || !startDate || !endDate}
                >
                  {loading ? <CircularProgress size={24} /> : "Create Event"}
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
    </LocalizationProvider>
  )
}

export default CreateEventPage
