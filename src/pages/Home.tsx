"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  Menu,
  MenuItem,
  Collapse,
  Avatar,
} from "@mui/material"
import InfiniteScroll from "react-infinite-scroll-component"
import Post from "../components/Post/Post"
import { getPosts, getFollowingPosts, getUserProfile } from "../services/firestore"
import { useAuth } from "../hooks/useAuth"
import debounce from "lodash.debounce"
import {
  Search as SearchIcon,
  FilterList,
  TravelExplore,
  TagFaces,
  TrendingUp,
  KeyboardArrowDown,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useMobile } from "../hooks/use-mobile"

const Home = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const { isMobileOrTablet } = useMobile()
  const [posts, setPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [tabValue, setTabValue] = useState(0) // 0 for "For You", 1 for "Following"
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null)
  const [sortMethod, setSortMethod] = useState<"recent" | "popular" | "trending">("recent")
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([])

  const PAGE_SIZE = 10 // Number of posts to load per page

  const fetchPosts = async (pageNum: number) => {
    setLoading(true)
    try {
      const allPosts = await getPosts()

      // Apply sorting
      const sortedPosts = [...allPosts]
      if (sortMethod === "popular") {
        sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      } else if (sortMethod === "trending") {
        // Trending is a combination of recent + engagement (likes, comments, shares)
        sortedPosts.sort((a, b) => {
          const aEngagement = (a.likes || 0) + (a.commentCount || 0) + (a.shareCount || 0)
          const bEngagement = (b.likes || 0) + (b.commentCount || 0) + (b.shareCount || 0)

          // Calculate engagement rate (weighted by recency)
          const aDate = new Date(a.createdAt)
          const bDate = new Date(b.createdAt)
          const aAge = Date.now() - aDate.getTime()
          const bAge = Date.now() - bDate.getTime()

          const aTrending = aEngagement / Math.sqrt(aAge)
          const bTrending = bEngagement / Math.sqrt(bAge)

          return bTrending - aTrending
        })
      }
      // recent sorting is default (by createdAt desc)

      const start = pageNum * PAGE_SIZE
      const end = start + PAGE_SIZE
      const paginatedPosts = sortedPosts.slice(start, end)
      setPosts((prev) => [...prev, ...paginatedPosts])
      setFilteredPosts((prev) => [...prev, ...paginatedPosts])
      setHasMore(paginatedPosts.length === PAGE_SIZE)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFollowingPosts = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      const followingPosts = await getFollowingPosts(currentUser.uid)

      // Apply same sorting logic as regular posts
      const sortedPosts = [...followingPosts]
      if (sortMethod === "popular") {
        sortedPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      } else if (sortMethod === "trending") {
        sortedPosts.sort((a, b) => {
          const aEngagement = (a.likes || 0) + (a.commentCount || 0) + (a.shareCount || 0)
          const bEngagement = (b.likes || 0) + (b.commentCount || 0) + (b.shareCount || 0)

          const aDate = new Date(a.createdAt)
          const bDate = new Date(b.createdAt)
          const aAge = Date.now() - aDate.getTime()
          const bAge = Date.now() - bDate.getTime()

          const aTrending = aEngagement / Math.sqrt(aAge)
          const bTrending = bEngagement / Math.sqrt(bAge)

          return bTrending - aTrending
        })
      }

      setPosts(sortedPosts)
      setFilteredPosts(sortedPosts)
      setHasMore(false) // For simplicity, we're not paginating following posts
    } catch (error) {
      console.error("Error fetching following posts:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch suggested users
  const fetchSuggestedUsers = async () => {
    if (!currentUser) return

    try {
      // In a real app, you'd have a proper algorithm for suggestions
      // For now, we'll just get some random users
      const allPosts = await getPosts()
      const userIds = [...new Set(allPosts.map((post) => post.authorId))]
        .filter((id) => id !== currentUser.uid)
        .slice(0, 5)

      const users = []
      for (const userId of userIds) {
        const user = await getUserProfile(userId)
        if (user) users.push(user)
      }

      setSuggestedUsers(users)
    } catch (error) {
      console.error("Error fetching suggested users:", error)
    }
  }

  const loadMorePosts = () => {
    if (hasMore && tabValue === 0) {
      setPage((prev) => prev + 1)
      fetchPosts(page + 1)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredPosts(posts)
      return
    }

    const lowerQuery = query.toLowerCase()

    const filtered = posts.filter((post) => {
      // Text search
      const textMatch =
        post.title?.toLowerCase().includes(lowerQuery) || post.content?.toLowerCase().includes(lowerQuery)

      // Location filter (if active)
      const locationMatch = locationFilter
        ? post.location?.name?.toLowerCase().includes(locationFilter.toLowerCase())
        : true

      return textMatch && locationMatch
    })

    setFilteredPosts(filtered)
  }

  const handleLocationFilter = (query: string) => {
    setLocationFilter(query || null)

    if (!query) {
      setFilteredPosts(posts)
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = posts.filter((post) => post.location?.name?.toLowerCase().includes(lowerQuery))

    setFilteredPosts(filtered)
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query)
    }, 500),
    [posts, locationFilter],
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  // Reset state and fetch posts when tab or sort method changes
  useEffect(() => {
    setPosts([])
    setFilteredPosts([])
    setPage(0)
    setSearchQuery("")
    setLocationFilter(null)

    if (tabValue === 0) {
      fetchPosts(0) // For You tab
    } else {
      fetchFollowingPosts() // Following tab
    }

    // Fetch suggested users
    if (currentUser && isMobileOrTablet) {
      fetchSuggestedUsers()
    }
  }, [tabValue, sortMethod, currentUser])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget)
  }

  const handleSortMenuClose = () => {
    setSortAnchorEl(null)
  }

  const handleSortSelect = (sort: "recent" | "popular" | "trending") => {
    setSortMethod(sort)
    handleSortMenuClose()
  }

  const handleAdvancedSearch = () => {
    const searchParams = new URLSearchParams()
    if (searchQuery) searchParams.set("query", searchQuery)
    if (locationFilter) searchParams.set("location", locationFilter)

    navigate(`/search?${searchParams.toString()}`)
  }

  return (
    <Box sx={{ p: isMobileOrTablet ? 0 : 2, width: "100%" }}>
      {!isMobileOrTablet && (
        <Typography variant="h4" gutterBottom>
          Travel Threads
        </Typography>
      )}

      {/* Mobile Stories/Suggested Users Row */}
      {isMobileOrTablet && suggestedUsers.length > 0 && (
        <Box sx={{ overflowX: "auto", whiteSpace: "nowrap", py: 1, px: 2, mb: 1 }}>
          {suggestedUsers.map((user) => (
            <Box
              key={user.id}
              component="span"
              sx={{
                display: "inline-block",
                textAlign: "center",
                mr: 2,
                "&:last-child": { mr: 0 },
              }}
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              <Avatar
                src={user.photoURL}
                alt={user.displayName}
                sx={{
                  width: 64,
                  height: 64,
                  mb: 0.5,
                  border: "2px solid",
                  borderColor: "primary.main",
                }}
              />
              <Typography variant="caption" display="block" noWrap sx={{ maxWidth: 64 }}>
                {user.displayName}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Search and Sort Controls - Desktop */}
      {!isMobileOrTablet && (
        <Card sx={{ mb: 3, width: "100%" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <TextField
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <IconButton
                sx={{ ml: 1 }}
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                color={showAdvancedSearch ? "primary" : "default"}
              >
                <FilterList />
              </IconButton>

              <Button
                variant="outlined"
                size="small"
                onClick={handleSortMenuOpen}
                endIcon={<KeyboardArrowDown />}
                sx={{ ml: 1, minWidth: 100 }}
              >
                {sortMethod === "recent" ? "Recent" : sortMethod === "popular" ? "Popular" : "Trending"}
              </Button>

              <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortMenuClose}>
                <MenuItem onClick={() => handleSortSelect("recent")}>
                  <KeyboardArrowDown sx={{ mr: 1 }} />
                  Recent
                </MenuItem>
                <MenuItem onClick={() => handleSortSelect("popular")}>
                  <TagFaces sx={{ mr: 1 }} />
                  Popular
                </MenuItem>
                <MenuItem onClick={() => handleSortSelect("trending")}>
                  <TrendingUp sx={{ mr: 1 }} />
                  Trending
                </MenuItem>
              </Menu>
            </Box>

            {/* Advanced Search Options */}
            <Collapse in={showAdvancedSearch}>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Filter by Location
                </Typography>

                <TextField
                  placeholder="Enter location (e.g., France, Paris, NYC)"
                  value={locationFilter || ""}
                  onChange={(e) => handleLocationFilter(e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TravelExplore fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <Button variant="contained" size="small" onClick={handleAdvancedSearch} fullWidth>
                  Advanced Search
                </Button>
              </Box>
            </Collapse>

            {/* Active Filters */}
            {(searchQuery || locationFilter) && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {searchQuery && (
                  <Chip label={`Search: ${searchQuery}`} onDelete={() => setSearchQuery("")} size="small" />
                )}
                {locationFilter && (
                  <Chip
                    icon={<TravelExplore fontSize="small" />}
                    label={locationFilter}
                    onDelete={() => handleLocationFilter("")}
                    size="small"
                  />
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feed Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        centered
        sx={{
          mb: 1,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": {
            height: isMobileOrTablet ? 3 : 2,
          },
          width: "100%",
        }}
        variant={isMobileOrTablet ? "fullWidth" : "standard"}
      >
        <Tab label="For You" />
        <Tab label="Following" />
      </Tabs>

      {/* Mobile Sort Controls */}
      {isMobileOrTablet && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            mb: 1,
            width: "100%",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {sortMethod === "recent" ? "Most Recent" : sortMethod === "popular" ? "Most Popular" : "Trending"}
          </Typography>

          <Button
            size="small"
            variant="text"
            onClick={handleSortMenuOpen}
            endIcon={<KeyboardArrowDown />}
            sx={{ textTransform: "none" }}
          >
            Sort
          </Button>
        </Box>
      )}

      {/* Feed Content */}
      {loading && posts.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4, width: "100%" }}>
          <CircularProgress />
        </Box>
      ) : filteredPosts.length === 0 ? (
        <Typography sx={{ textAlign: "center", my: 4, width: "100%" }}>
          {tabValue === 1
            ? searchQuery || locationFilter
              ? "No matching posts found in your following feed"
              : "Follow users to see their posts here!"
            : searchQuery || locationFilter
              ? "No matching posts found"
              : "No posts found"}
        </Typography>
      ) : (
        <InfiniteScroll
          dataLength={filteredPosts.length}
          next={loadMorePosts}
          hasMore={hasMore && !searchQuery && !locationFilter}
          loader={<CircularProgress sx={{ display: "block", mx: "auto", my: 2 }} />}
          endMessage={
            <Typography sx={{ textAlign: "center", mt: 2, mb: isMobileOrTablet ? 8 : 2 }}>No more posts</Typography>
          }
          style={{ width: "100%" }}
        >
          {filteredPosts.map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </InfiniteScroll>
      )}
    </Box>
  )
}

export default Home
