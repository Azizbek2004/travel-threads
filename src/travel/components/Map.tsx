'use client';

import { useEffect, useState } from 'react';
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

interface MapProps {
  lat: number;
  lng: number;
  posts?: Array<{
    id: string;
    title: string;
    content: string;
    location?: {
      lat: number;
      lng: number;
      name?: string;
    };
    imageUrl?: string;
  }>;
  zoom?: number;
}

const Map = ({ lat, lng, posts = [], zoom = 10 }: MapProps) => {
  const mapStyles = { height: '100%', width: '100%' };
  const defaultCenter = { lat, lng };
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // If showing multiple posts, fit the map to show all markers
  useEffect(() => {
    if (mapInstance && posts && posts.length > 1) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      posts.forEach((post) => {
        if (post.location?.lat && post.location?.lng) {
          bounds.extend({
            lat: post.location.lat,
            lng: post.location.lng,
          });
        }
      });
      mapInstance.fitBounds(bounds);
    }
  }, [posts, mapInstance]);

  // Close InfoWindow when clicking on map
  const handleMapClick = () => {
    if (selectedPost) {
      setSelectedPost(null);
    }
  };

  return (
    <LoadScript googleMapsApiKey="AIzaSyCX4xwYTwIDjj64ZULpmz-Osy4NNfRrSiE">
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={zoom}
        center={defaultCenter}
        onClick={handleMapClick}
        onLoad={(map) => setMapInstance(map)}
      >
        {/* Single marker if no posts provided */}
        {posts.length === 0 && <Marker position={defaultCenter} />}

        {/* Multiple markers for posts */}
        {posts.map(
          (post) =>
            post.location?.lat &&
            post.location?.lng && (
              <Marker
                key={post.id}
                position={{
                  lat: post.location.lat,
                  lng: post.location.lng,
                }}
                onClick={() => setSelectedPost(post)}
              />
            )
        )}

        {/* Info window for selected post */}
        {selectedPost && (
          <InfoWindow
            position={{
              lat: selectedPost.location.lat,
              lng: selectedPost.location.lng,
            }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <Box sx={{ maxWidth: 250, p: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedPost.title}
              </Typography>

              {selectedPost.imageUrl && (
                <img
                  src={selectedPost.imageUrl || '/placeholder.svg'}
                  alt={selectedPost.title}
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    marginBottom: 8,
                    borderRadius: 4,
                  }}
                />
              )}

              <Typography variant="body2" sx={{ mb: 1 }}>
                {selectedPost.content.substring(0, 100)}
                {selectedPost.content.length > 100 ? '...' : ''}
              </Typography>

              <Button
                component={Link}
                to={`/post/${selectedPost.id}`}
                size="small"
                variant="outlined"
                fullWidth
              >
                View Post
              </Button>
            </Box>
          </InfoWindow>
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
