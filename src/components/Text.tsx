import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { getThemeColors } from '../utils/theme';
import { useData } from '../context/DataContext';

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body2' | 'caption' | 'button';
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'text' | 'secondaryText';
  weight?: 'normal' | 'bold' | 'semibold' | 'light';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Text: React.FC<TextProps> = ({
  children,
  style,
  variant = 'body',
  color = 'text',
  weight = 'normal',
  align = 'auto',
  ...rest
}) => {
  const { settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');
  
  // Variant styles (font size and line height)
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return { fontSize: 28, lineHeight: 34, marginBottom: 10 };
      case 'h2':
        return { fontSize: 24, lineHeight: 30, marginBottom: 8 };
      case 'h3':
        return { fontSize: 20, lineHeight: 26, marginBottom: 6 };
      case 'h4':
        return { fontSize: 18, lineHeight: 24, marginBottom: 4 };
      case 'body':
        return { fontSize: 16, lineHeight: 22 };
      case 'body2':
        return { fontSize: 14, lineHeight: 20 };
      case 'caption':
        return { fontSize: 12, lineHeight: 18 };
      case 'button':
        return { fontSize: 16, lineHeight: 22 };
      default:
        return { fontSize: 16, lineHeight: 22 };
    }
  };
  
  // Weight styles
  const getWeightStyle = () => {
    switch (weight) {
      case 'light':
        return { fontWeight: '300' as const };
      case 'normal':
        return { fontWeight: '400' as const };
      case 'semibold':
        return { fontWeight: '600' as const };
      case 'bold':
        return { fontWeight: '700' as const };
      default:
        return { fontWeight: '400' as const };
    }
  };
  
  // Color styles
  const getColorStyle = () => {
    switch (color) {
      case 'primary':
        return { color: colors.primary };
      case 'secondary':
        return { color: colors.secondary };
      case 'success':
        return { color: colors.success };
      case 'danger':
        return { color: colors.danger };
      case 'warning':
        return { color: colors.warning };
      case 'info':
        return { color: colors.info };
      case 'secondaryText':
        return { color: colors.secondaryText };
      case 'text':
      default:
        return { color: colors.text };
    }
  };
  
  return (
    <RNText
      style={[
        getVariantStyle(),
        getWeightStyle(),
        getColorStyle(),
        { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}; 