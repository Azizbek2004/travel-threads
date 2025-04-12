"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import {
  Box,
  Typography,
  TextField,
  Tabs,
  Tab,
  CircularProgress,
  Card,
  CardContent,
  Autocomplete,
  FormControlLabel,
  Switch,
  IconButton,
  InputAdornment,
  Chip,
  Button,
  Grid,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  ListItemAvatar,
  Avatar,
} from "@mui/material"
import InfiniteScroll from "react-infinite-scroll-component"
import Post from "../components/Post/Post"
import UserCard from "../components/User/UserCard"
import { searchPosts, searchUsers, getLocationSuggestions } from "../services/firestore"
import debounce from "lodash.debounce"
import {
  Search as SearchIcon,
  LocationOn,
  Close,
  Map as MapIcon,
  FilterList,
  Place,
  FilterAlt,
  ArrowBack,
} from "@mui/icons-material"
import Map from "../travel/components/Map"
import { useMobile } from "../hooks/use-mobile"

const SearchPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()
  const queryParams = new URLSearchParams(location.search)
  const initialTextQuery = queryParams.get("query") || ""
  const initialLocationQuery = queryParams.get("location") || ""
  const initialOnlyWithLocation = queryParams.get("withLocation") === "true"

  const [textQuery, setTextQuery] = useState(initialTextQuery)
  const [locationQuery, setLocationQuery] = useState(initialLocationQuery)
  const [onlyWithLocation, setOnlyWithLocation] = useState(initialOnlyWithLocation)
  const [tabValue, setTabValue] = useState(0) // 0 for Posts, 1 for Users
  const [userResults, setUserResults] = useState<any[]>([])
  const [postResults, setPostResults] = useState<any[]>([])
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [userPage, setUserPage] = useState(0)
  const [postPage, setPostPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [mapCenter, setMapCenter] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const PAGE_SIZE = 10 // Number of items to load per page

  // Search for users (paginated)
  const fetchUsers = async (query: string, page: number) => {
    const allUsers = await searchUsers(query)
    const start = page * PAGE_SIZE
    const end = start + PAGE_SIZE
    const paginatedUsers = allUsers.slice(start, end)
    setUserResults((prev) => (page === 0 ? paginatedUsers : [...prev, ...paginatedUsers]))
    setHasMoreUsers(paginatedUsers.length === PAGE_SIZE)
  }

  // Search for posts with text and location filters
  const fetchPosts = async (textQuery: string, locationQuery: string, onlyWithLocation: boolean, page: number) => {
    const allPosts = await searchPosts(textQuery, locationQuery, onlyWithLocation)
    const start = page * PAGE_SIZE
    const end = start + PAGE_SIZE
    const paginatedPosts = allPosts.slice(start, end)
    setPostResults((prev) => (page === 0 ? paginatedPosts : [...prev, ...paginatedPosts]))
    setHasMorePosts(paginatedPosts.length === PAGE_SIZE)

    // Update map center if there are posts with location
    if (paginatedPosts.length > 0 && paginatedPosts[0].location?.lat && paginatedPosts[0].location?.lng) {
      setMapCenter({
        lat: paginatedPosts[0].location.lat,
        lng: paginatedPosts[0].location.lng,
      })
    }
  }

  // Handle search based on all current filters
  const handleSearch = async () => {
    if (!textQuery.trim() && !locationQuery.trim() && !onlyWithLocation) return

    setLoading(true)
    setUserResults([])
    setPostResults([])
    setUserPage(0)
    setPostPage(0)
    setHasMoreUsers(true)
    setHasMorePosts(true)

    try {
      // Update URL with search params
      const params = new URLSearchParams()
      if (textQuery) params.set("query", textQuery)
      if (locationQuery) params.set("location", locationQuery)

      if (onlyWithLocation) params.set("withLocation", "true")
      navigate(`/search?${params.toString()}`)

      await fetchUsers(textQuery, 0)
      await fetchPosts(textQuery, locationQuery, onlyWithLocation, 0)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
      setFilterDrawerOpen(false)
    }
  }

  const loadMoreUsers = () => {
    if (hasMoreUsers) {
      setUserPage((prev) => prev + 1)
      fetchUsers(textQuery, userPage + 1)
    }
  }

  const loadMorePosts = () => {
    if (hasMorePosts) {
      setPostPage((prev) => prev + 1)
      fetchPosts(textQuery, locationQuery, onlyWithLocation, postPage + 1)
    }
  }

  // Fetch location suggestions with debounce
  const debouncedGetLocationSuggestions = useCallback(
    debounce(async (input: string) => {
      if (input.length < 2) {
        setLocationSuggestions([])
        setLoadingLocationSuggestions(false)
        return
      }

      try {
        const suggestions = await getLocationSuggestions(input)
        setLocationSuggestions(suggestions)
      } catch (error) {
        console.error("Error getting location suggestions:", error)
      } finally {
        setLoadingLocationSuggestions(false)
      }
    }, 500),
    [],
  )

  // Update location suggestions when typing
  useEffect(() => {
    if (locationQuery.trim()) {
      setLoadingLocationSuggestions(true)
      debouncedGetLocationSuggestions(locationQuery)
    } else {
      setLocationSuggestions([])
    }
  }, [locationQuery, debouncedGetLocationSuggestions])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(() => {
      handleSearch()
    }, 800),
    [textQuery, locationQuery, onlyWithLocation],
  )

  // Initial search when page loads with URL parameters
  useEffect(() => {
    if (initialTextQuery || initialLocationQuery || initialOnlyWithLocation) {
      handleSearch()
    }
  }, []) // Empty dependency array for initial load only

  // Run search when filters change
  useEffect(() => {
    debouncedSearch()
  }, [textQuery, locationQuery, onlyWithLocation, debouncedSearch])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleClearFilters = () => {
    setTextQuery("")
    setLocationQuery("")
    setOnlyWithLocation(false)
    setShowFilters(false)
  }

  // Mobile search page
  if (isMobileOrTablet) {
    return (
      <Box sx={{ pb: 8 }}>
        {/* Search Header */}
        <Box
          sx={{
            p: 2,
            position: "sticky",
            top: 0,
            bgcolor: "background.paper",
            zIndex: 10,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton edge="start" onClick={() => navigate(-1)}>
              <ArrowBack />
            </IconButton>

            <TextField
              placeholder="Search..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: textQuery ? (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setTextQuery("")} size="small">
                      <Close fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />

            <IconButton
              color={locationQuery || onlyWithLocation ? "primary" : "default"}
              onClick={() => setFilterDrawerOpen(true)}
            >
              <FilterAlt />
            </IconButton>
          </Box>

          {/* Active filters */}
          {(locationQuery || onlyWithLocation) && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
              {locationQuery && (
                <Chip
                  icon={<LocationOn fontSize="small" />}
                  label={locationQuery}
                  size="small"
                  onDelete={() => setLocationQuery("")}
                />
              )}

              {onlyWithLocation && (
                <Chip
                  icon={<Place fontSize="small" />}
                  label="With location"
                  size="small"
                  onDelete={() => setOnlyWithLocation(false)}
                />
              )}
            </Box>
          )}
        </Box>

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
          <Tab label={`Posts (${postResults.length})`} />
          <Tab label={`Users (${userResults.length})`} />
        </Tabs>

        {/* Map View */}
        {showMap && postResults.length > 0 && (
          <Box sx={{ height: 200, mb: 1 }}>
            {mapCenter ? (
              <Map
                lat={mapCenter.lat}
                lng={mapCenter.lng}
                posts={postResults.filter((post) => post.location?.lat && post.location?.lng)}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <Typography color="text.secondary">No locations to display</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Search Results */}
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Post Results */}
            {tabValue === 0 && (
              <>
                {postResults.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>
                    No posts found matching your search criteria
                  </Typography>
                ) : (
                  <InfiniteScroll
                    dataLength={postResults.length}
                    next={loadMorePosts}
                    hasMore={hasMorePosts}
                    loader={<CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />}
                    endMessage={<Typography sx={{ textAlign: "center", mt: 2, mb: 8 }}>No more posts</Typography>}
                  >
                    {postResults.map((post) => (
                      <Post key={post.id} post={post} />
                    ))}
                  </InfiniteScroll>
                )}
              </>
            )}

            {/* User Results */}
            {tabValue === 1 && (
              <>
                {userResults.length === 0 ? (
                  <Typography sx={{ textAlign: "center", my: 4 }}>
                    No users found matching your search criteria
                  </Typography>
                ) : (
                  <List disablePadding>
                    {userResults.map((user) => (
                      <ListItem
                        key={user.id}
                        component={Link}
                        to={`/profile/${user.id}`}
                        sx={{
                          textDecoration: "none",
                          color: "inherit",
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          py: 1.5,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.photoURL} alt={user.displayName} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.displayName}
                          secondary={
                            user.bio ? user.bio.substring(0, 60) + (user.bio.length > 60 ? "..." : "") : "No bio"
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </>
        )}

        {/* Filter Drawer */}
        <Drawer
          anchor="bottom"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "70vh",
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Search Filters</Typography>
              <IconButton onClick={() => setFilterDrawerOpen(false)}>
                <Close />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Location
            </Typography>

            <TextField
              placeholder="Enter location (e.g., France, Paris)"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Switch checked={onlyWithLocation} onChange={(e) => setOnlyWithLocation(e.target.checked)} />}
              label="Only show posts with location"
              sx={{ my: 1, display: "block" }}
            />

            <FormControlLabel
              control={<Switch checked={showMap} onChange={(e) => setShowMap(e.target.checked)} />}
              label="Show map view"
              sx={{ mb: 2, display: "block" }}
            />

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button variant="outlined" fullWidth onClick={handleClearFilters}>
                Clear All
              </Button>
              <Button variant="contained" fullWidth onClick={handleSearch}>
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    )
  }

  // Desktop search page
  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>

      {/* Search Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TextField
              label="Search for posts and users"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: textQuery && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setTextQuery("")} edge="end">
                      <Close />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <IconButton
              sx={{ ml: 1 }}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters || locationQuery || onlyWithLocation ? "primary" : "default"}
            >
              <FilterList />
            </IconButton>
          </Box>

          {/* Advanced Filters */}
          {showFilters && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Advanced Filters
              </Typography>

              <Autocomplete
                freeSolo
                options={locationSuggestions}
                loading={loadingLocationSuggestions}
                value={locationQuery}
                onInputChange={(_, newValue) => setLocationQuery(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Location"
                    fullWidth
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {loadingLocationSuggestions ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch checked={onlyWithLocation} onChange={(e) => setOnlyWithLocation(e.target.checked)} />
                  }
                  label="Only posts with location"
                />

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<MapIcon />}
                  onClick={() => setShowMap(!showMap)}
                  color={showMap ? "primary" : "inherit"}
                >
                  {showMap ? "Hide Map" : "Show Map"}
                </Button>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button variant="text" onClick={handleClearFilters} sx={{ mr: 1 }}>
                  Clear Filters
                </Button>
                <Button variant="contained" onClick={handleSearch}>
                  Search
                </Button>
              </Box>
            </Box>
          )}

          {/* Active filters display */}
          {(textQuery || locationQuery || onlyWithLocation) && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {textQuery && <Chip label={`Search: ${textQuery}`} onDelete={() => setTextQuery("")} size="small" />}
              {locationQuery && (
                <Chip
                  icon={<LocationOn fontSize="small" />}
                  label={locationQuery}
                  onDelete={() => setLocationQuery("")}
                  size="small"
                />
              )}
              {onlyWithLocation && (
                <Chip label="With location only" onDelete={() => setOnlyWithLocation(false)} size="small" />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Map View */}
      {showMap && postResults.length > 0 && (
        <Paper sx={{ height: 300, mb: 3, overflow: "hidden", borderRadius: 2 }}>
          {mapCenter ? (
            <Map
              lat={mapCenter.lat}
              lng={mapCenter.lng}
              posts={postResults.filter((post) => post.location?.lat && post.location?.lng)}
            />
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <Typography color="text.secondary">No locations to display</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
        <Tab label={`Posts (${postResults.length || 0})`} />
        <Tab label={`Users (${userResults.length || 0})`} />
      </Tabs>

      {/* Search results */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Post Results */}
          {tabValue === 0 && (
            <>
              {postResults.length === 0 ? (
                <Typography sx={{ textAlign: "center", my: 4 }}>
                  No posts found matching your search criteria
                </Typography>
              ) : (
                <InfiniteScroll
                  dataLength={postResults.length}
                  next={loadMorePosts}
                  hasMore={hasMorePosts}
                  loader={<CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />}
                  endMessage={<Typography sx={{ textAlign: "center", mt: 2 }}>No more posts</Typography>}
                >
                  {postResults.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </InfiniteScroll>
              )}
            </>
          )}

          {/* User Results */}
          {tabValue === 1 && (
            <>
              {userResults.length === 0 ? (
                <Typography sx={{ textAlign: "center", my: 4 }}>
                  No users found matching your search criteria
                </Typography>
              ) : (
                <InfiniteScroll
                  dataLength={userResults.length}
                  next={loadMoreUsers}
                  hasMore={hasMoreUsers}
                  loader={<CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />}
                  endMessage={<Typography sx={{ textAlign: "center", mt: 2 }}>No more users</Typography>}
                >
                  <Grid container spacing={2}>
                    {userResults.map((user) => (
                      <Grid item xs={12} sm={6} md={4} key={user.id}>
                        <UserCard user={user} />
                      </Grid>
                    ))}
                  </Grid>
                </InfiniteScroll>
              )}
            </>
          )}
        </>
      )}
    </Box>
  )
}

export default SearchPage
