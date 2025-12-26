import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Box,
} from '@mui/material';
import { NotificationService } from '../services/NotificationService';

function NotificationSettingsDialog({ open, onClose }) {
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState(Notification.permission);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('notificationsEnabled') === 'true'
  );
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(
    localStorage.getItem('notificationSoundEnabled') === 'true'
  );
  const [snoozeDuration, setSnoozeDuration] = useState(
    parseInt(localStorage.getItem('snoozeDuration'), 10) || 5
  );
  const [notificationMessage, setNotificationMessage] = useState({ type: '', text: '' });

  // Load initial states from localStorage on component mount
  useEffect(() => {
    setNotificationsEnabled(localStorage.getItem('notificationsEnabled') === 'true');
    setNotificationSoundEnabled(localStorage.getItem('notificationSoundEnabled') === 'true');
    setSnoozeDuration(parseInt(localStorage.getItem('snoozeDuration'), 10) || 5);
    setNotificationPermissionStatus(Notification.permission);
  }, [open]); // Re-evaluate when dialog opens

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled);
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationSoundEnabled', notificationSoundEnabled);
  }, [notificationSoundEnabled]);

  useEffect(() => {
    localStorage.setItem('snoozeDuration', snoozeDuration);
  }, [snoozeDuration]);

  // Handle Notifications toggle
  const handleNotificationsToggle = async (event) => {
    const isEnabled = event.target.checked;
    setNotificationsEnabled(isEnabled);

    if (isEnabled && notificationPermissionStatus !== 'granted') {
      const granted = await NotificationService.requestPermission();
      setNotificationPermissionStatus(Notification.permission);
      if (!granted) {
        setNotificationsEnabled(false); // Revert if not granted
        setNotificationMessage({ type: 'warning', text: 'Notification permission denied by user. Please enable it in your browser settings.' });
      } else {
        setNotificationMessage({ type: 'success', text: 'Notification permission granted!' });
      }
    } else if (!isEnabled) {
      setNotificationMessage({ type: 'info', text: 'Notifications are currently disabled.' });
    }
  };

  // Handle Notification Sound toggle
  const handleNotificationSoundToggle = (event) => {
    setNotificationSoundEnabled(event.target.checked);
  };

  // Handle Snooze Duration change
  const handleSnoozeDurationChange = (event) => {
    setSnoozeDuration(event.target.value);
  };

  // Update NotificationService's sound preference
  useEffect(() => {
    NotificationService.setSoundEnabled(notificationSoundEnabled);
  }, [notificationSoundEnabled]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Notification Settings</DialogTitle>
      <DialogContent>
        {notificationMessage.text && (
            <Alert severity={notificationMessage.type} sx={{ mb: 2 }}>{notificationMessage.text}</Alert>
        )}
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={handleNotificationsToggle}
                name="enableNotifications"
                disabled={notificationPermissionStatus === 'denied'}
              />
            }
            label={notificationPermissionStatus === 'denied' ? "Notifications (Permission Denied)" : "Enable Notifications"}
          />
          {notificationsEnabled && notificationPermissionStatus === 'granted' && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSoundEnabled}
                    onChange={handleNotificationSoundToggle}
                    name="notificationSound"
                  />
                }
                label="Notification Sound"
              />
              <FormControl sx={{ mt: 2 }} fullWidth>
                <InputLabel id="snooze-duration-label">Snooze Duration</InputLabel>
                <Select
                  labelId="snooze-duration-label"
                  value={snoozeDuration}
                  label="Snooze Duration"
                  onChange={handleSnoozeDurationChange}
                >
                  <MenuItem value={5}>5 minutes</MenuItem>
                  <MenuItem value={10}>10 minutes</MenuItem>
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
        </FormGroup>
        {notificationPermissionStatus === 'denied' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                To enable notifications, please grant permission in your browser settings.
            </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default NotificationSettingsDialog;
