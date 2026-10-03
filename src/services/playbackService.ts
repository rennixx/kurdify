// Note: expo-audio API may be different - this is a placeholder
// Check expo-audio documentation for correct API usage
export async function loadAndPlay(uri: string) {
  // Placeholder implementation - replace with actual expo-audio API
  console.log('Playing audio:', uri);
  return { uri };
}

export async function stopSound(sound: any) {
  if (!sound) return;
  console.log('Stopping audio:', sound.uri);
}
