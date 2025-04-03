import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Session } from '../../src/data/types';

interface Props {
    visible: boolean;
    session: Session | null; // Session to edit
    onClose: () => void;
    onSave: (details: { notes?: string; assignments?: string[] }) => void;
}

const EditSessionModal: React.FC<Props> = ({ visible, session, onClose, onSave }) => {
    const [notes, setNotes] = useState('');
    const [assignmentsText, setAssignmentsText] = useState(''); // Store assignments as newline-separated text

    // Update state when the session prop changes
    useEffect(() => {
        if (session) {
            setNotes(session.notes || '');
            setAssignmentsText(session.assignments?.join('\n') || '');
        } else {
            // Reset fields if session is null (e.g., modal closed)
            setNotes('');
            setAssignmentsText('');
        }
    }, [session]);

    const handleSave = () => {
        if (!session) return; // Should not happen if modal is visible

        // Convert assignment text back to array, filtering empty lines
        const assignmentsArray = assignmentsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        onSave({ 
            notes: notes.trim() || undefined, // Save undefined if empty
            assignments: assignmentsArray.length > 0 ? assignmentsArray : undefined // Save undefined if empty
         });
        onClose(); // Close modal after saving
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/50" // Semi-transparent background
            >
                <View className="bg-white dark:bg-dark-card w-11/12 max-h-[80%] p-5 rounded-lg shadow-lg">
                    <ScrollView>
                        <Text className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text">Edit Session ({session?.date})</Text>
                        
                        {/* Notes Input */}
                        <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Notes:</Text>
                        <TextInput
                            className="border border-gray-300 dark:border-dark-border p-3 mb-4 rounded-md bg-white dark:bg-dark-input h-24 text-base text-gray-900 dark:text-dark-text align-top"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add session notes..."
                            placeholderTextColor="#9ca3af"
                            multiline={true}
                            textAlignVertical="top" // Align text to top for multiline
                        />

                        {/* Assignments Input */}
                         <Text className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Assignments (one per line):</Text>
                        <TextInput
                            className="border border-gray-300 dark:border-dark-border p-3 mb-6 rounded-md bg-white dark:bg-dark-input h-32 text-base text-gray-900 dark:text-dark-text align-top"
                            value={assignmentsText}
                            onChangeText={setAssignmentsText}
                            placeholder="- Homework 5 assigned\n- Read Chapter 3"
                            placeholderTextColor="#9ca3af"
                            multiline={true}
                            textAlignVertical="top"
                        />

                        {/* Action Buttons */}
                        <View className="flex-row justify-end mt-4">
                            <TouchableOpacity 
                                onPress={onClose} 
                                className="bg-gray-300 dark:bg-gray-600 active:bg-gray-400 px-4 py-2 rounded mr-3"
                            >
                                <Text className="text-gray-800 dark:text-dark-text font-semibold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                onPress={handleSave} 
                                className="bg-primary active:bg-indigo-700 px-4 py-2 rounded"
                            >
                                <Text className="text-white font-semibold">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                 </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default EditSessionModal; 