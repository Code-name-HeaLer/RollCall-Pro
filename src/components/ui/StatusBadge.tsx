import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../Text';
import { AttendanceStatus } from '../../data/types';
import { useData } from '../../context/DataContext';
import { getThemeColors } from '../../utils/theme';

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = 'medium'
}) => {
  const { settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');
  
  const getStatusStyle = () => {
    switch(status) {
      case 'present':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderColor: colors.success,
          color: colors.success,
          label: 'Present'
        };
      case 'absent':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          borderColor: colors.danger,
          color: colors.danger,
          label: 'Absent'
        };
      case 'canceled':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderColor: colors.warning,
          color: colors.warning,
          label: 'Canceled'
        };
      case 'holiday':
        return {
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          borderColor: colors.primary,
          color: colors.primary,
          label: 'Holiday'
        };
      default:
        return {
          backgroundColor: 'rgba(107, 114, 128, 0.15)',
          borderColor: colors.secondary,
          color: colors.secondary,
          label: 'Unknown'
        };
    }
  };
  
  const statusStyle = getStatusStyle();
  
  const getSizeStyle = () => {
    switch(size) {
      case 'small':
        return {
          paddingVertical: 2,
          paddingHorizontal: 6,
          fontSize: 10,
          borderRadius: 4,
        };
      case 'large':
        return {
          paddingVertical: 6,
          paddingHorizontal: 12,
          fontSize: 14,
          borderRadius: 8,
        };
      case 'medium':
      default:
        return {
          paddingVertical: 4,
          paddingHorizontal: 8,
          fontSize: 12,
          borderRadius: 6,
        };
    }
  };
  
  const sizeStyle = getSizeStyle();
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusStyle.backgroundColor,
          borderColor: statusStyle.borderColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
        },
      ]}
    >
      <Text
        style={{ color: statusStyle.color, fontSize: sizeStyle.fontSize }}
        weight="semibold"
      >
        {statusStyle.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    alignItems: 'center', 
    justifyContent: 'center',
  },
});

export default StatusBadge; 