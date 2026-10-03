import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, GlassButton } from '../components/ui';
import ProfileEditModal from '../components/ui/ProfileEditModal';
import { useAuth } from '../context/AuthContext';
import { getProfile, Profile, createProfile } from '../api/profiles';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [userStats, setUserStats] = useState({
    playlists: 0,
    likedSongs: 0,
    following: 0,
    totalListeningTime: '0h 0m',
    favoriteGenre: 'Unknown'
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserStats();
      loadRecentActivity();
    }
  }, [user]);

  async function loadProfile() {
    if (!user) return;
    
    try {
      const profileData = await getProfile(user.id);
      if (!profileData) {
        // Create a new profile if it doesn't exist
        const newProfile = await createProfile({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.user_metadata?.full_name || '',
          is_admin: false
        });
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (err) {
              Alert.alert('Error', 'Failed to sign out');
              console.error(err);
            }
          },
        },
      ]
    );
  }

  async function loadUserStats() {
    try {
      // In a real app, this would fetch from your backend
      // For demo, using mock data with some randomization
      setUserStats({
        playlists: Math.floor(Math.random() * 20) + 5,
        likedSongs: Math.floor(Math.random() * 500) + 100,
        following: Math.floor(Math.random() * 50) + 10,
        totalListeningTime: `${Math.floor(Math.random() * 100) + 20}h ${Math.floor(Math.random() * 60)}m`,
        favoriteGenre: ['Kurdish Folk', 'Traditional', 'Modern Kurdish', 'Pop Kurdish'][Math.floor(Math.random() * 4)]
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  async function loadRecentActivity() {
    try {
      // Mock recent activity data
      setRecentActivity([
        { type: 'liked', item: 'Şoreşa Azadiya Kurdistan', time: '2 hours ago' },
        { type: 'playlist', item: 'Created "Kurdish Classics"', time: '1 day ago' },
        { type: 'follow', item: 'Started following Şivan Perwer', time: '3 days ago' }
      ]);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  function handleProfileUpdate(updatedProfile: Profile) {
    setProfile(updatedProfile);
  }

  function formatJoinDate(dateString?: string) {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  if (loading) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <GlassCard style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading profile...</Text>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  if (!user || !profile) {
    return (
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
          <GlassCard style={styles.loadingCard}>
            <Ionicons name="person" size={40} color="#888" />
            <Text style={styles.loadingText}>Profile not found</Text>
          </GlassCard>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top + 20, 40),
            paddingBottom: Math.max(insets.bottom + 100, 120)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <GlassCard style={styles.profileCard} variant="spotify" intensity={8}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ 
                    uri: profile.avatar_url || user.user_metadata?.avatar_url || 'https://via.placeholder.com/120' 
                  }}
                  style={styles.avatar}
                />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.fullName}>
                  {profile.full_name || user.user_metadata?.full_name || 'Music Lover'}
                </Text>
                <Text style={styles.username}>@{profile.username}</Text>
                <Text style={styles.joinDate}>
                  Member since {formatJoinDate(profile.created_at)}
                </Text>
                {profile.bio && (
                  <Text style={styles.bio} numberOfLines={2}>
                    {profile.bio}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => console.log('Share profile')}
              >
                <Ionicons name="share-outline" size={20} color="#1db954" />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <GlassCard style={styles.statsCard} variant="spotify" intensity={5}>
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{userStats.playlists}</Text>
                <Text style={styles.statLabel}>Playlists</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{userStats.likedSongs}</Text>
                <Text style={styles.statLabel}>Liked Songs</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
                <Text style={styles.statNumber}>{userStats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Listening Stats */}
        <View style={styles.listeningStatsSection}>
          <GlassCard style={styles.listeningStatsCard} variant="spotify" intensity={4}>
            <View style={styles.listeningStatsHeader}>
              <Ionicons name="headset" size={24} color="#1db954" />
              <Text style={styles.listeningStatsTitle}>Your Music Journey</Text>
            </View>
            <View style={styles.listeningStatsContent}>
              <View style={styles.listeningStatItem}>
                <Text style={styles.listeningStatLabel}>Total Listening Time</Text>
                <Text style={styles.listeningStatValue}>{userStats.totalListeningTime}</Text>
              </View>
              <View style={styles.listeningStatItem}>
                <Text style={styles.listeningStatLabel}>Favorite Genre</Text>
                <Text style={styles.listeningStatValue}>{userStats.favoriteGenre}</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentActivity.map((activity, index) => (
            <GlassCard key={index} style={styles.activityCard} variant="spotify" intensity={3}>
              <View style={styles.activityContent}>
                <View style={styles.activityIcon}>
                  <Ionicons 
                    name={activity.type === 'liked' ? 'heart' : activity.type === 'playlist' ? 'list' : 'person-add'} 
                    size={20} 
                    color="#1db954" 
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText}>{activity.item}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Settings & More</Text>
          
          {/* Account */}
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <GlassCard style={styles.menuCard} variant="spotify" intensity={3}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="person-outline" size={24} color="#fff" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Account Settings</Text>
                <Text style={styles.menuSubtext}>Manage your account details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </GlassCard>
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <GlassCard style={styles.menuCard} variant="spotify" intensity={3}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="shield-outline" size={24} color="#fff" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Privacy & Safety</Text>
                <Text style={styles.menuSubtext}>Control your privacy settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </GlassCard>
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <GlassCard style={styles.menuCard} variant="spotify" intensity={3}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Notifications</Text>
                <Text style={styles.menuSubtext}>Manage notification preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </GlassCard>
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
            <GlassCard style={styles.menuCard} variant="spotify" intensity={3}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="help-circle-outline" size={24} color="#fff" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuText}>Help & Support</Text>
                <Text style={styles.menuSubtext}>Get help and contact support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </GlassCard>
          </TouchableOpacity>

          {/* Admin Panel (if admin) */}
          {profile.is_admin && (
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <GlassCard style={styles.menuCard} variant="spotify" intensity={3}>
                <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
                  <Ionicons name="construct-outline" size={24} color="#1db954" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuText, { color: '#1db954' }]}>Admin Panel</Text>
                  <Text style={styles.menuSubtext}>Manage app settings and content</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1db954" />
              </GlassCard>
            </TouchableOpacity>
          )}
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <GlassButton
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={styles.signOutButton}
            textStyle={styles.signOutText}
          />
        </View>
      </ScrollView>

      {/* Profile Edit Modal */}
      {profile && (
        <ProfileEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          profile={profile}
          onSave={handleProfileUpdate}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    letterSpacing: 0.2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  editButton: {
    padding: 4,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 20,
    borderWidth: 3,
    borderColor: 'rgba(29, 185, 84, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  username: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 18,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  joinDate: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    fontWeight: '400',
  },
  statsSection: {
    marginBottom: 30,
  },
  statsCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuSection: {
    marginBottom: 30,
  },
  menuItem: {
    marginBottom: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.1,
  },
  signOutSection: {
    marginTop: 20,
  },
  signOutButton: {
    width: '100%',
  },
  signOutText: {
    color: '#ff4444',
  },
  // New styles for enhanced profile
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1db954',
    borderWidth: 2,
    borderColor: '#000',
  },
  bio: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 10,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.05,
  },
  shareButton: {
    padding: 8,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1db954',
  },
  listeningStatsSection: {
    marginBottom: 30,
  },
  listeningStatsCard: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  listeningStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listeningStatsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.1,
  },
  listeningStatsContent: {
    gap: 12,
  },
  listeningStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listeningStatLabel: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  listeningStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityCard: {
    padding: 16,
    marginBottom: 8,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    color: '#b3b3b3',
    fontSize: 12,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
  },
  menuSubtext: {
    color: '#b3b3b3',
    fontSize: 12,
    marginTop: 2,
  },
});