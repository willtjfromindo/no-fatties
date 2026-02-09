import { state } from './state.js';
import { dom, updateCounter, flashBite, setStatus } from './ui.js';
import {
  COOLDOWN_MS, FALLBACK_THRESHOLD, FACE_WIDTH_MULTIPLIER,
  MIN_FPS, MAX_FPS, FPS_ADJUST_INTERVAL, FPS_HEADROOM, FRAME_INTERVAL,
} from './config.js';
import { BiteStateMachine, isHandNearMouth, getProximityThreshold } from './bite-state-machine.js';

let machine = null;

export function resetGestureState() {
  if (machine) machine.resetGesture();
}

export function startDetectionLoop(onLimitReached) {
  machine = new BiteStateMachine({
    cooldownMs: COOLDOWN_MS,
    onBite: (count) => {
      state.biteCount = count;
      updateCounter(state.biteCount, state.biteLimit);
      flashBite();
      if (window.posthog) window.posthog.capture('bite_detected', {
        bite_count: count,
        bite_limit: state.biteLimit,
      });
    },
    onLimitReached,
  });
  machine.biteLimit = state.biteLimit;

  state.detecting = true;
  state.lastVideoTime = -1;
  state.lastDetectionTime = 0;

  // Adaptive FPS state
  let currentFrameInterval = FRAME_INTERVAL;
  let frameTimes = [];
  let frameCount = 0;

  function processFrame(timestamp) {
    if (!state.detecting) return;

    if (timestamp - state.lastDetectionTime < currentFrameInterval) {
      requestAnimationFrame(processFrame);
      return;
    }

    const frameStart = performance.now();
    state.lastDetectionTime = timestamp;

    const video = dom.camera;
    if (video.currentTime === state.lastVideoTime || video.readyState < 2) {
      requestAnimationFrame(processFrame);
      return;
    }
    state.lastVideoTime = video.currentTime;

    try {
      const handResults = state.handLandmarker.detectForVideo(video, timestamp);
      const faceResults = state.faceDetector.detectForVideo(video, timestamp);

      // Extract mouth position
      let mouthPos = null;
      let faceDetection = null;
      if (faceResults.detections.length > 0) {
        faceDetection = faceResults.detections[0];
        const keypoints = faceDetection.keypoints;
        if (keypoints && keypoints.length > 3) {
          mouthPos = { x: keypoints[3].x, y: keypoints[3].y };
        }
      }

      // Extract fingertip positions
      const fingertips = [];
      if (handResults.landmarks) {
        for (const hand of handResults.landmarks) {
          fingertips.push(
            { x: hand[4].x,  y: hand[4].y },
            { x: hand[8].x,  y: hand[8].y },
            { x: hand[12].x, y: hand[12].y },
          );
        }
      }

      // Update status
      if (!mouthPos && fingertips.length === 0) {
        setStatus('No face or hands detected');
      } else if (!mouthPos) {
        setStatus('Face not visible');
      } else if (fingertips.length === 0) {
        setStatus('Hands not visible');
      } else {
        setStatus('');
      }

      // Run state machine
      if (mouthPos && fingertips.length > 0) {
        const threshold = getProximityThreshold(faceDetection, FALLBACK_THRESHOLD, FACE_WIDTH_MULTIPLIER);
        const nearMouth = isHandNearMouth(mouthPos, fingertips, threshold);
        machine.update(nearMouth);
      } else if (machine.state !== 'idle') {
        machine.update(false);
      }
    } catch (e) {
      console.error('Detection error:', e);
    }

    // Adaptive FPS: measure and adjust
    const processingTime = performance.now() - frameStart;
    frameTimes.push(processingTime);
    frameCount++;

    if (frameCount % FPS_ADJUST_INTERVAL === 0) {
      const avgTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes = [];

      const targetInterval = avgTime / FPS_HEADROOM;
      const minInterval = 1000 / MAX_FPS;
      const maxInterval = 1000 / MIN_FPS;
      currentFrameInterval = Math.max(minInterval, Math.min(maxInterval, targetInterval));
    }

    requestAnimationFrame(processFrame);
  }

  requestAnimationFrame(processFrame);
}

export function stopDetectionLoop() {
  state.detecting = false;
}
