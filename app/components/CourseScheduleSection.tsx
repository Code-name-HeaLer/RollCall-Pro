import React from 'react';
import { View, Text } from 'react-native';
import { Course, Schedule } from '../../src/data/types';

interface Props {
    course: Course;
}

const CourseScheduleSection: React.FC<Props> = ({ course }) => {
    return (
        <View className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm mb-5 border border-gray-200 dark:border-dark-border">
            <Text className="text-xl font-bold mb-3 text-gray-800 dark:text-dark-text">Schedule</Text>
            {course.schedule.map((slot: Schedule, index: number) => (
                <Text key={index} className="text-base text-gray-600 dark:text-gray-300 mb-1">
                    {`${slot.day}, ${slot.startTime} - ${slot.endTime}`}
                </Text>
            ))}
            {course.schedule.length === 0 && <Text className="text-gray-500 dark:text-gray-400 italic">No schedule set.</Text>}
        </View>
    );
};

export default CourseScheduleSection; 