import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, TextField, InputAdornment } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications'; // Import NotificationsIcon
import PaletteIcon from '@mui/icons-material/Palette'; // Import PaletteIcon
import AuthContext from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import NotificationSettingsDialog from './NotificationSettingsDialog'; // Import NotificationSettingsDialog
import AppearanceSettingsDialog from './AppearanceSettingsDialog'; // Import AppearanceSettingsDialog

function NavBar() {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { toggleColorMode, mode } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false); // State for notification dialog
  const [appearanceDialogOpen, setAppearanceDialogOpen] = useState(false); // State for appearance dialog

  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?query=${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  const handleOpenNotificationDialog = () => {
    setNotificationDialogOpen(true);
  };

  const handleCloseNotificationDialog = () => {
    setNotificationDialogOpen(false);
  };

  const handleOpenAppearanceDialog = () => {
    setAppearanceDialogOpen(true);
  };

  const handleCloseAppearanceDialog = () => {
    setAppearanceDialogOpen(false);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Daily Book
        </Typography>
        <Button color="inherit" onClick={() => navigate('/')}>
          Home
        </Button>
        {isAuthenticated && (
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearch}
            sx={{ mr: 2, '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' }, '&:hover fieldset': { borderColor: 'white' } }, '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.7)' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'white' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
        <IconButton sx={{ ml: 1 }} onClick={handleOpenAppearanceDialog} color="inherit"> {/* Appearance Button */}
          <PaletteIcon />
        </IconButton>
        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1" component="span" sx={{ mr: 2 }}>
              Welcome, {user.username}!
            </Typography>
            <IconButton color="inherit" onClick={handleOpenNotificationDialog}> {/* Notification Button */}
              <NotificationsIcon />
            </IconButton>
            <Button color="inherit" onClick={() => navigate('/tags')} sx={{ mr: 1 }}>
              Tags
            </Button>
            <Button color="inherit" onClick={() => navigate('/data_management')} sx={{ mr: 1 }}>
              Data
            </Button>
            <Button color="inherit" onClick={() => navigate('/settings')} sx={{ mr: 1 }}>
              Settings
            </Button>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
      {isAuthenticated && (
        <>
          <NotificationSettingsDialog
            open={notificationDialogOpen}
            onClose={handleCloseNotificationDialog}
          />
          <AppearanceSettingsDialog
            open={appearanceDialogOpen}
            onClose={handleCloseAppearanceDialog}
          />
        </>
      )}
    </AppBar>
  );
}

export default NavBar;
