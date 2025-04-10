import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { updateUserProfile } from '../../services/firestore';
import { UserProfile } from '../../types/user';

interface EditProfileProps {
  profile: UserProfile;
  onSave: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ profile, onSave }) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [photoURL, setPhotoURL] = useState(profile.photoURL);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be logged in to edit your profile.');
      return;
    }

    try {
      const updatedProfile: Partial<UserProfile> = {
        displayName,
        bio,
        photoURL,
      };
      await updateUserProfile(currentUser.uid, updatedProfile);
      onSave(); // Switch back to view mode
    } catch (err: any) {
      setError(`Failed to update profile: ${err.message}`);
      console.error('Profile update error:', err);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Edit Profile
      </Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        <TextField
          label="Photo URL"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Enter a URL to your profile picture"
        />
        <Box sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
          >
            Save
          </Button>
          <Button variant="outlined" onClick={onSave}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default EditProfile;
