import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ClockPage from './pages/ClockPage';
import AlarmPage from './pages/AlarmPage';
import TimerPage from './pages/TimerPage';
import StopwatchPage from './pages/StopwatchPage';

const pages = {
  clock: ClockPage,
  alarm: AlarmPage,
  timer: TimerPage,
  stopwatch: StopwatchPage,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('clock');
  const ActivePage = pages[activeTab];

  return (
    <div className="h-screen flex flex-col bg-[#121212] overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
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