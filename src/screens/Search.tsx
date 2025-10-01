import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { searchSongs, Song } from '../api/songs';
import { searchArtists, Artist } from '../api/artists';

export default function Search() {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const [songsData, artistsData] = await Promise.all([
        searchSongs(query),
        searchArtists(query),
      ]);
      setSongs(songsData);
      setArtists(artistsData);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <TextInput
        style={styles.input}
        placeholder="Search songs or artists..."
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
      />
      {loading && <Text>Searching...</Text>}
      
      {artists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artists</Text>
          {artists.map((artist) => (
            <TouchableOpacity key={artist.id} style={styles.item}>
              <Text>{artist.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {songs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Songs</Text>
          {songs.map((song) => (
            <TouchableOpacity key={song.id} style={styles.item}>
              <Text>{song.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
