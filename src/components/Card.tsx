import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { getThemeColors } from '../utils/theme';
import { useData } from '../context/DataContext';

interface CardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  elevation?: 'none' | 'small' | 'medium' | 'large';
  noPadding?: boolean;
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  border?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  style,
  elevation = 'small',
  noPadding = false,
  borderRadius = 'medium',
  border = true,
  ...rest
}) => {
  const { settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');

  // Get shadow style based on elevation
  const getShadowStyle = () => {
    if (settings?.theme === 'dark' || elevation === 'none') {
      return {};
    }
    
    switch (elevation) {
      case 'small':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        };
      case 'medium':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 4,
        };
      case 'large':
        return {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 6,
        };
      default:
        return {};
    }
  };
  
  // Get border radius based on size
  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'none': return 0;
      case 'small': return 4;
      case 'medium': return 8;
      case 'large': return 16;
      default: return 8;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: border ? colors.border : 'transparent',
          padding: noPadding ? 0 : 16,
          borderRadius: getBorderRadius(),
        },
        getShadowStyle(),
        style,
      ]}
      {...rest}
    >
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
          )}
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginVertical: 8,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
}); 