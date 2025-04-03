import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

const AttendanceButton = ({ title, onPress, colorClass }: { title: string; onPress: () => void; colorClass: string }) => (
    <TouchableOpacity 
        className={`flex-1 mx-1 p-2 rounded-md items-center ${colorClass}`}
        onPress={onPress}
    >
        <Text className="text-white font-semibold">{title}</Text>
    </TouchableOpacity>
);

export default AttendanceButton; 