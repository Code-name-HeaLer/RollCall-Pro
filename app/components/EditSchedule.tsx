import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Schedule } from '../../src/data/types';
import { Text } from '../../src/components/Text';
import { useData } from '../../src/context/DataContext';
import { getThemeColors } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import Modal from "react-native-modal";

// Simple Dropdown Picker (Replace with a better library later if needed)
// For simplicity, we'll use basic buttons for Day selection initially

interface Props {
    schedule: Schedule[];
    onScheduleChange: (newSchedule: Schedule[]) => void;
}

const daysOfWeek: Schedule['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Helper to format time as HH:MM
const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to parse HH:MM time string into a Date object
const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
};

const EditSchedule: React.FC<Props> = ({ schedule, onScheduleChange }) => {
    const { settings } = useData();
    const colors = getThemeColors(settings?.theme || 'light');
    
    const [showPicker, setShowPicker] = useState<false | 'startTime' | 'endTime'>(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [selectedTime, setSelectedTime] = useState(new Date());

    const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate && editingIndex !== null && showPicker) {
            const newSchedule = [...schedule];
            newSchedule[editingIndex] = {
                ...newSchedule[editingIndex],
                [showPicker]: formatTime(selectedDate),
            };
            
            // Validate end time is after start time
            if (showPicker === 'endTime' && newSchedule[editingIndex].startTime) {
                const startTime = parseTime(newSchedule[editingIndex].startTime);
                if (selectedDate <= startTime) {
                    // Add one hour to the selected time
                    selectedDate.setHours(selectedDate.getHours() + 1);
                    newSchedule[editingIndex].endTime = formatTime(selectedDate);
                }
            }
            
            onScheduleChange(newSchedule);
        }
        setTimePickerVisible(false);
        setShowPicker(false);
        setEditingIndex(null);
    };

    const handleDayChange = (index: number, day: Schedule['day']) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], day };
        onScheduleChange(newSchedule);
    };

    const addSlot = () => {
        // Find the next available day that's not in use
        const usedDays = new Set(schedule.map(s => s.day));
        const availableDay = daysOfWeek.find(day => !usedDays.has(day)) || 'Monday';
        
        onScheduleChange([
            ...schedule,
            { day: availableDay, startTime: '09:00', endTime: '10:00' }
        ]);
    };

    const removeSlot = (index: number) => {
        onScheduleChange(schedule.filter((_, i) => i !== index));
    };

    const openTimePicker = (index: number, type: 'startTime' | 'endTime') => {
        setEditingIndex(index);
        setShowPicker(type);
        setSelectedTime(parseTime(schedule[index][type]));
        setTimePickerVisible(true);
    };

    return (
        <View style={styles.container}>
            {schedule.map((slot, index) => (
                <View
                    key={index}
                    style={[
                        styles.scheduleSlot,
                        { 
                            backgroundColor: colors.card,
                            borderColor: colors.border
                        }
                    ]}
                >
                    <View style={styles.slotHeader}>
                        <Text variant="body" weight="semibold" color="text">Class {index + 1}</Text>
                        <Pressable
                            onPress={() => removeSlot(index)}
                            style={({ pressed }) => [
                                styles.removeButton,
                                { 
                                    backgroundColor: colors.danger + '15',
                                    opacity: pressed ? 0.7 : 1
                                }
                            ]}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </Pressable>
                    </View>

                    <View style={styles.daysContainer}>
                        {daysOfWeek.map(day => (
                            <Pressable
                                key={day}
                                onPress={() => handleDayChange(index, day)}
                                style={({ pressed }) => [
                                    styles.dayButton,
                                    {
                                        backgroundColor: slot.day === day ? colors.primary : colors.card,
                                        borderColor: slot.day === day ? colors.primary : colors.border,
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ]}
                            >
                                <Text
                                    variant="caption"
                                    weight={slot.day === day ? "semibold" : "normal"}
                                    style={{
                                        color: slot.day === day ? '#FFFFFF' : colors.text
                                    }}
                                >
                                    {day.substring(0, 3)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.timeContainer}>
                        <Pressable
                            onPress={() => openTimePicker(index, 'startTime')}
                            style={({ pressed }) => [
                                styles.timeButton,
                                { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    opacity: pressed ? 0.7 : 1
                                }
                            ]}
                        >
                            <Ionicons name="time-outline" size={18} color={colors.primary} />
                            <Text variant="body" color="text" style={styles.timeText}>{slot.startTime}</Text>
                        </Pressable>

                        <Text variant="body" color="secondaryText" style={styles.timeSeperator}>to</Text>

                        <Pressable
                            onPress={() => openTimePicker(index, 'endTime')}
                            style={({ pressed }) => [
                                styles.timeButton,
                                { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    opacity: pressed ? 0.7 : 1
                                }
                            ]}
                        >
                            <Ionicons name="time-outline" size={18} color={colors.primary} />
                            <Text variant="body" color="text" style={styles.timeText}>{slot.endTime}</Text>
                        </Pressable>
                    </View>
                </View>
            ))}

            <Pressable
                onPress={addSlot}
                style={({ pressed }) => [
                    styles.addButton,
                    { 
                        backgroundColor: colors.primary + '15',
                        opacity: pressed ? 0.7 : 1
                    }
                ]}
            >
                <Ionicons name="add-circle" size={20} color={colors.primary} />
                <Text variant="button" color="primary" style={styles.addButtonText}>
                    Add Time Slot
                </Text>
            </Pressable>

            {/* Time Picker Modal */}
            <Modal
                isVisible={timePickerVisible}
                onBackdropPress={() => setTimePickerVisible(false)}
                style={styles.modal}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <Text variant="h3" weight="semibold" color="text" style={styles.modalTitle}>
                        Select Time
                    </Text>
                    
                    <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleTimeChange}
                    />
                    
                    {Platform.OS === 'ios' && (
                        <View style={styles.modalActions}>
                            <Pressable
                                onPress={() => setTimePickerVisible(false)}
                                style={({ pressed }) => [
                                    styles.modalButton,
                                    { 
                                        backgroundColor: colors.danger + '15',
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ]}
                            >
                                <Text variant="body" weight="semibold" style={{ color: colors.danger }}>Cancel</Text>
                            </Pressable>
                            
                            <Pressable
                                onPress={() => {
                                    handleTimeChange({
                                        type: 'set',
                                        nativeEvent: {
                                            timestamp: selectedTime.getTime(),
                                            utcOffset: selectedTime.getTimezoneOffset() * -1
                                        }
                                    }, selectedTime);
                                }}
                                style={({ pressed }) => [
                                    styles.modalButton,
                                    { 
                                        backgroundColor: colors.success + '15',
                                        opacity: pressed ? 0.7 : 1
                                    }
                                ]}
                            >
                                <Text variant="body" weight="semibold" style={{ color: colors.success }}>Select</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 12,
    },
    scheduleSlot: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        gap: 12,
    },
    slotHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    removeButton: {
        padding: 8,
        borderRadius: 8,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        minWidth: 48,
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
    },
    timeText: {
        flex: 1,
    },
    timeSeperator: {
        paddingHorizontal: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        marginLeft: 4,
    },
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalTitle: {
        marginBottom: 16,
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 16,
    },
    modalButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
    },
});

export default EditSchedule; 