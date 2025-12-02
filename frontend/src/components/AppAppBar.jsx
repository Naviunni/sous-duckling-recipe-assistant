import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getToken, getProfile, signOut } from "../utils/auth.jsx";
import { alpha, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Drawer from '@mui/material/Drawer';
import MenuIcon from '@mui/icons-material/Menu';
import { ListItemIcon } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import HomeRounded from '@mui/icons-material/HomeRounded';
import ChatBubbleRounded from '@mui/icons-material/ChatBubbleRounded';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import ExploreRounded from '@mui/icons-material/ExploreRounded';
import ShoppingCartRounded from '@mui/icons-material/ShoppingCartRounded';
import Brand from './Brand.jsx';

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const token = getToken();
  const profile = getProfile();
  const navigate = useNavigate();

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 0 }}>
            <Brand />
            <Box sx={{ display: { xs: 'none', md: 'flex' }}}>
              <Button
                LinkComponent={Link}
                to="/"
                color="info"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  minHeight: 45,
                  textTransform: 'none',
                }}
              >
                <HomeRounded sx={{ fontSize: 20 }} />
                <span>Home</span>
              </Button>

              <Button
                LinkComponent={Link}
                to="/chat"
                color="info"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  minHeight: 45,
                  textTransform: 'none',
                }}
              >
                <ChatBubbleRounded sx={{ fontSize: 20 }} />
                <span>Chat</span>
              </Button>

              <Button
                LinkComponent={Link}
                to="/saved"
                color="info"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  minHeight: 45,
                  textTransform: 'none',
                }}
              >
                <FavoriteRounded sx={{ fontSize: 20 }} />
                <span>Saved</span>
              </Button>

              <Button
                LinkComponent={Link}
                to="/explore"
                color="info"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  minHeight: 45,
                  textTransform: 'none',
                }}
              >
                <ExploreRounded sx={{ fontSize: 20 }} />
                <span>Explore</span>
              </Button>

              <Button
                LinkComponent={Link}
                to="/grocery"
                color="info"
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 70,
                  minHeight: 45,
                  textTransform: 'none',
                }}
              >
                <ShoppingCartRounded sx={{ fontSize: 20 }} />
                <span>Grocery</span>
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              gap: 1,
              alignItems: 'center',
            }}
          >
            {!token ? (
              <Button
                component={Link}
                to="/login"
                color="primary"
                variant="contained"
                size="small"
              >
                Sign in
              </Button>        
            ) : (
              <>
                <span style={{ fontSize: 14, color: '#000' }}>
                  Hi, {profile?.name?.split(" ")[0]} 👋
                </span>

                <Button
                  component={Link}
                  to="/profile"
                  color="info"
                  variant="outlined"
                  size="small"
                >
                  Profile
                </Button>

                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    signOut();
                    window.location.reload();
                  }}
                >
                  Sign out
                </Button>
              </>
            )}
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: 'var(--template-frame-height, 0px)',
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: 'background.default' }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>
                <MenuItem component={Link} to="/">
                  <ListItemIcon>
                    <HomeRounded fontSize="small" />
                  </ListItemIcon>
                  Home
                </MenuItem>
                <MenuItem component={Link} to="/chat">
                  <ListItemIcon>
                    <ChatBubbleRounded fontSize="small" />
                  </ListItemIcon>
                  Chat
                </MenuItem>
                <MenuItem component={Link} to="/saved">
                  <ListItemIcon>
                    <FavoriteRounded fontSize="small" />
                  </ListItemIcon>
                  Saved
                </MenuItem>
                <MenuItem component={Link} to="/explore">
                  <ListItemIcon>
                    <ExploreRounded fontSize="small" />
                  </ListItemIcon>
                  Explore
                </MenuItem>
                <MenuItem component={Link} to="/grocery">
                  <ListItemIcon>
                    <ShoppingCartRounded fontSize="small" />
                  </ListItemIcon>
                  Grocery
                </MenuItem>
                <Divider sx={{ my: 3 }} />

                  {!token ? (
                    <MenuItem>
                      <Button
                        component={Link}
                        to="/login"
                        color="primary"
                        variant="contained"
                        fullWidth
                      >
                        Sign in
                      </Button>
                    </MenuItem>
                  ) : (
                    <>
                      <MenuItem component={Link} to="/profile" onClick={() => setOpen(false)}>
                        Profile
                      </MenuItem>
                      <MenuItem>
                        <Button
                          color="error"
                          variant="outlined"
                          fullWidth
                          onClick={() => {
                            signOut();
                            window.location.reload();
                            setOpen(false);
                          }}
                        >
                          Sign out
                        </Button>
                      </MenuItem>
                    </>
                  )}

              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
