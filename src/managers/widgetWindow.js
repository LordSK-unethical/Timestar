import { getCurrentWindow } from '@tauri-apps/api/window';

let isWidgetMode = false;
let onWidgetModeChange = null;

export async function initWidgetManager(callbacks = {}) {
  onWidgetModeChange = callbacks.onWidgetModeChange;
  
  const savedMode = localStorage.getItem('widgetMode');
  if (savedMode === 'true') {
    await enableWidgetMode();
  }
}

export async function toggleWidgetMode() {
  if (isWidgetMode) {
    await disableWidgetMode();
  } else {
    await enableWidgetMode();
  }
  return isWidgetMode;
}

export async function enableWidgetMode() {
  try {
    const mainWindow = getCurrentWindow();
    
    await mainWindow.setAlwaysOnTop(true);
    await mainWindow.setDecorations(false);
    await mainWindow.setSize({ width: 200, height: 80 });
    await mainWindow.setPosition({ type: 'TopRight', x: 20, y: 20 });
    
    isWidgetMode = true;
    localStorage.setItem('widgetMode', 'true');
    
    document.body.classList.add('widget-mode');
    
    if (onWidgetModeChange) {
      onWidgetModeChange(true);
    }
    
    window.dispatchEvent(new CustomEvent('widgetModeChange', { detail: { isWidgetMode: true } }));
    
    return true;
  } catch (e) {
    console.error('Error enabling widget mode:', e);
    return false;
  }
}

export async function disableWidgetMode() {
  try {
    const mainWindow = getCurrentWindow();
    
    await mainWindow.setAlwaysOnTop(false);
    await mainWindow.setDecorations(true);
    await mainWindow.setSize({ width: 480, height: 720 });
    await mainWindow.setPosition({ type: 'Center', x: 0, y: 0 });
    
    isWidgetMode = false;
    localStorage.setItem('widgetMode', 'false');
    
    document.body.classList.remove('widget-mode');
    
    if (onWidgetModeChange) {
      onWidgetModeChange(false);
    }
    
    window.dispatchEvent(new CustomEvent('widgetModeChange', { detail: { isWidgetMode: false } }));
    
    return true;
  } catch (e) {
    console.error('Error disabling widget mode:', e);
    return false;
  }
}

export function getIsWidgetMode() {
  return isWidgetMode;
}

export function startDragging() {
  const mainWindow = getCurrentWindow();
  mainWindow.startDragging();
}
