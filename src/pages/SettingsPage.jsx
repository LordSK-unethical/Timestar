import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Palette, Upload, Bell, Play, Pause, Trash2, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { 
  getAllRingtones, 
  addRingtone, 
  deleteRingtone, 
  playRingtoneById, 
  stopRingtone,
  getActiveRingtoneId,
  setActiveRingtone,
  invalidateRingtonesCache,
  DEFAULT_RINGTONES
} from '../managers/audioManager';
import PageHeader from '../components/PageHeader';

const COLOR_SCHEMES = [
  { id: 'blue', name: 'Blue', primary: '#3d5afe', primaryLight: '#8187ff', primaryDark: '#0031cb' },
  { id: 'purple', name: 'Purple', primary: '#9c27b0', primaryLight: '#d05ce3', primaryDark: '#6a0080' },
  { id: 'green', name: 'Green', primary: '#4caf50', primaryLight: '#80e27e', primaryDark: '#087f23' },
  { id: 'orange', name: 'Orange', primary: '#ff9800', primaryLight: '#ffc947', primaryDark: '#c66900' },
];

const NOTIFICATION_KEYS = {
  alarm: 'alarmNotifications',
  timer: 'timerNotifications', 
  pomodoro: 'pomodoroNotifications'
};

function ToggleSwitch({ isOn, onToggle, disabled = false }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-14 h-8 rounded-full transition-colors relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
        isOn ? 'bg-[var(--primary)]' : 'bg-[#3c3c3c]'
      }`}
    >
      <motion.div
        className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
        animate={{ left: isOn ? '28px' : '4px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

export default function SettingsPage({ onBack }) {
  const { isDark, setIsDark, colorScheme, setColorScheme } = useTheme();
  const [savedRingtones, setSavedRingtones] = useState([]);
  const [playingRingtoneId, setPlayingRingtoneId] = useState(null);
  const [selectedRingtoneId, setSelectedRingtoneId] = useState(null);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [notifications, setNotifications] = useState(() => ({
    alarm: localStorage.getItem(NOTIFICATION_KEYS.alarm) !== 'false',
    timer: localStorage.getItem(NOTIFICATION_KEYS.timer) !== 'false',
    pomodoro: localStorage.getItem(NOTIFICATION_KEYS.pomodoro) !== 'false',
  }));

  useEffect(() => {
    loadRingtones();
    return () => {
      stopRingtone();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_KEYS.alarm, notifications.alarm);
    localStorage.setItem(NOTIFICATION_KEYS.timer, notifications.timer);
    localStorage.setItem(NOTIFICATION_KEYS.pomodoro, notifications.pomodoro);
    
    window.dispatchEvent(new CustomEvent('notificationSettings', { detail: notifications }));
  }, [notifications]);

  const loadRingtones = async () => {
    const ringtones = await getAllRingtones();
    setSavedRingtones(ringtones);
    setSelectedRingtoneId(getActiveRingtoneId());
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleColorSchemeChange = (scheme) => {
    setColorScheme(scheme);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const newRingtone = await addRingtone(file);
      await loadRingtones();
      setSelectedRingtoneId(newRingtone.id);
      setShowApplyButton(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePlayRingtone = async (ringtone) => {
    if (playingRingtoneId === ringtone.id) {
      stopRingtone();
      setPlayingRingtoneId(null);
    } else {
      stopRingtone();
      try {
        await playRingtoneById(ringtone.id, false);
        setPlayingRingtoneId(ringtone.id);
      } catch (e) {
        console.error('Playback error:', e);
      }
    }
  };

  const handleSelectRingtone = (ringtoneId) => {
    setSelectedRingtoneId(ringtoneId);
    setShowApplyButton(ringtoneId !== getActiveRingtoneId());
  };

  const handleApplyRingtone = async () => {
    if (selectedRingtoneId) {
      await setActiveRingtone(selectedRingtoneId);
      setShowApplyButton(false);
    }
  };

  const handleDeleteRingtone = async (ringtoneId) => {
    await deleteRingtone(ringtoneId);
    await loadRingtones();
    
    if (selectedRingtoneId === ringtoneId) {
      setSelectedRingtoneId('default');
      setShowApplyButton(true);
    }
  };

  const toggleNotification = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="flex flex-col">
      <PageHeader title="Settings" onBack={onBack} />
      <div className="p-4 space-y-6">
        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={20} className="text-[var(--primary)]" />
            Appearance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300">Dark Mode</span>
              </div>
              <ToggleSwitch isOn={isDark} onToggle={handleThemeToggle} />
            </div>

            <div>
              <span className="text-gray-300 block mb-3">Color Scheme</span>
              <div className="flex gap-3">
                {COLOR_SCHEMES.map((scheme) => (
                  <motion.button
                    key={scheme.id}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorSchemeChange(scheme)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      colorScheme.id === scheme.id
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]'
                        : ''
                    }`}
                    style={{ backgroundColor: scheme.primary }}
                  >
                    {colorScheme.id === scheme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 rounded-full bg-white"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <span
                    key={scheme.id}
                    className={`text-xs ${
                      colorScheme.id === scheme.id ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {scheme.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload size={20} className="text-[var(--primary)]" />
            Ringtones
          </h2>

          {error && (
            <div className="mb-3 p-2 bg-red-500/20 text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
            {savedRingtones.map((ringtone) => (
              <div
                key={ringtone.id}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedRingtoneId === ringtone.id 
                    ? 'bg-[var(--primary)]/20 border border-[var(--primary)]' 
                    : 'bg-[#2c2c2c] hover:bg-[#3c3c3c]'
                }`}
                onClick={() => handleSelectRingtone(ringtone.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedRingtoneId === ringtone.id 
                      ? 'border-[var(--primary)]' 
                      : 'border-gray-500'
                  }`}>
                    {selectedRingtoneId === ringtone.id && (
                      <div className="w-2 h-2 rounded-full bg-[var(--primary)]" />
                    )}
                  </div>
                  <span className="text-gray-300 truncate">{ringtone.name}</span>
                  {ringtone.isDefault && (
                    <span className="text-xs text-gray-500">(Default)</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayRingtone(ringtone);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#4a4a4a]"
                  >
                    {playingRingtoneId === ringtone.id ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </motion.button>
                  {ringtone.isCustom && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRingtone(ringtone.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showApplyButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApplyRingtone}
              className="w-full mb-3 py-2 rounded-lg bg-[var(--primary)] text-white font-medium flex items-center justify-center gap-2"
            >
              <Check size={18} />
              Apply Selected Ringtone
            </motion.button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/mp3,audio/x-m4a"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full py-2 rounded-lg bg-[#2c2c2c] text-gray-300 hover:bg-[#3c3c3c] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Upload size={18} />
            {isUploading ? 'Uploading...' : 'Upload Custom Ringtone'}
          </motion.button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            Supported: MP3, WAV, OGG, M4A (max 5MB)
          </p>
        </section>

        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-[var(--primary)]" />
            Notifications
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300 block">Alarm Notifications</span>
                <span className="text-sm text-gray-500">Get notified when alarms ring</span>
              </div>
              <ToggleSwitch 
                isOn={notifications.alarm} 
                onToggle={() => toggleNotification('alarm')} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300 block">Timer Completion</span>
                <span className="text-sm text-gray-500">Alert when timer finishes</span>
              </div>
              <ToggleSwitch 
                isOn={notifications.timer} 
                onToggle={() => toggleNotification('timer')} 
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-300 block">Pomodoro Alerts</span>
                <span className="text-sm text-gray-500">Session change notifications</span>
              </div>
              <ToggleSwitch 
                isOn={notifications.pomodoro} 
                onToggle={() => toggleNotification('pomodoro')} 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
