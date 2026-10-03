-- PHASE 1 — BACKEND (SUPABASE) — SCHEMA, BUCKETS, RLS, RPC
-- Kurdify Complete Database Schema for Supabase
-- Run this in Supabase SQL Editor (make sure you're logged in as project owner)

-- 1) Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 7) Storage buckets for file uploads
-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create avatar storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create songs bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

-- Create song storage policies
DROP POLICY IF EXISTS "Song files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload songs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update songs they uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete songs they uploaded" ON storage.objects;

CREATE POLICY "Song files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'songs');

CREATE POLICY "Authenticated users can upload songs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'songs' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update songs they uploaded"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'songs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete songs they uploaded"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'songs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2) Profiles table (link to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
    ALTER TABLE public.profiles ADD COLUMN bio text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 3) Artists, Albums, Songs core tables
CREATE TABLE IF NOT EXISTS public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing artists table if they don't exist
DO $$ 
BEGIN
  -- Add image_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'image_url') THEN
    ALTER TABLE public.artists ADD COLUMN image_url text;
  END IF;
  
  -- If photo_url exists and image_url doesn't have data, copy data and drop photo_url
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'photo_url') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'image_url') THEN
    -- Copy data from photo_url to image_url where image_url is null
    UPDATE public.artists SET image_url = photo_url WHERE image_url IS NULL AND photo_url IS NOT NULL;
    -- Drop the old photo_url column
    ALTER TABLE public.artists DROP COLUMN photo_url;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'artists' AND column_name = 'photo_url') THEN
    -- If only photo_url exists, rename it to image_url
    ALTER TABLE public.artists RENAME COLUMN photo_url TO image_url;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  year int,
  cover_url text,
  release_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES public.artists(id),
  album_id uuid REFERENCES public.albums(id),
  duration int, -- seconds
  genre text,
  language text,
  file_url text, -- Direct file URL for streaming (optional for migration)
  cover_url text,
  storage_path text, -- supabase storage path (optional)
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Add missing columns to existing songs table if they don't exist
DO $$ 
BEGIN
  -- Add file_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'file_url') THEN
    ALTER TABLE public.songs ADD COLUMN file_url text;
  END IF;
  
  -- Add cover_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'cover_url') THEN
    ALTER TABLE public.songs ADD COLUMN cover_url text;
  END IF;
  
  -- Handle migration from old audio_url to new file_url
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'audio_url') THEN
    -- Copy data from audio_url to file_url where file_url is null
    UPDATE public.songs SET file_url = audio_url WHERE file_url IS NULL AND audio_url IS NOT NULL;
    
    -- Drop NOT NULL constraint from audio_url if it exists
    BEGIN
      ALTER TABLE public.songs ALTER COLUMN audio_url DROP NOT NULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore error if constraint doesn't exist
        NULL;
    END;
    
    -- Drop the old audio_url column
    ALTER TABLE public.songs DROP COLUMN audio_url;
  END IF;
  
  -- Handle migration from old cover_path to cover_url
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'songs' AND column_name = 'cover_path') THEN
    -- Copy data from cover_path to cover_url where cover_url is null
    UPDATE public.songs SET cover_url = cover_path WHERE cover_url IS NULL AND cover_path IS NOT NULL;
    
    -- Drop the old cover_path column
    ALTER TABLE public.songs DROP COLUMN cover_path;
  END IF;
  
  -- Add release_date to albums if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'albums' AND column_name = 'release_date') THEN
    ALTER TABLE public.albums ADD COLUMN release_date date;
  END IF;
END $$;

-- 4) Playlists, playlist_songs, likes, plays, counters
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to existing playlists table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'playlists' AND column_name = 'description') THEN
    ALTER TABLE public.playlists ADD COLUMN description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'playlists' AND column_name = 'updated_at') THEN
    ALTER TABLE public.playlists ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  position int,
  added_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.song_likes (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, song_id)
);

CREATE TABLE IF NOT EXISTS public.plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  song_id uuid REFERENCES public.songs(id) NOT NULL,
  played_at timestamptz DEFAULT now(),
  device_info jsonb
);

CREATE TABLE IF NOT EXISTS public.song_counters (
  song_id uuid PRIMARY KEY REFERENCES public.songs(id) ON DELETE CASCADE,
  total_plays bigint DEFAULT 0,
  last_played timestamptz
);

-- New tables for enhanced functionality

-- User follows (for following artists/users)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Artist follows
CREATE TABLE IF NOT EXISTS public.artist_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artist_id)
);

-- User activity log
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'like', 'play', 'follow', 'playlist_create', etc.
  target_type text NOT NULL, -- 'song', 'artist', 'playlist', 'user'
  target_id uuid NOT NULL,
  metadata jsonb, -- Additional context data
  created_at timestamptz DEFAULT now()
);

-- Recently played songs (separate from plays for better performance)
CREATE TABLE IF NOT EXISTS public.recently_played (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- User stats cache (for performance)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  total_playlists int DEFAULT 0,
  total_liked_songs int DEFAULT 0,
  total_following int DEFAULT 0,
  total_listening_time_seconds bigint DEFAULT 0,
  favorite_genre text,
  updated_at timestamptz DEFAULT now()
);

-- 5) Trigger to update counters when a play is recorded
CREATE OR REPLACE FUNCTION public.increment_play_count() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.song_counters (song_id, total_plays, last_played)
  VALUES (NEW.song_id, 1, NEW.played_at)
  ON CONFLICT (song_id) DO UPDATE
    SET total_plays = public.song_counters.total_plays + 1,
        last_played = NEW.played_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_play_count ON public.plays;
CREATE TRIGGER trg_increment_play_count
  AFTER INSERT ON public.plays
  FOR EACH ROW EXECUTE PROCEDURE public.increment_play_count();

-- 6) Trending / RPC helper (plays in last N days)
CREATE OR REPLACE FUNCTION public.get_trending(limit_count integer DEFAULT 50, days integer DEFAULT 7)
RETURNS TABLE(song_id uuid, plays bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, COUNT(p.*) as plays
  FROM public.songs s
  JOIN public.plays p ON p.song_id = s.id
  WHERE p.played_at > now() - (days || ' days')::interval
  GROUP BY s.id
  ORDER BY plays DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8) Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recently_played ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "artists_select_public" ON public.artists;
DROP POLICY IF EXISTS "albums_select_public" ON public.albums;
DROP POLICY IF EXISTS "songs_select_public" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_write" ON public.songs;
DROP POLICY IF EXISTS "playlists_select_public" ON public.playlists;
DROP POLICY IF EXISTS "playlists_insert_auth" ON public.playlists;
DROP POLICY IF EXISTS "playlists_update_owner" ON public.playlists;
DROP POLICY IF EXISTS "playlists_delete_owner" ON public.playlists;
DROP POLICY IF EXISTS "playlist_songs_select_public" ON public.playlist_songs;
DROP POLICY IF EXISTS "playlist_songs_modify_owner" ON public.playlist_songs;
DROP POLICY IF EXISTS "song_likes_select_public" ON public.song_likes;
DROP POLICY IF EXISTS "song_likes_insert_auth" ON public.song_likes;
DROP POLICY IF EXISTS "song_likes_delete_own" ON public.song_likes;
DROP POLICY IF EXISTS "plays_insert_auth" ON public.plays;
DROP POLICY IF EXISTS "plays_select_own" ON public.plays;
DROP POLICY IF EXISTS "song_counters_select_public" ON public.song_counters;

-- Profiles policies
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Artists, Albums policies (public read, admin write)
CREATE POLICY "artists_select_public" ON public.artists FOR SELECT USING (true);
CREATE POLICY "albums_select_public" ON public.albums FOR SELECT USING (true);

-- Songs policies (public read, admin write)
CREATE POLICY "songs_select_public" ON public.songs FOR SELECT USING (true);
CREATE POLICY "songs_admin_write" ON public.songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
);

-- Playlists policies (public read if public, owner modify)
CREATE POLICY "playlists_select_public" ON public.playlists FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "playlists_insert_auth" ON public.playlists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "playlists_update_owner" ON public.playlists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "playlists_delete_owner" ON public.playlists FOR DELETE USING (user_id = auth.uid());

-- Playlist songs policies
CREATE POLICY "playlist_songs_select_public" ON public.playlist_songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "playlist_songs_modify_owner" ON public.playlist_songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Song likes policies
CREATE POLICY "song_likes_select_public" ON public.song_likes FOR SELECT USING (true);
CREATE POLICY "song_likes_insert_auth" ON public.song_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "song_likes_delete_own" ON public.song_likes FOR DELETE USING (user_id = auth.uid());

-- Plays policies
CREATE POLICY "plays_insert_auth" ON public.plays FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "plays_select_own" ON public.plays FOR SELECT USING (user_id = auth.uid());

-- Song counters policies (public read)
CREATE POLICY "song_counters_select_public" ON public.song_counters FOR SELECT USING (true);

-- User follows policies
CREATE POLICY "user_follows_select_public" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_insert_auth" ON public.user_follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND follower_id = auth.uid());
CREATE POLICY "user_follows_delete_own" ON public.user_follows FOR DELETE USING (follower_id = auth.uid());

-- Artist follows policies
CREATE POLICY "artist_follows_select_public" ON public.artist_follows FOR SELECT USING (true);
CREATE POLICY "artist_follows_insert_auth" ON public.artist_follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "artist_follows_delete_own" ON public.artist_follows FOR DELETE USING (user_id = auth.uid());

-- User activity policies
CREATE POLICY "user_activity_select_own" ON public.user_activity FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_activity_insert_auth" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Recently played policies
CREATE POLICY "recently_played_select_own" ON public.recently_played FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "recently_played_insert_auth" ON public.recently_played FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "recently_played_update_own" ON public.recently_played FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- User stats policies
CREATE POLICY "user_stats_select_own" ON public.user_stats FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_stats_insert_auth" ON public.user_stats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "user_stats_update_own" ON public.user_stats FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Insert sample data (only if tables are empty)
INSERT INTO public.artists (name, bio, image_url) 
SELECT 'Şivan Perwer', 'Kurdish folk singer and songwriter', 'https://via.placeholder.com/300x300/1db954/ffffff?text=Şivan+Perwer'
WHERE NOT EXISTS (SELECT 1 FROM public.artists WHERE name = 'Şivan Perwer');

INSERT INTO public.artists (name, bio, image_url) 
SELECT 'Ciwan Haco', 'Kurdish musician and composer', 'https://via.placeholder.com/300x300/1db954/ffffff?text=Ciwan+Haco'
WHERE NOT EXISTS (SELECT 1 FROM public.artists WHERE name = 'Ciwan Haco');

INSERT INTO public.artists (name, bio, image_url) 
SELECT 'Aynur Doğan', 'Kurdish folk singer', 'https://via.placeholder.com/300x300/1db954/ffffff?text=Aynur+Doğan'
WHERE NOT EXISTS (SELECT 1 FROM public.artists WHERE name = 'Aynur Doğan');

INSERT INTO public.artists (name, bio, image_url) 
SELECT 'Hozan Diyar', 'Modern Kurdish artist', 'https://via.placeholder.com/300x300/1db954/ffffff?text=Hozan+Diyar'
WHERE NOT EXISTS (SELECT 1 FROM public.artists WHERE name = 'Hozan Diyar');

-- Insert albums
INSERT INTO public.albums (title, artist_id, year, cover_url, release_date)
SELECT 'Kine Ez', a.id, 1976, 'https://via.placeholder.com/400x400/16213e/ffffff?text=Kine+Ez', '1976-01-01'
FROM public.artists a 
WHERE a.name = 'Şivan Perwer'
AND NOT EXISTS (SELECT 1 FROM public.albums WHERE title = 'Kine Ez');

INSERT INTO public.albums (title, artist_id, year, cover_url, release_date)
SELECT 'Newroz', a.id, 1995, 'https://via.placeholder.com/400x400/16213e/ffffff?text=Newroz', '1995-03-21'
FROM public.artists a 
WHERE a.name = 'Ciwan Haco'
AND NOT EXISTS (SELECT 1 FROM public.albums WHERE title = 'Newroz');

INSERT INTO public.albums (title, artist_id, year, cover_url, release_date)
SELECT 'Rewend', a.id, 2004, 'https://via.placeholder.com/400x400/16213e/ffffff?text=Rewend', '2004-06-15'
FROM public.artists a 
WHERE a.name = 'Aynur Doğan'
AND NOT EXISTS (SELECT 1 FROM public.albums WHERE title = 'Rewend');

-- Insert songs with demo audio URLs
INSERT INTO public.songs (title, artist_id, album_id, duration, genre, language, file_url, cover_url, storage_path)
SELECT 'Kine Ez', a.id, al.id, 240, 'Folk', 'Kurdish', 
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
       'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Kine+Ez',
       'songs/kine-ez.mp3'
FROM public.artists a, public.albums al
WHERE a.name = 'Şivan Perwer' AND al.title = 'Kine Ez'
AND NOT EXISTS (SELECT 1 FROM public.songs WHERE title = 'Kine Ez');

INSERT INTO public.songs (title, artist_id, album_id, duration, genre, language, file_url, cover_url, storage_path)
SELECT 'Newroz', a.id, al.id, 320, 'Folk', 'Kurdish',
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
       'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Newroz',
       'songs/newroz.mp3'
FROM public.artists a, public.albums al
WHERE a.name = 'Ciwan Haco' AND al.title = 'Newroz'
AND NOT EXISTS (SELECT 1 FROM public.songs WHERE title = 'Newroz');

INSERT INTO public.songs (title, artist_id, album_id, duration, genre, language, file_url, cover_url, storage_path)
SELECT 'Rewend', a.id, al.id, 280, 'Folk', 'Kurdish',
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
       'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Rewend',
       'songs/rewend.mp3'
FROM public.artists a, public.albums al
WHERE a.name = 'Aynur Doğan' AND al.title = 'Rewend'
AND NOT EXISTS (SELECT 1 FROM public.songs WHERE title = 'Rewend');

-- Add more sample songs
INSERT INTO public.songs (title, artist_id, duration, genre, language, file_url, cover_url)
SELECT 'Şoreşa Azadiya Kurdistan', a.id, 195, 'Traditional', 'Kurdish',
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
       'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Şoreşa+Azadiya'
FROM public.artists a
WHERE a.name = 'Şivan Perwer'
AND NOT EXISTS (SELECT 1 FROM public.songs WHERE title = 'Şoreşa Azadiya Kurdistan');

INSERT INTO public.songs (title, artist_id, duration, genre, language, file_url, cover_url)
SELECT 'Delalê', a.id, 210, 'Folk', 'Kurdish',
       'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
       'https://via.placeholder.com/300x300/1a1a2e/ffffff?text=Delalê'
FROM public.artists a
WHERE a.name = 'Hozan Diyar'
AND NOT EXISTS (SELECT 1 FROM public.songs WHERE title = 'Delalê');

-- Initialize song counters for sample songs
INSERT INTO public.song_counters (song_id, total_plays, last_played)
SELECT s.id, 0, now()
FROM public.songs s
WHERE NOT EXISTS (SELECT 1 FROM public.song_counters WHERE song_id = s.id);