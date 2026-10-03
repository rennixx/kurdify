import supabase from './supabase';

export interface SongLike {
  user_id: string;
  song_id: string;
  created_at?: string;
}

export interface Play {
  id: string;
  user_id?: string;
  song_id: string;
  played_at?: string;
  device_info?: any;
}

export async function likeSong(songId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('song_likes')
    .insert({
      user_id: user.id,
      song_id: songId
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as SongLike;
}

export async function unlikeSong(songId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('song_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('song_id', songId);
  
  if (error) throw error;
}

export async function isLiked(songId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('song_likes')
    .select('song_id')
    .eq('user_id', user.id)
    .eq('song_id', songId)
    .single();
  
  return !error && !!data;
}

export async function recordPlay(songId: string, deviceInfo?: any) {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('plays')
    .insert({
      user_id: user?.id,
      song_id: songId,
      device_info: deviceInfo
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Play;
}

export async function getTrendingSongs(limit = 50, days = 7) {
  const { data, error } = await supabase
    .rpc('get_trending', { 
      limit_count: limit, 
      days 
    });
  
  if (error) throw error;
  return data;
}

export async function getSongPlayCount(songId: string) {
  const { data, error } = await supabase
    .from('song_counters')
    .select('total_plays, last_played')
    .eq('song_id', songId)
    .single();
  
  if (error) throw error;
  return data;
}