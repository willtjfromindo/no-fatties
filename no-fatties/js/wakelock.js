import { state } from './state.js';

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      state.wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (e) {
    console.warn('Wake lock not available:', e);
  }
}

export async function releaseWakeLock() {
  if (state.wakeLock) {
    try { await state.wakeLock.release(); } catch (e) { /* ignore */ }
    state.wakeLock = null;
  }
}
