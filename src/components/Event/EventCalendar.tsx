"use client"

import { useMemo } from "react"
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

const EventCalendar = ({ events, currentMonth, currentYear, onMonthChange, onYearChange }: EventCalendarProps) => {
  const theme = useTheme()
  const navigate = useNavigate()

  // Get days in current month - memoized to prevent recalculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = startOfMonth(new Date(currentYear, currentMonth))
    const lastDayOfMonth = endOfMonth(new Date(currentYear, currentMonth))
    const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth })

    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const startingDayOfWeek = firstDayOfMonth.getDay()

    // Add empty days for padding at the beginning
    const paddingDays = Array(startingDayOfWeek).fill(null)

    return [...paddingDays, ...daysInMonth]
  }, [currentMonth, currentYear])

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
  const getEventsForDay = (day: Date | null) => {
    if (!day) return []

    return events.filter((event) => {
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
      // If multiple events, navigate to a filtered list for that day
      const formattedDate = format(day, "yyyy-MM-dd")
      navigate(`/events?date=${formattedDate}`)
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

        <Typography variant="h6">{format(new Date(currentYear, currentMonth), "MMMM yyyy")}</Typography>

        <IconButton onClick={handleNextMonth}>
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Calendar grid */}
      <Grid container spacing={1}>
        {/* Days of week header */}
        {daysOfWeek.map((day) => (
          <Grid item xs={12 / 7} key={day}>
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

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isToday = day ? isSameDay(day, new Date()) : false

          return (
            <Grid item xs={12 / 7} key={index}>
              {day ? (
                <Paper
                  sx={{
                    height: 80,
                    p: 1,
                    bgcolor: isToday ? theme.palette.primary.light : theme.palette.background.paper,
                    color: isToday ? theme.palette.primary.contrastText : "inherit",
                    border: dayEvents.length > 0 ? `1px solid ${theme.palette.primary.main}` : "none",
                    cursor: dayEvents.length > 0 ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    "&:hover": {
                      bgcolor: dayEvents.length > 0 ? theme.palette.action.hover : undefined,
                    },
                  }}
                  onClick={() => dayEvents.length > 0 && handleDayClick(day, dayEvents)}
                >
                  <Typography align="center" sx={{ fontWeight: isToday ? "bold" : "normal" }}>
                    {format(day, "d")}
                  </Typography>

                  {/* Event indicators */}
                  {dayEvents.length > 0 && (
                    <Box sx={{ mt: "auto", display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {dayEvents.slice(0, 2).map((event, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: "100%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            fontSize: "0.75rem",
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            borderRadius: 0.5,
                            px: 0.5,
                          }}
                        >
                          {event.title}
                        </Box>
                      ))}

                      {dayEvents.length > 2 && (
                        <Typography variant="caption" sx={{ width: "100%", textAlign: "center" }}>
                          +{dayEvents.length - 2} more
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              ) : (
                <Box sx={{ height: 80 }} /> // Empty cell for padding
              )}
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

export default EventCalendar
