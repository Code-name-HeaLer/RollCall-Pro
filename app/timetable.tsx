import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, TextInput, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useData } from '../src/context/DataContext';
import { getThemeColors } from '../src/utils/theme';
import { Text } from '../src/components/Text';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Helper to format Date object to HH:MM AM/PM
const formatTime = (date: Date): string => {
    return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true, 
    });
};

// Helper to parse HH:MM AM/PM string back to a Date object (for picker value)
const parseTime = (timeString: string): Date => {
    const now = new Date(); // Use today for date parts
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) { // Handle midnight
        hours = 0;
    }
    
    now.setHours(hours, minutes, 0, 0);
    return now;
};

const TimetableScreen = () => {
  const { settings, courses, timetable, addTimetableEntry, deleteTimetableEntry } = useData();
  const router = useRouter();
  const colors = getThemeColors(settings?.theme || 'light');

  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);

  // State for the Add Entry form
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courses[0]?.id);
  const [startTime, setStartTime] = useState('09:00 AM'); // Use 12hr format with AM/PM
  const [endTime, setEndTime] = useState('10:00 AM');   // Use 12hr format with AM/PM
  const [location, setLocation] = useState('');
  const [isCourseModalVisible, setIsCourseModalVisible] = useState(false); // State for modal visibility
  // State for time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const entriesForSelectedDay = useMemo(() => {
    return timetable
      .filter(entry => entry.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)); // Sort by start time
  }, [timetable, selectedDay]);

  const getCourseName = (courseId: string) => {
    return courses.find(c => c.id === courseId)?.name || 'Unknown Course';
  };

  const handleAddEntry = () => {
    if (!selectedCourseId || !startTime || !endTime || !location) {
      Alert.alert('Error', 'Please fill in all fields: Course, Start Time, End Time, and Location.');
      return;
    }
    // TODO: Add time validation (e.g., format HH:MM, endTime > startTime)
    
    addTimetableEntry({
        day: selectedDay,
        startTime,
        endTime,
        location,
        courseId: selectedCourseId,
    });
    // Reset form maybe?
    // setStartTime(''); setEndTime(''); setLocation('');
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
        "Delete Entry",
        "Are you sure you want to remove this timetable entry?",
        [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", 
                style: "destructive", 
                onPress: () => deleteTimetableEntry(entryId) 
            }
        ]
    );
  };

  // Time Picker onChange handlers
  const onStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || parseTime(startTime); // Use current if cancelled
    setShowStartTimePicker(Platform.OS === 'ios'); // Keep open on iOS until done
    setStartTime(formatTime(currentDate));
  };

  const onEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || parseTime(endTime);
    setShowEndTimePicker(Platform.OS === 'ios');
    setEndTime(formatTime(currentDate));
  };

  const getCourseColor = (courseId: string): string => {
      return courses.find(c => c.id === courseId)?.color || colors.border;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen 
        options={{ 
            title: 'Manage Timetable', 
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text },
        }} 
      />

      {/* Day Selector Tabs - Horizontal Scroll */}
      <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.daySelectorScrollContainer}
      >
        <View style={styles.daySelector}>
          {daysOfWeek.map(day => (
            <Pressable 
              key={day}
              style={[
                styles.dayTab,
                selectedDay === day 
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text 
                style={[
                    styles.dayTabText,
                    selectedDay === day ? { color: '#FFFFFF' } : { color: colors.text }
                ]}
              >
                {day.substring(0, 3).toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Timetable List for Selected Day */}
      <Card title={`${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}'s Schedule`} style={styles.card}>
        {entriesForSelectedDay.length > 0 ? (
          entriesForSelectedDay.map(entry => (
            <View key={entry.id} style={[styles.entryItem, { borderBottomColor: colors.border }]}>
              {/* Add Course Color Indicator */}
              <View style={[styles.entryColorIndicator, { backgroundColor: getCourseColor(entry.courseId) }]} />
              <View style={styles.entryDetails}>
                <Text weight="semibold">{getCourseName(entry.courseId)}</Text>
                <Text variant="body2" color="secondaryText">{entry.startTime} - {entry.endTime}</Text>
                <Text variant="caption" color="secondaryText">{entry.location}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)} style={styles.deleteButton}>
                 <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text color="secondaryText" align="center" style={{ paddingVertical: 16 }}>No classes scheduled for {selectedDay}.</Text>
        )}
      </Card>

      {/* Add New Entry Form */}
      <Card title="Add New Entry" style={styles.card}>
        {/* Course Picker Trigger */}
        <View style={styles.inputContainer}>
            <Text style={styles.label} color="secondaryText">Course *</Text>
            <Pressable 
              style={[styles.input, styles.pickerTrigger, { borderColor: colors.border, backgroundColor: colors.inputBackground }]} 
              onPress={() => setIsCourseModalVisible(true)} // Open modal
            >
                 <Text style={{ color: colors.text }}>
                     {selectedCourseId ? getCourseName(selectedCourseId) : "Select Course..."}
                 </Text>
                 <Ionicons name="chevron-down" size={16} color={colors.secondaryText} />
            </Pressable>
        </View>

        {/* Time Inputs - Use Pressables to trigger pickers */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
                 <Text style={styles.label} color="secondaryText">Start Time *</Text>
                 <Pressable onPress={() => setShowStartTimePicker(true)} style={[styles.input, styles.timeInputTrigger, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                    <Text style={{ color: colors.text }}>{startTime}</Text>
                    <Ionicons name="time-outline" size={16} color={colors.secondaryText} style={{marginLeft: 5}}/>
                 </Pressable>
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
                 <Text style={styles.label} color="secondaryText">End Time *</Text>
                  <Pressable onPress={() => setShowEndTimePicker(true)} style={[styles.input, styles.timeInputTrigger, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
                    <Text style={{ color: colors.text }}>{endTime}</Text>
                    <Ionicons name="time-outline" size={16} color={colors.secondaryText} style={{marginLeft: 5}}/>
                 </Pressable>
            </View>
        </View>

        {/* Location Input */} 
        <View style={styles.inputContainer}>
            <Text style={styles.label} color="secondaryText">Location *</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]} 
                value={location} 
                onChangeText={setLocation} 
                placeholder="e.g., Room 101"
            />
        </View>

        <Button 
            title="Add to Timetable"
            onPress={handleAddEntry} 
            leftIcon={<Ionicons name="add" size={20} color="#FFFFFF" />} 
            style={{ marginTop: 8 }}
        />
      </Card>

      {/* Time Pickers (Render conditionally) */}
      {showStartTimePicker && (
        <DateTimePicker
          testID="startTimePicker"
          value={parseTime(startTime)} // Convert string back to Date for picker
          mode="time"
          is24Hour={false} // Use 12 hour format
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={onStartTimeChange}
        />
      )}
      {showEndTimePicker && (
         <DateTimePicker
          testID="endTimePicker"
          value={parseTime(endTime)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'clock'}
          onChange={onEndTimeChange}
        />
      )}

      {/* Course Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isCourseModalVisible}
        onRequestClose={() => {
          setIsCourseModalVisible(!isCourseModalVisible);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text variant="h4" weight="semibold">Select Course</Text>
                <TouchableOpacity onPress={() => setIsCourseModalVisible(false)} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <FlatList
              data={courses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.modalItem, { borderBottomColor: colors.border }]} 
                  onPress={() => {
                    setSelectedCourseId(item.id);
                    setIsCourseModalVisible(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <View style={[styles.modalItemColor, { backgroundColor: item.color }]} />
                     <Text style={{ color: colors.text }}>{item.name}</Text>
                  </View>
                  {selectedCourseId === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 0 }} />} // Minimal separator if border used
            />
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  daySelectorScrollContainer: { // Style for ScrollView wrapper
      paddingHorizontal: 8, // Add padding if tabs touch edges
  },
  daySelector: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginBottom: 8,
  },
  dayTab: {
    paddingHorizontal: 14, // Slightly more padding
    paddingVertical: 8,
    borderRadius: 18, // More rounded
    marginHorizontal: 4, // Add spacing between tabs
  },
  dayTabText: {
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  entryColorIndicator: { // Style for the color dot
      width: 8,
      height: 30, // Make it taller
      borderRadius: 4,
      marginRight: 12, // Space between dot and text
  },
  entryDetails: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    padding: 6, 
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  input: { // Base input style (height, border, radius etc)
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16, // Used by TextInput, Picker might ignore
    fontSize: 16,
  },
  pickerTrigger: { // Style for the pressable area that looks like an input
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputTrigger: { // Style for the pressable time input lookalike
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '90%',
    maxHeight: '70%', // Limit modal height
    borderRadius: 16,
    padding: 0, // Remove padding, handled by header/list
    overflow: 'hidden', // Ensure content respects border radius
  },
   modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
      padding: 4, // Make touch target larger
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1, // Separator line
  },
  modalItemColor: {
      width: 16,
      height: 16,
      borderRadius: 4,
      marginRight: 12,
  },
});

export default TimetableScreen; 