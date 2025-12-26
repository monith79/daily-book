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
  List, ListItem, ListItemText, ListItemIcon, Checkbox,
  CircularProgress,
  InputAdornment, // Import InputAdornment
} from '@mui/material';
import { PlaylistAddCheck as TodoIcon, Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'; // Import SearchIcon
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function TodoPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for Newest First, 'asc' for Oldest First
  const [filteredTodoLists, setFilteredTodoLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState(''); // New state for keyword

  const fetchFilteredTodoLists = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const params = { sort_order: sortOrder };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (keyword) params.keyword = keyword; // Add keyword to params

      const response = await axios.get(`${API_BASE_URL}/api/todos_filtered`, {
        params: params,
        withCredentials: true,
      });
      // The API returns a flat list of todo items. We need to group them by date.
      const groupedByDate = response.data.reduce((acc, todo) => {
        const date = todo.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(todo);
        return acc;
      }, {});
      
      const todoListsArray = Object.keys(groupedByDate).map(date => ({
        date: date,
        items: groupedByDate[date]
      }));

      // Sort these grouped lists by date again, as reduce doesn't guarantee order
      todoListsArray.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.date.localeCompare(b.date);
        } else {
          return b.date.localeCompare(a.date);
        }
      });

      setFilteredTodoLists(todoListsArray);

    } catch (error) {
      console.error('Error fetching filtered todo lists:', error);
      setFilteredTodoLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredTodoLists();
  }, [startDate, endDate, sortOrder, keyword, isAuthenticated]); // Add keyword to dependency array

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setKeyword(''); // Clear keyword
  };

  const handleCreateTodoList = () => {
    // Navigate to a new page for creating a todo list (e.g., today's date)
    const today = new Date().toISOString().split('T')[0];
    navigate(`/todo_entry/${today}`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <TodoIcon fontSize="large" /> Todo Lists
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filter & Sort Todo Lists
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
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTodoList}>
            Create New Todo List
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
        ) : filteredTodoLists.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="h6" align="center" color="text.secondary">
              No todo lists found for the selected criteria.
            </Typography>
          </Grid>
        ) : (
          filteredTodoLists.map((todoList) => (
            <Grid item xs={12} sm={6} md={4} key={todoList.date}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent>
                  <Typography variant="h6" component="div">
                    Todo List for {todoList.date}
                  </Typography>
                  <List dense>
                    {todoList.items && todoList.items.length > 0 ? (
                      todoList.items.map((todo) => (
                        <ListItem key={todo.id} disablePadding>
                          <ListItemIcon>
                            <Checkbox edge="start" checked={todo.completed} tabIndex={-1} disableRipple />
                          </ListItemIcon>
                          <ListItemText primary={todo.text} sx={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
                        </ListItem>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No items in this list.
                      </Typography>
                    )}
                  </List>
                </CardContent>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" sx={{ mt: 'auto', alignSelf: 'flex-start', m: 1 }} onClick={() => navigate(`/todo_entry/${todoList.date}`)}>
                  View Full Todo List
                </Button>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Container>
  );
}

export default TodoPage;