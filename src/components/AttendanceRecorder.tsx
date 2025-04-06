import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Text } from './Text';
import { Button } from './Button';
import { AttendanceStatus } from '../data/types';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    courseId: string;
    getTodayDateString: () => string;
    onRecordAttendance: (status: AttendanceStatus) => void;
}

const AttendanceRecorder: React.FC<Props> = ({ courseId, getTodayDateString, onRecordAttendance }) => {
    const { settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');
    
    // Status buttons with appropriate styling
    const attendanceButtons = [
        { 
            status: 'present' as AttendanceStatus, 
            title: 'Present', 
            icon: 'checkmark-circle',
            style: {
                backgroundColor: '#E6F4EA',
                borderWidth: 1,
                borderColor: '#34A853'
            },
            iconColor: '#34A853'
        },
        { 
            status: 'absent' as AttendanceStatus, 
            title: 'Absent', 
            icon: 'close-circle',
            style: {
                backgroundColor: '#FFEBEE',
                borderWidth: 1,
                borderColor: '#EA4335'
            },
            iconColor: '#EA4335'
        },
        { 
            status: 'canceled' as AttendanceStatus, 
            title: 'Canceled', 
            icon: 'ban',
            style: {
                backgroundColor: '#FFF8E1',
                borderWidth: 1,
                borderColor: '#FBBC04'
            },
            iconColor: '#FBBC04'
        },
        { 
            status: 'holiday' as AttendanceStatus, 
            title: 'Holiday', 
            icon: 'sunny',
            style: {
                backgroundColor: '#E8F0FE',
                borderWidth: 1,
                borderColor: '#4285F4'
            },
            iconColor: '#4285F4'
        }
    ];
    
    return (
        <Card 
            title="Record Attendance" 
            subtitle={`Today: ${getTodayDateString()}`}
            elevation="small"
        >
            <View style={styles.buttonsContainer}>
                {attendanceButtons.map((button) => (
                    <Button
                        key={button.status}
                        title={button.title}
                        variant="outline"
                        leftIcon={<Ionicons name={button.icon as any} size={16} color={button.iconColor} />}
                        onPress={() => onRecordAttendance(button.status)}
                        style={[styles.button, button.style]}
                    />
                ))}
            </View>
            <Text variant="caption" color="secondaryText" style={styles.helpText}>
                Tap a button to record today's attendance status
            </Text>
        </Card>
    );
};

const styles = StyleSheet.create({
    buttonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        paddingHorizontal: 12,
    },
    button: {
        width: '48%',
        marginHorizontal: '1%',
        marginVertical: 4,
        borderRadius: 12,
    },
    helpText: {
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 16
    }
});

export default AttendanceRecorder; 