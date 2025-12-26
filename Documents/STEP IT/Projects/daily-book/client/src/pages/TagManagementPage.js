import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { Sell as TagIcon, Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

function TagManagementPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useContext(AuthContext);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const fetchTags = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/tags`, { withCredentials: true });
      setTags(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to fetch tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setError('You need to be logged in to manage tags.');
      setLoading(false);
      return;
    }
    fetchTags();
  }, [isAuthenticated]);

  const handleRenameClick = (tag) => {
    setSelectedTag(tag);
    setNewTagName(tag);
    setRenameDialogOpen(true);
  };

  const handleDeleteClick = (tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!newTagName.trim() || newTagName === selectedTag) {
      setError('New tag name cannot be empty or the same as the old tag.');
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/api/tags/rename`,
        { old_tag: selectedTag, new_tag: newTagName },
        { withCredentials: true }
      );
      setRenameDialogOpen(false);
      fetchTags(); // Refresh tags
    } catch (err) {
      console.error('Error renaming tag:', err);
      setError(err.response?.data?.message || 'Failed to rename tag.');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/tags/${selectedTag}`, { withCredentials: true });
      setDeleteDialogOpen(false);
      fetchTags(); // Refresh tags
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError(err.response?.data?.message || 'Failed to delete tag.');
    }
  };

  const handleCloseDialog = () => {
    setRenameDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedTag('');
    setNewTagName('');
    setError('');
  };

  const handleCreateTag = async () => {
    if (!newTagInput.trim()) {
      setError('Tag name cannot be empty.');
      return;
    }
    if (tags.includes(newTagInput.trim())) {
      setError('Tag already exists.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First, get the current entry for today's date
      const getEntryResponse = await axios.get(`${API_BASE_URL}/api/entries/${today}`, { withCredentials: true });
      let existingEntry = getEntryResponse.data; // Will be {text: '', imageUrl: null, tags: []} if no entry

      // Add the new tag to the existing tags (or an empty array if none)
      let currentTags = existingEntry.tags || [];
      if (!currentTags.includes(newTagInput.trim())) {
        currentTags = [...currentTags, newTagInput.trim()];
      }

      // Prepare formData for the POST request
      const formData = new FormData();
      formData.append('text', existingEntry.text || ''); // Keep existing text or empty
      formData.append('tags', JSON.stringify(currentTags)); // Send updated tags as JSON string
      // Preserve existing image if any, though we don't handle file uploads here

      const saveEntryResponse = await axios.post(
        `${API_BASE_URL}/api/entries/${today}`,
        formData,
        { withCredentials: true }
      );

      setNewTagInput(''); // Clear input
      setError(''); // Clear any previous error
      fetchTags(); // Refresh the tag list
    } catch (err) {
      console.error('Error creating tag:', err);
      setError(err.response?.data?.message || 'Failed to create tag.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        <TagIcon fontSize="large" /> Tag Management
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error && !selectedTag ? ( // Only show global error if not related to a dialog
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create New Tag
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="New Tag Name"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateTag(); // Call create tag function
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTag} // Call create tag function
              disabled={!newTagInput.trim()}
            >
              Create
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            Your Unique Tags ({tags.length})
          </Typography>
          {tags.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No tags found yet. Add some to your diary entries!
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  color="primary"
                  variant="outlined"
                  onDelete={() => handleDeleteClick(tag)} // Use onDelete for primary action
                  deleteIcon={<DeleteIcon />} // Custom delete icon
                  sx={{
                    '& .MuiChip-label': { mr: 0.5 }, // Space for edit icon if needed, though using IconButton below
                  }}
                  // You might consider making the chip itself clickable for edit,
                  // or adding a separate IconButton for edit
                  onClick={() => handleRenameClick(tag)} // Click to rename
                />
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Rename Tag</DialogTitle>
        <DialogContent>
          {error && selectedTag && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="New Tag Name"
            type="text"
            fullWidth
            variant="standard"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleRenameConfirm();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleRenameConfirm}>Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          {error && selectedTag && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography>Are you sure you want to delete the tag "{selectedTag}" globally? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default TagManagementPage;