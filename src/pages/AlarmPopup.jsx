import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlarmClock, Clock } from 'lucide-react';
import { getCurrentWindow } from '@tauri-apps/api/window';

let audioInstance = null;
let snoozeTimeout = null;

export default function AlarmPopup() {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLabel(params.get('label') || 'Alarm');
    setTime(params.get('time') || '');
  }, []);

  const playAudio = useCallback(() => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance = null;
    }
    
    audioInstance = new Audio('/ez_ez_dhurandar.mp3');
    audioInstance.loop = true;
    audioInstance.volume = 0.7;
    
    const playPromise = audioInstance.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
      audioInstance = null;
    }
    
    if (snoozeTimeout) {
      clearTimeout(snoozeTimeout);
      snoozeTimeout = null;
    }
  }, []);

  useEffect(() => {
    playAudio();
    
    return () => {
      stopAudio();
    };
  }, [playAudio, stopAudio]);

  useEffect(() => {
    if (audioInstance) {
      if (isMuted || isSnoozed) {
        audioInstance.pause();
      } else {
        audioInstance.play().catch(() => {});
      }
    }
  }, [isMuted, isSnoozed]);

  const handleDismiss = async () => {
    stopAudio();
    
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (e) {
      window.close();
    }
  };

  const handleSnooze = async () => {
    stopAudio();
    setIsSnoozed(true);
    
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (e) {
      window.close();
    }

    snoozeTimeout = setTimeout(() => {
      setIsSnoozed(false);
      playAudio();
    }, 5 * 60 * 1000);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center" style={{ background: 'transparent' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-[340px] bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10"
      >
        <div className="text-center">
          {!isSnoozed && (
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                duration: 0.6, 
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#feca57] flex items-center justify-center shadow-lg"
            >
              <AlarmClock size={40} className="text-white" />
            </motion.div>
          )}

          {isSnoozed && (
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#2a2a2a] flex items-center justify-center">
              <Clock size={40} className="text-[#feca57]" />
            </div>
          )}

          <motion.h2 
            className="text-5xl font-light text-white mb-2 tracking-wide"
            key={time}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
          >
            {time || '00:00'}
          </motion.h2>
          
          <p className="text-base text-white/50 mb-6">
            {label}
          </p>

          {!isSnoozed && (
            <div className="relative w-24 h-24 mx-auto mb-6">
              {[0, 0.3, 0.6].map((delay, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-white/20"
                  animate={{ 
                    scale: [1, 1.4], 
                    opacity: [0.4, 0] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    delay: delay
                  }}
                />
              ))}
            </div>
          )}

          {isSnoozed && (
            <div className="flex items-center justify-center gap-2 text-[#feca57] mb-6 bg-[#2a2a2a] rounded-xl py-3">
              <Clock size={18} />
              <span className="text-sm font-medium">Snoozed for 5 minutes</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <motion.button
              onClick={handleDismiss}
              className="w-full py-3.5 rounded-2xl bg-[#3d5afe] text-white font-semibold text-base shadow-lg"
              whileHover={{ scale: 1.02, backgroundColor: '#4d6afe' }}
              whileTap={{ scale: 0.95 }}
            >
              Dismiss
            </motion.button>
            
            <motion.button
              onClick={handleSnooze}
              className="w-full py-3.5 rounded-2xl bg-[#2a2a2a] text-white/80 font-medium text-base border border-white/10 hover:bg-[#333333] transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
            >
              Snooze (5 min)
            </motion.button>

            {!isSnoozed && (
              <motion.button
                onClick={() => setIsMuted(!isMuted)}
                className="w-10 h-10 mx-auto rounded-full bg-[#2a2a2a] flex items-center justify-center mt-2 hover:bg-[#333333] transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? (
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}