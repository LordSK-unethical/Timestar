import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Trash2, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { writeFile, readFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';

const EVENTS_FILE = 'calendar_events.json';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', time: '09:00', description: '', reminder: false });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const fileExists = await exists(EVENTS_FILE, { baseDir: BaseDirectory.AppData });
      if (fileExists) {
        const data = await readFile(EVENTS_FILE, { baseDir: BaseDirectory.AppData });
        const loadedEvents = JSON.parse(new TextDecoder().decode(data));
        setEvents(loadedEvents);
      }
    } catch (e) {
      console.error('Error loading events:', e);
    }
  };

  const saveEvents = async (updatedEvents) => {
    try {
      await writeFile(
        EVENTS_FILE,
        new TextEncoder().encode(JSON.stringify(updatedEvents, null, 2)),
        { baseDir: BaseDirectory.AppData }
      );
      setEvents(updatedEvents);
    } catch (e) {
      console.error('Error saving events:', e);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setNewEvent({ title: '', time: '09:00', description: '', reminder: false });
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({ ...event });
    setShowEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title.trim()) return;
    
    const eventData = {
      id: editingEvent?.id || Date.now().toString(),
      title: newEvent.title,
      date: selectedDate.toISOString().split('T')[0],
      time: newEvent.time,
      description: newEvent.description,
      reminder: newEvent.reminder,
    };
    
    let updatedEvents;
    if (editingEvent) {
      updatedEvents = events.map(e => e.id === editingEvent.id ? eventData : e);
    } else {
      updatedEvents = [...events, eventData];
    }
    
    saveEvents(updatedEvents);
    setShowEventModal(false);
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    saveEvents(updatedEvents);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const days = getDaysInMonth(currentDate);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <button
          onClick={handleAddEvent}
          className="p-2 rounded-full bg-[var(--primary)] text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={handlePrevMonth} className="p-1 text-gray-400 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-semibold text-white">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={handleNextMonth} className="p-1 text-gray-400 hover:text-white">
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(day => (
            <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
              {day}
            </div>
          ))}
          
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day.date);
            return (
              <button
                key={index}
                onClick={() => handleDateClick(day.date)}
                className={`relative aspect-square p-1 rounded-lg text-sm transition-colors ${
                  !day.isCurrentMonth ? 'text-gray-600' : 'text-white'
                } ${isSelected(day.date) ? 'bg-[var(--primary)]' : ''} ${
                  isToday(day.date) && !isSelected(day.date) ? 'bg-[#2c2c2c]' : ''
                } hover:bg-[#2c2c2c]`}
              >
                <span className={!day.isCurrentMonth ? 'opacity-30' : ''}>
                  {day.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: isSelected(day.date) ? 'white' : 'var(--primary)' }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h3 className="text-lg font-semibold text-white mb-3">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        
        {selectedDateEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CalendarIcon size={48} className="mx-auto mb-2 opacity-50" />
            <p>No events for this day</p>
            <button
              onClick={handleAddEvent}
              className="mt-2 text-[var(--primary)] hover:underline"
            >
              Add an event
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDateEvents.map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#1e1e1e] rounded-xl p-3 flex items-start gap-3"
              >
                <div className="w-1 h-full min-h-[40px] rounded-full bg-[var(--primary)]" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-white">{event.title}</h4>
                    {event.reminder && <Bell size={14} className="text-gray-400" />}
                  </div>
                  <p className="text-sm text-gray-400">{event.time}</p>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1e1e1e] rounded-xl p-4 w-full max-w-sm mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingEvent ? 'Edit Event' : 'New Event'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                    className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Time</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Description (optional)</label>
                  <textarea
                    value={newEvent.description}
                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Add details..."
                    rows={2}
                    className="w-full mt-1 bg-[#2c2c2c] text-white rounded-lg px-3 py-2 resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Reminder</span>
                  <button
                    onClick={() => setNewEvent({ ...newEvent, reminder: !newEvent.reminder })}
                    className={`w-10 h-6 rounded-full transition-colors ${newEvent.reminder ? 'bg-[var(--primary)]' : 'bg-[#3c3c3c]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${newEvent.reminder ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 py-2 rounded-lg bg-[#2c2c2c] text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEvent}
                  className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-white font-medium"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
