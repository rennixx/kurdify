# Supabase Storage Buckets Setup

After running the schema.sql, you need to create storage buckets manually in Supabase dashboard:

## 1. Create Storage Buckets

Go to **Storage** in your Supabase dashboard and create these buckets:

### Songs Bucket (Private)
- **Name**: `songs`
- **Public**: ❌ **OFF** (private for access control)
- **File size limit**: 50MB (or as needed)
- **Allowed MIME types**: `audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/mp4`

### Covers Bucket (Public)
- **Name**: `covers` 
- **Public**: ✅ **ON** (public for easy image access)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

## 2. Storage Policies (RLS)

The buckets need Row Level Security policies. Add these in the **Policies** tab for each bucket:

### Songs Bucket Policies:
```sql
-- Allow authenticated users to upload songs
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'songs');

-- Allow public to read songs (for streaming)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'songs');
```

### Covers Bucket Policies:
```sql
-- Allow authenticated users to upload covers
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers');

-- Allow public read access (covers are public)
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'covers');
```

## 3. Admin Setup

After creating your first auth user (sign up in the app), make them admin:

1. Go to **Authentication > Users** in Supabase
2. Copy the user's UUID
3. Go to **SQL Editor** and run:

```sql
INSERT INTO public.profiles (id, username, full_name, is_admin)
VALUES ('<YOUR-USER-UUID>', 'admin', 'Kurdify Admin', true);
```

Replace `<YOUR-USER-UUID>` with the actual UUID from step 2.

## 4. Test Upload

After setup, test by:
1. Sign up/login in the app
2. Go to Admin screen 
3. Try uploading a song
4. Check if files appear in Storage buckets

## Storage Usage in App

The app uses:
- **Signed URLs** for songs (private, 1-hour expiry)
- **Public URLs** for covers (immediate access)
- **StorageService** helper class for all operations