import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Song } from '../api/music';
import { supabase } from '../api/supabase';
import { useAuth } from './AuthContext';

interface PlayerContextValue {
  // Current state
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
  
  // Queue management
  queue: Song[];
  currentIndex: number;
  
  // Player modes
  isShuffled: boolean;
  repeatMode: 'off' | 'one' | 'all';
  
  // Playback controls
  play: (song: Song, songQueue?: Song[]) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  
  // Navigation controls
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  
  // Seek controls
  seekTo: (position: number) => Promise<void>;
  
  // Mode controls
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  
  // Queue controls
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  setQueue: (songs: Song[], startIndex?: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const soundRef = useRef<Audio.Sound | null>(null);
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);
  
  // Basic state
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Queue state
  const [queue, setQueue] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [originalQueue, setOriginalQueue] = useState<Song[]>([]);
  
  // Mode state
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');

  // Setup audio session
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };
    
    setupAudio();
    
    return () => {
      if (positionUpdateRef.current) {
        clearInterval(positionUpdateRef.current);
      }
    };
  }, []);

  // Position tracking
  const startPositionUpdates = () => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
    }
    
    positionUpdateRef.current = setInterval(async () => {
      if (soundRef.current && isPlaying) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis || 0);
            setDuration(status.durationMillis || 0);
            
            // Auto skip when song ends
            if (status.didJustFinish) {
              handleSongEnd();
            }
          }
        } catch (error) {
          console.error('Error getting playback status:', error);
        }
      }
    }, 1000);
  };

  const stopPositionUpdates = () => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }
  };

  // Handle song end
  const handleSongEnd = async () => {
    switch (repeatMode) {
      case 'one':
        await seekTo(0);
        break;
      case 'all':
        await skipNext();
        break;
      default:
        if (currentIndex < queue.length - 1) {
          await skipNext();
        } else {
          await stop();
        }
        break;
    }
  };

  // Get streaming URL
  const getStreamingUrl = async (song: Song): Promise<string> => {
    if (song.storage_path) {
      try {
        // Try to get signed URL from Supabase storage
        const { data, error } = await supabase.storage
          .from('songs')
          .createSignedUrl(song.storage_path, 3600); // 1 hour expiry
        
        if (data && !error) {
          return data.signedUrl;
        }
      } catch (error) {
        console.warn('Failed to get signed URL, falling back to file_url:', error);
      }
    }
    
    // Fallback to direct file URL or demo
    return song.file_url || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
  };

  // Track play analytics
  const trackPlay = async (song: Song) => {
    if (!user) return;
    
    try {
      await supabase.from('plays').insert({
        user_id: user.id,
        song_id: song.id,
        device_info: 'Mobile App',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  };

  const play = async (song: Song, songQueue?: Song[]) => {
    try {
      setIsLoading(true);
      
      // Stop current song if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        stopPositionUpdates();
      }

      // Setup queue if provided
      if (songQueue) {
        const newQueue = isShuffled ? shuffleArray([...songQueue]) : songQueue;
        setQueue(newQueue);
        setOriginalQueue(songQueue);
        const songIndex = newQueue.findIndex(s => s.id === song.id);
        setCurrentIndex(songIndex >= 0 ? songIndex : 0);
      } else if (queue.length === 0) {
        setQueue([song]);
        setOriginalQueue([song]);
        setCurrentIndex(0);
      }

      // Get streaming URL
      const streamUrl = await getStreamingUrl(song);
      
      const sound = new Audio.Sound();
      soundRef.current = sound;
      
      await sound.loadAsync({ uri: streamUrl });
      await sound.playAsync();
      
      setCurrentSong(song);
      setIsPlaying(true);
      setPosition(0);
      
      startPositionUpdates();
      
      // Track play analytics
      await trackPlay(song);
      
      console.log('Playing:', song.title);
    } catch (error) {
      console.error('Error playing song:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pause = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        stopPositionUpdates();
      }
    } catch (error) {
      console.error('Error pausing:', error);
    }
  };

  const resume = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        startPositionUpdates();
      }
    } catch (error) {
      console.error('Error resuming:', error);
    }
  };

  const stop = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setCurrentSong(null);
      setPosition(0);
      setDuration(0);
      stopPositionUpdates();
    } catch (error) {
      console.error('Error stopping:', error);
    }
  };

  const skipNext = async () => {
    if (queue.length === 0) return;
    
    let nextIndex = currentIndex + 1;
    
    // Handle repeat and end of queue
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        await stop();
        return;
      }
    }
    
    setCurrentIndex(nextIndex);
    await play(queue[nextIndex]);
  };

  const skipPrevious = async () => {
    if (queue.length === 0) return;
    
    // If more than 3 seconds played, restart current song
    if (position > 3000) {
      await seekTo(0);
      return;
    }
    
    let prevIndex = currentIndex - 1;
    
    // Handle beginning of queue
    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1;
      } else {
        await seekTo(0);
        return;
      }
    }
    
    setCurrentIndex(prevIndex);
    await play(queue[prevIndex]);
  };

  const seekTo = async (newPosition: number) => {
    try {
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(newPosition);
        setPosition(newPosition);
      }
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const toggleShuffle = () => {
    const newShuffled = !isShuffled;
    setIsShuffled(newShuffled);
    
    if (newShuffled) {
      // Shuffle the queue but keep current song at current position
      const currentSongInQueue = queue[currentIndex];
      const otherSongs = queue.filter((_, index) => index !== currentIndex);
      const shuffledOthers = shuffleArray(otherSongs);
      const newQueue = [currentSongInQueue, ...shuffledOthers];
      setQueue(newQueue);
      setCurrentIndex(0);
    } else {
      // Restore original queue order
      if (currentSong) {
        const originalIndex = originalQueue.findIndex(s => s.id === currentSong.id);
        setQueue([...originalQueue]);
        setCurrentIndex(originalIndex >= 0 ? originalIndex : 0);
      }
    }
  };

  const toggleRepeat = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
    const currentModeIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentModeIndex + 1) % modes.length];
    setRepeatMode(nextMode);
  };

  const addToQueue = (song: Song) => {
    setQueue(prev => [...prev, song]);
    if (originalQueue.length > 0) {
      setOriginalQueue(prev => [...prev, song]);
    }
  };

  const removeFromQueue = (index: number) => {
    if (index === currentIndex) return; // Can't remove currently playing song
    
    setQueue(prev => prev.filter((_, i) => i !== index));
    
    // Adjust current index if needed
    if (index < currentIndex) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const setQueueFunction = (songs: Song[], startIndex: number = 0) => {
    const newQueue = isShuffled ? shuffleArray([...songs]) : songs;
    setQueue(newQueue);
    setOriginalQueue(songs);
    setCurrentIndex(startIndex);
  };

  // Utility function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const value: PlayerContextValue = {
    // Current state
    currentSong,
    isPlaying,
    isLoading,
    position,
    duration,
    
    // Queue management
    queue,
    currentIndex,
    
    // Player modes
    isShuffled,
    repeatMode,
    
    // Playback controls
    play,
    pause,
    resume,
    stop,
    
    // Navigation controls
    skipNext,
    skipPrevious,
    
    // Seek controls
    seekTo,
    
    // Mode controls
    toggleShuffle,
    toggleRepeat,
    
    // Queue controls
    addToQueue,
    removeFromQueue,
    setQueue: setQueueFunction,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
};