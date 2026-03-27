import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bell, BellOff, Edit2, X, Check } from 'lucide-react';

const STORAGE_KEY = 'timestar_alarms';

let notificationPermission = false;
let audioContext = null;

function createAlarmSound() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
    
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioContext.currentTime);
      osc2.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
      osc2.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.4);
    }, 800);
    
    setTimeout(() => {
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, audioContext.currentTime);
      osc3.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1);
      osc3.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
      gain3.gain.setValueAtTime(0.35, audioContext.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc3.start(audioContext.currentTime);
      osc3.stop(audioContext.currentTime + 0.5);
    }, 1600);
    
  } catch (e) {
    console.log('Audio error:', e);
  }
}

async function requestNotificationPermission() {
  try {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    notificationPermission = granted;
    return granted;
  } catch (e) {
    console.log('Notification permission error:', e);
    return false;
  }
}

async function sendNotification(alarm) {
  try {
    const { isPermissionGranted, sendNotification: send } = await import('@tauri-apps/plugin-notification');
    const granted = await isPermissionGranted();
    
    const timeStr = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
    const title = alarm.label ? `⏰ ${alarm.label}` : '⏰ Alarm';
    const body = alarm.label 
      ? `Time: ${timeStr}` 
      : `Time to wake up! It's ${timeStr}`;
    
    if (granted) {
      await send({ 
        title, 
        body,
        icon: 'icons/icon.png'
      });
    }
  } catch (e) {
    console.log('Send notification error:', e);
  }
}

async function openAlarmWindow(alarm) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const timeStr = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
    await invoke('create_alarm_window', { 
      alarmLabel: alarm.label || 'Alarm',
      alarmTime: timeStr 
    });
  } catch (e) {
    console.log('Failed to open alarm window:', e);
    createAlarmSound();
  }
}

export default function AlarmPage() {
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ hour: 6, minute: 0, label: '' });
  const [triggeredAlarms, setTriggeredAlarms] = useState(new Set());

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    const checkAlarms = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();
      
      if (currentSecond !== 0) return;
      
      alarms.forEach((alarm) => {
        if (alarm.enabled && 
            alarm.hour === currentHour && 
            alarm.minute === currentMinute &&
            !triggeredAlarms.has(alarm.id)) {
          
          setTriggeredAlarms(prev => new Set([...prev, alarm.id]));
          
          openAlarmWindow(alarm);
        }
      });
    }, 1000);
    
    return () => clearInterval(checkAlarms);
  }, [alarms, triggeredAlarms]);

  const handleAdd = () => {
    const newAlarm = {
      id: Date.now(),
      hour: formData.hour,
      minute: formData.minute,
      label: formData.label || 'Alarm',
      enabled: true,
    };
    setAlarms([...alarms, newAlarm]);
    setShowForm(false);
    setFormData({ hour: 6, minute: 0, label: '' });
  };

  const handleEdit = (alarm) => {
    setEditingId(alarm.id);
    setFormData({ hour: alarm.hour, minute: alarm.minute, label: alarm.label });
    setShowForm(true);
  };

  const handleUpdate = () => {
    setAlarms(alarms.map(a => 
      a.id === editingId 
        ? { ...a, hour: formData.hour, minute: formData.minute, label: formData.label || 'Alarm' } 
        : a
    ));
    setShowForm(false);
    setEditingId(null);
    setFormData({ hour: 6, minute: 0, label: '' });
  };

  const handleDelete = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
    setTriggeredAlarms(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleEnabled = (id) => {
    setAlarms(alarms.map(a => 
      a.id === id 
        ? { ...a, enabled: !a.enabled } 
        : a
    ));
    setTriggeredAlarms(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const formatTime = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  return (
    <div className="flex-1 flex flex-col px-4 pt-8 pb-28">
      <motion.h2 
        className="text-2xl font-normal text-[#e2e2e2] mb-6 ml-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Alarms
      </motion.h2>

      <div className="flex-1 overflow-y-auto pr-1">
        <AnimatePresence mode="popLayout">
          {alarms.map((alarm) => (
            <motion.div
              key={alarm.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="group bg-[#1e1e1e] rounded-2xl p-4 mb-3 flex items-center justify-between hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-center gap-4">
                <motion.button 
                  onClick={() => toggleEnabled(alarm.id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${alarm.enabled ? 'bg-[#3d5afe]/20' : 'bg-[#2c2c2c]'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  {alarm.enabled ? (
                    <Bell size={20} className="text-[#3d5afe]" />
                  ) : (
                    <BellOff size={20} className="text-[#6b6b6b]" />
                  )}
                </motion.button>
                <div>
                  <div className={`text-2xl font-light tracking-wide ${alarm.enabled ? 'text-[#e2e2e2]' : 'text-[#6b6b6b]'}`}>
                    {formatTime(alarm.hour, alarm.minute)}
                  </div>
                  <div className="text-sm text-[#8a8a8a]">{alarm.label}</div>
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.button 
                  onClick={() => handleEdit(alarm)} 
                  className="p-2.5 rounded-xl bg-[#2c2c2c] text-[#8a8a8a] hover:text-[#e2e2e2] hover:bg-[#3c3c3c]"
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit2 size={16} />
                </motion.button>
                <motion.button 
                  onClick={() => handleDelete(alarm.id)} 
                  className="p-2.5 rounded-xl bg-[#2c2c2c] text-[#8a8a8a] hover:text-[#ff5252] hover:bg-[#ff5252]/10"
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {alarms.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-3xl bg-[#2c2c2c] flex items-center justify-center mb-4">
              <Bell size={36} className="text-[#6b6b6b]" />
            </div>
            <p className="text-[#8a8a8a] text-lg mb-1">No alarms set</p>
            <p className="text-[#6b6b6b] text-sm">Tap + to create your first alarm</p>
          </motion.div>
        )}
      </div>

      <motion.button
        onClick={() => { 
          setShowForm(true); 
          setEditingId(null); 
          const now = new Date();
          setFormData({ hour: now.getHours(), minute: now.getMinutes(), label: '' }); 
        }}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-[#3d5afe] text-white flex items-center justify-center shadow-lg"
        whileHover={{ scale: 1.08, boxShadow: '0 8px 20px rgba(61, 90, 254, 0.4)' }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      >
        <Plus size={28} />
      </motion.button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-[#1e1e1e] p-6 rounded-3xl w-[340px] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-medium text-[#e2e2e2]">
                  {editingId ? 'Edit alarm' : 'New alarm'}
                </h3>
                <motion.button 
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-[#8a8a8a] hover:text-[#e2e2e2] hover:bg-[#2c2c2c]"
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={22} />
                </motion.button>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                <div className="bg-[#2c2c2c] rounded-2xl px-4 py-3">
                  <select
                    value={formData.hour}
                    onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                    className="text-4xl font-light bg-transparent text-[#e2e2e2] border-none focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i} className="bg-[#2c2c2c]">{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <span className="text-4xl text-[#6b6b6b] mt-3">:</span>
                <div className="bg-[#2c2c2c] rounded-2xl px-4 py-3">
                  <select
                    value={formData.minute}
                    onChange={(e) => setFormData({ ...formData, minute: parseInt(e.target.value) })}
                    className="text-4xl font-light bg-transparent text-[#e2e2e2] border-none focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i} className="bg-[#2c2c2c]">{String(i).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <motion.input
                type="text"
                placeholder="Label (optional)"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full p-4 rounded-2xl bg-[#2c2c2c] text-[#e2e2e2] placeholder-[#6b6b6b] mb-6 focus:outline-none focus:ring-2 focus:ring-[#3d5afe]/50 transition-all"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              />

              <div className="flex gap-3">
                <motion.button 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-3.5 rounded-2xl bg-[#2c2c2c] text-[#e2e2e2] font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  onClick={editingId ? handleUpdate : handleAdd} 
                  className="flex-1 py-3.5 rounded-2xl bg-[#3d5afe] text-white font-medium flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ backgroundColor: '#4d6afe' }}
                >
                  <Check size={20} /> 
                  {editingId ? 'Update' : 'Save'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}