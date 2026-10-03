import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '../components/ui';
import { 
  getFeaturedSongs, 
  getRecentAlbums, 
  getTopArtists,
  Song,
  Album,
  Artist 
} from '../api/music';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type HomeSection = {
  type: 'header' | 'quickActions' | 'sectionTitle' | 'featuredSongs' | 'albums' | 'artists';
  data?: any;
  title?: string;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { play, currentSong, isPlaying, isLoading } = usePlayer();
  const navigation = useNavigation();
  const [featuredSongs, setFeaturedSongs] = useState<Song[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<Album[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [recommendations, setRecommendations] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGreeting, setUserGreeting] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadHomeData();
    setUserGreeting(getPersonalizedGreeting());
  }, [user]);

  async function loadHomeData() {
    try {
      const [songs, albums, artists] = await Promise.all([
        getFeaturedSongs(8),
        getRecentAlbums(6),
        getTopArtists(8)
      ]);
      
      setFeaturedSongs(songs);
      setRecentAlbums(albums);
      setTopArtists(artists);
      
      // Load personalized content if user is logged in
      if (user) {
        await loadPersonalizedContent();
      }
    } catch (error) {
      console.error('Error loading home data:', error);
      // For demo purposes, set empty arrays if no data
      setFeaturedSongs([]);
      setRecentAlbums([]);
      setTopArtists([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPersonalizedContent() {
    try {
      // For demo, we'll use featured songs as recommendations
      // In a real app, this would be based on user listening history
      const recommendedSongs = await getFeaturedSongs(5);
      setRecommendations(recommendedSongs);
      
      // Simulate recently played (in real app, this would come from user data)
      const recentSongs = featuredSongs.slice(0, 3);
      setRecentlyPlayed(recentSongs);
    } catch (error) {
      console.error('Error loading personalized content:', error);
    }
  }

  function getPersonalizedGreeting(): string {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Music Lover';
    
    if (hour < 12) {
      return `Good morning, ${userName}`;
    } else if (hour < 18) {
      return `Good afternoon, ${userName}`;
    } else {
      return `Good evening, ${userName}`;
    }
  }

  async function handlePlaySong(song: Song, songList?: Song[]) {
    try {
      // If songList provided, use it as queue, otherwise use featured songs as default queue
      const queue = songList || featuredSongs;
      await play(song, queue);
      
      // Add to recently played (in real app, this would be saved to backend)
      setRecentlyPlayed(prev => {
        const filtered = prev.filter(s => s.id !== song.id);
        return [song, ...filtered.slice(0, 4)];
      });
    } catch (error) {
      console.error('Error playing song:', error);
    }
  }

  function getListeningStats() {
    if (!user) return null;
    
    return {
      totalSongs: recentlyPlayed.length + featuredSongs.length,
      totalTime: '2h 34m', // Demo data
      favoriteGenre: 'Kurdish Folk'
    };
  }

  // Create sections for the main FlatList
  const sections: HomeSection[] = [
    { type: 'header' },
    { type: 'quickActions' },
    ...(user && recentlyPlayed.length > 0 ? [
      { type: 'sectionTitle' as const, title: 'Recently Played' },
      ...recentlyPlayed.map(song => ({ type: 'featuredSongs' as const, data: song }))
    ] : []),
    ...(user && recommendations.length > 0 ? [
      { type: 'sectionTitle' as const, title: 'Made For You' },
      ...recommendations.slice(0, 3).map(song => ({ type: 'featuredSongs' as const, data: song }))
    ] : []),
    { type: 'sectionTitle', title: 'Featured Songs' },
    ...featuredSongs.slice(0, 4).map(song => ({ type: 'featuredSongs' as const, data: song })),
    { type: 'sectionTitle', title: 'Recent Albums' },
    { type: 'albums', data: recentAlbums },
    { type: 'sectionTitle', title: 'Top Artists' },
    { type: 'artists', data: topArtists },
  ];

  const renderItem = ({ item }: { item: HomeSection }) => {
    switch (item.type) {
      case 'header':
        return (
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {userGreeting}
            </Text>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <Image
                source={{ 
                  uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/32'
                }}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          </View>
        );

      case 'quickActions':
        const stats = getListeningStats();
        return (
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Library' as never)}
            >
              <GlassCard style={styles.quickActionCard} variant="spotify" intensity={5}>
                <View style={styles.quickActionContent}>
                  <Ionicons name="heart" size={24} color="#1db954" />
                  <View style={styles.quickActionInfo}>
                    <Text style={styles.quickActionText}>Liked Songs</Text>
                    {user && <Text style={styles.quickActionSubtext}>{recentlyPlayed.length} songs</Text>}
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => navigation.navigate('Library' as never)}
            >
              <GlassCard style={styles.quickActionCard} variant="spotify" intensity={5}>
                <View style={styles.quickActionContent}>
                  <Ionicons name="time" size={24} color="#1db954" />
                  <View style={styles.quickActionInfo}>
                    <Text style={styles.quickActionText}>Recently Played</Text>
                    {stats && <Text style={styles.quickActionSubtext}>{stats.totalTime} today</Text>}
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        );

      case 'sectionTitle':
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
        );

      case 'featuredSongs':
        const song = item.data as Song;
        const isCurrentSong = currentSong?.id === song.id;
        return (
          <TouchableOpacity
            style={[styles.songCard, isCurrentSong && styles.songCardActive]}
            onPress={() => handlePlaySong(song, featuredSongs)}
            activeOpacity={0.7}
          >
            <GlassCard 
              style={[
                styles.songCardInner, 
                isCurrentSong && styles.songCardInnerActive
              ] as any} 
              variant="spotify" 
              intensity={isCurrentSong ? 8 : 3}
            >
              <View style={styles.songImageContainer}>
                <Image
                  source={{ 
                    uri: song.cover_url || song.albums?.cover_url || 'https://via.placeholder.com/50' 
                  }}
                  style={[styles.songImage, isCurrentSong && styles.songImageActive]}
                />
                {isCurrentSong && (
                  <View style={styles.nowPlayingIndicator}>
                    <View style={[styles.nowPlayingBar, styles.bar1]} />
                    <View style={[styles.nowPlayingBar, styles.bar2]} />
                    <View style={[styles.nowPlayingBar, styles.bar3]} />
                  </View>
                )}
              </View>
              <View style={styles.songInfo}>
                <Text style={[styles.songTitle, isCurrentSong && styles.songTitleActive]} numberOfLines={1}>
                  {song.title}
                </Text>
                <Text style={[styles.songArtist, isCurrentSong && styles.songArtistActive]} numberOfLines={1}>
                  {song.artists?.name || 'Unknown Artist'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.playButton, isCurrentSong && styles.playButtonActive]}
                onPress={(e) => {
                  e.stopPropagation();
                  handlePlaySong(song, featuredSongs);
                }}
              >
                <View style={styles.playButtonInner}>
                  {isLoading && isCurrentSong ? (
                    <Ionicons name="refresh" size={20} color={isCurrentSong ? "#000" : "#1db954"} />
                  ) : isPlaying && isCurrentSong ? (
                    <Ionicons name="pause" size={20} color={isCurrentSong ? "#000" : "#1db954"} />
                  ) : (
                    <Ionicons name="play" size={20} color={isCurrentSong ? "#000" : "#1db954"} />
                  )}
                </View>
              </TouchableOpacity>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'albums':
        return (
          <FlatList
            data={item.data}
            renderItem={({ item: album }) => (
              <TouchableOpacity
                style={styles.albumCard}
                onPress={() => console.log('Opening album:', album.title)}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.albumCardInner} variant="spotify" intensity={4}>
                  <View style={styles.albumImageContainer}>
                    <Image
                      source={{ uri: album.cover_url || 'https://via.placeholder.com/100' }}
                      style={styles.albumImage}
                    />
                    <View style={styles.albumOverlay}>
                      <Ionicons name="play-circle" size={24} color="#fff" style={styles.albumPlayIcon} />
                    </View>
                  </View>
                  <View style={styles.albumTextContainer}>
                    <Text style={styles.albumTitle} numberOfLines={1}>
                      {album.title}
                    </Text>
                    <Text style={styles.albumArtist} numberOfLines={1}>
                      {album.artists?.name || 'Unknown Artist'}
                    </Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            )}
            keyExtractor={(album) => album.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        );

      case 'artists':
        return (
          <FlatList
            data={item.data}
            renderItem={({ item: artist }) => (
              <TouchableOpacity
                style={styles.artistCard}
                onPress={() => console.log('Opening artist:', artist.name)}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.artistCardInner} variant="spotify" intensity={4}>
                  <View style={styles.artistImageContainer}>
                    <Image
                      source={{ uri: artist.image_url || 'https://via.placeholder.com/70' }}
                      style={styles.artistImage}
                    />
                    <View style={styles.artistBadge}>
                      <Ionicons name="musical-note" size={12} color="#1db954" />
                    </View>
                  </View>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistType}>Artist</Text>
                </GlassCard>
              </TouchableOpacity>
            )}
            keyExtractor={(artist) => artist.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
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
            <Text style={styles.loadingText}>Loading your music...</Text>
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
    </LinearGradient>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 180, // Account for MiniPlayer (70px) + TabBar (90px) + extra space
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
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 10,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.2,
  },
  profileButton: {
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 20,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1db954',
  },
  quickActions: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 12,
  },
  quickAction: {
    flex: 1,
  },
  quickActionCard: {
    padding: 20,
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quickActionInfo: {
    flex: 1,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  quickActionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
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
  },
  songCard: {
    marginBottom: 12,
    marginHorizontal: 4,
  },
  songCardActive: {
    transform: [{ scale: 1.02 }],
  },
  songCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  songCardInnerActive: {
    borderColor: '#1db954',
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    shadowColor: '#1db954',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  songImageContainer: {
    position: 'relative',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  songImageActive: {
    borderWidth: 2,
    borderColor: '#1db954',
  },
  nowPlayingIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  nowPlayingBar: {
    width: 2,
    backgroundColor: '#1db954',
    borderRadius: 1,
  },
  bar1: {
    height: 8,
  },
  bar2: {
    height: 12,
  },
  bar3: {
    height: 6,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  songTitleActive: {
    color: '#1db954',
  },
  songArtist: {
    color: '#b3b3b3',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  songArtistActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  playButton: {
    padding: 0,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonActive: {
    shadowColor: '#1db954',
    shadowOpacity: 0.5,
  },
  playButtonInner: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  albumCard: {
    width: 150,
    marginRight: 16,
  },
  albumCardInner: {
    padding: 16,
    alignItems: 'center',
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
  albumImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  albumImage: {
    width: 110,
    height: 110,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  albumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  albumPlayIcon: {
    opacity: 0.8,
  },
  albumTextContainer: {
    width: '100%',
    alignItems: 'center',
  },
  albumTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  albumArtist: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  artistCard: {
    width: 110,
    marginRight: 16,
  },
  artistCardInner: {
    padding: 16,
    alignItems: 'center',
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
  artistImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  artistImage: {
    width: 75,
    height: 75,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(29, 185, 84, 0.4)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  artistBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1db954',
  },
  artistName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  artistType: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 8,
    paddingRight: 16,
  },
});