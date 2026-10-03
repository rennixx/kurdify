import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  intensity?: number;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export default function GlassButton({
  title,
  onPress,
  style,
  textStyle,
  intensity = 15,
  variant = 'primary',
  disabled = false,
}: GlassButtonProps) {
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return ['rgba(29, 185, 84, 0.8)', 'rgba(29, 185, 84, 0.6)'];
      case 'secondary':
        return ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)'];
      case 'outline':
        return ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'];
      default:
        return ['rgba(29, 185, 84, 0.8)', 'rgba(29, 185, 84, 0.6)'];
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <BlurView intensity={intensity} tint="dark" style={styles.blur}>
        <LinearGradient
          colors={getColors()}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blur: {
    flex: 1,
  },
  gradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});