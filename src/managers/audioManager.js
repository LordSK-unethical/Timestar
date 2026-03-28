const RINGTONES_STORAGE_KEY = 'timestar_ringtones';
const ACTIVE_RINGTONE_KEY = 'timestar_active_ringtone';
const MAX_RINGTONES = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

let currentAudio = null;
let cachedRingtones = null;

const DEFAULT_RINGTONES = [
  { id: 'default', name: 'Default Alarm', path: '/ez_ez_dhurandar.mp3', isDefault: true },
];

function generateId() {
  return `ringtone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TimeStarAudio', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('ringtones')) {
        db.createObjectStore('ringtones', { keyPath: 'id' });
      }
    };
  });
}

async function getAllRingtonesFromDB() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('ringtones', 'readonly');
      const store = transaction.objectStore('ringtones');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Error reading from IndexedDB:', e);
    return [];
  }
}

async function saveRingtoneToDB(ringtone) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('ringtones', 'readwrite');
      const store = transaction.objectStore('ringtones');
      const request = store.put(ringtone);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Error saving to IndexedDB:', e);
    return false;
  }
}

async function deleteRingtoneFromDB(id) {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('ringtones', 'readwrite');
      const store = transaction.objectStore('ringtones');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Error deleting from IndexedDB:', e);
    return false;
  }
}

export async function getSavedRingtones() {
  if (cachedRingtones !== null) {
    return cachedRingtones;
  }
  
  try {
    const customRingtones = await getAllRingtonesFromDB();
    cachedRingtones = customRingtones;
    return customRingtones;
  } catch (e) {
    console.error('Error getting saved ringtones:', e);
    cachedRingtones = [];
    return [];
  }
}

export async function getAllRingtones() {
  const custom = await getSavedRingtones();
  return [...DEFAULT_RINGTONES, ...custom];
}

export function invalidateRingtonesCache() {
  cachedRingtones = null;
}

export async function addRingtone(file) {
  const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'];
  const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  
  const fileName = file.name || 'custom-ringtone.mp3';
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  
  if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
    throw new Error('Invalid file type. Please upload MP3, WAV, OGG, or M4A files.');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size is 5MB.');
  }
  
  const existingRingtones = await getSavedRingtones();
  if (existingRingtones.length >= MAX_RINGTONES) {
    throw new Error(`Maximum ${MAX_RINGTONES} ringtones allowed. Please delete some first.`);
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const ringtone = {
          id: generateId(),
          name: fileName.replace(/\.[^/.]+$/, ''),
          data: base64,
          type: file.type || 'audio/mpeg',
          createdAt: Date.now(),
        };
        
        await saveRingtoneToDB(ringtone);
        invalidateRingtonesCache();
        
        resolve({
          id: ringtone.id,
          name: ringtone.name,
          path: null,
          isCustom: true,
        });
      } catch (e) {
        reject(e);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function deleteRingtone(id) {
  const success = await deleteRingtoneFromDB(id);
  if (success) {
    invalidateRingtonesCache();
    
    const activeRingtone = getActiveRingtoneId();
    if (activeRingtone === id) {
      await setActiveRingtone('default');
    }
  }
  return success;
}

export function getActiveRingtoneId() {
  try {
    return localStorage.getItem(ACTIVE_RINGTONE_KEY) || 'default';
  } catch {
    return 'default';
  }
}

export async function setActiveRingtone(id) {
  try {
    localStorage.setItem(ACTIVE_RINGTONE_KEY, id);
    return true;
  } catch (e) {
    console.error('Error saving active ringtone:', e);
    return false;
  }
}

export async function getActiveRingtone() {
  const activeId = getActiveRingtoneId();
  const allRingtones = await getAllRingtones();
  
  const active = allRingtones.find(r => r.id === activeId);
  if (active) {
    return active;
  }
  
  return DEFAULT_RINGTONES[0];
}

function getRingtoneUrl(ringtone) {
  if (ringtone.isDefault) {
    return ringtone.path;
  }
  
  if (ringtone.data) {
    return `data:${ringtone.type};base64,${ringtone.data}`;
  }
  
  return null;
}

export function playRingtone(ringtoneId, options = {}) {
  const { loop = true, volume = 0.5 } = options;
  
  stopRingtone();
  
  return new Promise(async (resolve, reject) => {
    try {
      const allRingtones = await getAllRingtones();
      const ringtone = allRingtones.find(r => r.id === ringtoneId) || DEFAULT_RINGTONES[0];
      
      const audioUrl = getRingtoneUrl(ringtone);
      if (!audioUrl) {
        reject(new Error('Could not load ringtone'));
        return;
      }
      
      currentAudio = new Audio();
      currentAudio.loop = loop;
      currentAudio.volume = volume;
      
      currentAudio.src = audioUrl;
      
      currentAudio.play()
        .then(() => resolve({ ...ringtone, audio: currentAudio }))
        .catch((e) => {
          console.error('Playback error:', e);
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

export function playRingtoneById(ringtoneId, loop = true) {
  stopRingtone();
  
  return new Promise(async (resolve, reject) => {
    try {
      const allRingtones = await getAllRingtones();
      const ringtone = allRingtones.find(r => r.id === ringtoneId) || DEFAULT_RINGTONES[0];
      
      const audioUrl = getRingtoneUrl(ringtone);
      if (!audioUrl) {
        reject(new Error('Could not load ringtone'));
        return;
      }
      
      currentAudio = new Audio();
      currentAudio.loop = loop;
      currentAudio.volume = 0.5;
      currentAudio.src = audioUrl;
      
      currentAudio.play()
        .then(() => resolve(currentAudio))
        .catch((e) => {
          console.error('Playback error:', e);
          reject(e);
        });
    } catch (e) {
      reject(e);
    }
  });
}

export function stopRingtone() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
}

export function pauseRingtone() {
  if (currentAudio) {
    currentAudio.pause();
  }
}

export function resumeRingtone() {
  if (currentAudio) {
    currentAudio.play().catch(() => {});
  }
}

export function isRingtonePlaying() {
  return currentAudio !== null && !currentAudio.paused;
}

export function setRingtoneVolume(volume) {
  if (currentAudio) {
    currentAudio.volume = Math.max(0, Math.min(1, volume));
  }
}

export { DEFAULT_RINGTONES };
