import supabase from './supabase';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  cover_url?: string;
  is_public: boolean;
  created_at?: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at?: string;
}

export async function getPlaylists(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('is_public', true)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Playlist[];
}

export async function getUserPlaylists(userId: string) {
  const { data, error } = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Playlist[];
}

export async function createPlaylist(playlist: Omit<Playlist, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('playlists')
    .insert(playlist)
    .select()
    .single();
  
  if (error) throw error;
  return data as Playlist;
}

export async function getPlaylistSongs(playlistId: string) {
  const { data, error } = await supabase
    .from('playlist_songs')
    .select(`
      *,
      songs:song_id (
        id,
        title,
        artist_id,
        duration,
        storage_path,
        cover_path
      )
    `)
    .eq('playlist_id', playlistId)
    .order('position');
  
  if (error) throw error;
  return data;
}

export async function addSongToPlaylist(playlistId: string, songId: string, position?: number) {
  const { data, error } = await supabase
    .from('playlist_songs')
    .insert({
      playlist_id: playlistId,
      song_id: songId,
      position: position || 0
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as PlaylistSong;
}