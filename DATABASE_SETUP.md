# Kurdify Database Setup

## Supabase Database Schema

To get started with Kurdify, you need to create the following tables in your Supabase database:

### 1. Artists Table
```sql
CREATE TABLE public.artists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Albums Table  
```sql
CREATE TABLE public.albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  cover_url TEXT,
  release_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Songs Table
```sql
CREATE TABLE public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE,
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  duration INTEGER, -- in seconds
  audio_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your needs)
CREATE POLICY "Allow public read access on artists" ON public.artists
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on albums" ON public.albums
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on songs" ON public.songs
  FOR SELECT USING (true);
```

### 5. Sample Data (Optional)

```sql
-- Insert sample artist
INSERT INTO public.artists (name, bio) VALUES 
('Şivan Perwer', 'Kurdish folk singer and songwriter');

-- Insert sample album
INSERT INTO public.albums (title, artist_id, release_year) VALUES 
('Kine Ez', (SELECT id FROM public.artists WHERE name = 'Şivan Perwer'), 1976);

-- Insert sample song
INSERT INTO public.songs (title, artist_id, album_id, duration, audio_url) VALUES 
('Kine Ez', 
 (SELECT id FROM public.artists WHERE name = 'Şivan Perwer'),
 (SELECT id FROM public.albums WHERE title = 'Kine Ez'),
 240,
 'https://example.com/sample-song.mp3');
```

## Next Steps

1. Run these SQL commands in your Supabase SQL editor
2. Restart your Expo app
3. The Home screen should now load without errors
4. Use the Admin screen to upload more songs

## Environment Variables

Make sure your `.env` file has the correct Supabase credentials:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```