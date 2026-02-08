import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';

export function useTone() {
  const [isReady, setIsReady] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);

  useEffect(() => {
    synthRef.current = new Tone.Synth().toDestination();
    setIsReady(true);

    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
    };
  }, []);

  const startAudio = async () => {
    await Tone.start();
  };

  const playNote = (frequency: number, duration: string = '8n') => {
    if (synthRef.current && isReady) {
      synthRef.current.triggerAttackRelease(frequency, duration);
    }
  };

  return { isReady, startAudio, playNote };
}
