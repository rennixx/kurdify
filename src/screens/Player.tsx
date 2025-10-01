import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { usePlayer } from '../context/PlayerContext';

export default function Player() {
  const { playing, play, stop } = usePlayer();

  async function handlePlay() {
    // Example: replace with actual song URI from props/navigation
    await play('https://example.com/song.mp3');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Player</Text>
      <Text>Status: {playing ? 'Playing' : 'Stopped'}</Text>
      <Button title="Play" onPress={handlePlay} disabled={playing} />
      <Button title="Stop" onPress={stop} disabled={!playing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});
