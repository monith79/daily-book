import React, { useContext, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DiaryPage from './pages/DiaryPage';
import NotePage from './pages/NotePage';
import RemindPage from './pages/RemindPage';
import TodoPage from './pages/TodoPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SearchPage from './pages/SearchPage';
import TagManagementPage from './pages/TagManagementPage';
import SingleDiaryEntryPage from './pages/SingleDiaryEntryPage';
import SingleNotePage from './pages/SingleNotePage';
import SingleReminderPage from './pages/SingleReminderPage';
import SingleTodoPage from './pages/SingleTodoPage';
import DataManagementPage from './pages/DataManagementPage';
import SettingsPage from './pages/SettingsPage'; // Import SettingsPage
import NavBar from './components/NavBar';
import AuthContext from './context/AuthContext';
import { NotificationService } from './services/NotificationService';
import { Box, CircularProgress } from '@mui/material';
import { useThemeContext } from './context/ThemeContext'; // Import useThemeContext
import './App.css';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const { mode } = useThemeContext(); // Get the current theme mode

  useEffect(() => {
    if (mode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [mode]);

  useEffect(() => {
    if (isAuthenticated && user && user.id) {
      // Ensure notificationsEnabled is checked from localStorage
      const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
      if (notificationsEnabled) {
        NotificationService.startChecker(user.id);
      } else {
        NotificationService.stopChecker();
      }
    } else {
      NotificationService.stopChecker();
    }
    return () => {
      NotificationService.stopChecker();
    };
  }, [isAuthenticated, user]);

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
        <Route path="/tags" element={<PrivateRoute><TagManagementPage /></PrivateRoute>} />
        <Route path="/diary_entry/:date" element={<PrivateRoute><SingleDiaryEntryPage /></PrivateRoute>} />
        <Route path="/note_entry/:date" element={<PrivateRoute><SingleNotePage /></PrivateRoute>} />
        <Route path="/reminder_entry/:date" element={<PrivateRoute><SingleReminderPage /></PrivateRoute>} />
        <Route path="/todo_entry/:date" element={<PrivateRoute><SingleTodoPage /></PrivateRoute>} />
        <Route path="/data_management" element={<PrivateRoute><DataManagementPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} /> {/* Add SettingsPage route */}
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/diary" element={<PrivateRoute><DiaryPage /></PrivateRoute>} />
        <Route path="/note" element={<PrivateRoute><NotePage /></PrivateRoute>} />
        <Route path="/remind" element={<PrivateRoute><RemindPage /></PrivateRoute>} />
        <Route path="/todo" element={<PrivateRoute><TodoPage /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
