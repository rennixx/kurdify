import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './src/context/AuthContext';
import { PlayerProvider } from './src/context/PlayerContext';
import Home from './src/screens/Home';
import Auth from './src/screens/Auth';
import Player from './src/screens/Player';
import Search from './src/screens/Search';
import Library from './src/screens/Library';
import Artist from './src/screens/Artist';
import Album from './src/screens/Album';
import Admin from './src/screens/Admin';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Auth" component={Auth} />
            <Stack.Screen name="Player" component={Player} />
            <Stack.Screen name="Search" component={Search} />
            <Stack.Screen name="Library" component={Library} />
            <Stack.Screen name="Artist" component={Artist} />
            <Stack.Screen name="Album" component={Album} />
            <Stack.Screen name="Admin" component={Admin} />
          </Stack.Navigator>
        </NavigationContainer>
      </PlayerProvider>
    </AuthProvider>
  );
}
