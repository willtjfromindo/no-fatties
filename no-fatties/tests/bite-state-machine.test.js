import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BiteStateMachine, isHandNearMouth, getProximityThreshold }
  from '../js/bite-state-machine.js';

// Helper: create a machine with fake timers
function createMachine(opts = {}) {
  let timerCallback = null;
  const sm = new BiteStateMachine(opts);
  sm._setTimeout = (fn) => { timerCallback = fn; return 1; };
  sm._clearTimeout = () => { timerCallback = null; };
  return { sm, fireTimer: () => { if (timerCallback) timerCallback(); } };
}

describe('BiteStateMachine', () => {
  it('starts in idle with 0 bites', () => {
    const sm = new BiteStateMachine();
    assert.equal(sm.state, 'idle');
    assert.equal(sm.biteCount, 0);
  });

  it('idle -> near_mouth on hand near mouth', () => {
    const sm = new BiteStateMachine();
    sm.update(true);
    assert.equal(sm.state, 'near_mouth');
    assert.equal(sm.biteCount, 1);
  });

  it('fires onBite callback with count', () => {
    let calledWith = null;
    const sm = new BiteStateMachine({ onBite: (c) => { calledWith = c; } });
    sm.update(true);
    assert.equal(calledWith, 1);
  });

  it('stays in near_mouth while hand remains', () => {
    const sm = new BiteStateMachine();
    sm.update(true);
    sm.update(true);
    sm.update(true);
    assert.equal(sm.state, 'near_mouth');
    assert.equal(sm.biteCount, 1);
  });

  it('near_mouth -> cooldown when hand leaves', () => {
    const { sm } = createMachine();
    sm.update(true);
    sm.update(false);
    assert.equal(sm.state, 'cooldown');
  });

  it('cooldown -> idle after timer fires', () => {
    const { sm, fireTimer } = createMachine();
    sm.update(true);
    sm.update(false);
    fireTimer();
    assert.equal(sm.state, 'idle');
  });

  it('re-entering during cooldown does NOT double-count', () => {
    const { sm } = createMachine();
    sm.update(true);   // bite 1
    sm.update(false);  // cooldown
    sm.update(true);   // back to near_mouth, no new bite
    assert.equal(sm.state, 'near_mouth');
    assert.equal(sm.biteCount, 1);
  });

  it('counts second bite after full cooldown cycle', () => {
    const { sm, fireTimer } = createMachine();
    sm.update(true);   // bite 1
    sm.update(false);  // cooldown
    fireTimer();       // idle
    sm.update(true);   // bite 2
    assert.equal(sm.biteCount, 2);
  });

  it('fires onLimitReached when limit hit', () => {
    let reached = false;
    const { sm, fireTimer } = createMachine({
      onLimitReached: () => { reached = true; },
    });
    sm.biteLimit = 2;
    sm.update(true);   // bite 1
    sm.update(false);
    fireTimer();
    sm.update(true);   // bite 2 = limit
    assert.ok(reached);
  });

  it('does NOT fire onLimitReached before limit', () => {
    let reached = false;
    const sm = new BiteStateMachine({
      onLimitReached: () => { reached = true; },
    });
    sm.biteLimit = 5;
    sm.update(true);
    assert.ok(!reached);
  });

  it('does not count when hand is not near mouth', () => {
    const sm = new BiteStateMachine();
    sm.update(false);
    sm.update(false);
    sm.update(false);
    assert.equal(sm.biteCount, 0);
    assert.equal(sm.state, 'idle');
  });

  it('reset clears state and count', () => {
    const sm = new BiteStateMachine();
    sm.update(true);
    sm.reset();
    assert.equal(sm.state, 'idle');
    assert.equal(sm.biteCount, 0);
  });

  it('resetGesture clears state but keeps count', () => {
    const sm = new BiteStateMachine();
    sm.update(true);
    sm.resetGesture();
    assert.equal(sm.state, 'idle');
    assert.equal(sm.biteCount, 1);
  });
});

describe('isHandNearMouth', () => {
  it('returns true for close fingertip', () => {
    assert.ok(isHandNearMouth({ x: 0.5, y: 0.5 }, [{ x: 0.51, y: 0.51 }], 0.1));
  });

  it('returns false for far fingertip', () => {
    assert.ok(!isHandNearMouth({ x: 0.5, y: 0.5 }, [{ x: 0.9, y: 0.9 }], 0.1));
  });

  it('returns false for empty fingertips', () => {
    assert.ok(!isHandNearMouth({ x: 0.5, y: 0.5 }, [], 0.1));
  });

  it('returns true if any fingertip is close', () => {
    const mouth = { x: 0.5, y: 0.5 };
    const fingers = [
      { x: 0.9, y: 0.9 },  // far
      { x: 0.51, y: 0.51 }, // close
      { x: 0.8, y: 0.8 },  // far
    ];
    assert.ok(isHandNearMouth(mouth, fingers, 0.1));
  });
});

describe('getProximityThreshold', () => {
  it('uses face bounding box when available', () => {
    const result = getProximityThreshold({ boundingBox: { width: 0.4 } }, 0.08, 0.25);
    assert.equal(result, 0.1);
  });

  it('uses fallback when no face', () => {
    assert.equal(getProximityThreshold(null, 0.08, 0.25), 0.08);
  });

  it('uses fallback when no bounding box', () => {
    assert.equal(getProximityThreshold({}, 0.08, 0.25), 0.08);
  });
});
