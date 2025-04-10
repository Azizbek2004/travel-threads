"use client"
import { Box, Typography, IconButton, Grid, Paper, useTheme } from "@mui/material"
import { ChevronLeft, ChevronRight } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns"
import type { Event } from "../../types/event"

interface EventCalendarProps {
  events: Event[]
  currentMonth: number
  currentYear: number
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

const EventCalendar = ({
  events,
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: EventCalendarProps) => {
  const theme = useTheme()
  const navigate = useNavigate()
  
  // Get days in current month
  const firstDayOfMonth = startOfMonth(new Date(currentYear, currentMonth))
  const lastDayOfMonth = endOfMonth(new Date(currentYear, currentMonth))
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })
  
  // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  
  // Previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11)
      onYearChange(currentYear - 1)
    } else {
      onMonthChange(currentMonth - 1)
    }
  }
  
  // Next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0)
      onYearChange(currentYear + 1)
    } else {
      onMonthChange(currentMonth + 1)
    }
  }
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStartDate = new Date(event.startDate)
      return isSameDay(eventStartDate, day)
    })
  }
  
  // Handle day click
  const handleDayClick = (day: Date, dayEvents: Event[]) => {
    if (dayEvents.length === 1) {
      // If only one event, navigate directly to it
      navigate(`/event/${dayEvents[0].id}`)
    } else if (dayEvents.length > 1) {
      // If multiple events, we could show a modal or navigate to a filtered list
      // For now, just navigate to the first one
      navigate(`/event/${dayEvents[0].id}`)
    }
  }
  
  // Days of week
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  return (
    <Box>
      {/* Calendar header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <IconButton onClick={handlePrevMonth}>
          <ChevronLeft />
        </IconButton>
        
        <Typography variant="h6">
          {format(new Date(currentYear, currentMonth), "MMMM yyyy")}
        </Typography>
        
        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>
      
      {/* Calendar grid */}
      <Grid container spacing={1}>
        {/* Days of week header */}
        {daysOfWeek.map(day => (
          <Grid item xs={12/7} key={day}>
            <Typography
              align="center"
              sx={{
                fontWeight: "bold",
                py: 1,
                bgcolor: theme.palette.grey[100],
                borderRadius: 1,
              }}
            >
              {day}
            </Typography>
          </Grid>
        ))}
        
        {/* Empty cells before first day */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <Grid item xs={12/7} key={`empty-${index}`}>
            <Paper
              sx={{
                height: 80,
                bgcolor:\
