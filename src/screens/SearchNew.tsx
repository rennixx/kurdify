import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  StatusBar,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton } from '../components/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchSongs, searchArtists, Song, Artist } from '../api/music';
import { usePlayer } from '../context/PlayerContext';
import { debounce } from '../utils/helpers';

const { width } = Dimensions.get('window');

type SearchCategory = 'all' | 'songs' | 'artists' | 'albums' | 'playlists';

interface SearchResult {
  type: 'song' | 'artist' | 'category' | 'trending';
  data?: Song | Artist;
  category?: string;
  trending?: boolean;
}

const TRENDING_SEARCHES = [
  'Kurdish Music',
  'Traditional Songs',
  'Folk Music',
  'Modern Kurdish',
  'Classical',
  'Pop Kurdish',
];

const CATEGORIES = [
  { id: 'kurdish', name: 'Kurdish', icon: 'musical-notes', color: '#1db954' },
  { id: 'folk', name: 'Folk', icon: 'leaf', color: '#ff6b6b' },
  { id: 'traditional', name: 'Traditional', icon: 'library', color: '#4ecdc4' },
  { id: 'modern', name: 'Modern', icon: 'radio', color: '#ffe66d' },
  { id: 'classical', name: 'Classical', icon: 'piano', color: '#a8e6cf' },
  { id: 'pop', name: 'Pop', icon: 'star', color: '#ff8b94' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  const { play, currentSong, isPlaying } = usePlayer();

  // Debounced search function
  const debouncedSearch = debounce(handleSearch, 300);

  useEffect(() => {
    if (query.trim()) {
      debouncedSearch();
    } else {
      setSongs([]);
      setArtists([]);
    }
  }, [query, activeCategory]);

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    try {
      if (activeCategory === 'all' || activeCategory === 'songs') {
        const songsResult = await searchSongs(query.trim());
        setSongs(songsResult || []);
      }
      
      if (activeCategory === 'all' || activeCategory === 'artists') {
        const artistsResult = await searchArtists(query.trim());
        setArtists(artistsResult || []);
      }

      // Add to recent searches
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaySong(song: Song) {
    try {
      await play(song);
    } catch (error) {
      console.error('Error playing song:', error);
      Alert.alert('Error', 'Failed to play song');
    }
  }

  function handleCategorySearch(category: string) {
    setQuery(category);
  }

  function handleTrendingSearch(term: string) {
    setQuery(term);
  }

  function clearSearch() {
    setQuery('');
    setSongs([]);
    setArtists([]);
  }

  const searchData: SearchResult[] = [];

  // Add search results
  if (query) {
    songs.forEach(song => searchData.push({ type: 'song', data: song }));
    artists.forEach(artist => searchData.push({ type: 'artist', data: artist }));
  } else {
    // Add categories when no search
    CATEGORIES.forEach(cat => searchData.push({ type: 'category', category: cat.name }));
    // Add trending searches
    TRENDING_SEARCHES.forEach(term => searchData.push({ type: 'trending', category: term }));
  }

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    switch (item.type) {
      case 'song':
        const song = item.data as Song;
        const isCurrentSong = currentSong?.id === song.id;
        return (
          <TouchableOpacity style={styles.resultItem}>
            <GlassCard style={styles.songCard} variant="spotify" intensity={3}>
              <View style={styles.songContent}>
                <Image
                  source={{ uri: song.cover_url || 'https://via.placeholder.com/50' }}
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
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => handlePlaySong(song)}
                >
                  <Ionicons
                    name={isCurrentSong && isPlaying ? 'pause' : 'play'}
                    size={20}
                    color="#1db954"
                  />
                </TouchableOpacity>
              </View>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'artist':
        const artist = item.data as Artist;
        return (
          <TouchableOpacity style={styles.resultItem}>
            <GlassCard style={styles.artistCard} variant="spotify" intensity={3}>
              <View style={styles.artistContent}>
                <Image
                  source={{ uri: artist.image_url || 'https://via.placeholder.com/50' }}
                  style={styles.artistImage}
                />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistType}>Artist</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </View>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'category':
        const category = CATEGORIES.find(cat => cat.name === item.category);
        if (!category) return null;
        return (
          <TouchableOpacity 
            style={styles.categoryItem}
            onPress={() => handleCategorySearch(category.name)}
          >
            <GlassCard style={[styles.categoryCard, { borderColor: category.color }] as any} variant="spotify" intensity={4}>
              <Ionicons name={category.icon as any} size={24} color={category.color} />
              <Text style={styles.categoryName}>{category.name}</Text>
            </GlassCard>
          </TouchableOpacity>
        );

      case 'trending':
        return (
          <TouchableOpacity 
            style={styles.trendingItem}
            onPress={() => handleTrendingSearch(item.category!)}
          >
            <GlassCard style={styles.trendingCard} variant="spotify" intensity={2}>
              <Ionicons name="trending-up" size={16} color="#1db954" />
              <Text style={styles.trendingText}>{item.category}</Text>
            </GlassCard>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 20, 40) }]}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <GlassCard style={styles.searchCard} variant="spotify" intensity={8}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search songs, artists..."
                placeholderTextColor="#888"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query ? (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#888" />
                </TouchableOpacity>
              ) : null}
            </View>
          </GlassCard>
        </View>

        {/* Category Filter */}
        {query ? (
          <View style={styles.categoryFilter}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { key: 'all', label: 'All' },
                { key: 'songs', label: 'Songs' },
                { key: 'artists', label: 'Artists' },
                { key: 'albums', label: 'Albums' },
                { key: 'playlists', label: 'Playlists' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    activeCategory === item.key && styles.activeFilterButton,
                  ]}
                  onPress={() => setActiveCategory(item.key as SearchCategory)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activeCategory === item.key && styles.activeFilterText,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.key}
            />
          </View>
        ) : null}

        {/* Results */}
        <View style={styles.resultsContainer}>
          {!query && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Browse Categories</Text>
            </View>
          )}
          
          <FlatList
            data={searchData}
            renderItem={renderSearchResult}
            keyExtractor={(item, index) => `${item.type}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            numColumns={query ? 1 : 2}
            key={query ? 'list' : 'grid'}
            ListEmptyComponent={() => (
              query ? (
                <View style={styles.emptyContainer}>
                  <GlassCard style={styles.emptyCard} variant="spotify" intensity={3}>
                    <Ionicons name="search" size={40} color="#888" />
                    <Text style={styles.emptyText}>
                      {loading ? 'Searching...' : 'No results found'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                      Try searching for different keywords
                    </Text>
                  </GlassCard>
                </View>
              ) : null
            )}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchHeader: {
    marginBottom: 20,
  },
  searchCard: {
    padding: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  categoryFilter: {
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterButton: {
    backgroundColor: '#1db954',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#000',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    marginBottom: 12,
  },
  songCard: {
    padding: 12,
  },
  songContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    color: '#ccc',
  },
  playButton: {
    padding: 8,
  },
  artistCard: {
    padding: 12,
  },
  artistContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artistImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  artistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  artistType: {
    fontSize: 14,
    color: '#ccc',
  },
  categoryItem: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  categoryCard: {
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  trendingItem: {
    marginBottom: 8,
  },
  trendingCard: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
});