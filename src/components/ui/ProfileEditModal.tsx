import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton } from '../ui';
import { LinearGradient } from 'expo-linear-gradient';
import { Profile, updateProfile } from '../../api/profiles';
import AvatarService from '../../services/AvatarService';
import { useAuth } from '../../context/AuthContext';

interface ProfileEditModalProps {
  visible: boolean;
  onClose: () => void;
  profile: Profile;
  onSave: (updatedProfile: Profile) => void;
}

export default function ProfileEditModal({ visible, onClose, profile, onSave }: ProfileEditModalProps) {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  async function handleAvatarUpload() {
    if (!user) return;
    
    setUploadingAvatar(true);
    try {
      const newAvatarUrl = await AvatarService.updateUserAvatar(user.id);
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters');
      return;
    }

    // Basic username validation
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert('Error', 'Username can only contain letters, numbers, and underscores');
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateProfile(profile.id, {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
      });

      onSave(updatedProfile);
      onClose();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // Reset form
    setFullName(profile.full_name || '');
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '');
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <TouchableOpacity 
                style={[styles.headerButton, saving && styles.disabledButton]} 
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={[styles.headerButtonText, styles.saveButton]}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Avatar Section */}
            <GlassCard style={styles.avatarSection} variant="spotify" intensity={5}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ 
                    uri: avatarUrl || user?.user_metadata?.avatar_url || 'https://via.placeholder.com/120' 
                  }}
                  style={styles.avatar}
                />
                <TouchableOpacity 
                  style={[styles.changeAvatarButton, uploadingAvatar && styles.disabledButton]}
                  onPress={handleAvatarUpload}
                  disabled={uploadingAvatar}
                >
                  <Ionicons 
                    name={uploadingAvatar ? "hourglass" : "camera"} 
                    size={20} 
                    color="#1db954" 
                  />
                  <Text style={styles.changeAvatarText}>
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Form Fields */}
            <GlassCard style={styles.formCard} variant="spotify" intensity={3}>
              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#666"
                  maxLength={50}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  maxLength={20}
                />
                <Text style={styles.fieldHint}>3-20 characters, letters, numbers, and underscores only</Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                  maxLength={200}
                />
                <Text style={styles.fieldHint}>{bio.length}/200</Text>
              </View>
            </GlassCard>

            {/* Privacy Notice */}
            <GlassCard style={styles.privacyCard} variant="spotify" intensity={2}>
              <View style={styles.privacySection}>
                <Ionicons name="shield-checkmark" size={24} color="#1db954" />
                <View style={styles.privacyText}>
                  <Text style={styles.privacyTitle}>Privacy Notice</Text>
                  <Text style={styles.privacyDescription}>
                    Your profile information is visible to other Kurdify users. 
                    You can update it anytime.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 5,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    color: '#1db954',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  avatarSection: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1db954',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1db954',
  },
  changeAvatarText: {
    color: '#1db954',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  formCard: {
    padding: 20,
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 50,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  privacyCard: {
    padding: 20,
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyText: {
    flex: 1,
    marginLeft: 12,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
});