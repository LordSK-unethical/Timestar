import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';

const DEFAULT_SHORTCUTS = {
  'Space': { action: 'toggleTimer', description: 'Start/Pause Timer' },
  'KeyR': { action: 'reset', description: 'Reset' },
  'KeyS': { action: 'snooze', description: 'Snooze Alarm' },
  'KeyD': { action: 'dismiss', description: 'Dismiss Alarm' },
  'CommandOrControl+Shift+M': { action: 'toggleWidget', description: 'Toggle Widget Mode' },
  'CommandOrControl+1': { action: 'navigateClock', description: 'Go to Clock' },
  'CommandOrControl+2': { action: 'navigateAlarm', description: 'Go to Alarm' },
  'CommandOrControl+3': { action: 'navigateTimer', description: 'Go to Timer' },
  'CommandOrControl+4': { action: 'navigateStopwatch', description: 'Go to Stopwatch' },
  'CommandOrControl+5': { action: 'navigatePomodoro', description: 'Go to Pomodoro' },
};

let registeredShortcuts = {};
let shortcutCallbacks = {};

export async function initShortcuts(callbacks = {}) {
  shortcutCallbacks = { ...callbacks };
  
  try {
    for (const [key, config] of Object.entries(DEFAULT_SHORTCUTS)) {
      await registerShortcut(key, config.action);
    }
    console.log('Shortcuts initialized');
  } catch (e) {
    console.error('Error initializing shortcuts:', e);
  }
}

async function registerShortcut(key, action) {
  try {
    const alreadyRegistered = await isRegistered(key);
    if (alreadyRegistered) {
      await unregister(key);
    }
    
    await register(key, (event) => {
      if (event.state === 'Pressed') {
        handleShortcut(action);
      }
    });
    
    registeredShortcuts[key] = action;
  } catch (e) {
    console.error(`Error registering shortcut ${key}:`, e);
  }
}

function handleShortcut(action) {
  if (shortcutCallbacks[action]) {
    shortcutCallbacks[action]();
  }
  
  window.dispatchEvent(new CustomEvent('shortcut', { detail: { action } }));
}

export async function updateShortcut(oldKey, newKey, action) {
  if (registeredShortcuts[oldKey]) {
    try {
      await unregister(oldKey);
    } catch (e) {
      console.error(`Error unregistering shortcut ${oldKey}:`, e);
    }
    delete registeredShortcuts[oldKey];
  }
  
  if (newKey) {
    await registerShortcut(newKey, action);
  }
}

export async function unregisterAllShortcuts() {
  for (const key of Object.keys(registeredShortcuts)) {
    try {
      await unregister(key);
    } catch (e) {
      console.error(`Error unregistering shortcut ${key}:`, e);
    }
  }
  registeredShortcuts = {};
}

export function getShortcuts() {
  return { ...DEFAULT_SHORTCUTS };
}

export function setCallbacks(callbacks) {
  shortcutCallbacks = { ...callbacks };
}
