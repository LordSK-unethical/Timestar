import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus, Minus, Plus as Add } from 'lucide-react';
import { formatTimerDisplay } from '../utils/timeUtils';

function TimePicker({ hours, minutes, seconds, setHours, setMinutes, setSeconds, disabled }) {
  const adjust = (setter, value, delta) => {
    const newVal = Math.max(0, Math.min(99, value + delta));
    setter(newVal);
  };

  if (disabled) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center">
        <button onClick={() => adjust(setHours, hours, 1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Plus size={20} /></button>
        <span className="text-5xl font-light text-[#e2e2e2] w-16 text-center">{String(hours).padStart(2, '0')}</span>
        <button onClick={() => adjust(setHours, hours, -1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Minus size={20} /></button>
        <span className="text-xs text-[#6b6b6b] mt-1">HR</span>
      </div>
      <span className="text-4xl text-[#6b6b6b] mt-[-30px]">:</span>
      <div className="flex flex-col items-center">
        <button onClick={() => adjust(setMinutes, minutes, 1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Plus size={20} /></button>
        <span className="text-5xl font-light text-[#e2e2e2] w-16 text-center">{String(minutes).padStart(2, '0')}</span>
        <button onClick={() => adjust(setMinutes, minutes, -1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Minus size={20} /></button>
        <span className="text-xs text-[#6b6b6b] mt-1">MIN</span>
      </div>
      <span className="text-4xl text-[#6b6b6b] mt-[-30px]">:</span>
      <div className="flex flex-col items-center">
        <button onClick={() => adjust(setSeconds, seconds, 1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Plus size={20} /></button>
        <span className="text-5xl font-light text-[#e2e2e2] w-16 text-center">{String(seconds).padStart(2, '0')}</span>
        <button onClick={() => adjust(setSeconds, seconds, -1)} className="p-2 text-[#8a8a8a] hover:text-[#e2e2e2]"><Minus size={20} /></button>
        <span className="text-xs text-[#6b6b6b] mt-1">SEC</span>
      </div>
    </div>
  );
}

export default function TimerPage() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isInputMode, setIsInputMode] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        setTotalSeconds(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsInputMode(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const playAlarm = useCallback(() => {
    new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR4GL5fh45t4HxAgoOjrfsgQADuW3u2VfR8QMpLm8JRsHxEvlOHzj3ofEDGS5fKReB8RMJPk8JB1HxAtkuTvkHYfEC6S5e6QcR4QLZLm7o9yHhAtkubujnEeEC2S5u2OcR4QLZLm7YxxHhAtkubtjXEdEC2S5u2McR0QLZLm7YxxHQ==').play().catch(() => {});
  }, []);

  const handleStartPause = () => {
    if (isInputMode) {
      const total = hours * 3600 + minutes * 60 + seconds;
      if (total > 0) {
        setTotalSeconds(total);
        setIsInputMode(false);
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsInputMode(true);
    setTotalSeconds(0);
  };

  const initialTotal = hours * 3600 + minutes * 60 + seconds;
  const progress = totalSeconds > 0 && initialTotal > 0 ? ((initialTotal - totalSeconds) / initialTotal) * 100 : 0;
  const circumference = 2 * Math.PI * 140;

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-28 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <svg className="w-72 h-72 transform -rotate-90">
          <circle cx="144" cy="144" r="140" stroke="#2c2c2c" strokeWidth="12" fill="none" />
          <motion.circle
            cx="144" cy="144" r="140"
            stroke="#3d5afe"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.5 }}
            strokeLinecap="round"
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          {isInputMode ? (
            <TimePicker hours={hours} minutes={minutes} seconds={seconds} setHours={setHours} setMinutes={setMinutes} setSeconds={setSeconds} disabled={!isInputMode} />
          ) : (
            <div className="text-center">
              <motion.div className="text-6xl font-light text-[#e2e2e2]" key={totalSeconds}>
                {formatTimerDisplay(totalSeconds)}
              </motion.div>
              <div className="text-sm text-[#6b6b6b] mt-2">{isRunning ? 'Running' : 'Paused'}</div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div 
        className="flex items-center gap-6 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          onClick={handleReset}
          className="w-16 h-16 rounded-full bg-[#2c2c2c] flex items-center justify-center text-[#8a8a8a] hover:text-[#e2e2e2]"
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={28} />
        </motion.button>

        <motion.button
          onClick={handleStartPause}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white ${isRunning ? 'bg-[#ff5252]' : 'bg-[#3d5afe]'}`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </motion.button>

        <motion.button
          onClick={() => { setIsInputMode(true); setIsRunning(false); setTotalSeconds(0); }}
          className="w-16 h-16 rounded-full bg-[#2c2c2c] flex items-center justify-center text-[#8a8a8a] hover:text-[#e2e2e2]"
          whileTap={{ scale: 0.95 }}
        >
          <Add size={28} />
        </motion.button>
      </motion.div>
    </div>
  );
}