import { open } from '@tauri-apps/plugin-dialog';
import { appDataDir } from '@tauri-apps/api/path';
import { exists, mkdir, writeFile, readFile, BaseDirectory } from '@tauri-apps/plugin-fs';

const RINGTONES_DIR = 'ringtones';
const SETTINGS_FILE = 'audio_settings.json';

let currentAudio = null;
let audioContext = null;

async function ensureRingtonesDir() {
  try {
    const dirExists = await exists(RINGTONES_DIR, { baseDir: BaseDirectory.AppData });
    if (!dirExists) {
      await mkdir(RINGTONES_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
  } catch (e) {
    console.error('Error creating ringtones directory:', e);
  }
}

export async function selectAudioFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Audio',
        extensions: ['mp3', 'wav', 'ogg', 'm4a']
      }]
    });

    if (selected) {
      const fileName = selected.name || selected.path?.split(/[/\\]/).pop() || 'custom.mp3';
      const customPath = await saveRingtone(selected, fileName);
      return { path: customPath, name: fileName };
    }
    return null;
  } catch (e) {
    console.error('Error selecting audio file:', e);
    return null;
  }
}

export async function saveRingtone(fileData, fileName) {
  try {
    await ensureRingtonesDir();
    const ringtonePath = `${RINGTONES_DIR}/${fileName}`;
    
    let content;
    if (typeof fileData === 'string') {
      const response = await fetch(fileData);
      content = await response.arrayBuffer();
    } else if (fileData.arrayBuffer) {
      content = await fileData.arrayBuffer();
    } else if (fileData.read) {
      content = await readFile(fileData.path);
    } else {
      content = fileData;
    }

    await writeFile(ringtonePath, new Uint8Array(content), { baseDir: BaseDirectory.AppData });
    return ringtonePath;
  } catch (e) {
    console.error('Error saving ringtone:', e);
    return null;
  }
}

export async function getSavedRingtones() {
  try {
    const settingsExists = await exists(SETTINGS_FILE, { baseDir: BaseDirectory.AppData });
    if (!settingsExists) {
      return [];
    }
    const data = await readFile(SETTINGS_FILE, { baseDir: BaseDirectory.AppData });
    const settings = JSON.parse(new TextDecoder().decode(data));
    return settings.ringtones || [];
  } catch (e) {
    console.error('Error reading saved ringtones:', e);
    return [];
  }
}

export async function saveRingtoneSettings(ringtones) {
  try {
    await ensureRingtonesDir();
    const settings = { ringtones };
    await writeFile(SETTINGS_FILE, new TextEncoder().encode(JSON.stringify(settings, null, 2)), { baseDir: BaseDirectory.AppData });
  } catch (e) {
    console.error('Error saving ringtone settings:', e);
  }
}

export function playAudio(audioPath, loop = true) {
  stopAudio();
  
  const audio = new Audio();
  audio.loop = loop;
  
  if (audioPath.startsWith('http') || audioPath.startsWith('data:')) {
    audio.src = audioPath;
  } else {
    audio.src = `https://asset.localhost/${audioPath}`;
  }
  
  audio.play().catch(e => console.error('Error playing audio:', e));
  currentAudio = audio;
  return audio;
}

export function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

export function pauseAudio() {
  if (currentAudio) {
    currentAudio.pause();
  }
}

export function resumeAudio() {
  if (currentAudio) {
    currentAudio.play().catch(e => console.error('Error resuming audio:', e));
  }
}

export function isAudioPlaying() {
  return currentAudio && !currentAudio.paused;
}

export function setVolume(volume) {
  if (currentAudio) {
    currentAudio.volume = Math.max(0, Math.min(1, volume));
  }
}

export const DEFAULT_RINGTONES = [
  { id: 'alarm1', name: 'Alarm 1', path: '/ez_ez_dhurandar.mp3' },
  { id: 'gentle', name: 'Gentle', path: null },
  { id: 'digital', name: 'Digital', path: null },
  { id: 'chime', name: 'Chime', path: null },
];
