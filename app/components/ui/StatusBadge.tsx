import React from 'react';
import { Text } from 'react-native';
import { AttendanceStatus } from '../data/types'; // Corrected path

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
    let bgColor = 'bg-gray-500'; // Default
    switch (status) {
        case 'present': bgColor = 'bg-green-500'; break;
        case 'absent': bgColor = 'bg-red-500'; break;
        case 'late': bgColor = 'bg-yellow-500'; break;
        case 'excused': bgColor = 'bg-gray-400'; break;
    }
    return (
        <Text 
            className={`text-xs font-bold text-white px-2 py-1 rounded-full overflow-hidden ${bgColor}`}
        >
            {status.toUpperCase()}
        </Text>
    );
};

export default StatusBadge; 