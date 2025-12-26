import { API_BASE_URL } from '../apiConfig';
import React, { useState, useContext } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  TextField,
} from '@mui/material';
import { FileDownload as ExportIcon, FileUpload as ImportIcon } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

function DataManagementPage() {
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);

  const [exportDataTypes, setExportDataTypes] = useState({
    diary_entries: true,
    notes: true,
    reminders: true,
    todos: true,
  });
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');

  const handleExport = async () => {
    if (!isAuthenticated) {
      setImportMessage({ type: 'error', text: 'You need to be logged in to export data.' });
      return;
    }
    setExportLoading(true);
    setImportMessage({ type: '', text: '' });

    const selectedTypes = Object.keys(exportDataTypes).filter(type => exportDataTypes[type]);
    if (selectedTypes.length === 0) {
      setImportMessage({ type: 'error', text: 'Please select at least one data type to export.' });
      setExportLoading(false);
      return;
    }

    try {
      const params = {
        data_types: selectedTypes,
        start_date: exportStartDate,
        end_date: exportEndDate,
      };
      const response = await axios.get(`${API_BASE_URL}/api/export`, {
        params: params,
        withCredentials: true,
        responseType: 'json', // Backend returns JSON directly
      });
      
      const json = JSON.stringify(response.data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dailybook_export.json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setImportMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setImportMessage({ type: 'error', text: error.response?.data?.message || 'Export failed.' });
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleImport = async () => {
    if (!isAuthenticated) {
      setImportMessage({ type: 'error', text: 'You need to be logged in to import data.' });
      return;
    }
    if (!selectedFile) {
      setImportMessage({ type: 'error', text: 'Please select a JSON file to import.' });
      return;
    }
    setImportLoading(true);
    setImportMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });
      setImportMessage({ type: 'success', text: response.data.message + '. Imported counts: ' + JSON.stringify(response.data.imported_counts) });
      setSelectedFile(null); // Clear selected file
      // Optionally, refresh UI where data is displayed
    } catch (error) {
      console.error('Import failed:', error);
      setImportMessage({ type: 'error', text: error.response?.data?.message || 'Import failed.' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportDataTypeChange = (event) => {
    setExportDataTypes({
      ...exportDataTypes,
      [event.target.name]: event.target.checked,
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        Data Management
      </Typography>

      <Grid container spacing={3}>
        {/* Export Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <ExportIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Export Data
            </Typography>
            {importMessage.type === 'error' && importMessage.text && ( // Display error specific to import/export if it exists
                <Alert severity="error" sx={{ mb: 2 }}>{importMessage.text}</Alert>
            )}
            <FormLabel component="legend" sx={{ mt: 2 }}>Select Data Types:</FormLabel>
            <FormGroup row>
              {Object.keys(exportDataTypes).map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={exportDataTypes[type]}
                      onChange={handleExportDataTypeChange}
                      name={type}
                    />
                  }
                  label={type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                />
              ))}
            </FormGroup>

            <FormLabel component="legend" sx={{ mt: 2 }}>Filter by Date Range (Optional):</FormLabel>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 2 }}>
                <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                />
                <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                />
            </Box>

            <Button
              variant="contained"
              color="primary"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={exportLoading}
              fullWidth
            >
              {exportLoading ? <CircularProgress size={24} color="inherit" /> : 'Export Data to JSON'}
            </Button>
          </Paper>
        </Grid>

        {/* Import Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              <ImportIcon sx={{ verticalAlign: 'middle', mr: 1 }} /> Import Data
            </Typography>
            {importMessage.type === 'success' && importMessage.text && (
                <Alert severity="success" sx={{ mb: 2 }}>{importMessage.text}</Alert>
            )}
            {importMessage.type === 'error' && importMessage.text && (
                <Alert severity="error" sx={{ mb: 2 }}>{importMessage.text}</Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Upload a JSON file previously exported from this application. Existing data with matching dates/IDs will be updated.
            </Typography>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              id="json-upload-button"
              onChange={handleFileChange}
            />
            <label htmlFor="json-upload-button">
              <Button variant="outlined" component="span" fullWidth>
                {selectedFile ? selectedFile.name : 'Choose JSON File'}
              </Button>
            </label>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ImportIcon />}
              onClick={handleImport}
              disabled={!selectedFile || importLoading}
              fullWidth
              sx={{ mt: 2 }}
            >
              {importLoading ? <CircularProgress size={24} color="inherit" /> : 'Import Data'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DataManagementPage;
