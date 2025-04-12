"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Box, Typography, Card, CardContent, Button, CircularProgress } from "@mui/material"
import Post from "../components/Post/Post"
import Map from "../travel/components/Map"
import { getPost } from "../services/firestore"
import { ArrowBack } from "@mui/icons-material"

const PostPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (id) {
        try {
          setLoading(true)
          const postData = await getPost(id)

          if (!postData) {
            setError("Post not found")
          } else {
            setPost(postData)
          }
        } catch (err: any) {
          setError(`Error loading post: ${err.message}`)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchPost()
  }, [id])

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error || !post) {
    return (
      <Box sx={{ p: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Card>
          <CardContent>
            <Typography color="error" align="center">
              {error || "Post not found"}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, maxWidth: "1200px", mx: "auto", width: "100%" }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Post post={post} isDetail={true} />

      {post.location && post.location.lat && post.location.lng && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Location
            </Typography>
            {post.location.name && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {post.location.name}
              </Typography>
            )}
            <Map lat={post.location.lat} lng={post.location.lng} />
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default PostPage
