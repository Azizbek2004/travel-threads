"use client";

import type React from "react";
import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Paper,
  CircularProgress,
  Link as MuiLink,
} from "@mui/material";
import { signUp } from "../../services/auth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useMobile } from "../../hooks/use-mobile";
import Logo from "../Shared/Layout/Logo";

const Signup = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobileOrTablet } = useMobile();

  // Get redirect path from location state
  const from = location.state?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName);
      navigate(from); // Redirect to the page they were trying to access or home
    } catch (error: any) {
      let message = "Signup failed";
      if (error.code === "auth/email-already-in-use") {
        message = "Email is already in use";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 180px)",
        p: 2,
      }}
    >
      <Paper
        elevation={isMobileOrTablet ? 0 : 3}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          mx: "auto",
          borderRadius: isMobileOrTablet ? 0 : 2,
        }}
      >
        <Box
          sx={{
            margin: "0 0 12px",
          }}
        >
          <Logo />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            type="email"
            required
            disabled={loading}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            helperText="Password must be at least 6 characters"
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
            disabled={loading}
            error={confirmPassword !== "" && password !== confirmPassword}
            helperText={
              confirmPassword !== "" && password !== confirmPassword
                ? "Passwords don't match"
                : ""
            }
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            disabled={
              loading ||
              !email ||
              !password ||
              !displayName ||
              password !== confirmPassword
            }
          >
            {loading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2">
            Already have an account?{" "}
            <MuiLink component={Link} to="/login" state={{ from }}>
              Log in
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;
