import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSonificationEngine,
  type SonificationEngine,
} from '../services/sonification';
import {
  createGlitchEngine,
  type GlitchEngine,
} from '../services/glitchSonification';
import type { TradeData } from '../types';

export function useSonification() {
  const [ambientOn, setAmbientOn] = useState(false);
  const [glitchOn, setGlitchOn] = useState(false);
  const [ambientVol, setAmbientVol] = useState(-10);
  const [glitchVol, setGlitchVol] = useState(-8);
  const [audioStarted, setAudioStarted] = useState(false);

  const ambientRef = useRef<SonificationEngine | null>(null);
  const glitchRef = useRef<GlitchEngine | null>(null);

  // Create both engines on mount
  useEffect(() => {
    ambientRef.current = createSonificationEngine();
    glitchRef.current = createGlitchEngine();

    return () => {
      ambientRef.current?.dispose();
      glitchRef.current?.dispose();
      ambientRef.current = null;
      glitchRef.current = null;
    };
  }, []);

  const ensureAudioStarted = useCallback(async () => {
    if (!audioStarted) {
      await ambientRef.current?.start();
      await glitchRef.current?.start();
      setAudioStarted(true);
    }
  }, [audioStarted]);

  const toggleAmbient = useCallback(async () => {
    await ensureAudioStarted();
    setAmbientOn((prev) => !prev);
  }, [ensureAudioStarted]);

  const toggleGlitch = useCallback(async () => {
    await ensureAudioStarted();
    setGlitchOn((prev) => !prev);
  }, [ensureAudioStarted]);

  const setAmbientVolume = useCallback((db: number) => {
    setAmbientVol(db);
    ambientRef.current?.setVolume(db);
  }, []);

  const setGlitchVolume = useCallback((db: number) => {
    setGlitchVol(db);
    glitchRef.current?.setVolume(db);
  }, []);

  const sonifyTrade = useCallback(
    (trade: TradeData) => {
      if (ambientOn && ambientRef.current) {
        ambientRef.current.feedTrade(trade);
      }
      if (glitchOn && glitchRef.current) {
        glitchRef.current.feedTrade(trade);
      }
    },
    [ambientOn, glitchOn],
  );

  return {
    ambientOn,
    glitchOn,
    ambientVol,
    glitchVol,
    toggleAmbient,
    toggleGlitch,
    setAmbientVolume,
    setGlitchVolume,
    sonifyTrade,
  };
}
