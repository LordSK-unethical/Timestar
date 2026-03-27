import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Globe, Trash2, Search } from 'lucide-react';
import { 
  CITIES, WORLD_CLOCK_KEY, 
  getTimeInTimezone, getTimeDifference, searchCities 
} from '../utils/worldClockUtils';
import PageHeader from '../components/PageHeader';

export default function ClockPage({ onBack }) {
  const [time, setTime] = useState(new Date());
  const [worldClock, setWorldClock] = useState(() => {
    const saved = localStorage.getItem(WORLD_CLOCK_KEY);
    return saved ? JSON.parse(saved) : [CITIES[0], CITIES[3]];
  });
  const [showAddCity, setShowAddCity] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(WORLD_CLOCK_KEY, JSON.stringify(worldClock));
  }, [worldClock]);

  useEffect(() => {
    setSearchResults(searchCities(searchQuery));
  }, [searchQuery]);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  const date = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const addCity = (city) => {
    if (!worldClock.find(c => c.name === city.name)) {
      setWorldClock([...worldClock, city]);
    }
    setShowAddCity(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeCity = (cityName) => {
    setWorldClock(worldClock.filter(c => c.name !== cityName));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {onBack && <PageHeader title="Clock" onBack={onBack} />}
      <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-28 overflow-auto">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
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
        className="w-full max-w-[360px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[#8a8a8a] font-medium flex items-center gap-2">
            <Globe size={16} />
            World clock
          </div>
          <motion.button
            onClick={() => setShowAddCity(true)}
            className="w-8 h-8 rounded-xl bg-[var(--primary)] flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <Plus size={18} className="text-white" />
          </motion.button>
        </div>

        <div className="bg-[#1e1e1e] rounded-3xl overflow-hidden">
          <AnimatePresence mode="popLayout">
            {worldClock.map((city, index) => {
              const { time: cityTime, date: cityDate } = getTimeInTimezone(city.timezone);
              const diff = getTimeDifference(city.timezone);
              
              return (
                <motion.div
                  key={city.name}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-center justify-between px-5 py-4 ${index !== worldClock.length - 1 ? 'border-b border-[#2c2c2c]' : ''}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-lg text-[#e2e2e2]">{city.name}</div>
                      {diff && diff !== 'Same time' && (
                        <span className="text-xs text-[#6b6b6b] bg-[#2c2c2c] px-1.5 py-0.5 rounded">{diff}</span>
                      )}
                    </div>
                    <div className="text-sm text-[#6b6b6b]">{cityDate}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xl text-[#e2e2e2]">{cityTime}</div>
                    <motion.button
                      onClick={() => removeCity(city.name)}
                      className="p-1.5 rounded-lg text-[#6b6b6b] hover:text-[#ff5252] hover:bg-[#ff5252]/10"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddCity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 z-50"
            onClick={() => setShowAddCity(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-[#1e1e1e] rounded-3xl w-[360px] shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#2c2c2c]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-[#e2e2e2]">Add city</h3>
                  <motion.button
                    onClick={() => setShowAddCity(false)}
                    className="p-1.5 rounded-lg text-[#8a8a8a] hover:text-[#e2e2e2] hover:bg-[#2c2c2c]"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b]" />
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2c2c2c] text-[#e2e2e2] placeholder-[#6b6b6b] focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {searchQuery && searchResults.length === 0 && (
                  <div className="p-4 text-center text-[#6b6b6b]">No cities found</div>
                )}
                {searchResults.map((city) => {
                  const isAdded = worldClock.find(c => c.name === city.name);
                  return (
                    <motion.button
                      key={city.name}
                      onClick={() => !isAdded && addCity(city)}
                      disabled={isAdded}
                      className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[#252525] ${isAdded ? 'opacity-50' : ''}`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div>
                        <div className="text-[#e2e2e2]">{city.name}</div>
                        <div className="text-sm text-[#6b6b6b]">{city.country}</div>
                      </div>
                      {isAdded && (
                        <span className="text-[var(--primary)] text-sm">Added</span>
                      )}
                    </motion.button>
                  );
                })}
                {!searchQuery && (
                  <div className="p-4">
                    <div className="text-xs text-[#6b6b6b] mb-2">POPULAR CITIES</div>
                    {CITIES.slice(0, 6).map((city) => {
                      const isAdded = worldClock.find(c => c.name === city.name);
                      return (
                        <motion.button
                          key={city.name}
                          onClick={() => !isAdded && addCity(city)}
                          disabled={isAdded}
                          className={`w-full px-2 py-2 flex items-center justify-between hover:bg-[#252525] rounded-lg ${isAdded ? 'opacity-50' : ''}`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-[#e2e2e2]">{city.name}</span>
                          {isAdded && <span className="text-[var(--primary)] text-xs">Added</span>}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}