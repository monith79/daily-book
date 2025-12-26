import { API_BASE_URL } from '../apiConfig';
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Lunar } from 'lunar-javascript'; // Import lunar-javascript
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Box,
  Badge,
  CircularProgress,
  Popover,
  List, ListItem, ListItemText,
  Divider, // Import Divider
  Tooltip,
  TextField,
} from '@mui/material';

import {
  Book as BookIcon,
  Note as NoteIcon,
  PlaylistAddCheck as TodoIcon,
  Notifications as RemindIcon,
}
 from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

// Debounce utility function
const debounce = (func, delay) => {
  let timeout;
  const debounced = function executed(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
};

// Helper function to get detailed Chinese Lunisolar date
const getChineseLunisolarDetails = (gregorianDate) => {
  const l = Lunar.fromDate(gregorianDate);

  // Add a safety check here
  if (!l || typeof l.getMonthInChinese !== 'function' || typeof l.getDayInChinese !== 'function' || typeof l.getYearInChinese !== 'function' || typeof l.getAnimal !== 'function' || typeof l.getLunarMonth !== 'function') {
    console.error("Invalid Lunar object or missing Lunar methods:", l);
    return {
      lunarDate: 'N/A',
      lunarYear: 'N/A',
      isLeapMonth: false,
      gregorianDate: gregorianDate.toDateString(),
      lunarMonthStr: 'N/A',
      lunarDayStr: 'N/A',
      lunarAnimal: 'N/A',
      lunarYearNum: 'N/A',
      lunarMonth: 'N/A',
      lunarDay: 'N/A',
      khmerLunarDayType: 'N/A', // Add new property
    };
  }

  const lunarMonth = l.getLunarMonth();
  // Ensure lunarMonth is valid before accessing its methods
  if (!lunarMonth || typeof lunarMonth.isLeap !== 'function') {
    console.error("Invalid LunarMonth object or missing isLeap method:", lunarMonth);
    return {
      lunarDate: 'N/A',
      lunarYear: 'N/A',
      isLeapMonth: false,
      gregorianDate: gregorianDate.toDateString(),
      lunarMonthStr: 'N/A',
      lunarDayStr: 'N/A',
      lunarAnimal: 'N/A',
      lunarYearNum: 'N/A',
      lunarMonth: 'N/A',
      lunarDay: 'N/A',
      khmerLunarDayType: 'N/A', // Add new property
    };
  }

  // Derive Khmer lunar terms
  let khmerLunarDayType = '';
  const lunarDay = l.getDay(); // 1-30

  if (lunarDay === 1) {
    khmerLunarDayType = 'New Moon';
  } else if (lunarDay === 15) { // Assuming full moon is on 15th for simplicity
    khmerLunarDayType = 'Full Moon';
  } else if (lunarDay < 15) {
    khmerLunarDayType = `${lunarDay} Koeut`;
  } else {
    khmerLunarDayType = `${lunarDay - 15} Roch`;
  }

  return {
    lunarDate: `农历: ${l.getMonthInChinese()}月${l.getDayInChinese()}日`, // Chinese Lunar Date
    lunarYear: `${l.getYearInChinese()} (${l.getAnimal()}) 年`, // Chinese Lunar Year and Animal
    isLeapMonth: lunarMonth.isLeap(),
    gregorianDate: gregorianDate.toDateString(),
    // Additional details that might be useful
    lunarMonthStr: l.getMonthInChinese(),
    lunarDayStr: l.getDayInChinese(),
    lunarAnimal: l.getAnimal(),
    lunarYearNum: l.getLunarYear(),
    lunarMonth: l.getMonth(),
    lunarDay: l.getDay(),
    khmerLunarDayType: khmerLunarDayType, // Add the new Khmer lunar type
  };
};

function HomePage() {
  const [calendarType, setCalendarType] = useState('solar');
  const [date, setDate] = useState(new Date()); // Represents the currently viewed month/day in the calendar
  const [remindersForMonth, setRemindersForMonth] = useState([]);
  const [todosForMonth, setTodosForMonth] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  // State for Popover
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState({ reminders: [], todos: [] });
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [loadingDayEvents, setLoadingDayEvents] = useState(false);
  // State for the diary text input
  const [diaryText, setDiaryText] = useState('');


  const formatDateForApi = (d) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!isAuthenticated || calendarType !== 'solar') {
      setRemindersForMonth([]);
      setTodosForMonth([]);
      return;
    }

    const fetchEventsForMonth = async () => {
      setLoadingEvents(true);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth is 0-indexed

      try {
        const [remindersRes, todosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/reminders/month/${year}/${month}`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/todos/month/${year}/${month}`, { withCredentials: true }),
        ]);
        setRemindersForMonth(remindersRes.data);
        setTodosForMonth(todosRes.data);
      } catch (error) {
        console.error('Error fetching monthly events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEventsForMonth();
  }, [date, isAuthenticated, calendarType]);

  const handleCalendarTypeChange = (event, newCalendarType) => {
    if (newCalendarType !== null) {
      setCalendarType(newCalendarType);
    }
  };

  const handleCalendarChange = (newDate) => {
    setDate(newDate);
  };

  // API call to save diary entry
  const saveDiaryEntry = async (date, text) => {
    if (!date) return;
    try {
      // The backend expects 'text' as form data, not JSON
      const formData = new FormData();
      formData.append('text', text);
      // If we supported images, we'd append them here too

      const response = await axios.post(
        `${API_BASE_URL}/api/entries/${formatDateForApi(date)}`,
        formData,
        { withCredentials: true }
      );
      console.log('Diary saved successfully:', response.data);
      // Optionally, update selectedDayEvents with the newly saved data
      // This might be important if the backend returns updated tags or imageUrl
      setSelectedDayEvents(prevEvents => ({
        ...prevEvents,
        diaryEntry: response.data,
      }));
    } catch (error) {
      console.error('Error saving diary:', error);
    }
  };

  // Effect for auto-saving diary entries
  useEffect(() => {
    // Only auto-save if a date is selected and the user is authenticated
    if (selectedDayDate && isAuthenticated) {
      // Create a debounced version of saveDiaryEntry that takes selectedDayDate and diaryText
      const debouncedSave = debounce(saveDiaryEntry, 1000);
      debouncedSave(selectedDayDate, diaryText);

      // Cleanup function to cancel the last debounced call if the component unmounts
      // or dependencies change before the delay finishes
      return () => {
        debouncedSave.cancel();
      };
    }
  }, [diaryText, selectedDayDate, isAuthenticated]); // Dependencies

  const handleDayClick = async (value, event) => {
    if (!isAuthenticated) return;

    setLoadingDayEvents(true);
    setPopoverAnchorEl(event.currentTarget);
    setSelectedDayDate(value);

    const dayKey = formatDateForApi(value);
    try {
      const [remindersRes, todosRes, notesRes, diaryRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reminders/${dayKey}`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/todos/${dayKey}`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/api/notes/${dayKey}`, { withCredentials: true }), // Fetch notes
        axios.get(`${API_BASE_URL}/api/entries/${dayKey}`, { withCredentials: true }), // Fetch diary entry
      ]);
      const newSelectedDayEvents = {
        reminders: remindersRes.data.text ? [{ text: remindersRes.data.text, time: remindersRes.data.time }] : [],
        todos: todosRes.data || [],
        note: notesRes.data.text ? notesRes.data : null, // Store note
        diaryEntry: diaryRes.data.text || diaryRes.data.imageUrl ? diaryRes.data : null, // Store diary entry
      };
      setSelectedDayEvents(newSelectedDayEvents);
      // Initialize diaryText with existing entry or empty string
      setDiaryText(newSelectedDayEvents.diaryEntry && newSelectedDayEvents.diaryEntry.text ? newSelectedDayEvents.diaryEntry.text : ''); // NEW LINE
    } catch (error) {
      console.error('Error fetching day events:', error);
      setSelectedDayEvents({ reminders: [], todos: [], note: null, diaryEntry: null }); // Reset all
      setDiaryText(''); // NEW LINE: Clear diaryText on error
    } finally {
      setLoadingDayEvents(false);
    }
  };

  const handlePopoverClose = () => {
    setPopoverAnchorEl(null);
    setSelectedDayEvents({ reminders: [], todos: [], note: null, diaryEntry: null }); // Reset all
    setSelectedDayDate(null);
  };

  const popoverOpen = Boolean(popoverAnchorEl);
  const popoverId = popoverOpen ? 'simple-popover' : undefined;

  const tileContent = ({ date: tileDate, view }) => {
    if (view === 'month' && isAuthenticated) {
      const dayKey = formatDateForApi(tileDate);
      const hasReminder = remindersForMonth.some(r => r.date === dayKey);
      const hasTodo = todosForMonth.some(t => t.date === dayKey);

      let indicatorCount = 0;
      if (hasReminder) indicatorCount++;
      if (hasTodo) indicatorCount++;

      let badgeColor = 'primary';
      if (hasReminder && hasTodo) {
        badgeColor = 'error';
      } else if (hasReminder) {
        badgeColor = 'warning';
      } else if (hasTodo) {
        badgeColor = 'success';
      }

      let lunisolarDetailsForTile = null;
      if (calendarType === 'lunisolar') {
        lunisolarDetailsForTile = getChineseLunisolarDetails(tileDate);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tileDateNormalized = new Date(tileDate);
      tileDateNormalized.setHours(0, 0, 0, 0);

      let backgroundColor = 'transparent';
      let borderColor = 'transparent';
      let borderWidth = '1px';
      let borderStyle = 'solid';

      if (tileDateNormalized.getTime() < today.getTime()) {
        backgroundColor = '#f0f0f0';
      } else if (tileDateNormalized.getTime() === today.getTime()) {
        backgroundColor = '#e3f2fd';
      } else {
        backgroundColor = '#fffde7';
      }

      if (hasTodo && hasReminder) {
        borderColor = 'purple';
      } else if (hasTodo) {
        borderColor = 'green';
      } else if (hasReminder) {
        borderColor = 'orange';
      }

      // Add day-of-the-week specific styling
      const dayOfWeek = tileDate.getDay();
      let dayOfWeekBackgroundColor = 'transparent';
      let dayOfWeekColor = 'inherit'; // Default text color

      if (dayOfWeek === 0) { // Sunday
        dayOfWeekBackgroundColor = 'rgba(255, 0, 0, 0.1)'; // Light red background
        dayOfWeekColor = 'red';
      } else if (dayOfWeek === 6) { // Saturday
        dayOfWeekBackgroundColor = 'rgba(173, 216, 230, 0.2)'; // Light blue background
        dayOfWeekColor = '#4169E1'; // Royal blue for text
      }
      
      let tooltipTitle = `${tileDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
      if (calendarType === 'lunisolar' && lunisolarDetailsForTile) {
        tooltipTitle += `\nLunar: ${lunisolarDetailsForTile.lunarMonthStr} ${lunisolarDetailsForTile.lunarDayStr}`;
        if (lunisolarDetailsForTile.khmerLunarDayType !== 'N/A') {
          tooltipTitle += `\nDay: ${lunisolarDetailsForTile.khmerLunarDayType}`;
        }
        tooltipTitle += `\nYear: ${lunisolarDetailsForTile.lunarYear}`;
      }
      
      return (
        <Tooltip title={tooltipTitle} arrow placement="top">
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            height: '100%',
            width: '100%',
            fontSize: '0.65em',
            textAlign: 'right',
            position: 'relative',
            p: 0.5,
            boxSizing: 'border-box',
            backgroundColor: dayOfWeekBackgroundColor !== 'transparent' ? dayOfWeekBackgroundColor : backgroundColor, // Apply day of week background first
            borderColor: borderColor,
            borderWidth: borderWidth,
            borderStyle: borderStyle,
            color: dayOfWeekColor, // Apply day of week text color
          }}>
            <Box sx={{ fontWeight: 'bold', fontSize: '1.1em', color: 'primary.main', mb: '2px' }}>
              {tileDate.getDate()}
            </Box>
            <Divider sx={{ width: '80%', my: 0.2 }} />
            {calendarType === 'lunisolar' && lunisolarDetailsForTile && lunisolarDetailsForTile.lunarDayStr !== 'N/A' && (
              <Box sx={{ color: 'text.secondary', lineHeight: 1.2, fontSize: '0.9em' }}>
                {lunisolarDetailsForTile.lunarDayStr}
              </Box>
            )}
            {calendarType === 'lunisolar' && lunisolarDetailsForTile && (tileDate.getDate() === 1 || (lunisolarDetailsForTile.lunarDayStr === '初一' && lunisolarDetailsForTile.lunarMonthStr !== 'N/A')) && (
                <Box sx={{ color: 'success.main', fontSize: '0.8em', lineHeight: 1.2 }}>
                    {lunisolarDetailsForTile.lunarMonthStr}
                </Box>
            )}
            {calendarType === 'lunisolar' && lunisolarDetailsForTile && (lunisolarDetailsForTile.lunarDayStr !== 'N/A' || (tileDate.getDate() === 1 || (lunisolarDetailsForTile.lunarDayStr === '初一' && lunisolarDetailsForTile.lunarMonthStr !== 'N/A'))) && (
            <Divider sx={{ width: '80%', my: 0.2 }} />
            )}
            {calendarType === 'lunisolar' && lunisolarDetailsForTile && lunisolarDetailsForTile.khmerLunarDayType !== 'N/A' && (
              <Box sx={{ color: 'info.main', lineHeight: 1.2, fontSize: '0.8em' }}>
                {lunisolarDetailsForTile.khmerLunarDayType}
              </Box>
            )}
            {indicatorCount > 0 && (
              <Badge
                badgeContent={''}
                color={badgeColor}
                variant="dot"
                sx={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  '& .MuiBadge-badge': {
                    height: 7,
                    minWidth: 7,
                    p: 0,
                    borderRadius: '50%',
                  }
                }}
              />
            )}
          </Box>
        </Tooltip>
      );
    }
    return null;
  };

  const features = [
    { name: 'Diary', path: '/diary', icon: <BookIcon /> },
    { name: 'Note', path: '/note', icon: <NoteIcon /> },
    { name: 'Remind', path: '/remind', icon: <RemindIcon /> },
    { name: 'Todo List', path: '/todo', icon: <TodoIcon /> },
  ];


  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" component="h1" align="center" gutterBottom>
        Welcome to your Daily Book
      </Typography>

      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <ToggleButtonGroup
          value={calendarType}
          exclusive
          onChange={handleCalendarTypeChange}
          aria-label="calendar type"
          fullWidth
          sx={{ mb: 2 }}
        >
          <ToggleButton value="solar" aria-label="solar calendar">
            Solar
          </ToggleButton>
          <ToggleButton value="lunisolar" aria-label="lunisolar calendar">
            Lunisolar
          </ToggleButton>
        </ToggleButtonGroup>

        {calendarType === 'solar' && (
          loadingEvents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Calendar
                onChange={handleCalendarChange}
                value={date}
                view="month"
                tileContent={tileContent}
                onClickDay={handleDayClick}
                onActiveStartDateChange={({ activeStartDate }) => setDate(activeStartDate)}
              />
              {selectedDayDate ? (
                <Paper elevation={2} sx={{ mt: 2, p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Details for {selectedDayDate?.toLocaleDateString()}
                  </Typography>
                  {loadingDayEvents ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 2 }}>Diary Entry:</Typography>
                      <TextField
                        fullWidth
                        multiline
                        rows={6}
                        variant="outlined"
                        placeholder="Write your diary entry here..."
                        value={diaryText}
                        onChange={(e) => setDiaryText(e.target.value)}
                        sx={{ mt: 1, mb: 2 }}
                      />
                      {selectedDayEvents.diaryEntry && selectedDayEvents.diaryEntry.imageUrl && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Image:</Typography>
                          <img src={`${API_BASE_URL}${selectedDayEvents.diaryEntry.imageUrl}`} alt="Diary Entry" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4 }} />
                        </Box>
                      )}
                      {selectedDayEvents.note && selectedDayEvents.note.text && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Note:</Typography>
                          <Typography variant="body2">{selectedDayEvents.note.text}</Typography>
                        </Box>
                      )}
                      {selectedDayEvents.reminders.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Reminders:</Typography>
                          <List dense disablePadding>
                            {selectedDayEvents.reminders.map((reminder, index) => (
                              <ListItem key={index} disableGutters>
                                <ListItemText primary={`${reminder.time ? reminder.time + ' - ' : ''}${reminder.text}`} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      {selectedDayEvents.todos.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="subtitle2">Todos:</Typography>
                          <List dense disablePadding>
                            {selectedDayEvents.todos.map((todo) => (
                              <ListItem key={todo.id} disableGutters>
                                <ListItemText primary={todo.text} sx={{ textDecoration: todo.completed ? 'line-through' : 'none' }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      {!selectedDayEvents.note && !selectedDayEvents.diaryEntry && selectedDayEvents.reminders.length === 0 && selectedDayEvents.todos.length === 0 && !diaryText && (
                        <Typography variant="body2" color="text.secondary">
                          No events or diary entry for this day.
                        </Typography>
                      )}
                    </>
                  )}
                </Paper>
              ) : null}

              {/* Keep Popover for potential future use or if other info needs to be displayed there */}
              <Popover
                id={popoverId}
                open={popoverOpen}
                anchorEl={popoverAnchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
              >
                {/* Popover content is now minimal or empty as details moved below calendar */}
                <Paper sx={{ p: 2, minWidth: 100 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Click day for details below
                  </Typography>
                </Paper>
              </Popover>
            </>
          )
        )}
        {calendarType === 'lunisolar' && (
          loadingEvents ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Calendar
              onChange={handleCalendarChange}
              value={date}
              view="month"
              tileContent={tileContent}
              onClickDay={handleDayClick}
              onActiveStartDateChange={({ activeStartDate }) => setDate(activeStartDate)}
            />
          )
        )}
      </Paper>


      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={3} key={feature.name}>
            <Card>
              <CardActionArea component={Link} to={feature.path}>
                <CardContent sx={{ textAlign: 'center' }}>
                  {feature.icon}
                  <Typography variant="h6" component="div">
                    {feature.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default HomePage;
