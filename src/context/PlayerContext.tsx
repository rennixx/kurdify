import React, { createContext, useContext, useState } from 'react';
import * as playback from '../services/playbackService';

type PlayerContextValue = {
  playing: boolean;
  play: (uri: string) => Promise<void>;
  stop: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState<any>(null);

  async function play(uri: string) {
    const s = await playback.loadAndPlay(uri);
    setSound(s);
    setPlaying(true);
  }

  async function stop() {
    await playback.stopSound(sound);
    setPlaying(false);
    setSound(null);
  }

  return <PlayerContext.Provider value={{ playing, play, stop }}>{children}</PlayerContext.Provider>;
};

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
