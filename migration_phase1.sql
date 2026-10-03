-- PHASE 1 MIGRATION — Add new tables and update existing ones
-- This migration can be run safely on existing database
-- Run this in Supabase SQL Editor

-- 1) Enable extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Add new columns to existing tables (ALTER statements are safe)
-- Update artists table - add photo_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'artists' AND column_name = 'photo_url') THEN
    ALTER TABLE public.artists ADD COLUMN photo_url text;
  END IF;
END $$;

-- Update albums table - rename release_year to year if needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'albums' AND column_name = 'release_year') THEN
    ALTER TABLE public.albums RENAME COLUMN release_year TO year;
  END IF;
END $$;

-- Update songs table - add new columns for Phase 1
DO $$ 
BEGIN
  -- Add genre column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'genre') THEN
    ALTER TABLE public.songs ADD COLUMN genre text;
  END IF;
  
  -- Add language column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'language') THEN
    ALTER TABLE public.songs ADD COLUMN language text;
  END IF;
  
  -- Add storage_path column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'storage_path') THEN
    ALTER TABLE public.songs ADD COLUMN storage_path text;
  END IF;
  
  -- Add cover_path column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'cover_path') THEN
    ALTER TABLE public.songs ADD COLUMN cover_path text;
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'songs' AND column_name = 'created_by') THEN
    ALTER TABLE public.songs ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing songs to have storage_path based on existing audio_url if needed
UPDATE public.songs 
SET storage_path = COALESCE(storage_path, 'songs/' || title || '.mp3')
WHERE storage_path IS NULL;

-- 3) Create new tables (only if they don't exist)

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_url text,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Playlist songs junction table
CREATE TABLE IF NOT EXISTS public.playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  position int,
  added_at timestamptz DEFAULT now()
);

-- Song likes table
CREATE TABLE IF NOT EXISTS public.song_likes (
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, song_id)
);

-- Plays tracking table
CREATE TABLE IF NOT EXISTS public.plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id),
  song_id uuid REFERENCES public.songs(id) NOT NULL,
  played_at timestamptz DEFAULT now(),
  device_info jsonb
);

-- Song counters table for analytics
CREATE TABLE IF NOT EXISTS public.song_counters (
  song_id uuid PRIMARY KEY REFERENCES public.songs(id) ON DELETE CASCADE,
  total_plays bigint DEFAULT 0,
  last_played timestamptz
);

-- 4) Create or replace functions (safe to run multiple times)

-- Function to increment play count
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

-- Create trigger (safe with DROP IF EXISTS)
DROP TRIGGER IF EXISTS trg_increment_play_count ON public.plays;
CREATE TRIGGER trg_increment_play_count
  AFTER INSERT ON public.plays
  FOR EACH ROW EXECUTE PROCEDURE public.increment_play_count();

-- Function to get trending songs
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

-- 5) Enable RLS on all tables (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_counters ENABLE ROW LEVEL SECURITY;

-- 6) Drop and recreate all policies (ensures clean state)
-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Artists, Albums policies (public read, admin write)
DROP POLICY IF EXISTS "artists_select_public" ON public.artists;
DROP POLICY IF EXISTS "albums_select_public" ON public.albums;
DROP POLICY IF EXISTS "Allow public read access on artists" ON public.artists;
DROP POLICY IF EXISTS "Allow public read access on albums" ON public.albums;

CREATE POLICY "artists_select_public" ON public.artists FOR SELECT USING (true);
CREATE POLICY "albums_select_public" ON public.albums FOR SELECT USING (true);

-- Songs policies (public read, admin write)
DROP POLICY IF EXISTS "songs_select_public" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_write" ON public.songs;
DROP POLICY IF EXISTS "Allow public read access on songs" ON public.songs;

CREATE POLICY "songs_select_public" ON public.songs FOR SELECT USING (true);
CREATE POLICY "songs_admin_write" ON public.songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin)
);

-- Playlists policies
DROP POLICY IF EXISTS "playlists_select_public" ON public.playlists;
DROP POLICY IF EXISTS "playlists_insert_auth" ON public.playlists;
DROP POLICY IF EXISTS "playlists_update_owner" ON public.playlists;
DROP POLICY IF EXISTS "playlists_delete_owner" ON public.playlists;

CREATE POLICY "playlists_select_public" ON public.playlists FOR SELECT USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "playlists_insert_auth" ON public.playlists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "playlists_update_owner" ON public.playlists FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "playlists_delete_owner" ON public.playlists FOR DELETE USING (user_id = auth.uid());

-- Playlist songs policies
DROP POLICY IF EXISTS "playlist_songs_select_public" ON public.playlist_songs;
DROP POLICY IF EXISTS "playlist_songs_modify_owner" ON public.playlist_songs;

CREATE POLICY "playlist_songs_select_public" ON public.playlist_songs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "playlist_songs_modify_owner" ON public.playlist_songs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Song likes policies
DROP POLICY IF EXISTS "song_likes_select_public" ON public.song_likes;
DROP POLICY IF EXISTS "song_likes_insert_auth" ON public.song_likes;
DROP POLICY IF EXISTS "song_likes_delete_own" ON public.song_likes;

CREATE POLICY "song_likes_select_public" ON public.song_likes FOR SELECT USING (true);
CREATE POLICY "song_likes_insert_auth" ON public.song_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "song_likes_delete_own" ON public.song_likes FOR DELETE USING (user_id = auth.uid());

-- Plays policies
DROP POLICY IF EXISTS "plays_insert_auth" ON public.plays;
DROP POLICY IF EXISTS "plays_select_own" ON public.plays;

CREATE POLICY "plays_insert_auth" ON public.plays FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "plays_select_own" ON public.plays FOR SELECT USING (user_id = auth.uid());

-- Song counters policies
DROP POLICY IF EXISTS "song_counters_select_public" ON public.song_counters;

CREATE POLICY "song_counters_select_public" ON public.song_counters FOR SELECT USING (true);

-- 7) Initialize song counters for existing songs (if not already done)
INSERT INTO public.song_counters (song_id, total_plays, last_played)
SELECT s.id, 0, now()
FROM public.songs s
WHERE NOT EXISTS (SELECT 1 FROM public.song_counters WHERE song_id = s.id);