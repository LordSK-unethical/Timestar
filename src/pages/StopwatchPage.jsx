import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Flag } from 'lucide-react';
import { formatTimeString } from '../utils/timeUtils';

export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      interval = setInterval(() => setTime(Date.now() - startTimeRef.current), 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStartPause = () => {
    if (isRunning) pausedTimeRef.current = time;
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    pausedTimeRef.current = 0;
  };

  const handleLap = () => setLaps([{ time, id: Date.now() }, ...laps]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-28 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <motion.div className="text-[72px] font-light tracking-tight text-[#e2e2e2]" key={Math.floor(time / 10)}>
          {formatTimeString(time, true)}
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-6 mb-12">
        <motion.button
          onClick={handleReset}
          className="w-16 h-16 rounded-full bg-[#2c2c2c] flex items-center justify-center text-[#8a8a8a] hover:text-[#e2e2e2]"
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={28} />
        </motion.button>

        <motion.button
          onClick={handleStartPause}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg ${isRunning ? 'bg-[#ff5252]' : 'bg-[#3d5afe]'}`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
        >
          {isRunning ? <Pause size={36} /> : <Play size={36} className="ml-2" />}
        </motion.button>

        <motion.button
          onClick={handleLap}
          disabled={!isRunning}
          className={`w-16 h-16 rounded-full flex items-center justify-center ${isRunning ? 'bg-[#2c2c2c] text-[#3d5afe]' : 'bg-[#2c2c2c] text-[#6b6b6b]'}`}
          whileTap={{ scale: 0.95 }}
        >
          <Flag size={28} />
        </motion.button>
      </div>

      <motion.div 
        className="w-full max-w-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-[#1e1e1e] rounded-3xl max-h-48 overflow-y-auto">
          <AnimatePresence>
            {laps.map((lap, index) => (
              <motion.div
                key={lap.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex justify-between items-center px-6 py-4 border-b border-[#2c2c2c] last:border-b-0"
              >
                <span className="text-sm text-[#8a8a8a]">Lap {laps.length - index}</span>
                <span className="text-lg font-mono text-[#e2e2e2]">{formatTimeString(lap.time, true)}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {laps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-[#6b6b6b]">
              <Flag size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Tap flag to record lap</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}