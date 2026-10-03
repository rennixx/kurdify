import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/ui';
import PlaylistCreateModal from '../components/ui/PlaylistCreateModal';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { 
  Song,
  Album,
  Artist,
  getFeaturedSongs 
} from '../api/music';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Simple playlist interface for demo
interface Playlist {
  id: string;
  name: string;
  cover_url?: string;
  song_count?: number;
}

const { width } = Dimensions.get('window');

type LibrarySection = {
  type: 'header' | 'quickAccess' | 'sectionTitle' | 'playlists' | 'likedSongs' | 'empty';
  data?: any;
  title?: string;
};

export default function LibraryScreen() {
  const { user } = useAuth();
  const { play, currentSong, isPlaying, isLoading } = usePlayer();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistModalVisible, setPlaylistModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      loadLibraryData();
    }
  }, [user]);

  async function loadLibraryData() {
    if (!user) return;
    
    try {
      // For now, just fetch some basic data that exists in the database
      // We'll use recent songs instead of user-specific data until those tables are created
      const songs = await getFeaturedSongs(10);
      
      // Set as "liked" songs for demo purposes
      setLikedSongs(songs || []);
      // Set empty playlists for now
      setPlaylists([]);
    } catch (error) {
      console.error('Error loading library data:', error);
      // Set empty arrays for demo
      setPlaylists([]);
      setLikedSongs([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePlaylistCreated(newPlaylist: Playlist) {
    setPlaylists(prev => [newPlaylist, ...prev]);
  }

  const sections: LibrarySection[] = [
    { type: 'header' },
    { type: 'quickAccess' },
    { type: 'sectionTitle', title: 'Recently Played' },
    ...(likedSongs.length > 0 
      ? likedSongs.slice(0, 5).map(song => ({ type: 'likedSongs' as const, data: song }))
      : [{ type: 'empty' as const, title: 'No recent songs' }]
    ),
    { type: 'sectionTitle', title: 'Your Playlists' },
    ...(playlists.length > 0
      ? playlists.map(playlist => ({ type: 'playlists' as const, data: playlist }))
      : [{ type: 'empty' as const, title: 'No playlists yet' }]
    ),
  ];

  const renderItem = ({ item }: { item: LibrarySection }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Image
                source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/40' }}
                style={styles.avatar}
              />
              <Text style={styles.title}>Your Library</Text>
            </View>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case 'quickAccess':
        return (
          <View style={styles.quickAccess}>
            {/* Liked Songs */}
            <TouchableOpacity style={styles.quickAccessItem}>
              <GlassCard style={styles.quickAccessCard} variant="spotify" intensity={5}>
                <LinearGradient
                  colors={['#1db954', '#1ed760']}
                  style={styles.likedSongsIcon}
                >
                  <Ionicons name="heart" size={20} color="#fff" />
                </LinearGradient>
                <View style={styles.quickAccessInfo}>
                  <Text style={styles.quickAccessTitle}>Liked Songs</Text>
                  <Text style={styles.quickAccessSubtitle}>
                    {likedSongs.length} songs
                  </Text>
                </View>
              </GlassCard>
            </TouchableOpacity>

            {/* Downloaded */}
            <TouchableOpacity style={styles.quickAccessItem}>
              <GlassCard style={styles.quickAccessCard} variant="spotify" intensity={5}>
                <View style={styles.downloadedIcon}>
                  <Ionicons name="download" size={20} color="#1db954" />
                </View>
                <View style={styles.quickAccessInfo}>
                  <Text style={styles.quickAccessTitle}>Downloaded</Text>
                  <Text style={styles.quickAccessSubtitle}>0 songs</Text>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        );

      case 'sectionTitle':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.title === 'Your Playlists' ? (
              <TouchableOpacity 
                style={styles.createPlaylistButton}
                onPress={() => setPlaylistModalVisible(true)}
              >
                <Ionicons name="add" size={20} color="#1db954" />
                <Text style={styles.createPlaylistText}>Create</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'likedSongs':
        const song = item.data as Song;
        return (
          <TouchableOpacity style={styles.songItem}>
            <GlassCard style={styles.songCard} variant="spotify" intensity={3}>
              <Image
                source={{ 
                  uri: song.cover_url || song.albums?.cover_url || 'https://via.placeholder.com/60' 
                }}
                style={styles.songImage}
              />
              <View style={styles.songInfo}>
                <Text style={styles.songTitle} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={styles.songArtist} numberOfLines={1}>
                  {song.artists?.name || 'Unknown Artist'}
                </Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
              </TouchableOpacity>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'playlists':
        const playlist = item.data as Playlist;
        return (
          <TouchableOpacity style={styles.playlistItem}>
            <GlassCard style={styles.playlistCard} variant="spotify" intensity={3}>
              <Image
                source={{ uri: playlist.cover_url || 'https://via.placeholder.com/60' }}
                style={styles.playlistImage}
              />
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistSubtitle} numberOfLines={1}>
                  {playlist.song_count || 0} songs
                </Text>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
              </TouchableOpacity>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'empty':
        return (
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard} variant="spotify" intensity={5}>
              <Ionicons name="musical-notes" size={40} color="#888" />
              <Text style={styles.emptyText}>{item.title}</Text>
              <Text style={styles.emptySubtext}>
                Start exploring to build your library
              </Text>
            </GlassCard>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <GlassCard style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading your library...</Text>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <GlassCard style={styles.loadingCard}>
            <Ionicons name="library" size={40} color="#888" />
            <Text style={styles.loadingText}>Please sign in</Text>
            <Text style={styles.emptySubtext}>
              Sign in to view your music library
            </Text>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlatList
        data={sections}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer, 
          { 
            paddingTop: Math.max(insets.top + 20, 40),
            paddingBottom: Math.max(insets.bottom + 100, 120)
          }
        ]}
      />

      {/* Playlist Create Modal */}
      <PlaylistCreateModal
        visible={playlistModalVisible}
        onClose={() => setPlaylistModalVisible(false)}
        onSuccess={handlePlaylistCreated}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  searchButton: {
    padding: 4,
  },
  quickAccess: {
    marginBottom: 30,
  },
  quickAccessItem: {
    marginBottom: 12,
  },
  quickAccessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  likedSongsIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadedIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessInfo: {
    flex: 1,
  },
  quickAccessTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  quickAccessSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  seeAll: {
    color: '#1db954',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.05,
  },
  songItem: {
    marginBottom: 8,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  songArtist: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  moreButton: {
    padding: 8,
  },
  playlistItem: {
    marginBottom: 8,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  playlistSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    minWidth: width * 0.8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0.05,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1db954',
    shadowColor: '#1db954',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createPlaylistText: {
    color: '#1db954',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.1,
  },
});