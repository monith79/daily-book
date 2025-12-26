import React, { useContext } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
import NotificationSettingsDialogContent from '../components/NotificationSettingsDialog';
import AppearanceSettingsDialogContent from '../components/AppearanceSettingsDialog'; // Import new appearance content component

function SettingsPage() {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Please log in to manage your settings.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <SettingsIcon fontSize="large" /> Settings
      </Typography>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Appearance
        </Typography>
        <AppearanceSettingsDialogContent isDialog={false} /> {/* Render content directly */}
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Notifications
        </Typography>
        <NotificationSettingsDialogContent isDialog={false} /> {/* Render content directly */}
      </Paper>

    </Container>
  );
}

export default SettingsPage;