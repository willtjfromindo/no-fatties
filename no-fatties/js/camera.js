import { state } from './state.js';
import { dom } from './ui.js';
import { CAMERA_WIDTH, CAMERA_HEIGHT } from './config.js';

export async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: CAMERA_WIDTH }, height: { ideal: CAMERA_HEIGHT } },
    audio: false,
  });
  dom.camera.srcObject = stream;
  state.cameraStream = stream;
  await dom.camera.play();
}

export function stopCamera() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(t => t.stop());
    state.cameraStream = null;
    dom.camera.srcObject = null;
  }
}
