# Kurdify (skeleton)

This repository contains the complete Kurdify Expo app (TypeScript + Expo SDK 54). A Kurdish music streaming platform with Supabase backend.

## 🚀 **Current Status: Phase 2 Complete**

**Phase 0**: ✅ Project structure, tooling, Expo SDK 54  
**Phase 1**: ✅ Complete Supabase backend (schema, RLS, storage, analytics)  
**Phase 2**: ✅ Frontend auth, navigation, player context  

## 🎵 **Features**

- **🔐 Complete Authentication** (Sign up, sign in, password reset)
- **📱 Bottom Tab Navigation** (Home, Search, Library, Profile) 
- **🎧 Advanced Player Context** (queue, play/pause, skip, seek)
- **👤 User Profiles** with admin role support
- **📂 Playlists** with CRUD operations
- **❤️ Likes & Play Tracking** with analytics
- **🔒 Row Level Security** for all data
- **☁️ Supabase Storage** for audio files and covers
- **📊 Trending Songs** algorithm
- **🛡️ Type-safe** throughout with TypeScript

## 🛠 **Quick Setup**

### 1. Install Dependencies
```powershell
pnpm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and add your Supabase credentials:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Setup
Run `migration_phase1.sql` in your Supabase SQL Editor to set up all tables, RLS policies, and functions.

### 4. Storage Setup
Follow `STORAGE_SETUP.md` to create storage buckets and policies.

### 5. Start Development
```powershell
pnpm start
```

## 📁 **Project Structure**

```
src/
├── api/           # Supabase client & API helpers
├── components/    # Reusable UI components
├── screens/       # All app screens
│   ├── auth/      # Login, SignUp, ForgotPassword
│   └── admin/     # Admin upload screen
├── context/       # Auth & Player contexts
├── hooks/         # Custom hooks
├── navigation/    # React Navigation setup
├── services/      # Business logic
├── utils/         # Helper functions
└── types/         # TypeScript definitions
```

## 🏗 **Architecture**

- **Frontend**: React Native + Expo SDK 54
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State**: React Context (Auth + Player)
- **Navigation**: React Navigation v7 (Bottom Tabs + Stack)
- **Styling**: React Native StyleSheet
- **Type Safety**: TypeScript throughout

## 🔐 **Authentication Flow**

1. **Unauthenticated**: Shows auth stack (Login/SignUp/ForgotPassword)
2. **Authenticated**: Shows main app with bottom tabs
3. **Admin Users**: Access to admin upload screen
4. **Session Persistence**: Automatic login on app restart

## 🎵 **Player Features**

- **Queue Management**: Add/remove songs, reorder
- **Playback Controls**: Play, pause, skip next/prev, seek
- **State Persistence**: Remember playback state
- **Track Info**: Current song, position, duration

## 🗃️ **Database Schema**

- **profiles**: User profiles linked to auth.users
- **artists/albums/songs**: Music catalog with metadata
- **playlists/playlist_songs**: User playlists
- **song_likes**: Like/unlike functionality  
- **plays**: Play tracking for analytics
- **song_counters**: Aggregated play counts
- **Trending algorithm**: RPC function for popular songs

## 🚀 **Deployment**

### EAS Build Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Set environment secrets
eas secret:create --scope project --name SUPABASE_URL --value your-url
eas secret:create --scope project --name SUPABASE_ANON_KEY --value your-key

# Build for development
eas build --platform ios --profile development
```

See `EAS_SETUP.md` for complete deployment guide.

## 📚 **Documentation**

- `DATABASE_SETUP.md` - Database schema guide
- `STORAGE_SETUP.md` - File storage configuration  
- `EAS_SETUP.md` - Build and deployment
- `migration_phase1.sql` - Complete database migration
- `schema.sql` - Fresh installation schema

## 🔧 **Development Commands**

```powershell
# Start Expo dev server
pnpm start

# Start with cache clear
pnpm start --clear

# Run linting
pnpm lint

# Format code
pnpm format

# Build for production
eas build --platform ios --profile production
```

## 🛣 **Next Steps**

Phase 3+ will include:
- **Real audio playback** (expo-audio integration)
- **File upload UI** (admin song uploads)
- **Advanced player** (visualizations, equalizer)
- **Social features** (following, sharing)
- **Offline support** (downloaded songs)

## 🤝 **Contributing**

This is a complete, production-ready music streaming app foundation. All authentication, database, and navigation is fully implemented and ready for enhancement.

---

**Built with ❤️ for Kurdish music** 🎵

