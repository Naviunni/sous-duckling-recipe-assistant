import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import AppTheme from './shared-theme/AppTheme';
import AppAppBar from './components/AppAppBar';
import Home from './components/Home';
import Chat from './components/Chat';  
import Saved from './components/Saved';
import Explore from './components/Explore';
import Grocery from './components/Grocery';
import Login from "./components/Login.jsx";
import { getProfile } from "./utils/auth.jsx";

function RequireAuth({ children }) {
  // simple client-side guard — replace with real session check when you have a backend
  const profile = getProfile();
  return profile ? children : <Navigate to="/login" replace />;
}

export default function App(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <AppAppBar />

      <Container
        maxWidth="lg"
        component="main"
        sx={{ display: 'flex', flexDirection: 'column', my: 16, gap: 4 }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
          <Route path="/saved" element={<RequireAuth><Saved /></RequireAuth>} />
          <Route path="/explore" element={<RequireAuth><Explore /></RequireAuth>} />
          <Route path="/grocery" element={<RequireAuth><Grocery /></RequireAuth>} />
        </Routes>
      </Container>
    </AppTheme>
  );
}
          
    
