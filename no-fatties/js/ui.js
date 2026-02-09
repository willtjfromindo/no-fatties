export const dom = {
  setupScreen:    document.getElementById('setup-screen'),
  monitorScreen:  document.getElementById('monitor-screen'),
  alarmScreen:    document.getElementById('alarm-screen'),
  limitInput:     document.getElementById('limit-input'),
  startBtn:       document.getElementById('start-btn'),
  stopBtn:        document.getElementById('stop-btn'),
  stopAlarmBtn:   document.getElementById('stop-alarm-btn'),
  camera:         document.getElementById('camera'),
  currentCount:   document.getElementById('current-count'),
  limitDisplay:   document.getElementById('limit-display'),
  progressBar:    document.getElementById('progress-bar'),
  biteFlash:      document.getElementById('bite-flash'),
  finalCount:     document.getElementById('final-count'),
  loadingOverlay: document.getElementById('loading-overlay'),
  loadingText:    document.getElementById('loading-text'),
  statusMsg:      document.getElementById('status-msg'),
  errorOverlay:   document.getElementById('error-overlay'),
  errorText:      document.getElementById('error-text'),
  retryBtn:       document.getElementById('retry-btn'),
};

export function updateCounter(biteCount, biteLimit) {
  dom.currentCount.textContent = biteCount;
  const pct = Math.min(100, (biteCount / biteLimit) * 100);
  dom.progressBar.style.width = pct + '%';
}

export function flashBite() {
  dom.biteFlash.classList.add('active');
  setTimeout(() => dom.biteFlash.classList.remove('active'), 150);
}

export function setStatus(msg) {
  dom.statusMsg.textContent = msg;
}

export function showLoading(show, text) {
  dom.loadingOverlay.classList.toggle('active', show);
  if (text) dom.loadingText.textContent = text;
}

export function showError(message) {
  dom.errorOverlay.classList.add('active');
  dom.errorText.textContent = message;
}

export function hideError() {
  dom.errorOverlay.classList.remove('active');
}
