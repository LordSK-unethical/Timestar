import { 
  DEFAULT_RINGTONES, 
  getAllRingtones, 
  playRingtoneById, 
  stopRingtone,
  getActiveRingtoneId,
  invalidateRingtonesCache as clearRingtoneCache
} from '../managers/audioManager';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SNOOZE_OPTIONS = [5, 10, 15];

const RINGTONES = DEFAULT_RINGTONES;

const STORAGE_KEY = 'timestar_alarms';
const SNOOZE_KEY = 'timestar_snooze';

let volumeLevel = 0;
let volumeInterval = null;

function playAlarmSound(ringtoneId = 'default', loop = true) {
  stopAlarmSound();
  
  try {
    const idToPlay = ringtoneId || getActiveRingtoneId();
    
    playRingtoneById(idToPlay, loop)
      .then((audio) => {
        if (audio) {
          audio.volume = 0.3;
          volumeLevel = 0.3;
          
          if (idToPlay === 'default' || idToPlay === DEFAULT_RINGTONES[0].id) {
            volumeInterval = setInterval(() => {
              if (volumeLevel < 0.8 && audio && !audio.paused) {
                volumeLevel += 0.02;
                audio.volume = volumeLevel;
              }
            }, 1000);
          }
        }
      })
      .catch((e) => {
        console.log('Audio playback error:', e);
      });
  } catch (e) {
    console.log('Audio error:', e);
  }
}

function stopAlarmSound() {
  stopRingtone();
  
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
  volumeLevel = 0;
}

async function requestNotificationPermission() {
  try {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === 'granted';
    }
    return granted;
  } catch (e) {
    console.log('Notification permission error:', e);
    return false;
  }
}

async function sendNotification(alarm, isSnooze = false) {
  try {
    const { isPermissionGranted, sendNotification: send } = await import('@tauri-apps/plugin-notification');
    const granted = await isPermissionGranted();
    
    const timeStr = `${String(alarm.hour).padStart(2, '0')}:${String(alarm.minute).padStart(2, '0')}`;
    const title = isSnooze ? '⏰ Snoozed Alarm' : '⏰ Alarm';
    const body = alarm.label 
      ? `${alarm.label} - ${timeStr}` 
      : `Time to wake up! ${timeStr}`;
    
    if (granted) {
      await send({ title, body });
    }
  } catch (e) {
    console.log('Send notification error:', e);
  }
}

function getRepeatDaysText(repeatDays) {
  if (!repeatDays || repeatDays.length === 0) return 'Once';
  if (repeatDays.length === 7) return 'Every day';
  if (repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)) return 'Weekdays';
  if (repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6)) return 'Weekends';
  
  return repeatDays.map(d => DAYS[d]).join(', ');
}

function shouldAlarmTrigger(alarm) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (!alarm.enabled) return false;
  
  if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
    return alarm.hour === currentHour && alarm.minute === currentMinute;
  }
  
  return alarm.repeatDays.includes(currentDay) && 
         alarm.hour === currentHour && 
         alarm.minute === currentMinute;
}

export { 
  DAYS, 
  SNOOZE_OPTIONS, 
  RINGTONES, 
  STORAGE_KEY, 
  SNOOZE_KEY,
  playAlarmSound, 
  stopAlarmSound, 
  requestNotificationPermission, 
  sendNotification,
  getRepeatDaysText,
  shouldAlarmTrigger,
  getAllRingtones as getRingtones,
  clearRingtoneCache as invalidateRingtonesCache
};
