import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface TabBarItemProps {
  name: string;
  label: string;
  icon: string;
  activeIcon: string;
  isActive: boolean;
  onPress: () => void;
  activeColor: string;
  inactiveColor: string;
}

const TabBarItem = ({ 
  name, 
  label, 
  icon, 
  activeIcon, 
  isActive, 
  onPress, 
  activeColor, 
  inactiveColor 
}: TabBarItemProps) => {
  // Add animation for the active indicator
  const [scaleAnimation] = React.useState(new Animated.Value(isActive ? 1 : 0));
  
  React.useEffect(() => {
    Animated.spring(scaleAnimation, {
      toValue: isActive ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true
    }).start();
  }, [isActive, scaleAnimation]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.tabItemContent}>
        {/* Animated indicator pill */}
        {isActive && (
          <Animated.View 
            style={[
              styles.activeIndicator,
              { 
                backgroundColor: activeColor,
                transform: [{ scale: scaleAnimation }]
              }
            ]} 
          />
        )}
        
        <Ionicons
          name={isActive ? activeIcon as any : icon as any}
          size={isActive ? 26 : 22}
          color={isActive ? activeColor : inactiveColor}
          style={styles.tabIcon}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? activeColor : inactiveColor },
            isActive && styles.activeTabLabel
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

interface CustomTabBarProps {
  activeColor: string;
  inactiveColor: string;
  backgroundColor: string;
}

const CustomTabBar = ({ activeColor, inactiveColor, backgroundColor }: CustomTabBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  // Add debug logging
  console.log('Current pathname:', pathname);

  // Define our tabs
  const tabs = [
    { name: 'index', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { name: 'courses', label: 'Courses', icon: 'book-outline', activeIcon: 'book' },
    { name: 'calendar', label: 'Calendar', icon: 'calendar-outline', activeIcon: 'calendar' },
    { name: 'notes-assign', label: 'Tasks', icon: 'document-text-outline', activeIcon: 'document-text' },
    { name: 'statistics', label: 'Statistics', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
    { name: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
  ];

  const handleTabPress = (tabName: string) => {
    if (tabName === 'index') {
      router.push('/(tabs)'); // Use explicit path for index
    } else {
      // Use separate paths for each tab to avoid type errors
      switch(tabName) {
        case 'courses':
          router.push('/(tabs)/courses');
          break;
        case 'calendar':
          router.push('/(tabs)/calendar');
          break;
        case 'notes-assign':
          router.push('/(tabs)/notes-assign');
          break;
        case 'statistics':
          router.push('/(tabs)/statistics');
          break;
        case 'settings':
          router.push('/(tabs)/settings');
          break;
        default:
          router.push('/(tabs)');
      }
    }
  };

  // Helper to determine if a tab is active
  const isTabActive = (tabName: string) => {
    // For debugging, log the pathname
    console.log(`Checking tab: ${tabName}, Current pathname: ${pathname}`);
    
    // Handle special case for home/index tab
    if (tabName === 'index') {
      return pathname === '/' || 
             pathname === '/(tabs)' || 
             pathname === '/(tabs)/index';
    }
    
    // For all other tabs, check if the pathname contains the tab name
    // This handles both direct matches and nested routes
    return pathname.includes(`/${tabName}`);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {tabs.map((tab) => (
        <TabBarItem
          key={tab.name}
          name={tab.name}
          label={tab.label}
          icon={tab.icon}
          activeIcon={tab.activeIcon}
          isActive={isTabActive(tab.name)}
          onPress={() => handleTabPress(tab.name)}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 94 : 70, // Increased height for both platforms
    paddingBottom: Platform.OS === 'ios' ? 24 : 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    // Enhanced elevation/shadow
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12, // Increased padding
    position: 'relative', // For the absolute positioned indicator
  },
  tabItemContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 4, // Slightly increased horizontal padding
  },
  tabIcon: {
    marginBottom: 4, // Increased margin below icon
  },
  tabLabel: {
    fontSize: 11, // Slightly larger font
    fontWeight: '500',
    marginTop: 3, // Increased margin above label
    textAlign: 'center',
  },
  activeTabLabel: {
    fontWeight: 'bold',
  },
  // Pill-shaped indicator - made more prominent
  activeIndicator: {
    position: 'absolute',
    top: -8, // Positioned slightly higher
    width: 28, // Slightly wider
    height: 5, // Slightly taller
    borderRadius: 3,
    backgroundColor: '#4F46E5', // Default, will be overridden by prop
  },
});

export default CustomTabBar; 