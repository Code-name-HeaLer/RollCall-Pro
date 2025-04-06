import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView, Pressable, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, DateData } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { useData } from '../../src/context/DataContext';
import { Session, AttendanceStatus } from '../../src/data/types';
import { Text } from '../../src/components/Text';
import { Card } from '../../src/components/Card';
import StatusBadge from '../../src/components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../../src/utils/theme';

const { width } = Dimensions.get('window');

// Define theme objects for light and dark modes
const lightTheme = {
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#b6c1cd',
    selectedDayBackgroundColor: '#4F46E5', // Primary color
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#4F46E5',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#4F46E5',
    selectedDotColor: '#ffffff',
    arrowColor: '#4F46E5',
    monthTextColor: '#2d4150',
    indicatorColor: 'blue',
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 16,
    // Add other properties as needed
};

const darkTheme = {
    calendarBackground: '#1e1e1e', // dark.card color approx
    textSectionTitleColor: '#9e9e9e',
    selectedDayBackgroundColor: '#4F46E5', 
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#818cf8', // Lighter primary
    dayTextColor: '#e0e0e0', // dark.text color
    textDisabledColor: '#555555',
    dotColor: '#818cf8',
    selectedDotColor: '#ffffff',
    arrowColor: '#818cf8',
    monthTextColor: '#e0e0e0',
    indicatorColor: '#818cf8',
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 16,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 16,
};

// Interface for session details specific to a date
interface DaySessionDetail {
    courseId: string;
    courseName: string;
    session: Session;
}

const CalendarScreen = () => {
  const { courses, isLoading, settings, recordAttendance } = useData();
  const router = useRouter();
  const colors = getThemeColors(settings?.theme || 'light');
  const [selectedDate, setSelectedDate] = useState<DateData | null>(null);
  const [sessionsForSelectedDate, setSessionsForSelectedDate] = useState<DaySessionDetail[]>([]);

  // Helper function to find sessions for a specific date
  const findSessionsForDate = (dateString: string): DaySessionDetail[] => {
    const sessionsFound: DaySessionDetail[] = [];
    courses.forEach(course => {
        const session = course.sessions.find(s => s.date === dateString);
        if (session) {
            sessionsFound.push({ 
                courseId: course.id, 
                courseName: course.name, 
                session 
            });
        }
    });
    return sessionsFound;
  };

  // Initialize with today's date and sessions
  useEffect(() => {
    if (!isLoading && courses.length > 0) {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const todayData: DateData = {
        dateString: todayString,
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        timestamp: today.getTime()
      };
      
      setSelectedDate(todayData);
      setSessionsForSelectedDate(findSessionsForDate(todayString));
    }
  }, [isLoading, courses]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day);
    // Find sessions for the pressed date
    setSessionsForSelectedDate(findSessionsForDate(day.dateString));
  };

  const markedDates = useMemo((): MarkedDates => {
    const marks: MarkedDates = {};
    const todayStr = new Date().toISOString().split('T')[0];
    let selectedDateStr = selectedDate?.dateString;

    courses.forEach(course => {
        course.sessions.forEach(session => {
            const dateStr = session.date;
            if (!marks[dateStr]) {
                 marks[dateStr] = { dots: [] };
            }
            if (!marks[dateStr].dots) {
                marks[dateStr].dots = [];
            }
            let dotColor = 'gray'; 
            switch (session.status) {
                case 'present': dotColor = '#10B981'; break;
                case 'absent': dotColor = '#EF4444'; break;
                case 'canceled': dotColor = '#F59E0B'; break;
                case 'holiday': dotColor = '#6B7280'; break;
            }
            if (!marks[dateStr].dots?.some(dot => dot.color === dotColor)){
                 marks[dateStr].dots?.push({ key: `${course.id}-${session.status}`, color: dotColor });
            }
            marks[dateStr].marked = true;
        });
    });

    // Combine today and selected date marking logic
    const highlightDate = (dateStr: string | undefined, isSelected: boolean) => {
        if (!dateStr) return;
        const baseMark = marks[dateStr] ? { ...marks[dateStr] } : {};
        marks[dateStr] = {
            ...baseMark,
            selected: true,
            selectedColor: isSelected ? (settings?.accentColor || '#4F46E5') : '#a0a0a0', // Dim if not currently selected
            marked: baseMark.marked || false, // Preserve marked status
        };
    };

    highlightDate(todayStr, !selectedDate || selectedDateStr === todayStr);
    if (selectedDateStr && selectedDateStr !== todayStr) {
        highlightDate(selectedDateStr, true);
    }

    return marks;
  }, [courses, settings?.accentColor, selectedDate]);

  const currentTheme = useMemo(() => {
    const baseTheme = settings?.theme === 'dark' ? darkTheme : lightTheme;
    return {
      ...baseTheme,
      calendarBackground: colors.card,
      textSectionTitleColor: colors.secondaryText,
      selectedDayBackgroundColor: colors.primary,
      todayTextColor: colors.primary,
      dayTextColor: colors.text,
      monthTextColor: colors.text,
      arrowColor: colors.primary,
    };
  }, [settings?.theme, colors]);

  // Handle changing attendance status for a course on the selected date
  const handleAttendanceChange = (courseId: string, status: AttendanceStatus) => {
    if (!selectedDate?.dateString) return;
    
    // Update the attendance in context/storage
    recordAttendance(courseId, selectedDate.dateString, status);
    
    // Update the local state
    setSessionsForSelectedDate(prev => 
      prev.map(item => {
        if (item.courseId === courseId) {
          return {
            ...item,
            session: {
              ...item.session,
              status
            }
          };
        }
        return item;
      })
    );
  };

  // Render attendance action buttons for a course
  const renderAttendanceActions = (courseId: string, currentStatus?: AttendanceStatus) => {
    return (
      <View style={[styles.attendanceActions, { borderTopColor: colors.border }]}>
        {(['present', 'absent', 'canceled', 'holiday'] as AttendanceStatus[]).map(status => (
          <Pressable 
            key={status}
            onPress={() => handleAttendanceChange(courseId, status)}
            style={({pressed}) => [
              styles.actionIcon,
              currentStatus && currentStatus !== status ? { opacity: 0.3 } : { opacity: 1 }, 
              pressed ? { opacity: 0.6 } : null,
              { backgroundColor: colors.card }
            ]}
          >
            <Ionicons 
              name={{
                present: 'checkmark-circle-outline',
                absent: 'close-circle-outline',
                canceled: 'ban-outline',
                holiday: 'sunny-outline'
              }[status] as any}
              size={24} 
              color={{
                present: colors.success,
                absent: colors.danger,
                canceled: colors.warning,
                holiday: colors.primary
              }[status]}
            />
          </Pressable>
        ))}
      </View>
    );
  };

  // Render item for the sessions list
  const renderSessionItem = ({ item }: { item: DaySessionDetail }) => (
    <View
      style={[
        styles.sessionItem,
        { 
          backgroundColor: colors.card,
        }
      ]}
    >
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text variant="h4" weight="semibold" style={styles.courseName}>
            {item.courseName}
          </Text>
          <StatusBadge status={item.session.status} size="small" />
        </View>
        
        {item.session.notes && (
          <View style={styles.detailRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="document-text" size={14} color={colors.primary} />
            </View>
            <Text variant="body2" color="secondaryText" numberOfLines={2} style={styles.detailText}>
              {item.session.notes}
            </Text>
          </View>
        )}
        
        {item.session.assignments && item.session.assignments.length > 0 && (
          <View style={styles.detailRow}>
            <View style={[styles.iconContainer, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="book" size={14} color={colors.warning} />
            </View>
            <Text variant="body2" color="secondaryText" style={styles.detailText}>
              {item.session.assignments.length} assignment(s)
            </Text>
          </View>
        )}

        {/* Add attendance action buttons */}
        <View style={styles.attendanceEditSection}>
          <Text variant="caption" color="secondaryText" style={styles.editLabel}>
            {item.session.status ? "Change Attendance Status:" : "Record Attendance:"}
          </Text>
          {renderAttendanceActions(item.courseId, item.session.status)}
        </View>
      </View>
    </View>
  );

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
        <Card style={styles.calendarCard}>
          <Calendar
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={currentTheme}
            style={styles.calendar}
          />
        </Card>

        {selectedDate && (
          <Card 
            title={`Sessions - ${selectedDate.dateString}`}
            style={styles.sessionsCard}
          >
            {sessionsForSelectedDate.length > 0 ? (
              sessionsForSelectedDate.map((session, index) => (
                <View 
                  key={session.courseId} 
                  style={[
                    styles.sessionWrapper,
                    index === sessionsForSelectedDate.length - 1 && styles.lastSessionWrapper
                  ]}
                >
                  {renderSessionItem({ item: session })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="calendar-outline" size={32} color={colors.primary} />
                </View>
                <Text variant="body" color="secondaryText" align="center">
                  No sessions recorded for this date
                </Text>
                <Text variant="caption" color="secondaryText" align="center" style={styles.emptySubtext}>
                  Select a course from the home screen to record attendance
                </Text>
              </View>
            )}
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
  calendarCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  calendar: {
    marginBottom: -8,
  },
  sessionsCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  sessionWrapper: {
    marginBottom: 16,
  },
  sessionItem: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sessionContent: {
    padding: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    flex: 1,
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastSessionWrapper: {
    marginBottom: 0,
  },
  emptySubtext: {
    marginTop: 8,
  },
  // Attendance editing styles
  attendanceEditSection: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  editLabel: {
    marginBottom: 8,
  },
  attendanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
});

export default CalendarScreen; 