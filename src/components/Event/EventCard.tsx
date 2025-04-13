"use client"

import type React from "react"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { attendEvent, cancelAttendance, markInterested } from "../../services/events"
import { getUserProfile } from "../../services/firestore"
import dayjs from "dayjs" // Replace date-fns with dayjs
import { CalendarMonth, LocationOn, Person, MoreVert, EventAvailable, EventBusy, Star } from "@mui/icons-material"
import { useMobile } from "../../hooks/use-mobile"
import type { Event } from "../../types/event"

interface EventCardProps {
  event: Event
  isDetail?: boolean
}

const EventCard = ({ event, isDetail = false }: EventCardProps) => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()

  const [author, setAuthor] = useState<any>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isAttending, setIsAttending] = useState(event.attendees?.includes(currentUser?.uid || "") || false)
  const [isInterested, setIsInterested] = useState(event.interested?.includes(currentUser?.uid || "") || false)
  const [attendeeCount, setAttendeeCount] = useState(event.attendees?.length || 0)
  const [interestedCount, setInterestedCount] = useState(event.interested?.length || 0)

  // Fetch author details
  useState(() => {
    const fetchAuthor = async () => {
      if (event.authorId) {
        const authorData = await getUserProfile(event.authorId)
        setAuthor(authorData)
      }
    }
    fetchAuthor()
  })

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleAttend = async () => {
    if (!currentUser) {
      navigate("/login", { state: { from: `/event/${event.id}` } })
      return
    }

    try {
      if (isAttending) {
        await cancelAttendance(event.id, currentUser.uid)
        setIsAttending(false)
        setAttendeeCount((prev) => prev - 1)
      } else {
        await attendEvent(event.id, currentUser.uid)
        setIsAttending(true)
        setAttendeeCount((prev) => prev + 1)
        // If they were interested, they're now attending instead
        if (isInterested) {
          setIsInterested(false)
          setInterestedCount((prev) => prev - 1)
        }
      }
    } catch (error) {
      console.error("Error updating attendance:", error)
    }
  }

  const handleInterested = async () => {
    if (!currentUser) {
      navigate("/login", { state: { from: `/event/${event.id}` } })
      return
    }

    try {
      if (isInterested) {
        // Currently no API to remove interest, so we'll just toggle the UI
        setIsInterested(false)
        setInterestedCount((prev) => prev - 1)
      } else {
        await markInterested(event.id, currentUser.uid)
        setIsInterested(true)
        setInterestedCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error updating interest:", error)
    }
  }

  const handleShareViaMessage = () => {
    if (!currentUser) {
      navigate("/login", { state: { from: `/event/${event.id}` } })
      return
    }

    // Navigate to messages with event data in state
    navigate("/messages", {
      state: {
        shareEvent: {
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          location: event.location,
        },
      },
    })

    handleMenuClose()
  }

  // Format dates with dayjs
  const startDate = dayjs(event.startDate)
  const endDate = dayjs(event.endDate)
  const formattedStartDate = startDate.format("MMM D, YYYY")
  const formattedStartTime = startDate.format("h:mm A")
  const formattedEndDate = endDate.format("MMM D, YYYY")
  const formattedEndTime = endDate.format("h:mm A")

  const isSameDay = formattedStartDate === formattedEndDate

  // Mobile layout
  if (isMobileOrTablet) {
    return (
      <Card sx={{ mb: 2, borderRadius: 2, overflow: "hidden" }}>
        {event.imageUrl && <CardMedia component="img" height="140" image={event.imageUrl} alt={event.title} />}

        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="h6"
              component={Link}
              to={`/event/${event.id}`}
              sx={{ textDecoration: "none", color: "text.primary", mb: 1 }}
            >
              {event.title}
            </Typography>

            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <CalendarMonth fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {isSameDay
                ? `${formattedStartDate}, ${formattedStartTime} - ${formattedEndTime}`
                : `${formattedStartDate} - ${formattedEndDate}`}
            </Typography>
          </Box>

          {event.location?.name && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <LocationOn fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {event.location.name}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Person fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <Star fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {interestedCount} interested
            </Typography>
          </Box>

          <Chip
            label={event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            size="small"
            sx={{ mr: 1, mb: 1 }}
          />

          {event.price && (
            <Chip label={`${event.price} ${event.currency || "USD"}`} size="small" color="primary" sx={{ mb: 1 }} />
          )}

          {!isDetail && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                mb: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {event.description}
            </Typography>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button
              variant={isAttending ? "outlined" : "contained"}
              size="small"
              startIcon={isAttending ? <EventBusy /> : <EventAvailable />}
              onClick={handleAttend}
              sx={{ flexGrow: 1, mr: 1 }}
            >
              {isAttending ? "Cancel" : "Attend"}
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Star />}
              onClick={handleInterested}
              color={isInterested ? "primary" : "inherit"}
              sx={{ flexGrow: 1 }}
            >
              {isInterested ? "Interested" : "Interest"}
            </Button>
          </Box>
        </CardContent>

        {/* Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem component={Link} to={`/event/${event.id}`} onClick={handleMenuClose}>
            View Details
          </MenuItem>
          {currentUser && currentUser.uid === event.authorId && (
            <MenuItem component={Link} to={`/edit-event/${event.id}`} onClick={handleMenuClose}>
              Edit Event
            </MenuItem>
          )}
          <MenuItem onClick={handleShareViaMessage}>Share via Message</MenuItem>
        </Menu>
      </Card>
    )
  }

  // Desktop layout
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {event.imageUrl && <CardMedia component="img" height="200" image={event.imageUrl} alt={event.title} />}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Typography
            variant="h5"
            component={Link}
            to={`/event/${event.id}`}
            sx={{ textDecoration: "none", color: "text.primary", mb: 2 }}
          >
            {event.title}
          </Typography>

          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <CalendarMonth sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="body1" color="text.secondary">
            {isSameDay
              ? `${formattedStartDate}, ${formattedStartTime} - ${formattedEndTime}`
              : `${formattedStartDate} - ${formattedEndDate}`}
          </Typography>
        </Box>

        {event.location?.name && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body1" color="text.secondary">
              {event.location.name}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Person sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="body1" color="text.secondary">
            {attendeeCount} {attendeeCount === 1 ? "attendee" : "attendees"}
            {event.maxAttendees && ` (max ${event.maxAttendees})`}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Star sx={{ mr: 1, color: "text.secondary" }} />
          <Typography variant="body1" color="text.secondary">
            {interestedCount} interested
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip label={event.category.charAt(0).toUpperCase() + event.category.slice(1)} sx={{ mr: 1 }} />

          {event.price && <Chip label={`${event.price} ${event.currency || "USD"}`} color="primary" />}
        </Box>

        {!isDetail && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {event.description}
          </Typography>
        )}

        {author && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar src={author.photoURL} alt={author.displayName} sx={{ width: 24, height: 24, mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Created by {author.displayName}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            variant={isAttending ? "outlined" : "contained"}
            startIcon={isAttending ? <EventBusy /> : <EventAvailable />}
            onClick={handleAttend}
            sx={{ flexGrow: 1, mr: 1 }}
          >
            {isAttending ? "Cancel Attendance" : "Attend Event"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Star />}
            onClick={handleInterested}
            color={isInterested ? "primary" : "inherit"}
            sx={{ flexGrow: 1 }}
          >
            {isInterested ? "Interested" : "I'm Interested"}
          </Button>
        </Box>
      </CardContent>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem component={Link} to={`/event/${event.id}`} onClick={handleMenuClose}>
          View Details
        </MenuItem>
        {currentUser && currentUser.uid === event.authorId && (
          <MenuItem component={Link} to={`/edit-event/${event.id}`} onClick={handleMenuClose}>
            Edit Event
          </MenuItem>
        )}
        <MenuItem onClick={handleShareViaMessage}>Share Event</MenuItem>
        {currentUser && currentUser.uid === event.authorId && (
          <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
            Delete Event
          </MenuItem>
        )}
      </Menu>
    </Card>
  )
}

export default EventCard
