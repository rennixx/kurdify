import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  padding?: number;
  variant?: 'default' | 'spotify' | 'subtle';
}

export default function GlassCard({
  children,
  style,
  intensity = 10,
  tint = 'dark',
  borderRadius = 12,
  padding = 16,
  variant = 'spotify',
}: GlassCardProps) {
  
  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'spotify':
        return [
          'rgba(255, 255, 255, 0.02)',
          'rgba(255, 255, 255, 0.01)',
        ];
      case 'subtle':
        return [
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 0.02)',
        ];
      default:
        return [
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0.05)',
        ];
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'spotify':
        return 'rgba(255, 255, 255, 0.05)';
      case 'subtle':
        return 'rgba(255, 255, 255, 0.08)';
      default:
        return 'rgba(255, 255, 255, 0.2)';
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        borderRadius,
        borderColor: getBorderColor(),
        backgroundColor: variant === 'spotify' ? 'rgba(18, 18, 18, 0.9)' : 'transparent'
      }, 
      style
    ]}>
      <BlurView
        intensity={variant === 'spotify' ? 5 : intensity}
        tint={tint}
        style={[
          styles.blurContainer,
          {
            borderRadius,
            padding,
          },
        ]}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  blurContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
});