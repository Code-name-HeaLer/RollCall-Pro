import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TimetableEntry } from '../data/types';
import { Text } from './Text';
import { Card } from './Card';
import { useData } from '../context/DataContext';
import { getThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    timetableEntries: TimetableEntry[];
}

const CourseScheduleSection: React.FC<Props> = ({ timetableEntries }) => {
    const { settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');

    // Format day to proper case
    const formatDay = (day: string): string => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    return (
        <Card title="Schedule" elevation="small">
            {(timetableEntries?.length ?? 0) === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="calendar" size={32} color={colors.border} />
                    <Text variant="body" color="secondaryText" style={styles.emptyText}>
                        No schedule set
                    </Text>
                </View>
            ) : (
                (timetableEntries ?? []).map((slot: TimetableEntry, index: number) => (
                    <View key={index} style={styles.scheduleItem}>
                        <View style={styles.dayIndicator}>
                            <Text variant="caption" weight="bold" color="secondaryText" align="center">
                                {formatDay(slot.day).substring(0, 3).toUpperCase()}
                            </Text>
                        </View>
                        <View style={styles.timeContainer}>
                            <View style={styles.timeDetail}>
                                <Ionicons name="time-outline" size={14} color={colors.secondaryText} style={styles.timeIcon} />
                                <Text variant="body" weight="semibold">{slot.startTime}</Text>
                                <Text variant="body2" color="secondaryText"> to </Text>
                                <Text variant="body" weight="semibold">{slot.endTime}</Text>
                            </View>
                            <Text variant="body2" color="secondaryText">
                                {formatDay(slot.day)}
                            </Text>
                        </View>
                    </View>
                ))
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    scheduleItem: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'center',
    },
    dayIndicator: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    timeContainer: {
        flex: 1,
    },
    timeDetail: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeIcon: {
        marginRight: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    emptyText: {
        marginTop: 8,
    }
});

export default CourseScheduleSection; 