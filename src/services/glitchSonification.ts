import * as Tone from 'tone';
import type { TradeData } from '../types';

/**
 * Alva Noto / Unieqav-style minimal glitch sonification.
 *
 * - Buy → sub-bass kick (sine wave with fast pitch drop)
 * - Sell → high digital beep (clean sine click, 2-4kHz)
 * - Every trade fires immediately, no aggregation
 * - Trades with size > 0.01 BTC get routed through reverb with long decay
 */

const LARGE_TRADE_THRESHOLD = 0.01;

export interface GlitchEngine {
  start: () => Promise<void>;
  feedTrade: (trade: TradeData) => void;
  setVolume: (db: number) => void;
  dispose: () => void;
}

export function createGlitchEngine(): GlitchEngine {
  // ─── Effects: reverb only for large trades ───
  const reverb = new Tone.Reverb({ decay: 4, wet: 0.7 }).toDestination();

  // ─── Dry path: small trades go straight to output ───
  // ─── Wet path: large trades go through reverb ───

  // Sub-bass kick for BUY — MembraneSynth gives that Alva Noto sine-sub punch
  const kickDry = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.15, sustain: 0, release: 0.05 },
    volume: -8,
  }).toDestination();

  const kickWet = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.25, sustain: 0, release: 0.1 },
    volume: -6,
  }).connect(reverb);

  // High digital beep for SELL — ultra-short sine click
  const beepDry = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.01 },
    volume: -14,
  }).toDestination();

  const beepWet = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03 },
    volume: -10,
  }).connect(reverb);

  // Subtle noise click layer — adds that Raster-Noton texture
  const noiseSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.008, sustain: 0, release: 0.002 },
    volume: -28,
  }).toDestination();

  function playBuy(trade: TradeData) {
    const now = Tone.now();
    const isLarge = trade.size >= LARGE_TRADE_THRESHOLD;

    // Kick pitch: slightly varies with trade size for micro-variation
    const pitch = 30 + Math.min(trade.size * 200, 20); // 30-50 Hz range

    if (isLarge) {
      kickWet.triggerAttackRelease(pitch, '16n', now);
    } else {
      kickDry.triggerAttackRelease(pitch, '32n', now);
    }

    // Tiny noise click on every trade
    noiseSynth.triggerAttackRelease('64n', now);
  }

  function playSell(trade: TradeData) {
    const now = Tone.now();
    const isLarge = trade.size >= LARGE_TRADE_THRESHOLD;

    // Beep frequency: 2000-4000 Hz range, varies slightly
    const freq = 2400 + Math.min(trade.size * 8000, 1600);

    if (isLarge) {
      beepWet.triggerAttackRelease(freq, '32n', now);
    } else {
      beepDry.triggerAttackRelease(freq, '64n', now);
    }

    // Tiny noise click
    noiseSynth.triggerAttackRelease('64n', now);
  }

  async function start() {
    await Tone.start();
  }

  function feedTrade(trade: TradeData) {
    if (Tone.getContext().state !== 'running') return;

    // isBuyerMaker=true means the buyer was the maker (passive),
    // so the trade was initiated by a seller (aggressive sell)
    if (trade.isBuyerMaker) {
      playSell(trade);
    } else {
      playBuy(trade);
    }
  }

  function setVolume(db: number) {
    kickDry.volume.value = db - 2;
    kickWet.volume.value = db;
    beepDry.volume.value = db - 8;
    beepWet.volume.value = db - 4;
    noiseSynth.volume.value = db - 22;
  }

  function dispose() {
    kickDry.dispose();
    kickWet.dispose();
    beepDry.dispose();
    beepWet.dispose();
    noiseSynth.dispose();
    reverb.dispose();
  }

  return { start, feedTrade, setVolume, dispose };
}
