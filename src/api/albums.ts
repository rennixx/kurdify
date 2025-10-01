import supabase from './supabase';

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  cover_url?: string;
  release_year?: number;
  created_at?: string;
}

export async function getAlbums(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data as Album[];
}

export async function getAlbumById(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Album;
}

export async function getAlbumsByArtist(artistId: string) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('artist_id', artistId);
  
  if (error) throw error;
  return data as Album[];
}
