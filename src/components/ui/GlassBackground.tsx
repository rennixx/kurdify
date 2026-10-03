import React from 'react';
import { ScrollView, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GlassBackgroundProps {
  children: React.ReactNode;
  colors?: string[];
}

const { width, height } = Dimensions.get('window');

export default function GlassBackground({
  children,
  colors = [
    '#0a0a0a',
    '#1a1a2e',
    '#16213e',
    '#0f0f23',
  ],
}: GlassBackgroundProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <LinearGradient
      colors={colors}
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
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 100)
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
});