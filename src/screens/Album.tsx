import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { getAlbumById, Album as AlbumType } from '../api/albums';
import { Song } from '../api/songs';

interface AlbumProps {
  route?: { params?: { albumId?: string } };
}

export default function Album({ route }: AlbumProps) {
  const albumId = route?.params?.albumId;
  const [album, setAlbum] = useState<AlbumType | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (albumId) {
      loadAlbum();
    }
  }, [albumId]);

  async function loadAlbum() {
    if (!albumId) return;
    
    try {
      const albumData = await getAlbumById(albumId);
      setAlbum(albumData);
      // Load album's songs
      // const songsData = await supabase.from('songs').select('*').eq('album_id', albumId);
      // setSongs(songsData);
    } catch (err) {
      console.error('Error loading album:', err);
    }
  }

  if (!album) {
    return (
      <View style={styles.container}>
        <Text>Loading album...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {album.cover_url && (
        <Image source={{ uri: album.cover_url }} style={styles.cover} />
      )}
      <Text style={styles.title}>{album.title}</Text>
      {album.year && (
        <Text style={styles.year}>{album.year}</Text>
      )}
      
      <Text style={styles.sectionTitle}>Tracks</Text>
      <FlatList
        data={songs}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.track}>
            <Text style={styles.trackNumber}>{index + 1}</Text>
            <Text style={styles.trackTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No tracks available</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  cover: { width: '100%', height: 300, borderRadius: 10, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  year: { fontSize: 14, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  track: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  trackNumber: { width: 30, color: '#666' },
  trackTitle: { flex: 1 },
});