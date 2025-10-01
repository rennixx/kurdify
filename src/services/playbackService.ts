import { Audio } from 'expo-av';

export async function loadAndPlay(uri: string) {
  const { sound } = await Audio.Sound.createAsync({ uri } as any, { shouldPlay: true });
  return sound;
}

export async function stopSound(sound: any) {
  if (!sound) return;
  await sound.stopAsync();
  await sound.unloadAsync();
}
