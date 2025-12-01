import React, { useState } from "react";
import { signIn, signUp } from "../utils/auth";
import { useNavigate } from "react-router-dom";

import {
  Box,
  TextField,
  Button,
  Alert,
  Stack,
} from "@mui/material";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignup) {
        await signUp(identifier, password);
        setTimeout(() => navigate("/welcome", { replace: true }), 220);
      } else {
        await signIn(identifier, password);
        setTimeout(() => navigate("/", { replace: true }), 220);
      }
    } catch (err) {
      setError(err?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={2}>
        {/* Email / Username */}
        <TextField
          label="Email"
          fullWidth
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
          variant="outlined"
          margin="normal"
          InputLabelProps={{ shrink: true }}
          sx={{
            '& .MuiInputLabel-outlined': {
              backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper),
              px: 0.5,
            },
          }}
        />

        {/* Password */}
        <TextField
          label="Password"
          fullWidth
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
          variant="outlined"
          margin="normal"
          InputLabelProps={{ shrink: true }}
          sx={{
            '& .MuiInputLabel-outlined': {
              backgroundColor: (theme) => (theme.vars ? `rgb(${theme.vars.palette.background.paperChannel})` : theme.palette.background.paper),
              px: 0.5,
            },
          }}
        />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        {/* Buttons */}
        <Stack direction="row" spacing={2} mt={1}>
          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading}
            sx={{
              bgcolor: "#FF8A00",
              "&:hover": { bgcolor: "#e67a00" },
              fontWeight: 600,
            }}
          >
            {loading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create account" : "Sign in")}
          </Button>

          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setIdentifier("john@example.com");
              setPassword("password123");
            }}
            title="Fill demo credentials"
            sx={{ fontWeight: 600 }}
          >
            Demo
          </Button>
        </Stack>

        <Button
          variant="text"
          onClick={() => setIsSignup((v) => !v)}
          sx={{ textTransform: 'none' }}
        >
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </Button>
      </Stack>
    </Box>
  );
}
