import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import AuthContext from '../context/AuthContext';
import {
  Book as BookIcon,
  Note as NoteIcon,
  PlaylistAddCheck as TodoIcon,
  Notifications as RemindIcon,
  Image as ImageIcon
} from '@mui/icons-material';

function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const query = new URLSearchParams(location.search).get('query');

  useEffect(() => {
    if (!isAuthenticated || !query) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/search?query=${query}`, { withCredentials: true });
        setSearchResults(response.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, isAuthenticated]);

  const getIcon = (type) => {
    switch (type) {
      case 'diary': return <BookIcon sx={{ mr: 1 }} />;
      case 'note': return <NoteIcon sx={{ mr: 1 }} />;
      case 'reminder': return <RemindIcon sx={{ mr: 1 }} />;
      case 'todo': return <TodoIcon sx={{ mr: 1 }} />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        Search Results for "{query}"
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
          {searchResults.length === 0 ? (
            <Typography variant="h6" align="center" color="text.secondary">
              No results found.
            </Typography>
          ) : (
            <List>
              {searchResults.map((result, index) => (
                <Box key={index}>
                  <ListItem alignItems="flex-start">
                    {getIcon(result.type)}
                    <ListItemText
                      primary={
                        <Typography
                          component="span"
                          variant="body1"
                          color="text.primary"
                        >
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)} - {result.date}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            sx={{ display: 'block' }}
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {result.text || (result.type === 'diary' && result.imageUrl && <><ImageIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Image attached</>)}
                          </Typography>
                          {result.tags && result.tags.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {result.tags.map((tag, tagIndex) => (
                                <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                              ))}
                            </Box>
                          )}
                          {result.type === 'todo' && (
                            <Typography variant="body2" color="text.secondary">
                              Status: {result.completed ? 'Completed' : 'Pending'}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default SearchPage;
