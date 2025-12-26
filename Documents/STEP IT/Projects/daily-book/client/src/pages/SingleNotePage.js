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
import { Save as SaveIcon, Note as NoteIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function SingleNotePage() {
  const { date: routeDate } = useParams(); // Get date from URL
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date(routeDate));
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState(null); // Now stores object {text}

  const formatDate = (d) => {
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const selectedDate = formatDate(date);
    axios.get(`${API_BASE_URL}/api/notes/${selectedDate}`, { withCredentials: true })
      .then(response => {
        const data = response.data;
        setSavedNote(data.text ? data : null); // Set null if no text
        setNote(data.text || '');
      })
      .catch(error => {
        console.error('Error fetching note:', error);
        setSavedNote(null);
        setNote('');
      });
  }, [date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleNoteChange = (event) => {
    setNote(event.target.value);
  };

  const handleSave = () => {
    const selectedDate = formatDate(date);
    axios.post(`${API_BASE_URL}/api/notes/${selectedDate}`, {
      text: note,
    }, { withCredentials: true })
      .then(response => {
        setSavedNote(response.data);
      })
      .catch(error => {
        console.error('Error saving note:', error);
      });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <NoteIcon fontSize="large" /> Note for {date.toDateString()}
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
              Edit Note
            </Typography>
            <TextField
              multiline
              rows={15}
              fullWidth
              variant="outlined"
              label="Write your note here..."
              value={note}
              onChange={handleNoteChange}
            />
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Note
              </Button>
            </Box>
          </Paper>
          {savedNote && savedNote.text && (
            <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Current Saved Note:
              </Typography>
              <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>
                {savedNote.text}
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default SingleNotePage;
