import { 
  Clock as ClockIcon, 
  AlarmClock as AlarmIcon, 
  MoreHorizontal as MoreIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const navItems = [
  { id: 'clock', icon: ClockIcon, label: 'Clock' },
  { id: 'alarm', icon: AlarmIcon, label: 'Alarms' },
  { id: 'more', icon: MoreIcon, label: 'More' },
];

export default function BottomNav({ activeTab, setActiveTab }) {
  const { colorScheme } = useTheme();
  const primaryColor = colorScheme.primary;

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
              className="flex flex-col items-center gap-1 py-2 px-6 rounded-2xl relative"
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div
                layoutId="activeNavBackground"
                className="absolute inset-0 rounded-2xl"
                initial={false}
                animate={{
                  opacity: isActive ? 0.15 : 0,
                  scale: isActive ? 1 : 0.9
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{ backgroundColor: primaryColor }}
              />
              <Icon 
                size={26} 
                className="relative z-10 transition-colors duration-200"
                style={{ 
                  color: isActive ? primaryColor : '#8a8a8a',
                  fill: isActive ? 'rgba(255,255,255,0.1)' : 'none'
                }}
              />
              <motion.span 
                className="text-xs relative z-10 font-medium transition-colors duration-200"
                style={{ color: isActive ? primaryColor : '#8a8a8a' }}
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
