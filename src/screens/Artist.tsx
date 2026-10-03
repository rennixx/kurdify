import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { getArtistById, Artist as ArtistType } from '../api/artists';
import { Song } from '../api/songs';

interface ArtistProps {
  route?: { params?: { artistId?: string } };
}

export default function Artist({ route }: ArtistProps) {
  const artistId = route?.params?.artistId;
  const [artist, setArtist] = useState<ArtistType | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (artistId) {
      loadArtist();
    }
  }, [artistId]);

  async function loadArtist() {
    if (!artistId) return;
    
    try {
      const artistData = await getArtistById(artistId);
      setArtist(artistData);
      // Load artist's songs
      // const songsData = await supabase.from('songs').select('*').eq('artist_id', artistId);
      // setSongs(songsData);
    } catch (err) {
      console.error('Error loading artist:', err);
    }
  }

  if (!artist) {
    return (
      <View style={styles.container}>
        <Text>Loading artist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {artist.photo_url && (
        <Image source={{ uri: artist.photo_url }} style={styles.image} />
      )}
      <Text style={styles.name}>{artist.name}</Text>
      {artist.bio && <Text style={styles.bio}>{artist.bio}</Text>}
      
      <Text style={styles.sectionTitle}>Popular Songs</Text>
      <FlatList
        data={songs}
        renderItem={({ item }) => (
          <View style={styles.songItem}>
            <Text>{item.title}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No songs available</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  image: { width: '100%', height: 200, borderRadius: 10, marginBottom: 20 },
  name: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  bio: { fontSize: 14, color: '#666', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  songItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
});