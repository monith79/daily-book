import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Box,
} from '@mui/material';
import { useThemeContext } from '../context/ThemeContext';

function AppearanceSettingsDialog({ open, onClose }) {
  const { mode, toggleColorMode } = useThemeContext();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Appearance Settings</DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'dark'}
                onChange={toggleColorMode}
                name="darkMode"
              />
            }
            label="Dark Mode"
          />
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AppearanceSettingsDialog;
