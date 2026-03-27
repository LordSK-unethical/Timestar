import { Clock as ClockIcon, AlarmClock as AlarmIcon, Timer as TimerIcon, Timer as StopwatchIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'clock', icon: ClockIcon, label: 'Clock' },
  { id: 'alarm', icon: AlarmIcon, label: 'Alarm' },
  { id: 'timer', icon: TimerIcon, label: 'Timer' },
  { id: 'stopwatch', icon: StopwatchIcon, label: 'Stopwatch' },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-[#2c2c2c] px-4 py-3 pb-5 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative"
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                layoutId="activeNavBackground"
                className="absolute inset-0 bg-[#3d5afe] rounded-2xl"
                initial={false}
                animate={{
                  opacity: isActive ? 0.15 : 0,
                  scale: isActive ? 1 : 0.9
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              <motion.div
                initial={false}
                animate={{
                  y: isActive ? 0 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon 
                  size={26} 
                  className="relative z-10 transition-colors duration-200"
                  style={{ 
                    color: isActive ? '#3d5afe' : '#8a8a8a',
                    fill: isActive ? 'rgba(61, 90, 254, 0.15)' : 'none'
                  }}
                />
              </motion.div>
              <motion.span 
                className="text-xs relative z-10 font-medium transition-colors duration-200"
                style={{ color: isActive ? '#3d5afe' : '#8a8a8a' }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}