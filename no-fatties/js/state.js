export const state = {
  biteLimit: 10,
  biteCount: 0,
  currentScreen: 'setup',
  detecting: false,
  lastVideoTime: -1,
  lastDetectionTime: 0,

  // Gesture state machine
  gestureState: 'idle',
  cooldownTimer: null,

  // MediaPipe models
  handLandmarker: null,
  faceDetector: null,

  // Resources
  cameraStream: null,
  audioContext: null,
  alarmInterval: null,
  wakeLock: null,
};
