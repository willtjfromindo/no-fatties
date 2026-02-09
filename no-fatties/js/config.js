// Detection timing
export const COOLDOWN_MS = 300;
export const TARGET_FPS = 15;
export const FRAME_INTERVAL = 1000 / TARGET_FPS;

// Adaptive FPS
export const MIN_FPS = 5;
export const MAX_FPS = 24;
export const FPS_ADJUST_INTERVAL = 30;
export const FPS_HEADROOM = 0.8;

// Proximity thresholds
export const FALLBACK_THRESHOLD = 0.08;
export const FACE_WIDTH_MULTIPLIER = 0.25;

// Audio
export const ALARM_FREQ_HIGH = 800;
export const ALARM_FREQ_LOW = 600;
export const ALARM_GAIN = 0.7;
export const ALARM_TONE_DURATION = 0.3;
export const ALARM_CYCLE_MS = 650;

// Camera
export const CAMERA_WIDTH = 640;
export const CAMERA_HEIGHT = 480;

// Self-hosted paths (bundled with app, used as primary on native)
const LOCAL_VISION_BUNDLE = '/models/vision_bundle.mjs';
const LOCAL_WASM = '/models/wasm';
const LOCAL_HAND_MODEL = '/models/hand_landmarker.task';
const LOCAL_FACE_MODEL = '/models/blaze_face_short_range.tflite';

// CDN paths (version-pinned, used as primary on web)
const CDN_VISION_BUNDLE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/vision_bundle.mjs';
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm';
const CDN_HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task';
const CDN_FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite';

// On native (Capacitor), use local files first (already in app bundle).
// On web, use CDN first with local fallback.
const isNative = typeof window !== 'undefined' && !!window.Capacitor;

export const VISION_BUNDLE_URL = isNative ? LOCAL_VISION_BUNDLE : CDN_VISION_BUNDLE;
export const MEDIAPIPE_WASM_URL = isNative ? LOCAL_WASM : CDN_WASM;
export const HAND_MODEL_URL = isNative ? LOCAL_HAND_MODEL : CDN_HAND_MODEL;
export const FACE_MODEL_URL = isNative ? LOCAL_FACE_MODEL : CDN_FACE_MODEL;

export const SELF_HOSTED_FALLBACKS = {
  VISION_BUNDLE_URL: isNative ? CDN_VISION_BUNDLE : LOCAL_VISION_BUNDLE,
  MEDIAPIPE_WASM_URL: isNative ? CDN_WASM : LOCAL_WASM,
  HAND_MODEL_URL: isNative ? CDN_HAND_MODEL : LOCAL_HAND_MODEL,
  FACE_MODEL_URL: isNative ? CDN_FACE_MODEL : LOCAL_FACE_MODEL,
};
