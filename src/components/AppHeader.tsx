import React from 'react';
import { View, StyleSheet, Image, Platform, StatusBar } from 'react-native';
import { Text } from './Text';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AppHeaderProps {
  title?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ title = 'RollCall Pro' }) => {
  const { settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');
  
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.card }}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.titleContainer}>
          <Text 
            variant="h2" 
            weight="bold" 
            style={styles.title}
          >
            {title}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    marginBottom: 0, // Override default margin
  },
});

export default AppHeader; 