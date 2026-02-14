import * as Tone from 'tone';
import type { TradeData } from '../types';

// Mixolydian scale intervals (semitones from root): 1 2 3 4 5 6 b7
const MIXOLYDIAN_INTERVALS = [0, 2, 4, 5, 7, 9, 10];

// Build a Mixolydian scale across multiple octaves as MIDI note numbers
function buildScale(rootMidi: number, octaves: number): number[] {
  const notes: number[] = [];
  for (let oct = 0; oct < octaves; oct++) {
    for (const interval of MIXOLYDIAN_INTERVALS) {
      notes.push(rootMidi + oct * 12 + interval);
    }
  }
  return notes;
}

// C3 = MIDI 48, spanning 4 octaves gives a nice range
const SCALE = buildScale(48, 4); // C3 Mixolydian up to C6

export interface SonificationEngine {
  start: () => Promise<void>;
  playTrade: (trade: TradeData) => void;
  setVolume: (db: number) => void;
  dispose: () => void;
}

export function createSonificationEngine(): SonificationEngine {
  // --- Signal chain: PolySynth -> Reverb -> Destination ---
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.35 }).toDestination();

  // Main melodic voice — warm FM synth
  const melodySynth = new Tone.PolySynth(Tone.FMSynth, {
    modulationIndex: 2,
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.8 },
    modulation: { type: 'sine' },
    oscillator: { type: 'sine' },
    volume: -6,
  }).connect(reverb);
  melodySynth.maxPolyphony = 8;

  // Harmony pad — softer, sustained
  const harmonySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.05, decay: 0.4, sustain: 0.3, release: 1.2 },
    volume: -14,
  }).connect(reverb);
  harmonySynth.maxPolyphony = 8;

  // Price tracking for relative mapping
  let priceMin = Infinity;
  let priceMax = -Infinity;

  function priceToScaleIndex(price: number): number {
    // Expand the observed range
    priceMin = Math.min(priceMin, price);
    priceMax = Math.max(priceMax, price);

    // Need some range to map — if prices are very close, use a $100 window
    const range = Math.max(priceMax - priceMin, 100);
    const normalized = (price - priceMin) / range; // 0..1
    const clamped = Math.max(0, Math.min(1, normalized));

    return Math.round(clamped * (SCALE.length - 1));
  }

  function sizeToDuration(size: number): string {
    // Larger trades → longer notes
    if (size >= 1) return '2n';     // whale trade
    if (size >= 0.1) return '4n';   // large
    if (size >= 0.01) return '8n';  // medium
    if (size >= 0.001) return '16n'; // small
    return '32n';                    // micro
  }

  function getHarmonyNotes(scaleIndex: number): number[] {
    // Build a triad from the Mixolydian scale: third (2 steps up) + fifth (4 steps up)
    const thirdIdx = Math.min(scaleIndex + 2, SCALE.length - 1);
    const fifthIdx = Math.min(scaleIndex + 4, SCALE.length - 1);
    return [SCALE[thirdIdx], SCALE[fifthIdx]];
  }

  async function start() {
    await Tone.start();
  }

  function playTrade(trade: TradeData) {
    if (Tone.getContext().state !== 'running') return;

    const scaleIndex = priceToScaleIndex(trade.price);
    const rootMidi = SCALE[scaleIndex];
    const duration = sizeToDuration(trade.size);
    const now = Tone.now();

    // Root melody note
    const rootFreq = Tone.Frequency(rootMidi, 'midi').toFrequency();
    melodySynth.triggerAttackRelease(rootFreq, duration, now);

    // Harmony notes (third + fifth in the Mixolydian scale)
    const harmonyMidis = getHarmonyNotes(scaleIndex);
    const harmonyFreqs = harmonyMidis.map((m) =>
      Tone.Frequency(m, 'midi').toFrequency(),
    );
    harmonySynth.triggerAttackRelease(harmonyFreqs, duration, now + 0.02);
  }

  function setVolume(db: number) {
    melodySynth.volume.value = db;
    harmonySynth.volume.value = db - 8; // harmony stays quieter
  }

  function dispose() {
    melodySynth.dispose();
    harmonySynth.dispose();
    reverb.dispose();
  }

  return { start, playTrade, setVolume, dispose };
}
