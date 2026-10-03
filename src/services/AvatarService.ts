import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from '../api/supabase';

export interface ImagePickerResult {
  uri: string;
  type: string;
  name: string;
}

export class AvatarService {
  /**
   * Request camera and media library permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Camera and photo library access are needed to upload avatars.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Show image picker options (camera vs library)
   */
  static async pickImage(): Promise<ImagePickerResult | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) return null;

      return new Promise((resolve) => {
        Alert.alert(
          'Select Photo',
          'Choose how you want to select your avatar photo',
          [
            {
              text: 'Camera',
              onPress: async () => {
                const result = await this.takePhoto();
                resolve(result);
              },
            },
            {
              text: 'Photo Library',
              onPress: async () => {
                const result = await this.pickFromLibrary();
                resolve(result);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(null),
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhoto(): Promise<ImagePickerResult | null> {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `avatar_${Date.now()}.jpg`,
        };
      }
      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }

  /**
   * Pick image from library
   */
  static async pickFromLibrary(): Promise<ImagePickerResult | null> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for avatars
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type === 'image' ? 'image/jpeg' : 'image/jpeg',
          name: asset.fileName || `avatar_${Date.now()}.jpg`,
        };
      }
      return null;
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  /**
   * Upload avatar to Supabase storage
   */
  static async uploadAvatar(
    userId: string, 
    imageResult: ImagePickerResult
  ): Promise<string | null> {
    try {
      // Generate unique filename
      const fileExt = imageResult.name.split('.').pop() || 'jpg';
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Read the file as binary data
      const response = await fetch(imageResult.uri);
      const arrayBuffer = await response.arrayBuffer();

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: imageResult.type,
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        Alert.alert('Upload Error', error.message);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
      return null;
    }
  }

  /**
   * Delete old avatar from storage
   */
  static async deleteAvatar(avatarUrl: string): Promise<boolean> {
    try {
      if (!avatarUrl || !avatarUrl.includes('avatars/')) return true;

      // Extract file path from URL
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('avatars');
      
      if (bucketIndex === -1) return false;
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }
  }

  /**
   * Complete avatar update process
   */
  static async updateUserAvatar(userId: string): Promise<string | null> {
    try {
      // Pick image
      const imageResult = await this.pickImage();
      if (!imageResult) return null;

      // Upload new avatar
      const newAvatarUrl = await this.uploadAvatar(userId, imageResult);
      if (!newAvatarUrl) return null;

      return newAvatarUrl;
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar');
      return null;
    }
  }

  /**
   * Validate avatar URL (for fallback scenarios)
   */
  static validateAvatarUrl(url: string): boolean {
    try {
      new URL(url);
      return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) !== null;
    } catch {
      return false;
    }
  }
}

export default AvatarService;