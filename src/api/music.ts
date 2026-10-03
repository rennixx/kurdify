import supabase from './supabase';

export interface Song {
  id: string;
  title: string;
  artist_id: string;
  album_id?: string;
  duration: number;
  file_url: string;
  cover_url?: string;
  genre?: string;
  storage_path?: string; // Supabase storage path for streaming
  created_at: string;
  artists?: Artist;
  albums?: Album;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  image_url?: string;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string;
  cover_url?: string;
  release_date?: string;
  created_at: string;
  artists?: Artist;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  song_count?: number;
}

// Featured content for home screen
export async function getFeaturedSongs(limit = 10) {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      ),
      albums (
        id,
        title,
        cover_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Song[];
}

export async function getRecentAlbums(limit = 6) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Album[];
}

export async function getTopArtists(limit = 8) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Artist[];
}

// Search functionality
export async function searchSongs(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      ),
      albums (
        id,
        title,
        cover_url
      )
    `)
    .ilike('title', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data as Song[];
}

export async function searchArtists(query: string, limit = 10) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data as Artist[];
}

export async function searchAlbums(query: string, limit = 10) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      )
    `)
    .ilike('title', `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data as Album[];
}

// User library functions - simplified to work with existing tables
export async function getUserPlaylists(userId: string) {
  // For now, return empty array since playlists table structure is unknown
  // TODO: Implement when playlist tables are properly set up
  return [] as any[];
}

export async function getUserLikedSongs(userId: string, limit = 50) {
  // For now, just return recent songs as a placeholder
  // TODO: Implement when user_liked_songs table is created
  try {
    return await getFeaturedSongs(limit);
  } catch (error) {
    console.error('Error getting user liked songs:', error);
    return [] as Song[];
  }
}

// Individual item fetchers
export async function getSong(id: string) {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      artists (
        id,
        name,
        image_url,
        bio
      ),
      albums (
        id,
        title,
        cover_url,
        release_date
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Song;
}

export async function getArtist(id: string) {
  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Artist;
}

export async function getArtistSongs(artistId: string, limit = 20) {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      albums (
        id,
        title,
        cover_url
      )
    `)
    .eq('artist_id', artistId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Song[];
}

export async function getAlbum(id: string) {
  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Album;
}

export async function getAlbumSongs(albumId: string) {
  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      artists (
        id,
        name,
        image_url
      )
    `)
    .eq('album_id', albumId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Song[];
}

// Play tracking functions
export async function trackPlay(userId: string, songId: string, deviceInfo: string = 'Mobile App') {
  const { error } = await supabase
    .from('plays')
    .insert({
      user_id: userId,
      song_id: songId,
      device_info: deviceInfo,
      timestamp: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function getUserPlayHistory(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('plays')
    .select(`
      id,
      timestamp,
      songs (
        id,
        title,
        cover_url,
        artists (
          id,
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getMostPlayedSongs(limit: number = 20) {
  const { data, error } = await supabase
    .from('plays')
    .select(`
      song_id,
      songs (
        id,
        title,
        cover_url,
        file_url,
        storage_path,
        duration,
        artists (
          id,
          name
        )
      )
    `)
    .not('songs', 'is', null)
    .limit(limit * 3); // Get more to account for duplicates

  if (error) throw error;

  // Count plays per song and return most played
  const playCounts: { [key: string]: { count: number; song: Song } } = {};
  
  data?.forEach((play: any) => {
    if (play.songs) {
      const songId = play.songs.id;
      if (playCounts[songId]) {
        playCounts[songId].count++;
      } else {
        playCounts[songId] = { count: 1, song: play.songs };
      }
    }
  });

  const sortedSongs = Object.values(playCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => item.song);

  return sortedSongs;
}