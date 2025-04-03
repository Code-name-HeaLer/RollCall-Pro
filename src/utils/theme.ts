// Theme utility for consistent styling across the app

// Custom type for theme colors
export type ThemeColors = {
  // Basic colors
  background: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  
  // UI elements
  headerBackground: string;
  headerText: string;
  inputBackground: string;
  
  // Status colors (consistent across themes)
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
};

// Define theme colors
export const lightColors: ThemeColors = {
  // Basic colors
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#111827',
  secondaryText: '#4B5563',
  border: '#E5E7EB',
  
  // UI elements
  headerBackground: '#FFFFFF', 
  headerText: '#111827',
  inputBackground: '#F9FAFB',
  
  // Status colors
  primary: '#4F46E5',    // Indigo
  secondary: '#6B7280',  // Gray
  success: '#10B981',    // Emerald
  danger: '#EF4444',     // Red
  warning: '#F59E0B',    // Amber
  info: '#3B82F6',       // Blue
};

export const darkColors: ThemeColors = {
  // Basic colors
  background: '#111827', 
  card: '#1F2937',
  text: '#F9FAFB',
  secondaryText: '#D1D5DB',
  border: '#374151',
  
  // UI elements
  headerBackground: '#1F2937',
  headerText: '#F9FAFB',
  inputBackground: '#374151',
  
  // Status colors (same as light mode for consistency)
  primary: '#4F46E5',   
  secondary: '#6B7280',  
  success: '#10B981',   
  danger: '#EF4444',    
  warning: '#F59E0B',   
  info: '#3B82F6',      
};

// Helper function to get current theme colors
export const getThemeColors = (theme: 'light' | 'dark'): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors;
};

// Helper function for common styles with theme awareness
export const getCommonStyles = (theme: 'light' | 'dark') => {
  const colors = getThemeColors(theme);
  
  return {
    // Cards and containers
    card: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      marginVertical: 8,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    
    // Text styles
    heading: {
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
    },
    subheading: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 8,
    },
    bodyText: {
      color: colors.text,
      fontSize: 15,
    },
    secondaryText: {
      color: colors.secondaryText,
      fontSize: 14,
    },
    
    // Input styles
    input: {
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 6,
      padding: 12,
      color: colors.text,
    },
    
    // Button styles
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 16,
    },
    
    // List items
    listItem: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 16,
      marginBottom: 8,
    }
  };
}; 