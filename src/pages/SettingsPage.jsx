import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Palette, Upload, Maximize2, Bell, Volume2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toggleWidgetMode, getIsWidgetMode } from '../managers/widgetWindow';
import { selectAudioFile, getSavedRingtones, saveRingtoneSettings, DEFAULT_RINGTONES } from '../managers/audioManager';
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
  const [widgetMode, setWidgetMode] = useState(false);
  const [savedRingtones, setSavedRingtones] = useState([]);
  const [notifications, setNotifications] = useState(() => ({
    alarm: localStorage.getItem(NOTIFICATION_KEYS.alarm) !== 'false',
    timer: localStorage.getItem(NOTIFICATION_KEYS.timer) !== 'false',
    pomodoro: localStorage.getItem(NOTIFICATION_KEYS.pomodoro) !== 'false',
  }));

  useEffect(() => {
    setWidgetMode(getIsWidgetMode());
    loadRingtones();
  }, []);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_KEYS.alarm, notifications.alarm);
    localStorage.setItem(NOTIFICATION_KEYS.timer, notifications.timer);
    localStorage.setItem(NOTIFICATION_KEYS.pomodoro, notifications.pomodoro);
    
    window.dispatchEvent(new CustomEvent('notificationSettings', { detail: notifications }));
  }, [notifications]);

  const loadRingtones = async () => {
    const ringtones = await getSavedRingtones();
    setSavedRingtones([...DEFAULT_RINGTONES, ...ringtones]);
  };

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleColorSchemeChange = (scheme) => {
    setColorScheme(scheme);
  };

  const handleWidgetToggle = async () => {
    const newMode = await toggleWidgetMode();
    setWidgetMode(newMode);
  };

  const handleUploadRingtone = async () => {
    const newRingtone = await selectAudioFile();
    if (newRingtone) {
      const updated = [...savedRingtones, newRingtone];
      setSavedRingtones(updated);
      await saveRingtoneSettings(updated);
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
            <Maximize2 size={20} className="text-[var(--primary)]" />
            Window Mode
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-300 block">Widget Mode</span>
              <span className="text-sm text-gray-500">Compact always-on-top view</span>
            </div>
            <ToggleSwitch isOn={widgetMode} onToggle={handleWidgetToggle} />
          </div>
        </section>

        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload size={20} className="text-[var(--primary)]" />
            Custom Ringtones
          </h2>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {savedRingtones.map((ringtone, index) => (
              <div
                key={ringtone.id || index}
                className="flex items-center justify-between p-2 rounded-lg bg-[#2c2c2c]"
              >
                <span className="text-gray-300">{ringtone.name}</span>
                <Volume2 size={16} className="text-gray-500" />
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUploadRingtone}
            className="w-full mt-3 py-2 rounded-lg bg-[#2c2c2c] text-gray-300 hover:bg-[#3c3c3c] flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Upload Custom Ringtone
          </motion.button>
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
