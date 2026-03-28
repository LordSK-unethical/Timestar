import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CalendarDays, Timer, Timer as StopwatchIcon, Settings, ChevronRight } from 'lucide-react';
import PomodoroPage from '../pages/PomodoroPage';
import CalendarPage from '../pages/CalendarPage';
import TimerPage from '../pages/TimerPage';
import StopwatchPage from '../pages/StopwatchPage';
import SettingsPage from '../pages/SettingsPage';
import PageHeader from '../components/PageHeader';

const menuItems = [
  { id: 'pomodoro', label: 'Pomodoro', icon: Brain, description: 'Focus timer with work/break sessions' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, description: 'Events and schedule' },
  { id: 'timer', label: 'Timer', icon: Timer, description: 'Countdown timer with presets' },
  { id: 'stopwatch', label: 'Stopwatch', icon: StopwatchIcon, description: 'Track time with lap support' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Customize app appearance' },
];

export default function MoreSection() {
  const [activePage, setActivePage] = useState(null);
  const primaryColor = 'var(--primary)';

  const renderPage = () => {
    switch (activePage) {
      case 'pomodoro':
        return <PomodoroPage onBack={() => setActivePage(null)} />;
      case 'calendar':
        return <CalendarPage onBack={() => setActivePage(null)} />;
      case 'timer':
        return <TimerPage onBack={() => setActivePage(null)} />;
      case 'stopwatch':
        return <StopwatchPage onBack={() => setActivePage(null)} />;
      case 'settings':
        return <SettingsPage onBack={() => setActivePage(null)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <AnimatePresence mode="wait">
        {activePage ? (
          <motion.div
            key={activePage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {renderPage()}
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <PageHeader title="More" />
            
            <div className="p-4 space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className="w-full bg-[#1e1e1e] rounded-2xl p-4 flex items-center gap-4 hover:bg-[#252525] transition-colors"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Icon size={24} style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <ChevronRight size={20} className="text-gray-600" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
