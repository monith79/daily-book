import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Calendar will not be used here but imported from original App.js
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
  Card,
  CardMedia,
  Input,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Book as BookIcon, Upload as UploadIcon, Add as AddIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function SingleDiaryEntryPage() {
  const { date: routeDate } = useParams(); // Get date from URL
  const navigate = useNavigate();
  
  const [date, setDate] = useState(new Date(routeDate));
  const [entry, setEntry] = useState('');
  const [savedEntry, setSavedEntry] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  const formatDate = (d) => {
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const selectedDate = formatDate(date);
    axios.get(`${API_BASE_URL}/api/entries/${selectedDate}`, { withCredentials: true })
      .then(response => {
        setSavedEntry(response.data);
        setEntry(response.data ? response.data.text : '');
        setTags(response.data && response.data.tags ? response.data.tags : []);
      })
      .catch(error => {
        console.error('Error fetching entry:', error);
      });
  }, [date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedImage(null);
  };

  const handleEntryChange = (event) => {
    setEntry(event.target.value);
  };

  const handleImageChange = (event) => {
    setSelectedImage(event.target.files[0]);
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleSave = () => {
    const selectedDate = formatDate(date);
    const formData = new FormData();
    formData.append('text', entry);
    formData.append('tags', JSON.stringify(tags)); // Send tags as JSON string
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    axios.post(`${API_BASE_URL}/api/entries/${selectedDate}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    })
      .then(response => {
        setSavedEntry(response.data);
      })
      .catch(error => {
        console.error('Error saving entry:', error);
      });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <BookIcon fontSize="large" /> Diary Entry for {date.toDateString()}
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
              Edit Entry
            </Typography>
            <TextField
              multiline
              rows={10} // Reduced rows to make space for tags
              fullWidth
              variant="outlined"
              label="Write your entry here..."
              value={entry}
              onChange={handleEntryChange}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Add a tag"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  }
                }}
              />
              <Button
                variant="contained"
                color="secondary"
                sx={{ ml: 1, p: 2 }}
                onClick={handleAddTag}
              >
                <AddIcon />
              </Button>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="upload-button">
                <Input
                  id="upload-button"
                  type="file"
                  onChange={handleImageChange}
                  sx={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                >
                  Upload Image
                </Button>
              </label>
              {selectedImage && <Typography variant="caption">{selectedImage.name}</Typography>}
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save Entry
              </Button>
            </Box>
          </Paper>
          {savedEntry && (
            <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Current Saved Entry:
              </Typography>
              <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}}>
                {savedEntry.text}
              </Typography>
              {savedEntry.imageUrl && (
                <Card sx={{ mt: 2 }}>
                  <CardMedia
                    component="img"
                    image={`${API_BASE_URL}${savedEntry.imageUrl}`}
                    alt="Memory"
                  />
                </Card>
              )}
              {savedEntry.tags && savedEntry.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Tags:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {savedEntry.tags.map((tag, index) => (
                      <Chip key={index} label={tag} variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default SingleDiaryEntryPage;
