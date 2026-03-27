const NOTIFICATION_KEYS = {
  alarm: 'alarmNotifications',
  timer: 'timerNotifications', 
  pomodoro: 'pomodoroNotifications'
};

export function getNotificationSettings() {
  return {
    alarm: localStorage.getItem(NOTIFICATION_KEYS.alarm) !== 'false',
    timer: localStorage.getItem(NOTIFICATION_KEYS.timer) !== 'false',
    pomodoro: localStorage.getItem(NOTIFICATION_KEYS.pomodoro) !== 'false',
  };
}

export function shouldShowNotification(type) {
  const settings = getNotificationSettings();
  return settings[type] !== false;
}

export function addNotificationSettingsListener(callback) {
  const handler = (event) => {
    callback(event.detail);
  };
  window.addEventListener('notificationSettings', handler);
  return () => window.removeEventListener('notificationSettings', handler);
}
