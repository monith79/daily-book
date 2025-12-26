import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
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
  CardContent,
  Chip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  InputAdornment, // Import InputAdornment
} from '@mui/material';
import { Notifications as RemindIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'; // Import SearchIcon
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function RemindPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for Newest First, 'asc' for Oldest First
  const [filteredReminders, setFilteredReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(''); // New state for keyword

  const fetchFilteredReminders = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const params = { sort_order: sortOrder };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (keyword) params.keyword = keyword; // Add keyword to params

      const response = await axios.get(`${API_BASE_URL}/api/reminders_filtered`, {
        params: params,
        withCredentials: true,
      });
      setFilteredReminders(response.data);
    } catch (error) {
      console.error('Error fetching filtered reminders:', error);
      setFilteredReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredReminders();
  }, [startDate, endDate, sortOrder, keyword, isAuthenticated]); // Add keyword to dependency array

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setKeyword(''); // Clear keyword
  };

  const handleCreateReminder = () => {
    // Navigate to a new page for creating a reminder (e.g., today's date)
    const today = new Date().toISOString().split('T')[0];
    navigate(`/reminder_entry/${today}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <RemindIcon fontSize="large" /> Reminders
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter & Sort Reminders
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label="Keyword"
              fullWidth
              variant="outlined"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="sort-order-label">Sort Order</InputLabel>
              <Select
                labelId="sort-order-label"
                value={sortOrder}
                label="Sort Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateReminder}>
            Create New Reminder
          </Button>
          <Button variant="outlined" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          </Grid>
        ) : filteredReminders.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="h6" align="center" color="text.secondary">
              No reminders found for the selected criteria.
            </Typography>
          </Grid>
        ) : (
          filteredReminders.map((reminder) => (
            <Grid item xs={12} sm={6} md={4} key={reminder.date}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {reminder.date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {reminder.time && <strong>{reminder.time} - </strong>}
                    {reminder.text.substring(0, 100)}{reminder.text.length > 100 ? '...' : ''}
                  </Typography>
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" sx={{ mt: 'auto', alignSelf: 'flex-start', m: 1 }} onClick={() => navigate(`/reminder_entry/${reminder.date}`)}>
                  View Full Reminder
                </Button>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default RemindPage;