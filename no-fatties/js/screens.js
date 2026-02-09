import { state } from './state.js';
import { dom } from './ui.js';

export function showScreen(name) {
  state.currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screenMap = {
    setup: dom.setupScreen,
    monitor: dom.monitorScreen,
    alarm: dom.alarmScreen,
  };
  if (screenMap[name]) screenMap[name].classList.add('active');
}
