import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Palette, Upload, Keyboard, Maximize2, Minimize2, Bell, Volume2 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toggleWidgetMode, getIsWidgetMode } from '../managers/widgetWindow';
import { selectAudioFile, getSavedRingtones, saveRingtoneSettings, DEFAULT_RINGTONES } from '../managers/audioManager';
import { getShortcuts } from '../managers/shortcutManager';

const COLOR_SCHEMES = [
  { id: 'blue', name: 'Blue', primary: '#3d5afe', primaryLight: '#8187ff', primaryDark: '#0031cb' },
  { id: 'purple', name: 'Purple', primary: '#9c27b0', primaryLight: '#d05ce3', primaryDark: '#6a0080' },
  { id: 'green', name: 'Green', primary: '#4caf50', primaryLight: '#80e27e', primaryDark: '#087f23' },
  { id: 'orange', name: 'Orange', primary: '#ff9800', primaryLight: '#ffc947', primaryDark: '#c66900' },
];

export default function SettingsPage() {
  const { isDark, setIsDark, colorScheme, setColorScheme } = useTheme();
  const [widgetMode, setWidgetMode] = useState(false);
  const [savedRingtones, setSavedRingtones] = useState([]);
  const [shortcuts] = useState(getShortcuts());

  useEffect(() => {
    setWidgetMode(getIsWidgetMode());
    loadRingtones();
  }, []);

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

  return (
    <div className="flex flex-col h-full p-4 overflow-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-6">
        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette size={20} className="text-[var(--primary)]" />
            Appearance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Dark Mode</span>
              <button
                onClick={handleThemeToggle}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  isDark ? 'bg-[var(--primary)]' : 'bg-[#3c3c3c]'
                }`}
              >
                <motion.div
                  className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                  animate={{ left: isDark ? '28px' : '4px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {isDark ? <Moon size={14} className="text-gray-800" /> : <Sun size={14} className="text-gray-800" />}
                </motion.div>
              </button>
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
            <button
              onClick={handleWidgetToggle}
              className={`w-14 h-8 rounded-full transition-colors relative ${
                widgetMode ? 'bg-[var(--primary)]' : 'bg-[#3c3c3c]'
              }`}
            >
              <motion.div
                className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
                animate={{ left: widgetMode ? '28px' : '4px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </section>

        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Upload size={20} className="text-[var(--primary)]" />
            Custom Ringtones
          </h2>

          <div className="space-y-2">
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
            <Keyboard size={20} className="text-[var(--primary)]" />
            Keyboard Shortcuts
          </h2>

          <div className="space-y-2">
            {Object.entries(shortcuts).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="text-gray-400 text-sm">{config.description}</span>
                <kbd className="px-2 py-1 bg-[#2c2c2c] rounded text-xs text-gray-300 font-mono">
                  {key.replace('CommandOrControl', 'Ctrl')}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#1e1e1e] rounded-xl p-4">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell size={20} className="text-[var(--primary)]" />
            Notifications
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Alarm Notifications</span>
              <button className="w-12 h-6 rounded-full bg-[var(--primary)]">
                <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Timer Completion</span>
              <button className="w-12 h-6 rounded-full bg-[var(--primary)]">
                <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Pomodoro Alerts</span>
              <button className="w-12 h-6 rounded-full bg-[var(--primary)]">
                <div className="w-5 h-5 rounded-full bg-white translate-x-6" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
