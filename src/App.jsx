import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';
import ClockSection from './sections/ClockSection';
import AlarmSection from './sections/AlarmSection';
import MoreSection from './sections/MoreSection';
import { ThemeProvider } from './hooks/useTheme';

const sections = {
  clock: ClockSection,
  alarm: AlarmSection,
  more: MoreSection,
};

function AppContent() {
  const [activeTab, setActiveTab] = useState('clock');
  const ActiveSection = sections[activeTab];

  return (
    <div className="flex flex-col h-screen bg-[#121212]">
      <main className="flex-1 overflow-y-auto pb-20">
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
            className="flex flex-col min-h-full"
          >
            <ActiveSection />
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
