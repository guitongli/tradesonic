import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createSonificationEngine,
  type SonificationEngine,
} from '../services/sonification';
import type { TradeData } from '../types';

export function useSonification() {
  const [enabled, setEnabled] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);
  const engineRef = useRef<SonificationEngine | null>(null);

  useEffect(() => {
    engineRef.current = createSonificationEngine();
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const toggleSound = useCallback(async () => {
    if (!audioStarted && engineRef.current) {
      await engineRef.current.start();
      setAudioStarted(true);
    }
    setEnabled((prev) => !prev);
  }, [audioStarted]);

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

  return { enabled, toggleSound, sonifyTrade, setVolume };
}
