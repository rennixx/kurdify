import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getSongs, Song } from '../api/songs';
import usePagination from '../hooks/usePagination';

export default function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { offset, pageSize, nextPage, hasMore, setHasMore } = usePagination({ pageSize: 10 });

  useEffect(() => {
    loadSongs();
  }, [offset]);

  async function loadSongs() {
    setLoading(true);
    try {
      const data = await getSongs(pageSize, offset);
      setSongs((prev) => [...prev, ...data]);
      if (data.length < pageSize) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  }

  function renderSong({ item }: { item: Song }) {
    return (
      <TouchableOpacity style={styles.songItem}>
        <Text style={styles.songTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Kurdify</Text>
      <FlatList
        data={songs}
        renderItem={renderSong}
        keyExtractor={(item) => item.id}
        onEndReached={() => hasMore && !loading && nextPage()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <Text>Loading...</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  songItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  songTitle: { fontSize: 16 },
});
