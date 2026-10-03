import React, { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { PlayerProvider } from './src/context/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import MiniPlayer from './src/components/ui/MiniPlayer';
import FullScreenPlayer from './src/components/ui/FullScreenPlayer';

export default function App() {
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <AppNavigator />
          <MiniPlayer onPress={() => setShowFullPlayer(true)} />
          <FullScreenPlayer 
            visible={showFullPlayer} 
            onClose={() => setShowFullPlayer(false)} 
          />
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
