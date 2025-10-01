import supabase from './supabase';

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  album_id?: string;
  duration?: number;
  audio_url: string;
  created_at?: string;
}

export async function getSongs(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data as Song[];
}

export async function getSongById(id: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Song;
}

export async function searchSongs(query: string) {
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .ilike('title', `%${query}%`);
  
  if (error) throw error;
  return data as Song[];
}
