import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ClockPage from './pages/ClockPage';
import AlarmPage from './pages/AlarmPage';
import TimerPage from './pages/TimerPage';
import StopwatchPage from './pages/StopwatchPage';
import PomodoroPage from './pages/PomodoroPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './hooks/useTheme';
import { initShortcuts, setCallbacks } from './managers/shortcutManager';
import { initWidgetManager } from './managers/widgetWindow';
import { playAudio, stopAudio } from './managers/audioManager';
import { getState as getPomodoroState } from './managers/pomodoroManager';

const pages = {
  clock: ClockPage,
  alarm: AlarmPage,
  timer: TimerPage,
  stopwatch: StopwatchPage,
  pomodoro: PomodoroPage,
  calendar: CalendarPage,
  settings: SettingsPage,
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('clock');
  const ActivePage = pages[activeTab];

  useEffect(() => {
    const handleToggleTimer = () => {
      const timerState = localStorage.getItem('timerState');
      if (timerState) {
        window.dispatchEvent(new CustomEvent('timerToggle'));
      }
    };

    const handleReset = () => {
      window.dispatchEvent(new CustomEvent('timerReset'));
      window.dispatchEvent(new CustomEvent('stopwatchReset'));
    };

    const handleSnooze = () => {
      window.dispatchEvent(new CustomEvent('alarmSnooze'));
    };

    const handleDismiss = () => {
      window.dispatchEvent(new CustomEvent('alarmDismiss'));
    };

    const handleNavigate = (page) => {
      setActiveTab(page.replace('navigate', '').toLowerCase());
    };

    const handleToggleWidget = async () => {
      const { toggleWidgetMode } = await import('./managers/widgetWindow');
      await toggleWidgetMode();
    };

    initShortcuts({
      toggleTimer: handleToggleTimer,
      reset: handleReset,
      snooze: handleSnooze,
      dismiss: handleDismiss,
      toggleWidget: handleToggleWidget,
      navigateClock: () => handleNavigate('navigateClock'),
      navigateAlarm: () => handleNavigate('navigateAlarm'),
      navigateTimer: () => handleNavigate('navigateTimer'),
      navigateStopwatch: () => handleNavigate('navigateStopwatch'),
      navigatePomodoro: () => handleNavigate('navigatePomodoro'),
    });

    initWidgetManager();

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && activeTab !== 'pomodoro' && activeTab !== 'settings' && activeTab !== 'calendar') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('timerToggle'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab]);

  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ 
              duration: 0.25, 
              ease: [0.25, 0.1, 0.25, 1],
              opacity: { duration: 0.15 }
            }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <ActivePage />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
