import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { Save as SaveIcon, Notifications as RemindIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function SingleReminderPage() {
  const { date: routeDate } = useParams(); // Get date from URL
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date(routeDate));
  const [reminder, setReminder] = useState('');
  const [time, setTime] = useState('');
  const [savedReminder, setSavedReminder] = useState(null); // Stores object {text, time}

  const formatDate = (d) => {
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const selectedDate = formatDate(date);
    axios.get(`${API_BASE_URL}/api/reminders/${selectedDate}`, { withCredentials: true })
      .then(response => {
        const data = response.data;
        setSavedReminder(data.text ? data : null); // Set null if no text
        setReminder(data.text || '');
        setTime(data.time || '');
      })
      .catch(error => {
        console.error('Error fetching reminder:', error);
        setSavedReminder(null);
        setReminder('');
        setTime('');
      });
  }, [date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleReminderChange = (event) => {
    setReminder(event.target.value);
  };

  const handleTimeChange = (event) => {
    setTime(event.target.value);
  };

  const handleSave = () => {
    const selectedDate = formatDate(date);
    axios.post(`${API_BASE_URL}/api/reminders/${selectedDate}`, {
      text: reminder,
      time: time,
    }, { withCredentials: true })
      .then(response => {
        setSavedReminder(response.data);
      })
      .catch(error => {
        console.error('Error saving reminder:', error);
      });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <RemindIcon fontSize="large" /> Reminder for {date.toDateString()}
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Select Another Date (Optional)
            </Typography>
            <Calendar
              onChange={handleDateChange}
              value={date}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Edit Reminder
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              label="Time (HH:MM)"
              type="time"
              value={time}
              onChange={handleTimeChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              multiline
              rows={12}
              fullWidth
              variant="outlined"
              label="Write your reminder here..."
              value={reminder}
              onChange={handleReminderChange}
            />
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Reminder
              </Button>
            </Box>
          </Paper>
          {savedReminder && savedReminder.text && (
            <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Current Saved Reminder:
              </Typography>
              <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>
                {savedReminder.time && <strong>{savedReminder.time} - </strong>}
                {savedReminder.text}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default SingleReminderPage;
