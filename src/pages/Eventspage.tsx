"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Paper,
  useTheme,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { getEvents, getAttendingEvents, getUpcomingEvents } from "../services/events"
import { Add, FilterList, CalendarMonth, ViewList } from "@mui/icons-material"
import { useMobile } from "../hooks/use-mobile"
import type { Event, EventCategoryType } from "../types/event"
import EventCard from "../components/Event/EventCard"
import EventCalendar from "../components/Event/EventCalendar"

const EventsPage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const { isMobileOrTablet } = useMobile()

  // State
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0) // 0 = All, 1 = Attending, 2 = My Events
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<EventCategoryType | null>(null)

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

  // Fetch events based on current tab
  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true)
      try {
        let eventData: Event[] = []

        switch (tabValue) {
          case 0: // All events
            eventData = await getUpcomingEvents(50)
            break
          case 1: // Attending events
            if (currentUser) {
              eventData = await getAttendingEvents(currentUser.uid)
            }
            break
          case 2: // My events
            if (currentUser) {
              eventData = await getEvents({
                query: currentUser.uid,
              })
              // Filter to only show events created by the current user
              eventData = eventData.filter((event) => event.authorId === currentUser.uid)
            }
            break
        }

        // Apply category filter if selected
        if (selectedCategory) {
          eventData = eventData.filter((event) => event.category === selectedCategory)
        }

        setEvents(eventData)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEventData()
  }, [tabValue, currentUser, selectedCategory])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleFilterClose = () => {
    setFilterAnchorEl(null)
  }

  const handleCategorySelect = (category: EventCategoryType | null) => {
    setSelectedCategory(category)
    handleFilterClose()
  }

  const handleCreateEvent = () => {
    if (currentUser) {
      navigate("/create-event")
    } else {
      navigate("/login", { state: { from: "/create-event" } })
    }
  }

  // Mobile layout
  if (isMobileOrTablet) {
    return (
      <Box sx={{ pb: 8 }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5">Events</Typography>
          <Box>
            <IconButton onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}>
              {viewMode === "list" ? <CalendarMonth /> : <ViewList />}
            </IconButton>
            <IconButton onClick={handleFilterClick}>
              <FilterList color={selectedCategory ? "primary" : "inherit"} />
            </IconButton>
            <IconButton onClick={handleCreateEvent} color="primary">
              <Add />
            </IconButton>
          </Box>
        </Box>

        {/* Category filter menu */}
        <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
          <MenuItem onClick={() => handleCategorySelect(null)}>All Categories</MenuItem>
          <Divider />
          <MenuItem onClick={() => handleCategorySelect("travel")}>Travel</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("food")}>Food</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("culture")}>Culture</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("adventure")}>Adventure</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("nature")}>Nature</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("workshop")}>Workshop</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("meetup")}>Meetup</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("festival")}>Festival</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("concert")}>Concert</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("sports")}>Sports</MenuItem>
          <MenuItem onClick={() => handleCategorySelect("other")}>Other</MenuItem>
        </Menu>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Upcoming" />
          <Tab label="Attending" />
          <Tab label="My Events" />
        </Tabs>

        {/* Filter chips */}
        {selectedCategory && (
          <Box sx={{ p: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              onDelete={() => setSelectedCategory(null)}
              size="small"
              color="primary"
            />
          </Box>
        )}

        {/* Content */}
        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : events.length === 0 ? (
            <Box sx={{ textAlign: "center", my: 4 }}>
              <Typography color="text.secondary" gutterBottom>
                No events found
              </Typography>
              <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent} sx={{ mt: 2 }}>
                Create Event
              </Button>
            </Box>
          ) : viewMode === "list" ? (
            // List view
            <Box>
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </Box>
          ) : (
            // Calendar view
            <EventCalendar
              events={events}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
            />
          )}
        </Box>
      </Box>
    )
  }

  // Desktop layout
  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Events</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={viewMode === "list" ? <CalendarMonth /> : <ViewList />}
            onClick={() => setViewMode(viewMode === "list" ? "calendar" : "list")}
            sx={{ mr: 1 }}
          >
            {viewMode === "list" ? "Calendar View" : "List View"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={handleFilterClick}
            color={selectedCategory ? "primary" : "inherit"}
            sx={{ mr: 1 }}
          >
            Filter
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent}>
            Create Event
          </Button>
        </Box>
      </Box>

      {/* Category filter menu */}
      <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
        <MenuItem onClick={() => handleCategorySelect(null)}>All Categories</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleCategorySelect("travel")}>Travel</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("food")}>Food</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("culture")}>Culture</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("adventure")}>Adventure</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("nature")}>Nature</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("workshop")}>Workshop</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("meetup")}>Meetup</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("festival")}>Festival</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("concert")}>Concert</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("sports")}>Sports</MenuItem>
        <MenuItem onClick={() => handleCategorySelect("other")}>Other</MenuItem>
      </Menu>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tab label="Upcoming Events" />
          <Tab label="Events I'm Attending" />
          <Tab label="My Created Events" />
        </Tabs>
      </Paper>

      {/* Filter chips */}
      {selectedCategory && (
        <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip
            label={`Category: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            onDelete={() => setSelectedCategory(null)}
            color="primary"
          />
        </Box>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : events.length === 0 ? (
        <Card sx={{ textAlign: "center", p: 4 }}>
          <Typography color="text.secondary" gutterBottom>
            No events found
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleCreateEvent} sx={{ mt: 2 }}>
            Create Event
          </Button>
        </Card>
      ) : viewMode === "list" ? (
        // List view
        <Grid container spacing={2}>
          {events.map((event) => (
            <Grid item xs={12} md={6} lg={4} key={event.id}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      ) : (
        // Calendar view
        <Card>
          <CardContent>
            <EventCalendar
              events={events}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default EventsPage
