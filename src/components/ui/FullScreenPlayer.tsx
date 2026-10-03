import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { usePlayer } from '../../context/PlayerContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface FullScreenPlayerProps {
  visible: boolean;
  onClose: () => void;
}

export default function FullScreenPlayer({ visible, onClose }: FullScreenPlayerProps) {
  const insets = useSafeAreaInsets();
  const [showQueue, setShowQueue] = useState(false);
  
  const {
    currentSong,
    isPlaying,
    isLoading,
    position,
    duration,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    pause,
    resume,
    skipNext,
    skipPrevious,
    seekTo,
    toggleShuffle,
    toggleRepeat,
    play,
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

  const handleSkipPrevious = async () => {
    await skipPrevious();
  };

  const handleSeek = async (value: number) => {
    await seekTo(value);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return 'repeat-outline';
      case 'all':
        return 'repeat';
      default:
        return 'repeat-outline';
    }
  };

  const getRepeatColor = () => {
    return repeatMode !== 'off' ? '#1DB954' : '#b3b3b3';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Background with blur effect */}
        <Image
          source={{ 
            uri: currentSong.cover_url || 'https://via.placeholder.com/400x400/333/fff?text=♪' 
          }}
          style={styles.backgroundImage}
          blurRadius={20}
        />
        
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
            style={StyleSheet.absoluteFillObject}
          />
        </BlurView>

        {/* Content */}
        <View style={[styles.content, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>PLAYING FROM PLAYLIST</Text>
              <Text style={styles.headerSubtitle}>Your Library</Text>
            </View>
            
            <TouchableOpacity 
              onPress={() => setShowQueue(!showQueue)} 
              style={styles.queueButton}
            >
              <Ionicons name="list" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {showQueue ? (
            // Queue view
            <ScrollView style={styles.queueContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.queueTitle}>Next in queue</Text>
              {queue.slice(currentIndex + 1).map((song, index) => (
                <TouchableOpacity 
                  key={song.id}
                  style={styles.queueItem}
                  onPress={() => play(song)}
                >
                  <Image
                    source={{ 
                      uri: song.cover_url || 'https://via.placeholder.com/50x50/333/fff?text=♪' 
                    }}
                    style={styles.queueItemCover}
                  />
                  <View style={styles.queueItemInfo}>
                    <Text style={styles.queueItemTitle} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text style={styles.queueItemArtist} numberOfLines={1}>
                      {song.artists?.name || 'Unknown Artist'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            // Player view
            <View style={styles.playerContainer}>
              {/* Album artwork */}
              <View style={styles.artworkContainer}>
                <Image
                  source={{ 
                    uri: currentSong.cover_url || 'https://via.placeholder.com/300x300/333/fff?text=♪' 
                  }}
                  style={styles.artwork}
                />
              </View>

              {/* Song info */}
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {currentSong.title}
                </Text>
                <Text style={styles.artistName} numberOfLines={1}>
                  {currentSong.artists?.name || 'Unknown Artist'}
                </Text>
              </View>

              {/* Progress slider */}
              <View style={styles.progressContainer}>
                <TouchableOpacity
                  style={styles.progressBar}
                  onPress={(e) => {
                    const { locationX } = e.nativeEvent;
                    const progressBarWidth = width - 40; // Account for padding
                    const newPosition = (locationX / progressBarWidth) * duration;
                    handleSeek(newPosition);
                  }}
                  activeOpacity={1}
                >
                  <View style={styles.progressBackground}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                      ]} 
                    />
                    <View 
                      style={[
                        styles.progressThumb,
                        { left: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
                <View style={styles.timeLabels}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              {/* Main controls */}
              <View style={styles.mainControls}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={toggleShuffle}
                >
                  <Ionicons
                    name="shuffle"
                    size={24}
                    color={isShuffled ? '#1DB954' : '#b3b3b3'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkipPrevious}
                >
                  <Ionicons name="play-skip-back" size={32} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.playButton}
                  onPress={handlePlayPause}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={isLoading ? 'ellipse' : (isPlaying ? 'pause' : 'play')}
                    size={32}
                    color="#000"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkipNext}
                >
                  <Ionicons name="play-skip-forward" size={32} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={toggleRepeat}
                >
                  <Ionicons
                    name={getRepeatIcon()}
                    size={24}
                    color={getRepeatColor()}
                  />
                </TouchableOpacity>
              </View>

              {/* Secondary controls */}
              <View style={styles.secondaryControls}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="heart-outline" size={24} color="#b3b3b3" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="share-outline" size={24} color="#b3b3b3" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: width * 1.2,
    height: height * 1.2,
    top: -height * 0.1,
    left: -width * 0.1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#b3b3b3',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  queueButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  artwork: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 16,
  },
  songInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
  },
  songTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    color: '#b3b3b3',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 30,
  },
  progressBar: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  progressBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#1DB954',
    borderRadius: 6,
    marginLeft: -6,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 60,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  queueContainer: {
    flex: 1,
    marginTop: 20,
  },
  queueTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  queueItemCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  queueItemArtist: {
    color: '#b3b3b3',
    fontSize: 14,
  },
});