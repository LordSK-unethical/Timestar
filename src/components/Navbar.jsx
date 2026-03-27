import { Clock, Timer, Timer as Stopwatch, AlarmClock as Alarm, Sun, Moon, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { id: 'clock', icon: Clock, label: 'Clock' },
  { id: 'stopwatch', icon: Stopwatch, label: 'Stopwatch' },
  { id: 'timer', icon: Timer, label: 'Timer' },
  { id: 'alarm', icon: Alarm, label: 'Alarm' },
];

export default function Navbar({ activeTab, setActiveTab }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-900/50 backdrop-blur-md border-b border-gray-700/50">
      <div className="flex items-center gap-2">
        <motion.div 
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Clock size={22} className="text-white" />
        </motion.div>
        <span className="text-xl font-semibold text-white tracking-tight">TimeStar</span>
      </div>

      <nav className="flex items-center gap-1 bg-gray-800/50 rounded-2xl p-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors ${
                isActive 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10 text-sm font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <motion.button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-gray-800/50 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </div>
    </header>
  );
}