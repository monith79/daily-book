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
  OutlinedInput,
} from '@mui/material';
import { Book as BookIcon, Add as AddIcon } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function DiaryPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [lastDiaryEntry, setLastDiaryEntry] = useState(null); // New state for last entry

  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

    useEffect(() => {

      if (isAuthenticated) {

        axios.get(`${API_BASE_URL}/api/tags`, { withCredentials: true })

          .then(response => {

            setAllTags(response.data);

          })

          .catch(error => console.error('Error fetching tags:', error));

      }

    }, [isAuthenticated]);

  

    // New useEffect to fetch the last diary entry

    useEffect(() => {

      const fetchLastDiaryEntry = async () => {

        if (!isAuthenticated) {

          setLastDiaryEntry(null);

          return;

        }

        try {

          const response = await axios.get(`${API_BASE_URL}/api/entries/last`, { withCredentials: true });

          setLastDiaryEntry(response.data);

        } catch (error) {

          console.error('Error fetching last diary entry:', error);

          setLastDiaryEntry(null);

        }

      };

      fetchLastDiaryEntry();

    }, [isAuthenticated]); // Rerun when authentication status changes

  

  

    const fetchFilteredEntries = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const params = {
        sort_order: sortOrder,
        start_date: startDate,
        end_date: endDate,
        tags: selectedTags.join(','),
      };

      const response = await axios.get(`${API_BASE_URL}/api/diary_entries_filtered`, {
        params: params,
        withCredentials: true,
      });
      setFilteredEntries(response.data);
    } catch (error) {
      console.error('Error fetching filtered diary entries:', error);
      setFilteredEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredEntries();
  }, [startDate, endDate, sortOrder, selectedTags, isAuthenticated]);

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setSelectedTags([]);
  };
  
  const handleCreateEntry = () => {
    const today = new Date().toISOString().split('T')[0];
    navigate(`/diary_entry/${today}`);
  };

  const handleTagChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedTags(typeof value === 'string' ? value.split(',') : value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <BookIcon fontSize="large" /> Diary Entries
      </Typography>

      {lastDiaryEntry && lastDiaryEntry.date !== null && (
        <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Latest Diary Entry ({lastDiaryEntry.date})
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {lastDiaryEntry.text}
          </Typography>
          {lastDiaryEntry.imageUrl && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <img src={`${API_BASE_URL}${lastDiaryEntry.imageUrl}`} alt="Latest Entry" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
            </Box>
          )}
          {lastDiaryEntry.tags && lastDiaryEntry.tags.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {lastDiaryEntry.tags.map((tag, tagIndex) => (
                <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          )}
          <Button size="small" sx={{ mt: 1 }} onClick={() => navigate(`/diary_entry/${lastDiaryEntry.date}`)}>
            View Full Entry
          </Button>
        </Paper>
      )}

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter & Sort Entries
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
            <FormControl fullWidth>
              <InputLabel id="tag-filter-label">Tags</InputLabel>
              <Select
                labelId="tag-filter-label"
                multiple
                value={selectedTags}
                onChange={handleTagChange}
                input={<OutlinedInput label="Tags" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                {allTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateEntry}>
            Create New Entry
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
        ) : filteredEntries.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="h6" align="center" color="text.secondary">
              No diary entries found for the selected criteria.
            </Typography>
          </Grid>
        ) : (
          filteredEntries.map((entry) => (
            <Grid item xs={12} sm={6} md={4} key={entry.date}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    {entry.date}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {entry.text}
                  </Typography>
                  {entry.imageUrl && (
                    <Box sx={{ mt: 1 }}>
                      <img src={`${API_BASE_URL}${entry.imageUrl}`} alt="Entry" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 4 }} />
                    </Box>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {entry.tags.map((tag, tagIndex) => (
                        <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" sx={{ mt: 'auto', alignSelf: 'flex-start', m: 1 }} onClick={() => navigate(`/diary_entry/${entry.date}`)}>
                  View Full Entry
                </Button>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default DiaryPage;
