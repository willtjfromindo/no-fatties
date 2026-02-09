import { state } from './state.js';
import {
  ALARM_FREQ_HIGH, ALARM_FREQ_LOW, ALARM_GAIN,
  ALARM_TONE_DURATION, ALARM_CYCLE_MS,
} from './config.js';

export function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === 'suspended') {
    state.audioContext.resume();
  }
}

export function playAlarm() {
  ensureAudioContext();
  stopAlarm();

  function playTone() {
    if (!state.audioContext || state.currentScreen !== 'alarm') return;

    const now = state.audioContext.currentTime;
    const gain = state.audioContext.createGain();
    gain.gain.value = ALARM_GAIN;
    gain.connect(state.audioContext.destination);

    const osc1 = state.audioContext.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = ALARM_FREQ_HIGH;
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + ALARM_TONE_DURATION);

    const osc2 = state.audioContext.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = ALARM_FREQ_LOW;
    osc2.connect(gain);
    osc2.start(now + ALARM_TONE_DURATION);
    osc2.stop(now + ALARM_TONE_DURATION * 2);

    osc2.onended = () => gain.disconnect();
  }

  playTone();
  state.alarmInterval = setInterval(playTone, ALARM_CYCLE_MS);
}

export function stopAlarm() {
  if (state.alarmInterval) {
    clearInterval(state.alarmInterval);
    state.alarmInterval = null;
  }
}
