import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Flag, Trophy, TrendingDown } from 'lucide-react';
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

  const handleLap = () => {
    const newLap = { 
      time, 
      id: Date.now(),
      lapNumber: laps.length + 1,
      splitTime: laps.length > 0 ? time - laps[0].time : time
    };
    setLaps([newLap, ...laps]);
  };

  const getLapStats = () => {
    if (laps.length < 2) return { fastest: null, slowest: null };
    
    const splitTimes = laps.map((lap, i) => ({
      index: i,
      split: i === 0 ? lap.time : lap.time - laps[i - 1].time
    }));
    
    const sorted = [...splitTimes].sort((a, b) => a.split - b.split);
    return {
      fastest: sorted[0].index,
      slowest: sorted[sorted.length - 1].index
    };
  };

  const stats = getLapStats();

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
        <div className="bg-[#1e1e1e] rounded-3xl max-h-56 overflow-y-auto">
          <AnimatePresence>
            {laps.map((lap, index) => {
              const isFastest = stats.fastest === index;
              const isSlowest = stats.slowest === index;
              const prevLap = laps[index + 1];
              const splitTime = prevLap ? lap.time - prevLap.time : lap.time;
              
              return (
                <motion.div
                  key={lap.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex justify-between items-center px-5 py-3.5 border-b border-[#2c2c2c] last:border-b-0 ${
                    isFastest ? 'bg-[#22c55e]/10' : isSlowest ? 'bg-[#ef4444]/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isFastest && (
                      <Trophy size={14} className="text-[#22c55e]" />
                    )}
                    {isSlowest && (
                      <TrendingDown size={14} className="text-[#ef4444]" />
                    )}
                    <span className={`text-sm ${isFastest ? 'text-[#22c55e]' : isSlowest ? 'text-[#ef4444]' : 'text-[#8a8a8a]'}`}>
                      Lap {laps.length - index}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6b6b6b]">
                      +{formatTimeString(splitTime, false)}
                    </span>
                    <span className={`text-lg font-mono ${isFastest ? 'text-[#22c55e]' : isSlowest ? 'text-[#ef4444]' : 'text-[#e2e2e2]'}`}>
                      {formatTimeString(lap.time, true)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {laps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-[#6b6b6b]">
              <Flag size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Tap flag to record lap</p>
            </div>
          )}
        </div>
        
        {laps.length >= 2 && (
          <div className="flex justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-1 text-[#22c55e]">
              <Trophy size={12} />
              Fastest: Lap {laps.length - stats.fastest}
            </div>
            <div className="flex items-center gap-1 text-[#ef4444]">
              <TrendingDown size={12} />
              Slowest: Lap {laps.length - stats.slowest}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}