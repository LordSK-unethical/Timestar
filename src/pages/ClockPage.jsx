import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ClockPage() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const date = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center pb-28 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mb-2 text-sm text-[#8a8a8a] font-medium">Local time</div>
        
        <motion.div
          className="text-[72px] font-light tracking-tight text-[#e2e2e2] mb-2"
          key={seconds}
        >
          {hours}:{minutes}
          <span className="text-[36px] text-[#6b6b6b] ml-1 align-top">{seconds}</span>
        </motion.div>

        <div className="text-base text-[#8a8a8a]">
          {date}
        </div>
      </motion.div>

      <motion.div 
        className="mt-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-[#1e1e1e] rounded-3xl p-6 min-w-[320px]">
          <div className="text-sm text-[#8a8a8a] mb-4 font-medium">World clock</div>
          <div className="flex items-center justify-between py-3 border-b border-[#2c2c2c]">
            <div>
              <div className="text-lg text-[#e2e2e2]">New York</div>
              <div className="text-sm text-[#6b6b6b]">Tue, Mar 26</div>
            </div>
            <div className="text-xl text-[#e2e2e2]">11:20</div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-lg text-[#e2e2e2]">London</div>
              <div className="text-sm text-[#6b6b6b]">Tue, Mar 26</div>
            </div>
            <div className="text-xl text-[#e2e2e2]">16:20</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}