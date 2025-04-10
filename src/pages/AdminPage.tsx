import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { getPosts, deletePost } from '../services/firestore';

const AdminPage = () => {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const postsData = await getPosts();
      setPosts(postsData);
    };
    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    await deletePost(id);
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      {posts.map((post) => (
        <Box key={post.id} sx={{ mb: 2 }}>
          <Typography>{post.title}</Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleDelete(post.id)}
          >
            Delete
          </Button>
        </Box>
      ))}
    </Box>
  );
};

export default AdminPage;
