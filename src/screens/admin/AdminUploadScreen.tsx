import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AdminUploadScreen() {
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('Kurdish');
  const [duration, setDuration] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleUploadSong() {
    if (!songTitle || !artistName) {
      Alert.alert('Error', 'Song title and artist name are required');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement actual file upload to Supabase Storage
      // 1. Upload audio file to 'songs' bucket
      // 2. Upload cover image to 'covers' bucket (if provided)
      // 3. Create/find artist record
      // 4. Create/find album record (if provided)
      // 5. Create song record with storage paths
      
      Alert.alert('Success', 'Song uploaded successfully!');
      
      // Reset form
      setSongTitle('');
      setArtistName('');
      setAlbumTitle('');
      setGenre('');
      setDuration('');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Failed to upload song');
    } finally {
      setUploading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Upload Song</Text>
      <Text style={styles.subtitle}>Add new music to Kurdify</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>Song Title *</Text>
        <TextInput
          style={styles.input}
          value={songTitle}
          onChangeText={setSongTitle}
          placeholder="Enter song title"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Artist Name *</Text>
        <TextInput
          style={styles.input}
          value={artistName}
          onChangeText={setArtistName}
          placeholder="Enter artist name"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Album Title</Text>
        <TextInput
          style={styles.input}
          value={albumTitle}
          onChangeText={setAlbumTitle}
          placeholder="Enter album title (optional)"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Genre</Text>
        <TextInput
          style={styles.input}
          value={genre}
          onChangeText={setGenre}
          placeholder="e.g. Folk, Pop, Traditional"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Language</Text>
        <TextInput
          style={styles.input}
          value={language}
          onChangeText={setLanguage}
          placeholder="Enter language"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Duration (seconds)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 240"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />

        {/* TODO: Add file picker for audio file */}
        <TouchableOpacity style={styles.fileButton}>
          <Text style={styles.fileButtonText}>Choose Audio File</Text>
        </TouchableOpacity>

        {/* TODO: Add file picker for cover image */}
        <TouchableOpacity style={styles.fileButton}>
          <Text style={styles.fileButtonText}>Choose Cover Image (Optional)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
          onPress={handleUploadSong}
          disabled={uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Song'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.note}>
        Note: This is a placeholder upload interface. File upload functionality 
        will be implemented with proper Supabase Storage integration.
      </Text>
    </ScrollView>
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
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  fileButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
    borderStyle: 'dashed',
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: '#1db954',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  uploadButtonDisabled: {
    backgroundColor: '#666',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    marginTop: 30,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});