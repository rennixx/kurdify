import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton } from '../ui';
import { LinearGradient } from 'expo-linear-gradient';
import { createPlaylist } from '../../api/playlists';
import { useAuth } from '../../context/AuthContext';

interface PlaylistCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (playlist: any) => void;
}

export default function PlaylistCreateModal({ visible, onClose, onSuccess }: PlaylistCreateModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Error', 'Playlist name is required');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create playlists');
      return;
    }

    setCreating(true);
    try {
      const playlist = await createPlaylist({
        name: name.trim(),
        description: description.trim() || undefined,
        is_public: isPublic,
        user_id: user.id,
      });

      onSuccess(playlist);
      handleClose();
      Alert.alert('Success', `Playlist "${name}" created successfully!`);
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      Alert.alert('Error', error.message || 'Failed to create playlist');
    } finally {
      setCreating(false);
    }
  }

  function handleClose() {
    setName('');
    setDescription('');
    setIsPublic(false);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
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
              <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Create Playlist</Text>
              <TouchableOpacity 
                style={[styles.headerButton, creating && styles.disabledButton]} 
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={[styles.headerButtonText, styles.createButton]}>
                  {creating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <GlassCard style={styles.formCard} variant="spotify" intensity={5}>
              <View style={styles.iconContainer}>
                <View style={styles.playlistIcon}>
                  <Ionicons name="musical-notes" size={40} color="#1db954" />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Playlist Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="My Awesome Playlist"
                  placeholderTextColor="#666"
                  maxLength={100}
                  autoFocus
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell everyone what your playlist is about..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />
                <Text style={styles.fieldHint}>{description.length}/300</Text>
              </View>

              <View style={styles.formSection}>
                <TouchableOpacity 
                  style={styles.toggleOption}
                  onPress={() => setIsPublic(!isPublic)}
                >
                  <View style={styles.toggleContent}>
                    <View style={styles.toggleInfo}>
                      <Text style={styles.toggleTitle}>Make playlist public</Text>
                      <Text style={styles.toggleDescription}>
                        {isPublic 
                          ? 'Anyone can see and follow this playlist' 
                          : 'Only you can see this playlist'
                        }
                      </Text>
                    </View>
                    <View style={[styles.toggle, isPublic && styles.toggleActive]}>
                      <View style={[styles.toggleSlider, isPublic && styles.toggleSliderActive]} />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Tips */}
            <GlassCard style={styles.tipsCard} variant="spotify" intensity={2}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={20} color="#1db954" />
                <Text style={styles.tipsTitle}>Tips</Text>
              </View>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Use descriptive names to find your playlists easily</Text>
                <Text style={styles.tipItem}>• Add a description to help others discover your playlist</Text>
                <Text style={styles.tipItem}>• You can change these settings anytime later</Text>
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
  createButton: {
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
  formCard: {
    padding: 20,
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playlistIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderWidth: 2,
    borderColor: '#1db954',
    justifyContent: 'center',
    alignItems: 'center',
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
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
    textAlign: 'right',
  },
  toggleOption: {
    marginTop: 8,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 18,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#1db954',
  },
  toggleSlider: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleSliderActive: {
    transform: [{ translateX: 22 }],
  },
  tipsCard: {
    padding: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 18,
  },
});