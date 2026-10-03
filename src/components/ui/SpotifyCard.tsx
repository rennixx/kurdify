import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface SpotifyCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderRadius?: number;
  padding?: number;
  elevated?: boolean;
}

export default function SpotifyCard({
  children,
  style,
  borderRadius = 8,
  padding = 16,
  elevated = false,
}: SpotifyCardProps) {
  return (
    <View style={[
      styles.container, 
      { 
        borderRadius,
        shadowOpacity: elevated ? 0.3 : 0.1,
        shadowRadius: elevated ? 6 : 3,
        elevation: elevated ? 8 : 3,
      }, 
      style
    ]}>
      <LinearGradient
        colors={[
          'rgba(28, 28, 28, 0.95)',
          'rgba(18, 18, 18, 0.98)',
        ]}
        style={[styles.gradient, { borderRadius, padding }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gradient: {
    flex: 1,
  },
});