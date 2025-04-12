"use client"

import { useRef } from "react"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  Button,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Divider,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Skeleton,
} from "@mui/material"
import { Link } from "react-router-dom"
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Repeat,
  MoreHoriz,
  Send,
  Share as ShareIcon,
  ContentCopy,
  Twitter,
  Facebook,
  WhatsApp,
  Reply,
  LocationOn,
} from "@mui/icons-material"
import { useAuth } from "../../hooks/useAuth"
import {
  getUserProfile,
  likePost,
  unlikePost,
  addComment,
  getComments,
  getReplies,
  likeComment,
  unlikeComment,
  sharePost,
} from "../../services/firestore"
import { formatDate } from "../../utils/helpers"
import type { Comment } from "../../types/post"
import { useMobile } from "../../hooks/use-mobile"

interface PostProps {
  post: {
    id: string
    title: string
    content: string
    imageUrl?: string
    authorId: string
    createdAt: string
    likes: number
    likedBy: string[]
    commentCount: number
    shareCount: number
    location?: {
      lat: number
      lng: number
      name?: string
    }
  }
  isDetail?: boolean
}

const Post = ({ post, isDetail = false }: PostProps) => {
  const { currentUser } = useAuth()
  const { isMobileOrTablet } = useMobile()
  const [author, setAuthor] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes || 0)
  const [commentCount, setCommentCount] = useState(post.commentCount || 0)
  const [shareCount, setShareCount] = useState(post.shareCount || 0)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [shareAnchorEl, setShareAnchorEl] = useState<null | HTMLElement>(null)
  const [showComments, setShowComments] = useState(isDetail)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareCaption, setShareCaption] = useState("")
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const commentInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        if (post.authorId) {
          const authorData = await getUserProfile(post.authorId)
          setAuthor(authorData)
        }
      } catch (error) {
        console.error("Error fetching author:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAuthor()

    // Check if current user has liked this post
    if (currentUser && post.likedBy) {
      setLiked(post.likedBy.includes(currentUser.uid))
    }
  }, [post.authorId, post.likedBy, currentUser])

  useEffect(() => {
    if (showComments) {
      fetchComments()
    }
  }, [showComments, post.id])

  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const fetchedComments = await getComments(post.id)
      setComments(fetchedComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser) return

    try {
      const newLikedState = !liked

      // Update UI immediately for better UX
      setLiked(newLikedState)
      setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1))

      // Update in Firestore
      if (newLikedState) {
        await likePost(post.id, currentUser.uid)
      } else {
        await unlikePost(post.id, currentUser.uid)
      }
    } catch (error) {
      console.error("Error updating like status:", error)
      // Revert UI state on error
      setLiked(!liked)
      setLikeCount(post.likes)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !newComment.trim()) return

    try {
      const commentData = {
        postId: post.id,
        authorId: currentUser.uid,
        content: newComment.trim(),
      }

      await addComment(commentData)

      // Update UI
      setNewComment("")
      setCommentCount((prev) => prev + 1)

      // Refresh comments
      fetchComments()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleShare = async () => {
    if (!currentUser) return

    try {
      const shareData = {
        postId: post.id,
        authorId: currentUser.uid,
        caption: shareCaption,
      }

      await sharePost(shareData)

      // Update UI
      setShareCount((prev) => prev + 1)
      setShareDialogOpen(false)
      setShareCaption("")

      // Show success message
      setSnackbarMessage("Post shared successfully!")
      setSnackbarOpen(true)
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    navigator.clipboard.writeText(postUrl)
    setShareAnchorEl(null)

    // Show success message
    setSnackbarMessage("Link copied to clipboard!")
    setSnackbarOpen(true)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleShareMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setShareAnchorEl(event.currentTarget)
  }

  const handleShareMenuClose = () => {
    setShareAnchorEl(null)
  }

  const handleOpenShareDialog = () => {
    setShareDialogOpen(true)
    setShareAnchorEl(null)
  }

  const handleCloseShareDialog = () => {
    setShareDialogOpen(false)
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false)
  }

  const CommentItem = ({ comment }: { comment: Comment }) => {
    const [commentAuthor, setCommentAuthor] = useState<any>(null)
    const [commentLiked, setCommentLiked] = useState(false)
    const [commentLikeCount, setCommentLikeCount] = useState(comment.likes || 0)
    const [showReplies, setShowReplies] = useState(false)
    const [replies, setReplies] = useState<Comment[]>([])
    const [newReply, setNewReply] = useState("")
    const [replyFormOpen, setReplyFormOpen] = useState(false)
    const [loadingAuthor, setLoadingAuthor] = useState(true)

    useEffect(() => {
      const fetchCommentAuthor = async () => {
        try {
          if (comment.authorId) {
            const authorData = await getUserProfile(comment.authorId)
            setCommentAuthor(authorData)
          }
        } catch (error) {
          console.error("Error fetching comment author:", error)
        } finally {
          setLoadingAuthor(false)
        }
      }

      fetchCommentAuthor()

      // Check if current user has liked this comment
      if (currentUser && comment.likedBy) {
        setCommentLiked(comment.likedBy.includes(currentUser.uid))
      }
    }, [comment.authorId, comment.likedBy])

    useEffect(() => {
      if (showReplies) {
        fetchReplies()
      }
    }, [showReplies])

    const fetchReplies = async () => {
      try {
        if (comment.id) {
          const fetchedReplies = await getReplies(comment.id)
          setReplies(fetchedReplies)
        }
      } catch (error) {
        console.error("Error fetching replies:", error)
      }
    }

    const handleCommentLike = async () => {
      if (!currentUser) return

      try {
        const newLikedState = !commentLiked

        // Update UI immediately
        setCommentLiked(newLikedState)
        setCommentLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1))

        // Update in Firestore
        if (newLikedState) {
          await likeComment(comment.id, currentUser.uid)
        } else {
          await unlikeComment(comment.id, currentUser.uid)
        }
      } catch (error) {
        console.error("Error updating comment like status:", error)
        // Revert UI state on error
        setCommentLiked(!commentLiked)
        setCommentLikeCount(comment.likes)
      }
    }

    const handleReplySubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!currentUser || !newReply.trim()) return

      try {
        const replyData = {
          postId: post.id,
          authorId: currentUser.uid,
          content: newReply.trim(),
          parentId: comment.id,
        }

        await addComment(replyData)

        // Update UI
        setNewReply("")
        setReplyFormOpen(false)

        // Show replies and refresh
        setShowReplies(true)
        fetchReplies()
      } catch (error) {
        console.error("Error adding reply:", error)
      }
    }

    if (loadingAuthor) {
      return (
        <ListItem alignItems="flex-start" sx={{ px: isMobileOrTablet ? 1 : 0 }}>
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText primary={<Skeleton width="40%" />} secondary={<Skeleton width="80%" />} />
        </ListItem>
      )
    }

    return (
      <>
        <ListItem alignItems="flex-start" sx={{ px: isMobileOrTablet ? 1 : 0 }}>
          <ListItemAvatar>
            <Avatar
              src={commentAuthor?.photoURL}
              alt={commentAuthor?.displayName || "User"}
              component={Link}
              to={`/profile/${comment.authorId}`}
              sx={{
                cursor: "pointer",
                width: isMobileOrTablet ? 32 : 40,
                height: isMobileOrTablet ? 32 : 40,
              }}
            >
              {commentAuthor?.displayName ? commentAuthor.displayName.charAt(0).toUpperCase() : "U"}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  component={Link}
                  to={`/profile/${comment.authorId}`}
                  sx={{
                    textDecoration: "none",
                    color: "text.primary",
                    fontWeight: "bold",
                    fontSize: isMobileOrTablet ? "0.875rem" : "1rem",
                  }}
                >
                  {commentAuthor?.displayName || "Anonymous User"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(comment.createdAt)}
                </Typography>
              </Box>
            }
            secondary={
              <Box>
                <Typography
                  component="span"
                  variant={isMobileOrTablet ? "body2" : "body1"}
                  color="text.primary"
                  sx={{ display: "block", my: 1 }}
                >
                  {comment.content}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Button
                    size="small"
                    startIcon={commentLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                    onClick={handleCommentLike}
                    sx={{ minWidth: "auto", p: 0 }}
                  >
                    {commentLikeCount > 0 ? commentLikeCount : ""}
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Reply fontSize="small" />}
                    onClick={() => setReplyFormOpen(true)}
                    sx={{ minWidth: "auto", p: 0 }}
                  >
                    Reply
                  </Button>
                  {!showReplies && replies.length === 0 && (
                    <Button size="small" onClick={() => setShowReplies(true)} sx={{ minWidth: "auto", p: 0 }}>
                      View replies
                    </Button>
                  )}
                </Box>
              </Box>
            }
          />
        </ListItem>

        {/* Reply form */}
        {replyFormOpen && (
          <Box component="form" onSubmit={handleReplySubmit} sx={{ pl: 7, pr: 2, mb: 2 }}>
            <TextField
              placeholder="Write a reply..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              fullWidth
              size="small"
              multiline
              maxRows={3}
              sx={{ mb: 1 }}
              autoFocus
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button size="small" onClick={() => setReplyFormOpen(false)}>
                Cancel
              </Button>
              <Button size="small" variant="contained" type="submit" disabled={!newReply.trim()}>
                Reply
              </Button>
            </Box>
          </Box>
        )}

        {/* Replies */}
        {showReplies && replies.length > 0 && (
          <Box sx={{ pl: 7 }}>
            <List disablePadding>
              {replies.map((reply) => (
                <CommentItem key={`reply-${reply.id}`} comment={reply} />
              ))}
            </List>
          </Box>
        )}
      </>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <Card sx={{ mb: isMobileOrTablet ? 1 : 2, width: "100%" }}>
        <Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
          <Box sx={{ width: "100%" }}>
            <Skeleton width="40%" />
            <Skeleton width="20%" />
          </Box>
        </Box>
        <CardContent>
          <Skeleton width="90%" />
          <Skeleton width="80%" />
          <Skeleton width="60%" />
        </CardContent>
      </Card>
    )
  }

  // Mobile-optimized post card
  if (isMobileOrTablet) {
    return (
      <Card
        sx={{
          mb: 1,
          borderRadius: 0,
          boxShadow: "none",
          borderBottom: "1px solid",
          borderColor: "divider",
          width: "100%",
        }}
      >
        {/* Post Header */}
        <Box sx={{ display: "flex", alignItems: "center", p: 2, pb: 1 }}>
          {author && (
            <>
              <Avatar
                src={author.photoURL}
                alt={author.displayName || "User"}
                component={Link}
                to={`/profile/${post.authorId}`}
                sx={{ mr: 1.5, cursor: "pointer", width: 36, height: 36 }}
              >
                {author.displayName ? author.displayName.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle2"
                  component={Link}
                  to={`/profile/${post.authorId}`}
                  sx={{
                    textDecoration: "none",
                    color: "text.primary",
                    fontWeight: "bold",
                  }}
                >
                  {author.displayName || "Anonymous User"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "0.7rem" }}>
                  {formatDate(post.createdAt)}
                  {post.location?.name && (
                    <Box component="span" sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                      <LocationOn fontSize="inherit" sx={{ mr: 0.5, fontSize: "0.8rem" }} />
                      {post.location.name}
                    </Box>
                  )}
                </Typography>
              </Box>
              <IconButton sx={{ padding: 0.5 }} onClick={handleMenuOpen}>
                <MoreHoriz fontSize="small" />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem component={Link} to={`/post/${post.id}`}>
                  View Post
                </MenuItem>
                {currentUser && currentUser.uid === post.authorId && <MenuItem>Edit Post</MenuItem>}
                <MenuItem onClick={handleCopyLink}>Copy Link</MenuItem>
                {currentUser && currentUser.uid !== post.authorId && <MenuItem>Report</MenuItem>}
              </Menu>
            </>
          )}
        </Box>

        {/* Post Content */}
        <CardContent sx={{ py: 1, px: 2 }}>
          <Typography
            variant="subtitle1"
            component={Link}
            to={`/post/${post.id}`}
            sx={{
              textDecoration: "none",
              color: "text.primary",
              fontWeight: "medium",
              fontSize: "0.95rem",
            }}
          >
            {post.title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.85rem" }}>
            {post.content}
          </Typography>
          {post.imageUrl && (
            <Box sx={{ mt: 1.5, mx: -2 }}>
              <img src={post.imageUrl || "/placeholder.svg"} alt="Post" style={{ width: "100%", display: "block" }} />
            </Box>
          )}
        </CardContent>

        {/* Post Stats */}
        {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
          <Box
            sx={{
              px: 2,
              display: "flex",
              justifyContent: "space-between",
              mt: 0.5,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {likeCount > 0 && `${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {commentCount > 0 && `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
              {commentCount > 0 && shareCount > 0 && " • "}
              {shareCount > 0 && `${shareCount} ${shareCount === 1 ? "share" : "shares"}`}
            </Typography>
          </Box>
        )}

        <Divider sx={{ mx: 2, my: 0.5 }} />

        {/* Post Actions */}
        <CardActions sx={{ px: 2, py: 0.5, justifyContent: "space-between" }}>
          <IconButton size="small" onClick={handleLike} color={liked ? "error" : "default"}>
            {liked ? <Favorite fontSize="small" /> : <FavoriteBorder fontSize="small" />}
          </IconButton>

          <IconButton size="small" onClick={() => setShowComments(!showComments)}>
            <ChatBubbleOutline fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={handleShareMenuOpen}>
            <ShareIcon fontSize="small" />
          </IconButton>

          {/* Share Menu */}
          <Menu anchorEl={shareAnchorEl} open={Boolean(shareAnchorEl)} onClose={handleShareMenuClose}>
            <MenuItem onClick={handleCopyLink}>
              <ContentCopy fontSize="small" sx={{ mr: 1 }} />
              Copy Link
            </MenuItem>
            <MenuItem onClick={handleOpenShareDialog}>
              <Repeat fontSize="small" sx={{ mr: 1 }} />
              Repost
            </MenuItem>
            <MenuItem onClick={handleShareMenuClose}>
              <Twitter fontSize="small" sx={{ mr: 1 }} />
              Share to Twitter
            </MenuItem>
            <MenuItem onClick={handleShareMenuClose}>
              <Facebook fontSize="small" sx={{ mr: 1 }} />
              Share to Facebook
            </MenuItem>
            <MenuItem onClick={handleShareMenuClose}>
              <WhatsApp fontSize="small" sx={{ mr: 1 }} />
              Share via WhatsApp
            </MenuItem>
          </Menu>
        </CardActions>

        {/* Comments Section */}
        <Collapse in={showComments}>
          <Divider />
          <Box sx={{ p: 1.5 }}>
            {/* Comment Form */}
            {currentUser && (
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: "flex", mb: 2 }}>
                <Avatar
                  src={currentUser.photoURL || undefined}
                  alt={currentUser.displayName || "User"}
                  sx={{ mr: 1, width: 32, height: 32 }}
                >
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
                </Avatar>
                <TextField
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  fullWidth
                  size="small"
                  inputRef={commentInputRef}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" disabled={!newComment.trim()} size="small">
                        <Send fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            )}

            {/* Comments List */}
            {loadingComments ? (
              <Typography align="center" variant="body2">
                Loading comments...
              </Typography>
            ) : comments.length > 0 ? (
              <List disablePadding>
                {comments.map((comment) => (
                  <CommentItem key={`comment-${comment.id}`} comment={comment} />
                ))}
              </List>
            ) : (
              <Typography align="center" color="text.secondary" variant="body2">
                No comments yet. Be the first to comment!
              </Typography>
            )}
          </Box>
        </Collapse>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Share this post</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Originally posted by {author?.displayName || "Anonymous User"}
              </Typography>
            </Box>
            <TextField
              label="Add a caption (optional)"
              value={shareCaption}
              onChange={(e) => setShareCaption(e.target.value)}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseShareDialog}>Cancel</Button>
            <Button onClick={handleShare} variant="contained" color="primary">
              Share
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Card>
    )
  }

  // Desktop post card
  return (
    <Card sx={{ mb: 2, width: "100%" }}>
      {/* Post Header */}
      <Box sx={{ display: "flex", alignItems: "center", p: 2, pb: 0 }}>
        {author && (
          <>
            <Avatar
              src={author.photoURL}
              alt={author.displayName || "User"}
              component={Link}
              to={`/profile/${post.authorId}`}
              sx={{ mr: 1, cursor: "pointer" }}
            >
              {author.displayName ? author.displayName.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Box>
              <Typography
                variant="subtitle1"
                component={Link}
                to={`/profile/${post.authorId}`}
                sx={{
                  textDecoration: "none",
                  color: "text.primary",
                  fontWeight: "bold",
                }}
              >
                {author.displayName || "Anonymous User"}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDate(post.createdAt)}
                {post.location?.name && ` • ${post.location.name}`}
              </Typography>
            </Box>
            <IconButton sx={{ ml: "auto" }} onClick={handleMenuOpen}>
              <MoreHoriz />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem component={Link} to={`/post/${post.id}`}>
                View Post
              </MenuItem>
              {currentUser && currentUser.uid === post.authorId && <MenuItem>Edit Post</MenuItem>}
              <MenuItem onClick={handleCopyLink}>Copy Link</MenuItem>
              {currentUser && currentUser.uid !== post.authorId && <MenuItem>Report</MenuItem>}
            </Menu>
          </>
        )}
      </Box>

      {/* Post Content */}
      <CardContent>
        <Typography
          variant="h6"
          component={Link}
          to={`/post/${post.id}`}
          sx={{ textDecoration: "none", color: "text.primary" }}
        >
          {post.title}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {post.content}
        </Typography>
        {post.imageUrl && (
          <Box sx={{ mt: 2, borderRadius: 2, overflow: "hidden" }}>
            <img src={post.imageUrl || "/placeholder.svg"} alt="Post" style={{ width: "100%", display: "block" }} />
          </Box>
        )}
      </CardContent>

      {/* Post Stats */}
      {(likeCount > 0 || commentCount > 0 || shareCount > 0) && (
        <Box sx={{ px: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            {likeCount > 0 && `${likeCount} ${likeCount === 1 ? "like" : "likes"}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {commentCount > 0 && `${commentCount} ${commentCount === 1 ? "comment" : "comments"}`}
            {commentCount > 0 && shareCount > 0 && " • "}
            {shareCount > 0 && `${shareCount} ${shareCount === 1 ? "share" : "shares"}`}
          </Typography>
        </Box>
      )}

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Post Actions */}
      <CardActions sx={{ px: 2, pb: 1 }}>
        <Button startIcon={liked ? <Favorite color="error" /> : <FavoriteBorder />} onClick={handleLike} size="small">
          {liked ? "Liked" : "Like"}
        </Button>
        <Button startIcon={<ChatBubbleOutline />} onClick={() => setShowComments(!showComments)} size="small">
          Comment
        </Button>
        <Button startIcon={<ShareIcon />} onClick={handleShareMenuOpen} size="small">
          Share
        </Button>

        {/* Share Menu */}
        <Menu anchorEl={shareAnchorEl} open={Boolean(shareAnchorEl)} onClose={handleShareMenuClose}>
          <MenuItem onClick={handleCopyLink}>
            <ContentCopy fontSize="small" sx={{ mr: 1 }} />
            Copy Link
          </MenuItem>
          <MenuItem onClick={handleOpenShareDialog}>
            <Repeat fontSize="small" sx={{ mr: 1 }} />
            Repost
          </MenuItem>
          <MenuItem onClick={handleShareMenuClose}>
            <Twitter fontSize="small" sx={{ mr: 1 }} />
            Share to Twitter
          </MenuItem>
          <MenuItem onClick={handleShareMenuClose}>
            <Facebook fontSize="small" sx={{ mr: 1 }} />
            Share to Facebook
          </MenuItem>
          <MenuItem onClick={handleShareMenuClose}>
            <WhatsApp fontSize="small" sx={{ mr: 1 }} />
            Share via WhatsApp
          </MenuItem>
        </Menu>
      </CardActions>

      {/* Comments Section */}
      <Collapse in={showComments}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Comment Form */}
          {currentUser && (
            <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: "flex", mb: 2 }}>
              <Avatar src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} sx={{ mr: 1 }}>
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "U"}
              </Avatar>
              <TextField
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                fullWidth
                size="small"
                inputRef={commentInputRef}
                InputProps={{
                  endAdornment: (
                    <IconButton type="submit" disabled={!newComment.trim()} size="small">
                      <Send fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          )}

          {/* Comments List */}
          {loadingComments ? (
            <Typography align="center">Loading comments...</Typography>
          ) : comments.length > 0 ? (
            <List>
              {comments.map((comment) => (
                <CommentItem key={`comment-${comment.id}`} comment={comment} />
              ))}
            </List>
          ) : (
            <Typography align="center" color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </Box>
      </Collapse>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={handleCloseShareDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Share this post</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {post.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Originally posted by {author?.displayName || "Anonymous User"}
            </Typography>
          </Box>
          <TextField
            label="Add a caption (optional)"
            value={shareCaption}
            onChange={(e) => setShareCaption(e.target.value)}
            fullWidth
            multiline
            rows={3}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShareDialog}>Cancel</Button>
          <Button onClick={handleShare} variant="contained" color="primary">
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default Post
