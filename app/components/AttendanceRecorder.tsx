import React from 'react';
import { View, Text } from 'react-native';
import AttendanceButton from './ui/AttendanceButton'; // Use UI component
import { AttendanceStatus } from '../data/types';

interface Props {
    courseId: string;
    getTodayDateString: () => string; // Pass helper function or date string
    onRecordAttendance: (status: AttendanceStatus) => void;
}

const AttendanceRecorder: React.FC<Props> = ({ courseId, getTodayDateString, onRecordAttendance }) => {
    return (
        <View className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm mb-5 border border-gray-200 dark:border-dark-border">
            <Text className="text-xl font-bold mb-3 text-gray-800 dark:text-dark-text">Record Today's Attendance ({getTodayDateString()})</Text>
            <View className="flex-row justify-around mb-2">
                <AttendanceButton title="Present" onPress={() => onRecordAttendance('present')} colorClass="bg-green-500"/>
                <AttendanceButton title="Absent" onPress={() => onRecordAttendance('absent')} colorClass="bg-red-500"/>
                <AttendanceButton title="Late" onPress={() => onRecordAttendance('late')} colorClass="bg-yellow-500"/>
                <AttendanceButton title="Excused" onPress={() => onRecordAttendance('excused')} colorClass="bg-gray-400"/>
            </View>
      </View>
    );
};

export default AttendanceRecorder; 