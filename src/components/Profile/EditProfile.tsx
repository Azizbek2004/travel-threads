"use client";

import type React from "react";
import { useState, useRef } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { updateUserProfile } from "../../services/firestore";
import { uploadImage } from "../../services/storage";
import type { UserProfile } from "../../types/user";
import { PhotoCamera } from "@mui/icons-material";

interface EditProfileProps {
  profile: UserProfile;
  onSave: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ profile, onSave }) => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [photoURL, setPhotoURL] = useState(profile.photoURL);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    profile.photoURL
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to edit your profile.");
      return;
    }

    setLoading(true);
    try {
      let updatedPhotoURL = photoURL;

      // Upload new photo if selected
      if (photoFile) {
        updatedPhotoURL = await uploadImage(photoFile);
      }

      const updatedProfile: Partial<UserProfile> = {
        displayName,
        bio,
        photoURL: updatedPhotoURL,
      };

      await updateUserProfile(currentUser.uid, updatedProfile);
      onSave(); // Switch back to view mode
    } catch (err: any) {
      setError(`Failed to update profile: ${err.message}`);
      console.error("Profile update error:", err);
    } finally {
      setLoading(false);
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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Avatar
            src={photoPreview || undefined}
            alt={displayName}
            sx={{ width: 100, height: 100, mb: 2 }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ display: "none" }}
            ref={fileInputRef}
          />
          <Button
            variant="outlined"
            startIcon={<PhotoCamera />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            Change Photo
          </Button>
        </Box>

        <TextField
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
          margin="normal"
          required
          disabled={loading}
        />
        <TextField
          label="Bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          fullWidth
          multiline
          rows={3}
          margin="normal"
          disabled={loading}
        />
        <Box sx={{ mt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mr: 1 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button variant="outlined" onClick={onSave} disabled={loading}>
            Cancel
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default EditProfile;
