import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bell, BellOff, Edit2, X, Check, Repeat, BellRing, Volume2 } from 'lucide-react';
import { 
  DAYS, SNOOZE_OPTIONS, RINGTONES, STORAGE_KEY, SNOOZE_KEY,
  playAlarmSound, stopAlarmSound, requestNotificationPermission, 
  sendNotification, getRepeatDaysText, shouldAlarmTrigger 
} from '../utils/alarmUtils';

const getDefaultFormData = () => ({
  hour: new Date().getHours(),
  minute: 0,
  label: '',
  repeatDays: [],
  ringtone: 'default',
  snoozeMinutes: 5
});

export default function AlarmPage() {
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [snoozeData, setSnoozeData] = useState(() => {
    const saved = localStorage.getItem(SNOOZE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getDefaultFormData());
  const [triggeredAlarms, setTriggeredAlarms] = useState(new Set());
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(null);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [currentRingingAlarm, setCurrentRingingAlarm] = useState(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    if (snoozeData) {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozeData));
    }
  }, [snoozeData]);

  const handleSnooze = useCallback((alarm, minutes) => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
    
    setSnoozeData({
      alarmId: alarm.id,
      triggerTime: snoozeTime.getTime(),
      alarm: alarm,
      minutes: minutes
    });
    
    setShowSnoozeMenu(null);
    setCurrentRingingAlarm(null);
  }, []);

  const handleDismiss = useCallback(() => {
    stopAlarmSound();
    setIsAlarmRinging(false);
    setCurrentRingingAlarm(null);
  }, []);

  useEffect(() => {
    const checkAlarms = setInterval(() => {
      const now = new Date();
      const currentTime = now.getTime();
      
      if (snoozeData && currentTime >= snoozeData.triggerTime && !isAlarmRinging) {
        setTriggeredAlarms(prev => {
          if (!prev.has(snoozeData.alarmId)) {
            const newSet = new Set(prev);
            newSet.add(snoozeData.alarmId);
            setIsAlarmRinging(true);
            setCurrentRingingAlarm(snoozeData.alarm);
            playAlarmSound(snoozeData.alarm.ringtone, true);
            sendNotification(snoozeData.alarm, true);
            return newSet;
          }
          return prev;
        });
        
        setSnoozeData(null);
        return;
      }
      
      alarms.forEach((alarm) => {
        if (shouldAlarmTrigger(alarm) && !triggeredAlarms.has(alarm.id) && !isAlarmRinging) {
          setTriggeredAlarms(prev => {
            const newSet = new Set(prev);
            newSet.add(alarm.id);
            setIsAlarmRinging(true);
            setCurrentRingingAlarm(alarm);
            playAlarmSound(alarm.ringtone, true);
            sendNotification(alarm);
            return newSet;
          });
        }
      });
    }, 1000);
    
    return () => clearInterval(checkAlarms);
  }, [alarms, triggeredAlarms, snoozeData, isAlarmRinging]);

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.repeatDays.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...prev.repeatDays, day].sort((a, b) => a - b);
      return { ...prev, repeatDays: days };
    });
  };

  const handleAdd = () => {
    const newAlarm = {
      id: Date.now(),
      hour: formData.hour,
      minute: formData.minute,
      label: formData.label || 'Alarm',
      enabled: true,
      repeatDays: formData.repeatDays,
      ringtone: formData.ringtone,
      snoozeMinutes: formData.snoozeMinutes
    };
    setAlarms([...alarms, newAlarm]);
    setShowForm(false);
    setFormData(getDefaultFormData());
  };

  const handleEdit = (alarm) => {
    setEditingId(alarm.id);
    setFormData({
      hour: alarm.hour,
      minute: alarm.minute,
      label: alarm.label || '',
      repeatDays: alarm.repeatDays || [],
      ringtone: alarm.ringtone || 'default',
      snoozeMinutes: alarm.snoozeMinutes || 5
    });
    setShowForm(true);
  };

  const handleUpdate = () => {
    setAlarms(alarms.map(a => 
      a.id === editingId 
        ? { 
            ...a, 
            hour: formData.hour, 
            minute: formData.minute, 
            label: formData.label || 'Alarm',
            repeatDays: formData.repeatDays,
            ringtone: formData.ringtone,
            snoozeMinutes: formData.snoozeMinutes
          } 
        : a
    ));
    setShowForm(false);
    setEditingId(null);
    setFormData(getDefaultFormData());
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
      {isAlarmRinging && currentRingingAlarm && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff6b6b] to-[#feca57] flex items-center justify-center mb-8 shadow-2xl"
          >
            <BellRing size={48} className="text-white" />
          </motion.div>
          
          <h2 className="text-5xl font-light text-white mb-2">
            {formatTime(currentRingingAlarm.hour, currentRingingAlarm.minute)}
          </h2>
          <p className="text-xl text-white/60 mb-8">{currentRingingAlarm.label}</p>
          
          <div className="flex gap-4">
            <motion.button
              onClick={() => setShowSnoozeMenu(currentRingingAlarm.id)}
              className="py-4 px-8 rounded-2xl bg-white/10 text-white font-medium border border-white/20"
              whileTap={{ scale: 0.95 }}
            >
              Snooze
            </motion.button>
            <motion.button
              onClick={handleDismiss}
              className="py-4 px-8 rounded-2xl bg-[#3d5afe] text-white font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Dismiss
            </motion.button>
          </div>
          
          {showSnoozeMenu === currentRingingAlarm.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-32 flex gap-3"
            >
              {SNOOZE_OPTIONS.map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSnooze(currentRingingAlarm, mins)}
                  className="py-3 px-6 rounded-xl bg-[#2c2c2c] text-white font-medium"
                >
                  {mins} min
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

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
              className="group bg-[#1e1e1e] rounded-2xl p-4 mb-3 hover:bg-[#252525] transition-colors"
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
                <div className="flex-1">
                  <div className={`text-2xl font-light tracking-wide ${alarm.enabled ? 'text-[#e2e2e2]' : 'text-[#6b6b6b]'}`}>
                    {formatTime(alarm.hour, alarm.minute)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#8a8a8a]">
                    {alarm.repeatDays && alarm.repeatDays.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Repeat size={12} />
                        {getRepeatDaysText(alarm.repeatDays)}
                      </span>
                    )}
                    {alarm.label && alarm.label !== 'Alarm' && (
                      <span>• {alarm.label}</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
          setFormData(getDefaultFormData());
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
              className="bg-[#1e1e1e] p-6 rounded-3xl w-[360px] shadow-2xl max-h-[90vh] overflow-y-auto"
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

              <div className="mb-4">
                <label className="text-sm text-[#8a8a8a] mb-2 block">Repeat</label>
                <div className="flex gap-2">
                  {DAYS.map((day, index) => (
                    <motion.button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                        formData.repeatDays.includes(index)
                          ? 'bg-[#3d5afe] text-white'
                          : 'bg-[#2c2c2c] text-[#8a8a8a] hover:text-[#e2e2e2]'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {day.charAt(0)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[#8a8a8a] mb-2 block">Ringtone</label>
                <select
                  value={formData.ringtone}
                  onChange={(e) => setFormData({ ...formData, ringtone: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#2c2c2c] text-[#e2e2e2] focus:outline-none cursor-pointer"
                >
                  {RINGTONES.map(ring => (
                    <option key={ring.id} value={ring.id} className="bg-[#2c2c2c]">{ring.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-sm text-[#8a8a8a] mb-2 block">Snooze duration</label>
                <select
                  value={formData.snoozeMinutes}
                  onChange={(e) => setFormData({ ...formData, snoozeMinutes: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-[#2c2c2c] text-[#e2e2e2] focus:outline-none cursor-pointer"
                >
                  {SNOOZE_OPTIONS.map(mins => (
                    <option key={mins} value={mins} className="bg-[#2c2c2c]">{mins} minutes</option>
                  ))}
                </select>
              </div>

              <motion.input
                type="text"
                placeholder="Label (optional)"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full p-4 rounded-xl bg-[#2c2c2c] text-[#e2e2e2] placeholder-[#6b6b6b] mb-6 focus:outline-none focus:ring-2 focus:ring-[#3d5afe]/50 transition-all"
              />

              <div className="flex gap-3">
                <motion.button 
                  onClick={() => setShowForm(false)} 
                  className="flex-1 py-3.5 rounded-xl bg-[#2c2c2c] text-[#e2e2e2] font-medium"
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  onClick={editingId ? handleUpdate : handleAdd} 
                  className="flex-1 py-3.5 rounded-xl bg-[#3d5afe] text-white font-medium flex items-center justify-center gap-2"
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