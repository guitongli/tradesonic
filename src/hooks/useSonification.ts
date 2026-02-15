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

export type SoundMode = 'ambient' | 'glitch';

type Engine = SonificationEngine | GlitchEngine;

export function useSonification() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<SoundMode>('glitch');
  const [audioStarted, setAudioStarted] = useState(false);
  const engineRef = useRef<Engine | null>(null);

  // Create/swap engine when mode changes
  useEffect(() => {
    engineRef.current?.dispose();
    engineRef.current =
      mode === 'ambient' ? createSonificationEngine() : createGlitchEngine();

    // If audio was already started, re-start the new engine
    if (audioStarted) {
      engineRef.current.start();
    }

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSound = useCallback(async () => {
    if (!audioStarted && engineRef.current) {
      await engineRef.current.start();
      setAudioStarted(true);
    }
    setEnabled((prev) => !prev);
  }, [audioStarted]);

  const switchMode = useCallback((newMode: SoundMode) => {
    setMode(newMode);
  }, []);

  const sonifyTrade = useCallback(
    (trade: TradeData) => {
      if (enabled && engineRef.current) {
        engineRef.current.feedTrade(trade);
      }
    },
    [enabled],
  );

  const setVolume = useCallback((db: number) => {
    engineRef.current?.setVolume(db);
  }, []);

  return { enabled, mode, toggleSound, switchMode, sonifyTrade, setVolume };
}
