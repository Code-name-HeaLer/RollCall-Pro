import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Session } from '../../src/data/types';
import StatusBadge from './ui/StatusBadge'; // Use UI component
import EditSessionModal from './EditSessionModal'; // Import the modal
import { useData } from '../../src/context/DataContext'; // Import useData to get update function

interface Props {
    sessions: Session[];
    courseId: string; // Need courseId to update the correct course
}

const AttendanceHistoryList: React.FC<Props> = ({ sessions, courseId }) => {
    const { updateSessionDetails } = useData(); // Get update function from context
    const [modalVisible, setModalVisible] = useState(false);
    const [editingSession, setEditingSession] = useState<Session | null>(null);

    const handleEditPress = (session: Session) => {
        setEditingSession(session);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingSession(null); // Clear editing session on close
    };

    const handleSaveChanges = (details: { notes?: string; assignments?: string[] }) => {
        if (editingSession) {
            updateSessionDetails(courseId, editingSession.date, details);
        }
        // Modal is closed within EditSessionModal's handleSave
    };

    // Define renderItem inside the component to access state/handlers
    const renderSessionItem = ({ item }: { item: Session }) => (
        <View className="py-3 border-b border-gray-200 dark:border-dark-border last:border-b-0">
            {/* Top Row: Date, Status, Edit Button */}
            <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base font-medium text-gray-700 dark:text-dark-text">{item.date}</Text>
                <View className="flex-row items-center">
                    <StatusBadge status={item.status} />
                    {/* Pass current item to edit handler */}
                    <TouchableOpacity onPress={() => handleEditPress(item)} className="ml-3 p-1">
                        <Text className="text-blue-600 dark:text-blue-400 text-sm">Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {/* Notes */}
            {item.notes && (
                <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">Notes: {item.notes}</Text>
            )}
            {/* Assignments */}
            {item.assignments && item.assignments.length > 0 && (
                 <View className="mt-1">
                     <Text className="text-sm text-gray-600 dark:text-gray-400 font-medium">Assignments:</Text>
                     {item.assignments.map((assignment, index) => (
                        <Text key={index} className="text-sm text-gray-500 dark:text-gray-400 ml-2">- {assignment}</Text>
                     ))}
                 </View>
            )}
        </View>
    );

    return (
        <View className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm mb-5 border border-gray-200 dark:border-dark-border">
            <Text className="text-xl font-bold mb-1 text-gray-800 dark:text-dark-text">Attendance History</Text>
            {sessions.length === 0 ? (
                <Text className="text-gray-500 dark:text-gray-400 italic mt-2">No attendance recorded yet.</Text>
            ) : (
                <FlatList 
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={(item) => item.date}
                    scrollEnabled={false}
                />
            )}
            {/* Render the modal */}
            <EditSessionModal 
                visible={modalVisible} 
                session={editingSession} 
                onClose={handleCloseModal} 
                onSave={handleSaveChanges} 
            />
        </View>
    );
};

export default AttendanceHistoryList; 