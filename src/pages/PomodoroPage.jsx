import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Settings, Coffee, Brain } from 'lucide-react';
import {
  initPomodoro,
  start,
  pause,
  reset,
  skipSession,
  setSessionType,
  formatTime,
  getProgress,
  getState,
} from '../managers/pomodoroManager';
import { playAudio, stopAudio, DEFAULT_RINGTONES } from '../managers/audioManager';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';

export default function PomodoroPage() {
  const [state, setState] = useState({
    timeRemaining: 25 * 60,
    isRunning: false,
    isPaused: false,
    currentSession: 'work',
    completedSessions: 0,
    totalSessionsToday: 0,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    soundEnabled: true,
  });

  useEffect(() => {
    const init = initPomodoro({
      onTick: (newState) => {
        setState({ ...newState });
      },
      onSessionChange: (newState) => {
        setState({ ...newState });
        if (settings.soundEnabled) {
          playAudio(DEFAULT_RINGTONES[0].path, false);
        }
        handleNotification(newState);
      },
    });
    setState(init);
  }, [settings.soundEnabled]);

  const handleNotification = async (pomodoroState) => {
    let permitted = await isPermissionGranted();
    if (!permitted) {
      const permission = await requestPermission();
      permitted = permission === 'granted';
    }
    if (permitted) {
      const message = pomodoroState.currentSession === 'work'
        ? 'Work session complete! Time for a break.'
        : 'Break is over! Ready to work?';
      sendNotification({ title: 'TimeStar', body: message });
    }
  };

  const handleStartPause = useCallback(() => {
    if (state.isRunning) {
      pause();
    } else {
      start();
    }
  }, [state.isRunning]);

  const handleReset = useCallback(() => {
    reset();
  }, []);

  const handleSkip = useCallback(() => {
    skipSession();
  }, []);

  const handleSessionChange = (type) => {
    setSessionType(type);
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const progress = getProgress();
  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;

  const sessionColors = {
    work: { primary: 'var(--primary)', label: 'Work Session' },
    shortBreak: { primary: '#4ade80', label: 'Short Break' },
    longBreak: { primary: '#f472b6', label: 'Long Break' },
  };

  const currentSessionColor = sessionColors[state.currentSession];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Pomodoro</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full hover:bg-[#2c2c2c] transition-colors"
        >
          <Settings size={24} className="text-gray-400" />
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['work', 'shortBreak', 'longBreak'].map((session) => (
          <button
            key={session}
            onClick={() => handleSessionChange(session)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              state.currentSession === session
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[#2c2c2c] text-gray-400 hover:bg-[#3c3c3c]'
            }`}
          >
            {session === 'work' ? <Brain size={16} className="inline mr-1" /> : <Coffee size={16} className="inline mr-1" />}
            {session === 'work' ? 'Work' : session === 'shortBreak' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke="#2c2c2c"
              strokeWidth="8"
            />
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              fill="none"
              stroke={currentSessionColor.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-5xl font-bold text-white"
              key={state.timeRemaining}
              initial={{ scale: 1.1, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {formatTime(state.timeRemaining)}
            </motion.span>
            <span className="text-gray-400 mt-2">{currentSessionColor.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="p-4 rounded-full bg-[#2c2c2c] text-gray-400 hover:bg-[#3c3c3c] transition-colors"
          >
            <RotateCcw size={24} />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartPause}
            className="p-6 rounded-full text-white transition-colors"
            style={{ backgroundColor: currentSessionColor.primary }}
          >
            {state.isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSkip}
            className="p-4 rounded-full bg-[#2c2c2c] text-gray-400 hover:bg-[#3c3c3c] transition-colors"
          >
            <SkipForward size={24} />
          </motion.button>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl p-4">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{state.completedSessions}</span>
            <p className="text-xs text-gray-400">Sessions</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{state.totalSessionsToday}</span>
            <p className="text-xs text-gray-400">Today</p>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-white">{state.completedSessions * 25}</span>
            <p className="text-xs text-gray-400">Minutes</p>
          </div>
        </div>
      </div>

      {showSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="absolute inset-0 bg-[#121212] z-50 p-4"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <button onClick={() => setShowSettings(false)} className="text-gray-400">
              <RotateCcw size={20} className="rotate-180" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="bg-[#1e1e1e] rounded-xl p-4">
              <label className="text-gray-400 text-sm">Work Duration (minutes)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) => handleSettingsChange({ ...settings, workDuration: parseInt(e.target.value) || 25 })}
                className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                min="1"
                max="60"
              />
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl p-4">
              <label className="text-gray-400 text-sm">Short Break (minutes)</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => handleSettingsChange({ ...settings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                min="1"
                max="30"
              />
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl p-4">
              <label className="text-gray-400 text-sm">Long Break (minutes)</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => handleSettingsChange({ ...settings, longBreakDuration: parseInt(e.target.value) || 15 })}
                className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                min="1"
                max="60"
              />
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl p-4">
              <label className="text-gray-400 text-sm">Sessions before long break</label>
              <input
                type="number"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) => handleSettingsChange({ ...settings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                min="1"
                max="10"
              />
            </div>
            
            <div className="bg-[#1e1e1e] rounded-xl p-4 flex items-center justify-between">
              <span className="text-white">Sound Notifications</span>
              <button
                onClick={() => handleSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-[var(--primary)]' : 'bg-[#3c3c3c]'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
