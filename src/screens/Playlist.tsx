import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getPlaylistSongs } from '../api/playlists';
import { usePlayer } from '../context/PlayerContext';

interface PlaylistScreenProps {
  route: { params: { playlistId: string; playlistName: string } };
}

export default function PlaylistScreen({ route }: PlaylistScreenProps) {
  const { playlistId, playlistName } = route.params;
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, setQueue } = usePlayer();

  useEffect(() => {
    loadPlaylistSongs();
  }, [playlistId]);

  async function loadPlaylistSongs() {
    try {
      const data = await getPlaylistSongs(playlistId);
      setSongs(data);
    } catch (err) {
      console.error('Error loading playlist songs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePlaySong(song: any, index: number) {
    const songList = songs.map(item => item.songs);
    setQueue(songList, index);
    await play(song);
  }

  function renderSong({ item, index }: { item: any; index: number }) {
    const song = item.songs;
    
    return (
      <TouchableOpacity 
        style={styles.songItem}
        onPress={() => handlePlaySong(song, index)}
      >
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.songMeta}>
            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading playlist...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlistName}</Text>
      <Text style={styles.songCount}>{songs.length} songs</Text>
      
      {songs.length === 0 ? (
        <Text style={styles.emptyText}>This playlist is empty</Text>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderSong}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  songCount: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  songMeta: {
    fontSize: 12,
    color: '#888',
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});