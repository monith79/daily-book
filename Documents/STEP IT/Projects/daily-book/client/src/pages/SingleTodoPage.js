import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
} from '@mui/material';
import { Save as SaveIcon, PlaylistAddCheck as TodoIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function SingleTodoPage() {
  const { date: routeDate } = useParams(); // Get date from URL
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date(routeDate));
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');

  const formatDate = (d) => {
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const selectedDate = formatDate(date);
    axios.get(`${API_BASE_URL}/api/todos/${selectedDate}`, { withCredentials: true })
      .then(response => {
        setTodos(response.data || []);
      })
      .catch(error => {
        console.error('Error fetching todos:', error);
        setTodos([]);
      });
  }, [date]);

  const handleDateChange = (newDate) => {
    setDate(newDate);
  };

  const handleNewTodoTextChange = (event) => {
    setNewTodoText(event.target.value);
  };

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      const newTodo = {
        id: uuidv4(),
        text: newTodoText.trim(),
        completed: false,
      };
      const updatedTodos = [...todos, newTodo];
      setTodos(updatedTodos);
      setNewTodoText('');
      saveTodos(updatedTodos);
    }
  };

  const handleToggleTodo = (id) => {
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  const handleDeleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveTodos(updatedTodos);
  };

  const saveTodos = (currentTodos) => {
    const selectedDate = formatDate(date);
    axios.post(`${API_BASE_URL}/api/todos/${selectedDate}`, currentTodos, { withCredentials: true })
      .then(response => {
        console.log('Todos saved:', response.data);
      })
      .catch(error => {
        console.error('Error saving todos:', error);
      });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <TodoIcon fontSize="large" /> Todo List for {date.toDateString()}
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
              Edit Todo List
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                fullWidth
                variant="outlined"
                label="Add a new todo"
                value={newTodoText}
                onChange={handleNewTodoTextChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTodo();
                  }
                }}
              />
              <Button
                variant="contained"
                color="primary"
                sx={{ ml: 1, p: 2 }}
                onClick={handleAddTodo}
              >
                <AddIcon />
              </Button>
            </Box>
            <List>
              {todos.map((todo) => (
                <ListItem
                  key={todo.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteTodo(todo.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                  disablePadding
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={todo.completed}
                      tabIndex={-1}
                      disableRipple
                      onChange={() => handleToggleTodo(todo.id)}
                    />
                  </ListItemIcon>
                  <ListItemText primary={todo.text} sx={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
                </ListItem>
              ))}
              {todos.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                  No todos for this date.
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default SingleTodoPage;