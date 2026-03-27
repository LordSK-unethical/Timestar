import { writeFile, readFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const POMODORO_STATS_FILE = 'pomodoro_stats.json';

const DEFAULT_SETTINGS = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
};

let pomodoroState = {
  timeRemaining: DEFAULT_SETTINGS.workDuration,
  isRunning: false,
  isPaused: false,
  currentSession: 'work',
  completedSessions: 0,
  totalSessionsToday: 0,
  settings: { ...DEFAULT_SETTINGS },
};

let intervalId = null;
let onTick = null;
let onSessionChange = null;

async function loadStats() {
  try {
    const fileExists = await exists(POMODORO_STATS_FILE, { baseDir: BaseDirectory.AppData });
    if (fileExists) {
      const data = await readFile(POMODORO_STATS_FILE, { baseDir: BaseDirectory.AppData });
      const stats = JSON.parse(new TextDecoder().decode(data));
      
      const today = new Date().toDateString();
      if (stats.date !== today) {
        pomodoroState.totalSessionsToday = 0;
      } else {
        pomodoroState.totalSessionsToday = stats.totalSessionsToday || 0;
      }
      pomodoroState.completedSessions = stats.completedSessions || 0;
    }
  } catch (e) {
    console.error('Error loading pomodoro stats:', e);
  }
}

async function saveStats() {
  try {
    const stats = {
      date: new Date().toDateString(),
      completedSessions: pomodoroState.completedSessions,
      totalSessionsToday: pomodoroState.totalSessionsToday,
    };
    await writeFile(
      POMODORO_STATS_FILE,
      new TextEncoder().encode(JSON.stringify(stats, null, 2)),
      { baseDir: BaseDirectory.AppData }
    );
  } catch (e) {
    console.error('Error saving pomodoro stats:', e);
  }
}

function tick() {
  if (pomodoroState.timeRemaining > 0) {
    pomodoroState.timeRemaining--;
    if (onTick) onTick({ ...pomodoroState });
  } else {
    handleSessionComplete();
  }
}

function handleSessionComplete() {
  stop();
  
  if (pomodoroState.currentSession === 'work') {
    pomodoroState.completedSessions++;
    pomodoroState.totalSessionsToday++;
    saveStats();
    
    const isLongBreak = pomodoroState.completedSessions % pomodoroState.settings.sessionsBeforeLongBreak === 0;
    pomodoroState.currentSession = isLongBreak ? 'longBreak' : 'shortBreak';
    pomodoroState.timeRemaining = isLongBreak 
      ? pomodoroState.settings.longBreakDuration 
      : pomodoroState.settings.shortBreakDuration;
  } else {
    pomodoroState.currentSession = 'work';
    pomodoroState.timeRemaining = pomodoroState.settings.workDuration;
  }
  
  if (onSessionChange) {
    onSessionChange({ ...pomodoroState });
  }
  
  if (pomodoroState.settings.autoStartBreaks && pomodoroState.currentSession !== 'work') {
    start();
  } else if (pomodoroState.settings.autoStartWork && pomodoroState.currentSession === 'work') {
    start();
  }
}

export function initPomodoro(callbacks = {}) {
  onTick = callbacks.onTick;
  onSessionChange = callbacks.onSessionChange;
  loadStats();
  return { ...pomodoroState };
}

export function start() {
  if (intervalId) return;
  pomodoroState.isRunning = true;
  pomodoroState.isPaused = false;
  intervalId = setInterval(tick, 1000);
  if (onTick) onTick({ ...pomodoroState });
}

export function pause() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = true;
  if (onTick) onTick({ ...pomodoroState });
}

export function stop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  pomodoroState.isRunning = false;
  pomodoroState.isPaused = false;
  if (onTick) onTick({ ...pomodoroState });
}

export function reset() {
  stop();
  pomodoroState.timeRemaining = pomodoroState.currentSession === 'work' 
    ? pomodoroState.settings.workDuration 
    : pomodoroState.currentSession === 'longBreak'
      ? pomodoroState.settings.longBreakDuration
      : pomodoroState.settings.shortBreakDuration;
  if (onTick) onTick({ ...pomodoroState });
}

export function skipSession() {
  handleSessionComplete();
}

export function setSessionType(type) {
  stop();
  pomodoroState.currentSession = type;
  pomodoroState.timeRemaining = type === 'work' 
    ? pomodoroState.settings.workDuration 
    : type === 'longBreak'
      ? pomodoroState.settings.longBreakDuration
      : pomodoroState.settings.shortBreakDuration;
  if (onTick) onTick({ ...pomodoroState });
}

export function updateSettings(newSettings) {
  pomodoroState.settings = { ...pomodoroState.settings, ...newSettings };
  if (!pomodoroState.isRunning) {
    pomodoroState.timeRemaining = pomodoroState.currentSession === 'work' 
      ? pomodoroState.settings.workDuration 
      : pomodoroState.currentSession === 'longBreak'
        ? pomodoroState.settings.longBreakDuration
        : pomodoroState.settings.shortBreakDuration;
    if (onTick) onTick({ ...pomodoroState });
  }
}

export function getState() {
  return { ...pomodoroState };
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getProgress() {
  let totalDuration;
  if (pomodoroState.currentSession === 'work') {
    totalDuration = pomodoroState.settings.workDuration;
  } else if (pomodoroState.currentSession === 'longBreak') {
    totalDuration = pomodoroState.settings.longBreakDuration;
  } else {
    totalDuration = pomodoroState.settings.shortBreakDuration;
  }
  return ((totalDuration - pomodoroState.timeRemaining) / totalDuration) * 100;
}
