import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface LibraryItem {
  id: string;
  title: string;
  type: 'song' | 'album' | 'playlist';
}

export default function Library() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);

  useEffect(() => {
    if (user) {
      loadLibrary();
    }
  }, [user]);

  async function loadLibrary() {
    // Placeholder: fetch user's saved songs/albums/playlists
    // const data = await supabase.from('user_library').select('*').eq('user_id', user.id);
    setItems([]);
  }

  function renderItem({ item }: { item: LibraryItem }) {
    return (
      <TouchableOpacity style={styles.item}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemType}>{item.type}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Library</Text>
      {!user ? (
        <Text>Please sign in to view your library</Text>
      ) : items.length === 0 ? (
        <Text>Your library is empty</Text>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemTitle: { fontSize: 16, fontWeight: '500' },
  itemType: { fontSize: 12, color: '#666', marginTop: 4 },
});