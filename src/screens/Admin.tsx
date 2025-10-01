import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import supabase from '../api/supabase';

export default function Admin() {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleUploadSong() {
    if (!songTitle || !artistName || !audioUrl) {
      alert('Please fill all fields');
      return;
    }

    setUploading(true);
    try {
      // Placeholder: create artist if doesn't exist, then create song
      // 1. Check if artist exists or create new
      // const { data: artist } = await supabase.from('artists').select('*').eq('name', artistName).single();
      // 2. Insert song with artist_id
      // await supabase.from('songs').insert({ title: songTitle, artist_id: artist.id, audio_url: audioUrl });
      
      alert('Song uploaded successfully!');
      setSongTitle('');
      setArtistName('');
      setAudioUrl('');
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <Text style={styles.subtitle}>Upload New Song</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Song Title"
        value={songTitle}
        onChangeText={setSongTitle}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Artist Name"
        value={artistName}
        onChangeText={setArtistName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Audio URL"
        value={audioUrl}
        onChangeText={setAudioUrl}
      />
      
      <Button 
        title={uploading ? 'Uploading...' : 'Upload Song'} 
        onPress={handleUploadSong}
        disabled={uploading}
      />
      
      <Text style={styles.note}>
        Note: This is a placeholder admin panel. Implement proper authentication 
        and file upload handling for production use.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 20, color: '#666' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  note: { marginTop: 30, fontSize: 12, color: '#999', fontStyle: 'italic' },
});