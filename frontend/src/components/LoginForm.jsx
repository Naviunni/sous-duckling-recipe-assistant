import React, { useState } from "react";
import { signInMock } from "../utils/auth";
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
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInMock(identifier, password);
      setTimeout(() => navigate("/", { replace: true }), 220);
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
          label="Email or username"
          fullWidth
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username"
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
            {loading ? "Signing in..." : "Sign in"}
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
      </Stack>
    </Box>
  );
}
