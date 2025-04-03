import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
// import { Link } from 'expo-router'; // Remove if edit button also removed
import { Course } from '../data/types';
import { Text } from './Text';
import { Card } from './Card';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    course: Course;
}

const CourseDetailsSection: React.FC<Props> = ({ course }) => {
    const { settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');

    return (
        <Card title="Details" elevation="small">
          {course.professor && (
                <View style={styles.detailRow}>
                    <Ionicons name="person" size={18} color={colors.secondaryText} style={styles.icon} />
                    <Text variant="body" color="text">{course.professor}</Text>
                </View>
            )}
            
            {typeof course.attendanceThreshold === 'number' && (
                <View style={styles.detailRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.secondaryText} style={styles.icon} />
                    <Text variant="body" color="text">
                        Minimum Attendance: <Text weight="semibold">{course.attendanceThreshold}%</Text>
                    </Text>
                </View>
            )}
            
            <View style={styles.detailRow}>
                <Ionicons name="color-palette" size={18} color={colors.secondaryText} style={styles.icon} />
                <Text variant="body" color="text">Course Color:</Text>
                <View 
                    style={[styles.colorSwatch, { backgroundColor: course.color }]}
                />
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        marginRight: 10,
    },
    colorSwatch: {
        width: 20,
        height: 20,
        borderRadius: 4,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    }
});

export default CourseDetailsSection; 