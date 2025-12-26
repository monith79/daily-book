import { API_BASE_URL } from '../apiConfig';
import axios from 'axios';

const NOTIFICATION_CHECK_INTERVAL = 60 * 1000; // Check every minute

let notificationInterval = null;
let isSoundEnabled = localStorage.getItem('notificationSoundEnabled') === 'true';

// Audio for notification sound
const notificationSound = new Audio('/notification.mp3'); // Assuming you have a notification sound file

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return false;
  }
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

const handleSnooze = (reminder) => {
  const snoozeDuration = parseInt(localStorage.getItem('snoozeDuration'), 10) || 5;
  const now = new Date();
  const snoozedTime = new Date(now.getTime() + snoozeDuration * 60000); // Add snooze minutes

  const snoozedDate = `${snoozedTime.getFullYear()}-${(snoozedTime.getMonth() + 1).toString().padStart(2, '0')}-${snoozedTime.getDate().toString().padStart(2, '0')}`;
  const snoozedTimeString = `${snoozedTime.getHours().toString().padStart(2, '0')}:${snoozedTime.getMinutes().toString().padStart(2, '0')}`;

  const newReminderText = `Snoozed: ${reminder.text}`;

  axios.post(`${API_BASE_URL}/api/reminders/${snoozedDate}`, {
    text: newReminderText,
    time: snoozedTimeString,
  }, { withCredentials: true })
  .then(() => {
    console.log(`Reminder snoozed for ${snoozeDuration} minutes.`);
  })
  .catch(error => {
    console.error('Error snoozing reminder:', error);
  });
};

const showNotification = (title, options, reminder) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      ...options,
      renotify: true,
      requireInteraction: true,
      actions: [{ action: 'snooze', title: 'Snooze' }],
    });

    notification.onclick = () => {
      // You can define what happens when the notification body is clicked
      console.log('Notification clicked.');
    };

    notification.onaction = (event) => {
      if (event.action === 'snooze') {
        handleSnooze(reminder);
      }
    };

    if (isSoundEnabled) {
        notificationSound.play().catch(e => console.error("Error playing notification sound:", e));
    }
  }
};

const checkRemindersAndNotify = async (userId) => {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted.');
    return;
  }

  const today = new Date();
  const todayDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const currentTime = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;

  try {
    const response = await axios.get(`${API_BASE_URL}/api/reminders/${todayDate}`, { withCredentials: true });
    const reminder = response.data;

    if (reminder && reminder.text && reminder.time && reminder.time === currentTime) {
      showNotification('Reminder!', {
        body: reminder.text,
        icon: '/logo192.png',
        vibrate: [200, 100, 200],
      }, reminder);
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

export const startReminderChecker = (userId) => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }
  notificationInterval = setInterval(() => checkRemindersAndNotify(userId), NOTIFICATION_CHECK_INTERVAL);
  console.log('Reminder checker started.');
};

export const stopReminderChecker = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('Reminder checker stopped.');
  }
};

export const setSoundEnabled = (enabled) => {
    isSoundEnabled = enabled;
};


export const NotificationService = {
  requestPermission: requestNotificationPermission,
  startChecker: startReminderChecker,
  stopChecker: stopReminderChecker, // Corrected line
  setSoundEnabled: setSoundEnabled,
};