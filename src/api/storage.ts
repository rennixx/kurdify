import supabase from './supabase';

// Storage buckets helper for songs and covers
export class StorageService {
  static async uploadSong(file: File, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('songs')
      .upload(fileName, file);

    if (error) throw error;
    return data.path;
  }

  static async uploadCover(file: File, fileName: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('covers')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data.path;
  }

  static async getSongUrl(path: string): Promise<string> {
    // Use signed URL for protected song access
    const { data, error } = await supabase.storage
      .from('songs')
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  }

  static getCoverUrl(path: string): string {
    // Public URL for covers (since covers bucket is public)
    const { data } = supabase.storage
      .from('covers')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async deleteSong(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('songs')
      .remove([path]);

    if (error) throw error;
  }

  static async deleteCover(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('covers')
      .remove([path]);

    if (error) throw error;
  }
}

export default StorageService;