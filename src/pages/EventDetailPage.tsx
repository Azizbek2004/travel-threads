"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Chip,
  Avatar,
  Paper,
} from "@mui/material"
import { ArrowBack, CalendarMonth, LocationOn, Person, AttachMoney } from "@mui/icons-material"
import { getEvent } from "../services/events"
import { getUserProfile } from "../services/firestore"
import { format } from "date-fns"
import Map from "../travel/components/Map"
import { useMobile } from "../hooks/use-mobile"
import type { Event } from "../types/event"

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()
  const [event, setEvent] = useState<Event | null>(null)
  const [author, setAuthor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const eventData = await getEvent(id)

        if (!eventData) {
          setError("Event not found")
          return
        }

        setEvent(eventData)

        // Fetch author data
        if (eventData.authorId) {
          const authorData = await getUserProfile(eventData.authorId)
          setAuthor(authorData)
        }
      } catch (err: any) {
        setError(`Error loading event: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [id])

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !event) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Card>
          <CardContent>
            <Typography color="error" align="center">
              {error || "Event not found"}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Format dates
  const startDate = new Date(event.startDate)
  const endDate = new Date(event.endDate)
  const formattedStartDate = format(startDate, "EEEE, MMMM d, yyyy")
  const formattedStartTime = format(startDate, "h:mm a")
  const formattedEndDate = format(endDate, "EEEE, MMMM d, yyyy")
  const formattedEndTime = format(endDate, "h:mm a")
  const isSameDay = formattedStartDate === formattedEndDate

  // Mobile layout
  if (isMobileOrTablet) {
    return (
      <Box sx={{ pb: 8 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ m: 2 }}>
          Back
        </Button>

        {event.imageUrl && (
          <Box sx={{ width: "100%", height: 200, overflow: "hidden" }}>
            <img
              src={event.imageUrl || "/placeholder.svg"}
              alt={event.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        )}

        <Box sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            {event.title}
          </Typography>

          <Chip label={event.category.charAt(0).toUpperCase() + event.category.slice(1)} size="small" sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <CalendarMonth fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2">
              {isSameDay
                ? `${formattedStartDate}, ${formattedStartTime} - ${formattedEndTime}`
                : `${formattedStartDate} ${formattedStartTime} - ${formattedEndDate} ${formattedEndTime}`}
            </Typography>
          </Box>

          {event.location?.name && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <LocationOn fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              <Typography variant="body2">{event.location.name}</Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Person fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
            <Typography variant="body2">
              {event.attendees?.length || 0} {event.attendees?.length === 1 ? "attendee" : "attendees"}
              {event.maxAttendees ? ` (max ${event.maxAttendees})` : ""}
            </Typography>
          </Box>

          {event.price && (
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AttachMoney fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
              <Typography variant="body2">
                {event.price} {event.currency || "USD"}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body2" paragraph>
            {event.description}
          </Typography>

          {author && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Organized by
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Avatar src={author.photoURL} alt={author.displayName} sx={{ mr: 1 }} />
                <Typography variant="body2">{author.displayName}</Typography>
              </Box>
            </>
          )}

          {event.location?.lat && event.location?.lng && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Location
              </Typography>
              <Box sx={{ height: 200, mb: 2 }}>
                <Map lat={event.location.lat} lng={event.location.lng} zoom={15} />
              </Box>
            </>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button variant="contained" fullWidth>
              Attend Event
            </Button>
            <Button variant="outlined" fullWidth>
              I'm Interested
            </Button>
          </Box>
        </Box>
      </Box>
    )
  }

  // Desktop layout
  return (
    <Box sx={{ p: 2 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to Events
      </Button>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            {event.imageUrl && (
              <Box sx={{ width: "100%", height: 300, overflow: "hidden" }}>
                <img
                  src={event.imageUrl || "/placeholder.svg"}
                  alt={event.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </Box>
            )}

            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {event.title}
                  </Typography>

                  <Chip label={event.category.charAt(0).toUpperCase() + event.category.slice(1)} sx={{ mr: 1 }} />

                  {event.price && <Chip label={`${event.price} ${event.currency || "USD"}`} color="primary" />}
                </Box>

                {author && (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      Organized by:
                    </Typography>
                    <Avatar src={author.photoURL} alt={author.displayName} sx={{ mr: 1 }} />
                    <Typography variant="body2">{author.displayName}</Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <CalendarMonth fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                      Date & Time
                    </Typography>
                    <Typography variant="body2">
                      {isSameDay
                        ? `${formattedStartDate}, ${formattedStartTime} - ${formattedEndTime}`
                        : `${formattedStartDate} ${formattedStartTime} - ${formattedEndDate} ${formattedEndTime}`}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <Person fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                      Attendees
                    </Typography>
                    <Typography variant="body2">
                      {event.attendees?.length || 0} {event.attendees?.length === 1 ? "person" : "people"} attending
                      {event.maxAttendees ? ` (max ${event.maxAttendees})` : ""}
                    </Typography>
                  </Paper>
                </Grid>

                {event.location?.name && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        <LocationOn fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
                        Location
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        {event.location.name}
                      </Typography>

                      {event.location?.lat && event.location?.lng && (
                        <Box sx={{ height: 300, mt: 2 }}>
                          <Map lat={event.location.lat} lng={event.location.lng} zoom={15} />
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                About this event
              </Typography>
              <Typography variant="body1" paragraph>
                {event.description}
              </Typography>

              {event.website && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Website
                  </Typography>
                  <Typography variant="body2">
                    <a href={event.website} target="_blank" rel="noopener noreferrer">
                      {event.website}
                    </a>
                  </Typography>
                </Box>
              )}

              {event.contactEmail && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Email
                  </Typography>
                  <Typography variant="body2">
                    <a href={`mailto:${event.contactEmail}`}>{event.contactEmail}</a>
                  </Typography>
                </Box>
              )}

              {event.contactPhone && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Phone
                  </Typography>
                  <Typography variant="body2">{event.contactPhone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ position: "sticky", top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Join this event
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button variant="contained" fullWidth size="large">
                  Attend Event
                </Button>
                <Button variant="outlined" fullWidth>
                  I'm Interested
                </Button>
                <Button variant="outlined" fullWidth>
                  Share Event
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                Attendees ({event.attendees?.length || 0})
              </Typography>

              {event.attendees && event.attendees.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {/* We would fetch and display attendee avatars here */}
                  <Avatar>A</Avatar>
                  <Avatar>B</Avatar>
                  <Avatar>C</Avatar>
                  {event.attendees.length > 3 && <Avatar>+{event.attendees.length - 3}</Avatar>}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Be the first to attend this event!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default EventDetailPage
