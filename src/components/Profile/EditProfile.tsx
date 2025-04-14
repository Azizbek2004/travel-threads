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
  Chip,
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

  // Add to the state declarations
  const [favoritePlaces, setFavoritePlaces] = useState<string[]>(
    profile.favoritePlaces || []
  );
  const [placeInput, setPlaceInput] = useState("");
  const [placeSuggestions, setPlaceSuggestions] = useState<string[]>([]);

  // Add a function to fetch place suggestions
  const fetchPlaceSuggestions = async (input: string) => {
    if (!input.trim() || input.length < 2) return;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&types=(regions)&key=AIzaSyCX4xwYTwIDjj64ZULpmz-Osy4NNfRrSiE`,
        { mode: "no-cors" } // Note: This will need a proper backend proxy in production
      );

      // Since we can't directly access the response due to CORS, we'll use a simplified approach
      // In a real app, you'd make this request through your backend

      // Simulate some suggestions based on input
      const suggestions = [
        `${input} City`,
        `${input} Region`,
        `${input} Country`,
      ];

      setPlaceSuggestions(suggestions);
    } catch (error) {
      console.error("Error fetching place suggestions:", error);
    }
  };

  // Add a function to handle adding a place
  const handleAddPlace = () => {
    if (placeInput.trim() && !favoritePlaces.includes(placeInput.trim())) {
      setFavoritePlaces([...favoritePlaces, placeInput.trim()]);
      setPlaceInput("");
    }
  };

  // Add a function to handle removing a place
  const handleRemovePlace = (place: string) => {
    setFavoritePlaces(favoritePlaces.filter((p) => p !== place));
  };

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
        favoritePlaces, // Add this line
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
        {/* Favorite Places */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Favorite Places
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <TextField
              label="Add a place"
              value={placeInput}
              onChange={(e) => {
                setPlaceInput(e.target.value);
                fetchPlaceSuggestions(e.target.value);
              }}
              fullWidth
              margin="normal"
              disabled={loading}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPlace();
                }
              }}
            />
            <Button
              onClick={handleAddPlace}
              disabled={!placeInput.trim() || loading}
              sx={{ ml: 1, height: 56 }}
            >
              Add
            </Button>
          </Box>

          {/* Place suggestions */}
          {placeSuggestions.length > 0 && placeInput.trim() && (
            <Box sx={{ mb: 2 }}>
              {placeSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="text"
                  size="small"
                  onClick={() => {
                    setPlaceInput(suggestion);
                    setPlaceSuggestions([]);
                  }}
                  sx={{ mr: 1, mb: 1 }}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          )}

          {/* Display favorite places */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {favoritePlaces.map((place, index) => (
              <Chip
                key={index}
                label={place}
                onDelete={() => handleRemovePlace(place)}
                disabled={loading}
              />
            ))}
          </Box>
        </Box>
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
