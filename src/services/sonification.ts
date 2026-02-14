import * as Tone from 'tone';
import type { TradeData } from '../types';

// Mixolydian scale intervals (semitones from root): 1 2 3 4 5 6 b7
const MIXOLYDIAN_INTERVALS = [0, 2, 4, 5, 7, 9, 10];

function buildScale(rootMidi: number, octaves: number): number[] {
  const notes: number[] = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of MIXOLYDIAN_INTERVALS) {
      notes.push(rootMidi + oct * 12 + interval);
    }
  }
  return notes;
}

// C3 Mixolydian across 3 octaves for pads, higher range would be too bright
const SCALE = buildScale(48, 3); // C3–C5

// Whale trade threshold in BTC
const WHALE_THRESHOLD = 0.1;

export interface SonificationEngine {
  start: () => Promise<void>;
  feedTrade: (trade: TradeData) => void;
  setVolume: (db: number) => void;
  dispose: () => void;
}

export function createSonificationEngine(): SonificationEngine {
  // ─── Effects chain ───
  const reverb = new Tone.Reverb({ decay: 6, wet: 0.6 }).toDestination();
  const delay = new Tone.FeedbackDelay({
    delayTime: '4n',
    feedback: 0.3,
    wet: 0.25,
  }).connect(reverb);

  // ─── Ambient pad: slow-attack sine pad for the 1/sec pulse ───
  const padSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 1.2, decay: 2.0, sustain: 0.4, release: 3.0 },
    volume: -10,
  }).connect(delay);
  padSynth.maxPolyphony = 12;

  // ─── Harmony layer: triangle wave, slightly offset timing ───
  const harmonySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 1.5, decay: 2.5, sustain: 0.3, release: 4.0 },
    volume: -18,
  }).connect(reverb);
  harmonySynth.maxPolyphony = 8;

  // ─── Drone: low sustained bass that shifts with trend ───
  const droneSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 3, decay: 1, sustain: 1, release: 4 },
    volume: -16,
  }).connect(reverb);

  // ─── Whale bell: metallic singing-bowl sound for large trades ───
  const whaleSynth = new Tone.MetalSynth({
    envelope: { attack: 0.01, decay: 4, release: 3 },
    harmonicity: 3.1,
    modulationIndex: 16,
    resonance: 2000,
    octaves: 1.5,
    volume: -14,
  }).connect(delay);

  // ─── Trade aggregation state ───
  let tradeBuffer: TradeData[] = [];
  let pulseInterval: ReturnType<typeof setInterval> | null = null;
  let currentDroneNote: number | null = null;

  // Price tracking for relative mapping
  let priceMin = Infinity;
  let priceMax = -Infinity;

  function priceToScaleIndex(price: number): number {
    priceMin = Math.min(priceMin, price);
    priceMax = Math.max(priceMax, price);
    const range = Math.max(priceMax - priceMin, 100);
    const normalized = (price - priceMin) / range;
    const clamped = Math.max(0, Math.min(1, normalized));
    return Math.round(clamped * (SCALE.length - 1));
  }

  function getTriad(scaleIndex: number): number[] {
    const root = SCALE[scaleIndex];
    const third = SCALE[Math.min(scaleIndex + 2, SCALE.length - 1)];
    const fifth = SCALE[Math.min(scaleIndex + 4, SCALE.length - 1)];
    return [root, third, fifth];
  }

  function midiToFreq(midi: number): number {
    return Tone.Frequency(midi, 'midi').toFrequency();
  }

  // ─── Ambient pulse: called every ~1.5 seconds ───
  function playAmbientPulse() {
    if (Tone.getContext().state !== 'running') return;
    if (tradeBuffer.length === 0) return;

    // Aggregate: average price, total volume
    const avgPrice =
      tradeBuffer.reduce((sum, t) => sum + t.price, 0) / tradeBuffer.length;
    const tradeCount = tradeBuffer.length;
    tradeBuffer = [];

    const scaleIndex = priceToScaleIndex(avgPrice);
    const triad = getTriad(scaleIndex);
    const now = Tone.now();

    // Pad chord — duration scales with activity (more trades = fuller sound)
    const duration = tradeCount > 50 ? '2n' : tradeCount > 10 ? '1n' : '2n.';
    const padFreqs = triad.map(midiToFreq);
    padSynth.triggerAttackRelease(padFreqs, duration, now);

    // Harmony — just the third and fifth, offset slightly
    const harmonyFreqs = [triad[1], triad[2]].map(midiToFreq);
    harmonySynth.triggerAttackRelease(harmonyFreqs, duration, now + 0.3);

    // Update drone — shift the bass note slowly to follow the average price
    const droneNote = SCALE[Math.min(scaleIndex, 6)]; // keep in low octave
    const droneFreq = midiToFreq(droneNote - 12); // one octave below the scale
    if (currentDroneNote !== droneNote) {
      currentDroneNote = droneNote;
      droneSynth.triggerAttackRelease(droneFreq, '2m', now + 0.1);
    }
  }

  // ─── Whale alert: immediate singing-bowl hit ───
  function playWhaleAlert(trade: TradeData) {
    if (Tone.getContext().state !== 'running') return;
    const now = Tone.now();
    // Higher pitch for bigger trades, range 200-800 Hz
    const freq = Math.min(200 + trade.size * 100, 800);
    whaleSynth.triggerAttackRelease(freq, '4n', now);
  }

  // ─── Public API ───
  async function start() {
    await Tone.start();
    Tone.getTransport().bpm.value = 60;
    // Start the ambient pulse loop
    if (!pulseInterval) {
      pulseInterval = setInterval(playAmbientPulse, 1500);
    }
  }

  function feedTrade(trade: TradeData) {
    tradeBuffer.push(trade);

    // Whale trades get an immediate alert
    if (trade.size >= WHALE_THRESHOLD) {
      playWhaleAlert(trade);
    }
  }

  function setVolume(db: number) {
    padSynth.volume.value = db;
    harmonySynth.volume.value = db - 8;
    droneSynth.volume.value = db - 6;
    whaleSynth.volume.value = db - 4;
  }

  function dispose() {
    if (pulseInterval) {
      clearInterval(pulseInterval);
      pulseInterval = null;
    }
    padSynth.dispose();
    harmonySynth.dispose();
    droneSynth.dispose();
    whaleSynth.dispose();
    delay.dispose();
    reverb.dispose();
  }

  return { start, feedTrade, setVolume, dispose };
}
