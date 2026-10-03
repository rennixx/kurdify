import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassBackground } from '../components/ui';
import { usePlayer } from '../context/PlayerContext';
import { 
  searchSongs, 
  searchArtists, 
  searchAlbums,
  Song,
  Artist,
  Album 
} from '../api/music';

type SearchResult = {
  type: 'song' | 'artist' | 'album';
  data: Song | Artist | Album;
};

export default function SearchScreen() {
  const { play, currentSong, isPlaying, isLoading } = usePlayer();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');

  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const searchContent = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const [songs, artists, albums] = await Promise.all([
        searchSongs(searchQuery, 20),
        searchArtists(searchQuery, 10),
        searchAlbums(searchQuery, 10)
      ]);

      const allResults: SearchResult[] = [
        ...songs.map(song => ({ type: 'song' as const, data: song })),
        ...artists.map(artist => ({ type: 'artist' as const, data: artist })),
        ...albums.map(album => ({ type: 'album' as const, data: album }))
      ];

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(debounce(searchContent, 300), [searchContent]);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    if (activeTab === 'songs') return result.type === 'song';
    if (activeTab === 'artists') return result.type === 'artist';
    if (activeTab === 'albums') return result.type === 'album';
    return true;
  });

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    if (item.type === 'song') {
      const song = item.data as Song;
      const isCurrentSong = currentSong?.id === song.id;
      return (
        <TouchableOpacity style={styles.resultItem}>
          <GlassCard style={styles.resultCard} intensity={10}>
            <Image
              source={{ 
                uri: song.cover_url || song.albums?.cover_url || 'https://via.placeholder.com/60' 
              }}
              style={styles.resultImage}
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{song.title}</Text>
              <Text style={styles.resultSubtitle}>
                Song • {song.artists?.name || 'Unknown Artist'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => play(song)}
            >
              {isLoading && isCurrentSong ? (
                <Ionicons name="refresh" size={20} color="#1db954" />
              ) : isPlaying && isCurrentSong ? (
                <Ionicons name="pause" size={20} color="#1db954" />
              ) : (
                <Ionicons name="play" size={20} color="#1db954" />
              )}
            </TouchableOpacity>
          </GlassCard>
        </TouchableOpacity>
      );
    }

    if (item.type === 'artist') {
      const artist = item.data as Artist;
      return (
        <TouchableOpacity style={styles.resultItem}>
          <GlassCard style={styles.resultCard} intensity={10}>
            <Image
              source={{ uri: artist.image_url || 'https://via.placeholder.com/60' }}
              style={[styles.resultImage, styles.circularImage]}
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{artist.name}</Text>
              <Text style={styles.resultSubtitle}>Artist</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </GlassCard>
        </TouchableOpacity>
      );
    }

    if (item.type === 'album') {
      const album = item.data as Album;
      return (
        <TouchableOpacity style={styles.resultItem}>
          <GlassCard style={styles.resultCard} intensity={10}>
            <Image
              source={{ uri: album.cover_url || 'https://via.placeholder.com/60' }}
              style={styles.resultImage}
            />
            <View style={styles.resultInfo}>
              <Text style={styles.resultTitle}>{album.title}</Text>
              <Text style={styles.resultSubtitle}>
                Album • {album.artists?.name || 'Unknown Artist'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </GlassCard>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderTabButton = (tab: typeof activeTab, label: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <GlassBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Search</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <GlassCard style={styles.searchCard} intensity={20}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="What do you want to listen to?"
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </GlassCard>
        </View>

        {/* Search Tabs */}
        {query.length > 0 && (
          <View style={styles.tabContainer}>
            <GlassCard style={styles.tabCard} intensity={15}>
              {renderTabButton('all', 'All')}
              {renderTabButton('songs', 'Songs')}
              {renderTabButton('artists', 'Artists')}
              {renderTabButton('albums', 'Albums')}
            </GlassCard>
          </View>
        )}

        {/* Results */}
        {query.length > 0 ? (
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1db954" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : filteredResults.length > 0 ? (
              <FlatList
                data={filteredResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) => `${item.type}-${(item.data as any).id}-${index}`}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.resultsList}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <GlassCard style={styles.emptyCard}>
                  <Ionicons name="search" size={40} color="#888" />
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>
                    Try different keywords or check spelling
                  </Text>
                </GlassCard>
              </View>
            )}
          </View>
        ) : (
          /* Browse Categories */
          <View style={styles.browseContainer}>
            <Text style={styles.browseTitle}>Browse all</Text>
            
            <View style={styles.categoriesGrid}>
              {['Kurdish Music', 'Pop', 'Rock', 'Folk', 'Classical', 'Jazz'].map((category, index) => (
                <TouchableOpacity key={category} style={styles.categoryItem}>
                  <GlassCard style={styles.categoryCard} intensity={15}>
                    <Text style={styles.categoryText}>{category}</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchCard: {
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
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  clearButton: {
    padding: 4,
  },
  tabContainer: {
    marginBottom: 20,
  },
  tabCard: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(29, 185, 84, 0.3)',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.05,
  },
  activeTabText: {
    color: '#1db954',
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  resultsList: {
    paddingBottom: 100,
  },
  resultItem: {
    marginBottom: 8,
  },
  resultCard: {
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
  resultImage: {
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
  circularImage: {
    borderRadius: 25,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  resultSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  playButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyText: {
    color: '#fff',
    fontSize: 22,
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
  browseContainer: {
    flex: 1,
  },
  browseTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '48%',
    marginBottom: 12,
  },
  categoryCard: {
    padding: 24,
    minHeight: 90,
    justifyContent: 'center',
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
  categoryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});