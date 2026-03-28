import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Plus, Minus, Timer, Trash2, Plus as AddIcon, BellRing, RotateCcw as Refresh } from 'lucide-react';
import { formatTimerDisplay } from '../utils/timeUtils';
import { useTheme } from '../hooks/useTheme';
import { shouldShowNotification } from '../utils/settingsUtils';
import PageHeader from '../components/PageHeader';

const TIMER_PRESETS = [
  { label: '1m', seconds: 60 },
  { label: '3m', seconds: 180 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
  { label: '30m', seconds: 1800 },
  { label: '45m', seconds: 2700 },
  { label: '1h', seconds: 3600 },
];

function createTimer(id, label = '', seconds = 0) {
  return {
    id,
    label,
    totalSeconds: seconds,
    remainingSeconds: seconds,
    isRunning: false,
    isInputMode: seconds === 0,
    isCompleted: false,
    createdAt: Date.now()
  };
}

let timerAudio = null;
let volumeInterval = null;

function playTimerSound() {
  stopTimerSound();
  
  try {
    timerAudio = new Audio('/ez_ez_dhurandar.mp3');
    timerAudio.loop = true;
    timerAudio.volume = 0.3;
    
    timerAudio.play().catch(() => {});
    
    let vol = 0.3;
    volumeInterval = setInterval(() => {
      if (vol < 0.7 && timerAudio && !timerAudio.paused) {
        vol += 0.02;
        timerAudio.volume = vol;
      }
    }, 500);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

function stopTimerSound() {
  if (timerAudio) {
    timerAudio.pause();
    timerAudio.currentTime = 0;
    timerAudio = null;
  }
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
}

function TimerCard({ timer, onStart, onPause, onReset, onDelete, onUpdateTime }) {
  const hours = Math.floor(timer.remainingSeconds / 3600);
  const minutes = Math.floor((timer.remainingSeconds % 3600) / 60);
  const seconds = timer.remainingSeconds % 60;
  
  const initialTotal = timer.totalSeconds;
  const progress = initialTotal > 0 ? ((initialTotal - timer.remainingSeconds) / initialTotal) * 100 : 0;
  const circumference = 2 * Math.PI * 70;

  const handlePreset = (seconds) => {
    onUpdateTime(timer.id, seconds);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#1e1e1e] rounded-3xl p-5 mb-4"
    >
      {timer.isInputMode && (
        <div className="flex flex-wrap gap-2 mb-4">
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset.seconds}
              onClick={() => handlePreset(preset.seconds)}
              className="px-3 py-1.5 rounded-xl bg-[#2c2c2c] text-sm text-[#8a8a8a] hover:text-[#e2e2e2] hover:bg-[#3c3c3c] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <svg className="w-36 h-36 transform -rotate-90 flex-shrink-0">
          <circle cx="72" cy="72" r="70" stroke="#2c2c2c" strokeWidth="8" fill="none" />
          <motion.circle
            cx="72" cy="72" r="70"
            stroke={timer.isCompleted ? '#22c55e' : 'var(--primary)'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.3 }}
            strokeLinecap="round"
          />
        </svg>

        <div className="flex-1">
          {timer.isInputMode ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <button onClick={() => handlePreset(timer.totalSeconds + 60)} className="p-1 text-[#6b6b6b] hover:text-[#e2e2e2]">
                  <Plus size={16} />
                </button>
                <span className="text-3xl font-light text-[#e2e2e2] w-12 text-center">
                  {String(Math.floor(timer.totalSeconds / 60)).padStart(2, '0')}
                </span>
                <button onClick={() => handlePreset(Math.max(0, timer.totalSeconds - 60))} className="p-1 text-[#6b6b6b] hover:text-[#e2e2e2]">
                  <Minus size={16} />
                </button>
              </div>
              <span className="text-2xl text-[#6b6b6b]">min</span>
            </div>
          ) : (
            <div className="text-center">
              <motion.div 
                className={`text-4xl font-light ${timer.isCompleted ? 'text-[#22c55e]' : 'text-[#e2e2e2]'}`}
                animate={timer.isCompleted ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5, repeat: timer.isCompleted ? Infinity : 0 }}
              >
                {formatTimerDisplay(timer.remainingSeconds)}
              </motion.div>
              <div className="text-sm text-[#6b6b6b] mt-1">
                {timer.isCompleted ? 'Completed!' : timer.isRunning ? 'Running' : 'Paused'}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!timer.isInputMode && !timer.isCompleted && (
            <motion.button
              onClick={() => timer.isRunning ? onPause(timer.id) : onStart(timer.id)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${timer.isRunning ? 'bg-[#ff5252]' : 'bg-[var(--primary)]'}`}
              whileTap={{ scale: 0.9 }}
            >
              {timer.isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </motion.button>
          )}
          
          {timer.isCompleted && (
            <motion.button
              onClick={() => onStart(timer.id)}
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#22c55e] text-white"
              whileTap={{ scale: 0.9 }}
              whileHover={{ backgroundColor: '#16a34a' }}
            >
              <Refresh size={20} />
            </motion.button>
          )}
          
          {timer.isInputMode && (
            <motion.button
              onClick={() => onStart(timer.id)}
              disabled={timer.totalSeconds === 0}
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${timer.totalSeconds > 0 ? 'bg-[var(--primary)]' : 'bg-[#2c2c2c] text-[#6b6b6b]'}`}
              whileTap={{ scale: 0.9 }}
            >
              <Play size={20} className="ml-0.5" />
            </motion.button>
          )}
          
          <motion.button
            onClick={() => onReset(timer.id)}
            className="w-12 h-12 rounded-xl bg-[#2c2c2c] flex items-center justify-center text-[#8a8a8a] hover:text-[#e2e2e2]"
            whileTap={{ scale: 0.9 }}
          >
            <RotateCcw size={18} />
          </motion.button>
          
          <motion.button
            onClick={() => onDelete(timer.id)}
            className="w-12 h-12 rounded-xl bg-[#2c2c2c] flex items-center justify-center text-[#8a8a8a] hover:text-[#ff5252]"
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function TimerCompletePopup({ timer, onDismiss, onRestart }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[#1e1e1e] rounded-3xl p-8 w-80 shadow-2xl text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#22c55e] to-[#4ade80] flex items-center justify-center"
        >
          <BellRing size={40} className="text-white" />
        </motion.div>

        <h2 className="text-3xl font-light text-white mb-2">Time's up!</h2>
        <p className="text-white/60 mb-6">
          {timer.label || `Timer: ${formatTimerDisplay(timer.totalSeconds)}`}
        </p>

        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onRestart}
            className="w-full py-4 rounded-2xl bg-[#22c55e] text-white font-medium flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
            whileHover={{ backgroundColor: '#16a34a' }}
          >
            <Refresh size={20} />
            Restart
          </motion.button>
          
          <motion.button
            onClick={onDismiss}
            className="w-full py-4 rounded-2xl bg-[#2c2c2c] text-white font-medium"
            whileTap={{ scale: 0.98 }}
          >
            Dismiss
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function TimerPage({ onBack }) {
  const { colorScheme } = useTheme();
  const [timers, setTimers] = useState([createTimer(1, '', 300)]);
  const [completedTimerId, setCompletedTimerId] = useState(null);
  const intervalsRef = useRef({});

  useEffect(() => {
    const handleToggle = () => {
      const runningTimer = timers.find(t => t.isRunning && !t.isCompleted);
      if (runningTimer) {
        pauseTimer(runningTimer.id);
      } else {
        const pausedTimer = timers.find(t => !t.isRunning && t.remainingSeconds > 0 && !t.isCompleted);
        if (pausedTimer) {
          startTimer(pausedTimer.id);
        }
      }
    };

    const handleReset = () => {
      const activeTimer = timers.find(t => !t.isCompleted && t.remainingSeconds > 0);
      if (activeTimer) {
        resetTimer(activeTimer.id);
      }
    };

    window.addEventListener('timerToggle', handleToggle);
    window.addEventListener('timerReset', handleReset);

    return () => {
      window.removeEventListener('timerToggle', handleToggle);
      window.removeEventListener('timerReset', handleReset);
    };
  }, [timers]);

  useEffect(() => {
    Object.values(intervalsRef.current).forEach(interval => {
      if (interval) clearInterval(interval);
    });
    intervalsRef.current = {};

    timers.forEach(timer => {
      if (timer.isRunning && timer.remainingSeconds > 0) {
        const interval = setInterval(() => {
          setTimers(prev => {
            const updated = prev.map(t => {
              if (t.id === timer.id && t.isRunning && t.remainingSeconds > 0) {
                const newRemaining = t.remainingSeconds - 1;
                if (newRemaining <= 0) {
                  if (shouldShowNotification('timer')) {
                    playTimerSound();
                  }
                  return { ...t, remainingSeconds: 0, isRunning: false, isCompleted: true };
                }
                return { ...t, remainingSeconds: newRemaining };
              }
              return t;
            });
            
            const completed = updated.find(t => t.isCompleted && t.id === timer.id);
            if (completed && !intervalsRef.current[timer.id + '_notified']) {
              intervalsRef.current[timer.id + '_notified'] = true;
              setCompletedTimerId(timer.id);
            }
            
            return updated;
          });
        }, 1000);
        intervalsRef.current[timer.id] = interval;
      }
    });

    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, [timers]);

  const completedTimer = completedTimerId ? timers.find(t => t.id === completedTimerId) : null;

  const addTimer = () => {
    setTimers([...timers, createTimer(Date.now(), '', 0)]);
  };

  const deleteTimer = (id) => {
    if (intervalsRef.current[id]) {
      clearInterval(intervalsRef.current[id]);
    }
    setTimers(timers.filter(t => t.id !== id));
  };

  const startTimer = (id) => {
    if (intervalsRef.current[id + '_notified']) {
      intervalsRef.current[id + '_notified'] = false;
      setCompletedTimerId(null);
    }
    
    setTimers(timers.map(t => {
      if (t.id === id) {
        if (t.totalSeconds === 0) return t;
        
        if (t.isCompleted) {
          return { 
            ...t, 
            isRunning: true, 
            isInputMode: false,
            remainingSeconds: t.totalSeconds,
            isCompleted: false
          };
        }
        
        return { 
          ...t, 
          isRunning: true, 
          isInputMode: false,
          remainingSeconds: t.isInputMode ? t.totalSeconds : t.remainingSeconds
        };
      }
      return t;
    }));
  };

  const pauseTimer = (id) => {
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: false } : t
    ));
  };

  const resetTimer = (id) => {
    if (intervalsRef.current[id + '_notified']) {
      intervalsRef.current[id + '_notified'] = false;
    }
    
    if (completedTimerId === id) {
      stopTimerSound();
      setCompletedTimerId(null);
    }
    
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: false, remainingSeconds: t.totalSeconds, isInputMode: true, isCompleted: false } : t
    ));
  };

  const updateTimerTime = (id, seconds) => {
    setTimers(timers.map(t => 
      t.id === id ? { ...t, totalSeconds: seconds, remainingSeconds: seconds } : t
    ));
  };

  const handleDismissComplete = () => {
    stopTimerSound();
    setCompletedTimerId(null);
  };

  const handleRestartComplete = (id) => {
    stopTimerSound();
    setCompletedTimerId(null);
    startTimer(id);
  };

  return (
    <div className="flex flex-col">
      {onBack && <PageHeader title="Timer" onBack={onBack} />}
      <div className="flex flex-col px-4 pt-4">
        <AnimatePresence>
          {completedTimer && (
            <TimerCompletePopup
              timer={completedTimer}
              onDismiss={handleDismissComplete}
              onRestart={() => handleRestartComplete(completedTimer.id)}
            />
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-normal text-[#e2e2e2] ml-2">Timer</h2>
        <motion.button
          onClick={addTimer}
          className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <AddIcon size={20} className="text-white" />
        </motion.button>
      </div>

      <AnimatePresence mode="popLayout">
        {timers.map((timer) => (
          <TimerCard
            key={timer.id}
            timer={timer}
            onStart={startTimer}
            onPause={pauseTimer}
            onReset={resetTimer}
            onDelete={deleteTimer}
            onUpdateTime={updateTimerTime}
          />
        ))}
      </AnimatePresence>

      {timers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Timer size={48} className="text-[#6b6b6b] mb-4" />
          <p className="text-[#8a8a8a]">No timers</p>
          <motion.button
            onClick={addTimer}
            className="mt-4 px-6 py-2 rounded-xl bg-[var(--primary)] text-white"
            whileTap={{ scale: 0.95 }}
          >
            Add Timer
          </motion.button>
        </div>
      )}
      </div>
    </div>
  );
}