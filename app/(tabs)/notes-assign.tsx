import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { Text } from '../../src/components/Text';
import { Card } from '../../src/components/Card';
import { getThemeColors } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Picker } from '@react-native-picker/picker';
import { v4 as uuidv4 } from 'uuid';
import { Assignment } from '../../src/data/types';

const { width } = Dimensions.get('window');

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Helper to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

// Helper to check if a date is tomorrow
const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
};

// Helper to check if a date is in the past
const isPast = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// Helper to format date for section headers
const formatDateSection = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
};

const NotesAssignScreen = () => {
  const { courses, timetable, settings, assignments, addAssignment, toggleAssignmentStatus, isLoading } = useData();
  const colors = getThemeColors(settings?.theme || 'light');
  
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [newAssignment, setNewAssignment] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  
  // Add date filter state
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [showFilterDatePicker, setShowFilterDatePicker] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'upcoming' | 'past' | 'specific'>('today');
  
  // Get available days for the selected course
  const availableDays = selectedCourse
    ? timetable
        .filter(entry => entry.courseId === selectedCourse)
        .map(entry => entry.day)
    : [];
  
  // Reset selectedDay if it's not available for the newly selected course
  useEffect(() => {
    if (selectedCourse && selectedDay && !availableDays.includes(selectedDay)) {
      setSelectedDay(availableDays.length > 0 ? availableDays[0] : '');
    }
  }, [selectedCourse, availableDays]);
  
  // Filter and sort assignments based on the selected filter
  const filteredAssignments = useMemo(() => {
    if (!assignments.length) return [];
    
    let filtered = [...assignments];
    
    // Apply date filter
    switch (filterType) {
      case 'today':
        filtered = filtered.filter(a => a.dueDate && isToday(new Date(a.dueDate)));
        break;
      case 'upcoming':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        filtered = filtered.filter(a => a.dueDate && new Date(a.dueDate) >= today);
        break;
      case 'past':
        filtered = filtered.filter(a => a.dueDate && isPast(new Date(a.dueDate)));
        break;
      case 'specific':
        filtered = filtered.filter(a => a.dueDate && isSameDay(new Date(a.dueDate), filterDate));
        break;
      // 'all' doesn't need filtering
    }
    
    // Sort by due date (earliest first)
    filtered.sort((a, b) => {
      // If no due date, put at the end
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    return filtered;
  }, [assignments, filterType, filterDate]);
  
  // Group assignments by due date
  const groupedAssignments = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    
    filteredAssignments.forEach(assignment => {
      if (!assignment.dueDate) {
        const key = 'No Due Date';
        if (!groups[key]) groups[key] = [];
        groups[key].push(assignment);
        return;
      }
      
      const dueDate = new Date(assignment.dueDate);
      const key = formatDateSection(dueDate);
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(assignment);
    });
    
    // Convert to array of sections for rendering
    return Object.entries(groups).map(([title, items]) => ({
      title,
      data: items,
      isPast: items[0].dueDate ? isPast(new Date(items[0].dueDate)) : false
    }));
  }, [filteredAssignments]);
  
  const handleAddAssignment = () => {
    if (!newAssignment.trim() || selectedCourse === '' || selectedDay === '') {
      Alert.alert('Please complete all fields', 'Course, day and assignment title are required');
      return;
    }
    
    const assignment: Assignment = {
      id: uuidv4(),
      title: newAssignment.trim(),
      courseId: selectedCourse,
      dayOfWeek: selectedDay,
      dueDate: dueDate || undefined,
      completed: false,
    };
    
    addAssignment(assignment);
    setNewAssignment('');
    setDueDate(null);
    setSelectedCourse(courses.length > 0 ? courses[0].id : '');
    
    // Schedule notifications if there's a due date
    if (dueDate) {
      scheduleAssignmentNotifications(assignment);
    }
  };
  
  const scheduleAssignmentNotifications = async (assignment: Assignment) => {
    if (!assignment.dueDate) return;
    
    const courseName = courses.find(c => c.id === assignment.courseId)?.name || 'Course';
    
    try {
      // Get seconds until the due date, minus 5 hours and 1 hour
      const now = new Date();
      const dueTimestamp = assignment.dueDate.getTime();
      
      // Schedule 5 hour notification if there's at least 5 hours left
      const fiveHoursMs = 5 * 60 * 60 * 1000;
      if (dueTimestamp - now.getTime() > fiveHoursMs) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Assignment Due',
            body: `${assignment.title} for ${courseName} is due in 5 hours`,
            data: { assignmentId: assignment.id }
          },
          trigger: {
            seconds: Math.floor((dueTimestamp - now.getTime() - fiveHoursMs) / 1000),
            channelId: 'assignments',
          },
        });
      }
      
      // Schedule 1 hour notification if there's at least 1 hour left
      const oneHourMs = 60 * 60 * 1000;
      if (dueTimestamp - now.getTime() > oneHourMs) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Hurry, Your Assignment is Due',
            body: `${assignment.title} for ${courseName} is due in 1 hour`,
            data: { assignmentId: assignment.id }
          },
          trigger: {
            seconds: Math.floor((dueTimestamp - now.getTime() - oneHourMs) / 1000),
            channelId: 'assignments',
          },
        });
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  };
  
  // Format the date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Set Deadline';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Handle opening date picker first
  const handleOpenPicker = () => {
    setPickerMode('date');
    setShowDatePicker(true);
  };
  
  // Handle date selection
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Hide the date picker first
    setShowDatePicker(false);
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      // Save the selected date while preserving time if already set
      let newDate = selectedDate;
      if (dueDate) {
        newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
      }
      setDueDate(newDate);
      
      // On Android, we'll show the time picker next
      if (Platform.OS === 'android') {
        // Small delay to ensure date picker is fully closed
        setTimeout(() => {
          setPickerMode('time');
          setShowTimePicker(true);
        }, 100);
      }
    }
  };
  
  // Handle time selection
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    // Hide the time picker
    setShowTimePicker(false);
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedTime && dueDate) {
      // Create a new date with the selected time
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };
  
  // Handle filter date change
  const handleFilterDateChange = (event: any, selectedDate?: Date) => {
    setShowFilterDatePicker(false);
    
    if (event.type === 'dismissed') {
      return;
    }
    
    if (selectedDate) {
      setFilterDate(selectedDate);
      setFilterType('specific');
    }
  };
  
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card title="Add New Assignment" style={styles.card}>
          <View style={styles.inputRow}>
            <Text variant="body" color="text">Course:</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Picker
                selectedValue={selectedCourse}
                onValueChange={(value: string) => setSelectedCourse(value)}
                style={styles.picker}
                dropdownIconColor={colors.text}
                mode="dropdown"
              >
                <Picker.Item label="Select a course" value="" color={colors.secondaryText} />
                {courses.map(course => (
                  <Picker.Item 
                    key={course.id} 
                    label={course.name} 
                    value={course.id} 
                    color={colors.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
          
          {selectedCourse && availableDays.length > 0 && (
            <View style={styles.inputRow}>
              <Text variant="body" color="text">Day:</Text>
              <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Picker
                  selectedValue={selectedDay}
                  onValueChange={(value: string) => setSelectedDay(value)}
                  style={styles.picker}
                  dropdownIconColor={colors.text}
                  mode="dropdown"
                >
                  <Picker.Item label="Select a day" value="" color={colors.secondaryText} />
                  {availableDays.map(day => (
                    <Picker.Item 
                      key={day} 
                      label={day} 
                      value={day} 
                      color={colors.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter assignment title..."
              value={newAssignment}
              onChangeText={setNewAssignment}
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.text
                }
              ]}
              placeholderTextColor={colors.secondaryText}
            />
          </View>
          
          <View style={styles.inputRow}>
            <Text variant="body" color="text">Due Date & Time:</Text>
            <View style={styles.datePickerRow}>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border
                  }
                ]}
                onPress={handleOpenPicker}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text variant="body2" color="text" style={styles.dateText}>
                  {formatDate(dueDate)}
                </Text>
              </TouchableOpacity>
              
              {dueDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setDueDate(null)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Platform-specific DateTimePicker implementation */}
            {Platform.OS === 'ios' ? (
              // iOS implementation with modal-style pickers
              <>
                {/* Date Picker Modal for iOS */}
                {showDatePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      testID="iosDatePicker"
                      value={dueDate || new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(e, date) => {
                        if (date) setDueDate(date);
                      }}
                      style={styles.datePicker}
                    />
                    <View style={styles.pickerButtonRow}>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.pickerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, styles.doneButton]}
                        onPress={() => {
                          setShowDatePicker(false);
                          setPickerMode('time');
                          setTimeout(() => setShowTimePicker(true), 300);
                        }}
                      >
                        <Text style={styles.doneButtonText}>Next: Set Time</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                
                {/* Time Picker Modal for iOS */}
                {showTimePicker && (
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      testID="iosTimePicker"
                      value={dueDate || new Date()}
                      mode="time"
                      display="spinner"
                      onChange={(e, time) => {
                        if (time && dueDate) {
                          const newDate = new Date(dueDate);
                          newDate.setHours(time.getHours(), time.getMinutes());
                          setDueDate(newDate);
                        } else if (time) {
                          setDueDate(time);
                        }
                      }}
                      style={styles.datePicker}
                    />
                    <View style={styles.pickerButtonRow}>
                      <TouchableOpacity
                        style={styles.pickerButton}
                        onPress={() => {
                          setShowTimePicker(false);
                          setPickerMode('date');
                          setTimeout(() => setShowDatePicker(true), 300);
                        }}
                      >
                        <Text style={styles.pickerButtonText}>Back to Date</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.pickerButton, styles.doneButton]}
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            ) : (
              // Android implementation with native pickers
              <>
                {showDatePicker && (
                  <DateTimePicker
                    testID="androidDatePicker"
                    value={dueDate || new Date()}
                    mode="date"
                    onChange={handleDateChange}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    testID="androidTimePicker"
                    value={dueDate || new Date()}
                    mode="time"
                    onChange={handleTimeChange}
                  />
                )}
              </>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.addButton,
              { 
                backgroundColor: 
                  newAssignment.trim() && selectedCourse === '' || selectedDay === ''
                    ? colors.secondaryText
                    : colors.primary
              }
            ]}
            onPress={handleAddAssignment}
            disabled={!newAssignment.trim() || selectedCourse === '' || selectedDay === ''}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text variant="button" style={{ color: '#FFFFFF', marginLeft: 8 }}>
              Add Assignment
            </Text>
          </TouchableOpacity>
        </Card>
        
        {assignments.length > 0 ? (
          <Card title="Your Assignments" style={styles.card}>
            {/* Date filter controls */}
            <View style={styles.filterContainer}>
              <Text variant="body" color="text">Filter by:</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filterType === 'all' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <Text 
                    variant="caption" 
                    style={{ color: filterType === 'all' ? '#FFFFFF' : colors.text }}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption, 
                    filterType === 'today' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterType('today')}
                >
                  <Text 
                    variant="caption" 
                    style={{ color: filterType === 'today' ? '#FFFFFF' : colors.text }}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption, 
                    filterType === 'upcoming' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterType('upcoming')}
                >
                  <Text 
                    variant="caption" 
                    style={{ color: filterType === 'upcoming' ? '#FFFFFF' : colors.text }}
                  >
                    Upcoming
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption, 
                    filterType === 'past' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setFilterType('past')}
                >
                  <Text 
                    variant="caption" 
                    style={{ color: filterType === 'past' ? '#FFFFFF' : colors.text }}
                  >
                    Past
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Specific date picker */}
              <View style={styles.specificDateContainer}>
                <TouchableOpacity
                  style={[
                    styles.specificDateButton,
                    { 
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                    filterType === 'specific' && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => setShowFilterDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                  <Text 
                    variant="caption" 
                    color={filterType === 'specific' ? 'primary' : 'text'} 
                    style={{ marginLeft: 4 }}
                  >
                    {filterType === 'specific' 
                      ? filterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                      : 'Specific Date'}
                  </Text>
                </TouchableOpacity>
                
                {showFilterDatePicker && (
                  <DateTimePicker
                    value={filterDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleFilterDateChange}
                    style={Platform.OS === 'ios' ? styles.datePicker : undefined}
                  />
                )}
              </View>
            </View>
            
            {/* Grouped assignments by date */}
            {groupedAssignments.length > 0 ? (
              groupedAssignments.map((group, index) => (
                <View key={group.title} style={styles.dateSection}>
                  <View style={[
                    styles.dateSectionHeader,
                    group.isPast && { backgroundColor: 'rgba(0,0,0,0.05)' },
                  ]}>
                    <Text 
                      variant="h4" 
                      weight="semibold" 
                      style={[
                        group.isPast && { color: colors.secondaryText },
                      ]}
                    >
                      {group.title}
                    </Text>
                  </View>
                  
                  {group.data.map(assignment => {
                    const course = courses.find(c => c.id === assignment.courseId);
                    
                    return (
                      <View 
                        key={assignment.id}
                        style={[
                          styles.assignmentItem,
                          { 
                            borderColor: colors.border,
                            opacity: assignment.completed ? 0.7 : 1,
                            width: '100%'
                          }
                        ]}
                      >
                        <View style={[styles.assignmentContent, { width: '100%' }]}>
                          <View style={[styles.assignmentHeader, { width: '100%', flexWrap: 'nowrap', overflow: 'hidden' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                              <View 
                                style={[
                                  styles.courseIndicator, 
                                  { backgroundColor: course?.color || colors.primary }
                                ]} 
                              />
                              <Text
                                variant="h4"
                                weight="semibold"
                                style={[
                                  styles.assignmentTitle,
                                  assignment.completed && {
                                    textDecorationLine: 'line-through',
                                    color: assignment.completedType === 'success' 
                                      ? colors.success 
                                      : colors.danger
                                  }
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {assignment.title}
                              </Text>
                            </View>
                            
                            {/* Status Buttons - Always Visible */}
                            <View style={styles.statusButtons}>
                              <TouchableOpacity
                                style={[
                                  styles.statusButton, 
                                  { 
                                    backgroundColor: 
                                      assignment.completed && assignment.completedType === 'success' 
                                        ? colors.success 
                                        : colors.success + '20'
                                  }
                                ]}
                                onPress={() => toggleAssignmentStatus(assignment.id, 'success')}
                              >
                                <Ionicons 
                                  name="checkmark" 
                                  size={18} 
                                  color={
                                    assignment.completed && assignment.completedType === 'success'
                                      ? '#FFFFFF'
                                      : colors.success
                                  } 
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[
                                  styles.statusButton, 
                                  { 
                                    backgroundColor: 
                                      assignment.completed && assignment.completedType === 'failed' 
                                        ? colors.danger 
                                        : colors.danger + '20'
                                  }
                                ]}
                                onPress={() => toggleAssignmentStatus(assignment.id, 'failed')}
                              >
                                <Ionicons 
                                  name="close" 
                                  size={18} 
                                  color={
                                    assignment.completed && assignment.completedType === 'failed'
                                      ? '#FFFFFF'
                                      : colors.danger
                                  } 
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          
                          <View style={styles.assignmentDetails}>
                            <View style={styles.detailItem}>
                              <Ionicons name="book-outline" size={14} color={colors.secondaryText} />
                              <Text variant="caption" color="secondaryText">
                                {course?.name || 'Unknown course'}
                              </Text>
                            </View>
                            <View style={styles.detailItem}>
                              <Ionicons name="calendar-outline" size={14} color={colors.secondaryText} />
                              <Text variant="caption" color="secondaryText">
                                {assignment.dayOfWeek}
                              </Text>
                            </View>
                            {assignment.dueDate && (
                              <View style={styles.detailItem}>
                                <Ionicons name="time-outline" size={14} color={colors.secondaryText} />
                                <Text variant="caption" color="secondaryText">
                                  {new Date(assignment.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            ) : (
              <View style={styles.emptyFilterState}>
                <Ionicons name="search-outline" size={36} color={colors.secondaryText} />
                <Text variant="body" color="secondaryText" align="center" style={styles.emptyText}>
                  No assignments found for the selected filter.
                </Text>
              </View>
            )}
          </Card>
        ) : (
          <Card style={styles.card}>
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.secondaryText} />
              <Text variant="body" color="secondaryText" align="center" style={styles.emptyText}>
                No assignments yet. Add your first assignment above.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  inputRow: {
    marginBottom: 12,
  },
  pickerContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
  },
  dateText: {
    marginLeft: 8,
  },
  clearDateButton: {
    marginLeft: 8,
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  // Filter styles
  filterContainer: {
    marginBottom: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  specificDateContainer: {
    marginTop: 4,
  },
  specificDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  // Date section styles
  dateSection: {
    marginBottom: 16,
  },
  dateSectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  assignmentItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    width: '100%',
  },
  assignmentContent: {
    flex: 1,
    width: '100%',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    width: '100%',
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  courseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  assignmentTitle: {
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    position: 'relative',
    right: 0,
    marginLeft: 8,
  },
  statusButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginLeft: 6,
  },
  assignmentDetails: {
    marginLeft: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyFilterState: {
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    marginTop: 12,
    maxWidth: 250,
    textAlign: 'center',
  },
  iosPickerContainer: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  datePicker: {
    height: 200,
  },
  pickerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  pickerButton: {
    padding: 16,
    alignItems: 'center',
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#2196F3',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#2196F3',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default NotesAssignScreen; 