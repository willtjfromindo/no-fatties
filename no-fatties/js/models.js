import { state } from './state.js';
import { showLoading } from './ui.js';
import {
  VISION_BUNDLE_URL, MEDIAPIPE_WASM_URL,
  HAND_MODEL_URL, FACE_MODEL_URL,
  SELF_HOSTED_FALLBACKS,
} from './config.js';

let visionModule = null;

async function importWithRetry(url, fallbackUrl, maxRetries = 2) {
  let lastError;
  const urls = [url, fallbackUrl].filter(Boolean);
  for (const tryUrl of urls) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
        return await import(tryUrl);
      } catch (e) {
        lastError = e;
        console.warn(`Import attempt ${attempt + 1} failed for ${tryUrl}:`, e.message);
      }
    }
  }
  throw lastError;
}

async function createWithRetry(createFn, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      return await createFn();
    } catch (e) {
      lastError = e;
      console.warn(`Model load attempt ${attempt + 1} failed:`, e.message);
    }
  }
  throw lastError;
}

export async function initModels(delegate = 'GPU') {
  showLoading(true, 'Loading AI models...');

  if (!visionModule) {
    visionModule = await importWithRetry(
      VISION_BUNDLE_URL,
      SELF_HOSTED_FALLBACKS.VISION_BUNDLE_URL,
    );
  }
  const { FaceDetector, HandLandmarker, FilesetResolver } = visionModule;

  let filesetResolver;
  try {
    filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  } catch (e) {
    console.warn('CDN WASM failed, trying self-hosted:', e.message);
    filesetResolver = await FilesetResolver.forVisionTasks(SELF_HOSTED_FALLBACKS.MEDIAPIPE_WASM_URL);
  }

  showLoading(true, 'Loading hand tracking...');
  state.handLandmarker = await createWithRetry(async () => {
    try {
      return await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch (e) {
      // Fallback to self-hosted URL
      return await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: SELF_HOSTED_FALLBACKS.HAND_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }
  });

  showLoading(true, 'Loading face detection...');
  state.faceDetector = await createWithRetry(async () => {
    try {
      return await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    } catch (e) {
      // Fallback to self-hosted URL
      return await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: SELF_HOSTED_FALLBACKS.FACE_MODEL_URL, delegate },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });
    }
  });
}
