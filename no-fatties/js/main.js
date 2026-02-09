import { state } from './state.js';
import { dom, updateCounter, showLoading, showError, hideError } from './ui.js';
import { showScreen } from './screens.js';
import { startCamera, stopCamera } from './camera.js';
import { initModels } from './models.js';
import { startDetectionLoop, stopDetectionLoop, resetGestureState } from './detection.js';
import { ensureAudioContext, playAlarm, stopAlarm } from './audio.js';
import { requestWakeLock, releaseWakeLock } from './wakelock.js';
import { checkCapabilities } from './capability.js';

function track(event, props) {
  if (window.posthog) window.posthog.capture(event, props);
}

// ─── Flow Control ───

async function startMonitoring() {
  // Check device capabilities
  const caps = checkCapabilities();
  if (!caps.capable) {
    showError(caps.reason);
    return;
  }
  if (caps.warnings.length > 0) {
    console.warn('Device warnings:', caps.warnings);
  }

  state.biteLimit = Math.max(1, parseInt(dom.limitInput.value, 10) || 10);
  state.biteCount = 0;

  dom.limitDisplay.textContent = state.biteLimit;
  updateCounter(state.biteCount, state.biteLimit);

  showLoading(true, 'Loading AI models...');

  try {
    if (!state.handLandmarker || !state.faceDetector) {
      await initModels(caps.delegate);
    }

    showLoading(true, 'Starting camera...');
    await startCamera();

    ensureAudioContext();
    await requestWakeLock();

    showLoading(false);
    showScreen('monitor');
    track('monitoring_started', { bite_limit: state.biteLimit });

    startDetectionLoop(triggerAlarm);
  } catch (err) {
    showLoading(false);
    console.error('Start error:', err);
    showError(err.message);
    track('start_failed', { error: err.message });
  }
}

function stopMonitoring() {
  track('monitoring_stopped', {
    bite_count: state.biteCount,
    bite_limit: state.biteLimit,
    hit_limit: false,
  });
  stopDetectionLoop();
  stopCamera();
  releaseWakeLock();
  resetGestureState();
  showScreen('setup');
}

function triggerAlarm() {
  track('alarm_triggered', {
    bite_count: state.biteCount,
    bite_limit: state.biteLimit,
  });
  stopDetectionLoop();
  stopCamera();
  releaseWakeLock();
  resetGestureState();

  dom.finalCount.textContent = `You hit ${state.biteCount} bites!`;
  showScreen('alarm');
  playAlarm();
}

function resetFromAlarm() {
  stopAlarm();
  showScreen('setup');
}

// ─── Event Listeners ───

dom.startBtn.addEventListener('click', startMonitoring);
dom.stopBtn.addEventListener('click', stopMonitoring);
dom.stopAlarmBtn.addEventListener('click', resetFromAlarm);

dom.retryBtn.addEventListener('click', () => {
  hideError();
  state.handLandmarker = null;
  state.faceDetector = null;
  startMonitoring();
});

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    dom.limitInput.value = btn.dataset.value;
  });
});

// Warn when bite limit >= 100
let fattyWarned = false;
dom.limitInput.addEventListener('input', () => {
  const val = parseInt(dom.limitInput.value, 10);
  if (val >= 100 && !fattyWarned) {
    fattyWarned = true;
    alert("Don't be a fatty");
    dom.limitInput.value = 10;
    fattyWarned = false;
  }
});

document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && state.detecting) {
    await requestWakeLock();
  }
});
