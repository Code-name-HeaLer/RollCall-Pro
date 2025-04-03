import React from 'react';
import { View, Text } from 'react-native';
import { Course } from '../../src/data/types';

interface Props {
    course: Course;
}

const CourseDetailsSection: React.FC<Props> = ({ course }) => {
    return (
        <View className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm mb-5 border border-gray-200 dark:border-dark-border">
            <Text className="text-xl font-bold mb-3 text-gray-800 dark:text-dark-text">Details</Text>
            {course.professor && <Text className="text-base text-gray-600 dark:text-gray-300 mb-1">Professor: {course.professor}</Text>}
            {course.location && <Text className="text-base text-gray-600 dark:text-gray-300 mb-1">Location: {course.location}</Text>}
            {/* Display Threshold if set */}
            {typeof course.attendanceThreshold === 'number' && (
                <Text className="text-base text-gray-600 dark:text-gray-300 mb-2">
                    Min. Attendance: {course.attendanceThreshold}%
                 </Text>
            )}
            <View className="flex-row items-center">
                <Text className="text-base text-gray-600 dark:text-gray-300">Color:</Text>
                <View 
                    className="w-5 h-5 rounded-sm ml-2 border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: course.color }}
                />
            </View>
            {/* TODO: Add Threshold display here */}
        </View>
    );
};

export default CourseDetailsSection; 