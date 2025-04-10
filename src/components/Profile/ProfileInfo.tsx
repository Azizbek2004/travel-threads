import React from 'react';
import { Box, Typography, Avatar, Divider } from '@mui/material';
import { UserProfile } from '../../types/user';

interface ProfileInfoProps {
  profile: UserProfile;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ profile }) => {
  return (
    <Box sx={{ p: 2, border: '1px solid grey', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar
          src={profile.photoURL}
          alt={profile.displayName}
          sx={{ width: 100, height: 100, mr: 2 }}
        />
        <Box>
          <Typography variant="h5">{profile.displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            @{profile.id.slice(0, 8)} {/* Shortened UID as a pseudo-username */}
          </Typography>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Bio:</strong> {profile.bio || 'No bio yet.'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          <strong>Email:</strong> {profile.email || 'Not provided'}
        </Typography>
        <Typography variant="body1">
          <strong>Joined:</strong>{' '}
          {profile.createdAt
            ? new Date(profile.createdAt).toLocaleDateString()
            : 'Unknown'}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProfileInfo;
