import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Slot } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { getThemeColors } from '../../src/utils/theme';
import CustomTabBar from '../../src/components/CustomTabBar';
import AppHeader from '../../src/components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const { settings, isLoading } = useData();
  
  // Loading check
  if (isLoading || !settings) {
    const colors = settings ? getThemeColors(settings.theme) : getThemeColors('light');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const colors = getThemeColors(settings.theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <AppHeader />
      
      {/* This is where the active tab screen will be rendered */}
      <View style={styles.screenContainer}>
        <Slot />
      </View>
      
      {/* Custom Tab Bar */}
      <CustomTabBar 
        activeColor={colors.primary} 
        inactiveColor={colors.secondaryText} 
        backgroundColor={colors.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
  },
}); 