import supabase from './supabase';

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  created_at?: string;
}

export async function getArtists(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return data as Artist[];
}

export async function getArtistById(id: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Artist;
}

export async function searchArtists(query: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', `%${query}%`);
  
  if (error) throw error;
  return data as Artist[];
}
