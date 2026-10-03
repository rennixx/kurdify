import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayer } from '../../context/PlayerContext';

const { width } = Dimensions.get('window');

interface MiniPlayerProps {
  onPress: () => void;
}

export default function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { 
    currentSong, 
    isPlaying, 
    isLoading, 
    pause, 
    resume, 
    skipNext,
    position,
    duration 
  } = usePlayer();

  if (!currentSong) {
    return null;
  }

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  const handleSkipNext = async () => {
    await skipNext();
  };

  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View 
            style={[
              styles.progressFill,
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Main content */}
      <LinearGradient
        colors={['rgba(40, 40, 40, 0.98)', 'rgba(20, 20, 20, 0.98)']}
        style={styles.content}
      >
        <TouchableOpacity 
          style={styles.songInfo} 
          onPress={onPress}
          activeOpacity={0.8}
        >
          {/* Album cover */}
          <Image
            source={{ 
              uri: currentSong.cover_url || 'https://via.placeholder.com/50x50/333/fff?text=♪' 
            }}
            style={styles.albumCover}
          />

          {/* Song details */}
          <View style={styles.songDetails}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {currentSong.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {currentSong.artists?.name || 'Unknown Artist'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handlePlayPause}
            disabled={isLoading}
          >
            <Ionicons
              name={isLoading ? 'ellipse' : (isPlaying ? 'pause' : 'play')}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleSkipNext}
          >
            <Ionicons
              name="play-skip-forward"
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above navigation tabs
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  progressContainer: {
    height: 2,
    backgroundColor: 'transparent',
  },
  progressBackground: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#1DB954',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  albumCover: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistName: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});