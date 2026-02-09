/**
 * Pure bite detection state machine. No DOM dependencies.
 * States: 'idle' -> 'near_mouth' -> 'cooldown' -> 'idle'
 */
export class BiteStateMachine {
  constructor({ cooldownMs = 300, onBite = null, onLimitReached = null } = {}) {
    this.cooldownMs = cooldownMs;
    this.onBite = onBite;
    this.onLimitReached = onLimitReached;

    this.state = 'idle';
    this.biteCount = 0;
    this.biteLimit = Infinity;
    this.cooldownTimer = null;

    // Injectable timer functions for testing
    this._setTimeout = (fn, ms) => setTimeout(fn, ms);
    this._clearTimeout = (id) => clearTimeout(id);
  }

  reset() {
    this.state = 'idle';
    this.biteCount = 0;
    if (this.cooldownTimer !== null) {
      this._clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  resetGesture() {
    this.state = 'idle';
    if (this.cooldownTimer !== null) {
      this._clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  /**
   * @param {boolean} nearMouth - whether hand is near mouth this frame
   */
  update(nearMouth) {
    switch (this.state) {
      case 'idle':
        if (nearMouth) {
          this.biteCount++;
          this.state = 'near_mouth';
          if (this.onBite) this.onBite(this.biteCount);
          if (this.biteCount >= this.biteLimit && this.onLimitReached) {
            this.onLimitReached();
          }
        }
        break;

      case 'near_mouth':
        if (!nearMouth) {
          this.state = 'cooldown';
          this.cooldownTimer = this._setTimeout(() => {
            this.state = 'idle';
            this.cooldownTimer = null;
          }, this.cooldownMs);
        }
        break;

      case 'cooldown':
        if (nearMouth) {
          this._clearTimeout(this.cooldownTimer);
          this.cooldownTimer = null;
          this.state = 'near_mouth';
        }
        break;
    }
  }
}

// Proximity helpers (pure functions)

export function getProximityThreshold(faceDetection, fallback, multiplier) {
  if (!faceDetection || !faceDetection.boundingBox) return fallback;
  return faceDetection.boundingBox.width * multiplier;
}

export function isHandNearMouth(mouthPos, fingertips, threshold) {
  const thresholdSq = threshold * threshold;
  for (const tip of fingertips) {
    const dx = tip.x - mouthPos.x;
    const dy = tip.y - mouthPos.y;
    if (dx * dx + dy * dy < thresholdSq) return true;
  }
  return false;
}
