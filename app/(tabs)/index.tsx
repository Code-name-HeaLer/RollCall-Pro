import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { getThemeColors } from '../../src/utils/theme';
import { Text } from '../../src/components/Text';
import { Card } from '../../src/components/Card';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from '../../src/components/ui/StatusBadge';
import { AttendanceStatus } from '../../src/data/types';

const { width } = Dimensions.get('window');

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HomeScreen = () => {
  const { settings, courses, timetable, addAttendanceSession } = useData();
  const router = useRouter();
  const colors = getThemeColors(settings?.theme || 'light');
  
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayName = dayNames[dayOfWeek];
  const todayDateString = getTodayDateString();

  const todayTimetableEntries = useMemo(() => {
    return timetable
      .filter(entry => entry.day.toLowerCase() === todayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timetable, todayName]);

  const todaySchedule = useMemo(() => {
    return todayTimetableEntries.map(entry => {
        const course = courses.find(c => c.id === entry.courseId);
        return {
            ...entry,
            courseName: course?.name || 'Unknown Course',
            courseColor: course?.color || colors.border,
            professor: course?.professor,
        };
    });
  }, [todayTimetableEntries, courses, colors.border]);

  const [todayStatuses, setTodayStatuses] = useState<Record<string, AttendanceStatus>>(() => {
    const initialStatuses: Record<string, AttendanceStatus> = {};
    todaySchedule.forEach(item => {
        const course = courses.find(c => c.id === item.courseId);
        const todaySession = course?.sessions?.find(s => s.date === todayDateString);
        if (todaySession) {
            initialStatuses[item.courseId] = todaySession.status;
        }
    });
    return initialStatuses;
  });

  const handleRecord = (courseId: string, status: AttendanceStatus) => {
    addAttendanceSession(courseId, { date: todayDateString, status });
    setTodayStatuses(prev => ({ ...prev, [courseId]: status }));
  };

  // Calculate total attendance including mid-semester entry data
  const calculateAttendance = () => {
    let totalPresent = 0;
    let totalRelevant = 0;

    courses.forEach(course => {
      // Count sessions
      const presentSessions = course.sessions.filter(s => s.status === 'present').length;
      const absentSessions = course.sessions.filter(s => s.status === 'absent').length;
      
      // Add mid-semester entry data if available
      const midSemesterPresent = course.totalClassesAttended || 0;
      const midSemesterTotal = course.totalClassesDone || 0;
      const midSemesterAbsent = midSemesterTotal - midSemesterPresent;
      
      // Sum up for this course
      totalPresent += presentSessions + midSemesterPresent;
      totalRelevant += presentSessions + absentSessions + midSemesterTotal;
    });

    // Calculate overall rate
    return totalRelevant > 0 ? Math.round((totalPresent / totalRelevant) * 100) : 0;
  };

  const attendanceRate = calculateAttendance();
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.primary + '15' }]}>
          <Text variant="h2" weight="bold" color="primary" align="center">
            {attendanceRate}%
          </Text>
          <Text variant="caption" color="secondaryText" align="center">
            Overall Attendance
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
          <Text variant="h2" weight="bold" style={{ color: colors.success }} align="center">
            {todaySchedule.length}
          </Text>
          <Text variant="caption" color="secondaryText" align="center">
            Classes Today
          </Text>
        </View>
      </View>

      <Card 
        title="Today's Schedule" 
        subtitle={today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        elevation="small"
        style={{ marginBottom: 16 }}
      >
        {todaySchedule.length > 0 ? (
          <View style={styles.timeline}>
            {todaySchedule.map((item) => {
              const currentStatus = todayStatuses[item.courseId];
              
              return (
                <View 
                  key={item.id}
                  style={[styles.timelineItemContainer, { backgroundColor: colors.card }]}
                >
                  <View style={styles.timelineCourseInfo}>
                    <View style={[styles.timelineLine, { backgroundColor: item.courseColor }]} />
                    <View style={styles.timelineContent}>
                      <Text variant="body2" color="secondaryText">
                        {item.startTime} - {item.endTime}
                      </Text>
                      <Pressable onPress={() => router.push(`/course/${item.courseId}`)}>
                        <Text variant="h4" weight="semibold" style={{ marginVertical: 4 }}>
                          {item.courseName}
                        </Text>
                      </Pressable>
                      <View style={styles.timelineDetails}>
                        {item.professor && (
                          <View style={styles.detailItem}>
                            <Ionicons name="person-outline" size={14} color={colors.secondaryText} />
                            <Text variant="caption" color="secondaryText" style={styles.detailText}>
                              {item.professor}
                            </Text>
                          </View>
                        )}
                        {item.location && (
                          <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={14} color={colors.secondaryText} />
                            <Text variant="caption" color="secondaryText" style={styles.detailText}>
                              {item.location}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.attendanceActions, { borderTopColor: colors.border }]}>
                    {(['present', 'absent', 'canceled', 'holiday'] as AttendanceStatus[]).map(status => (
                      <Pressable 
                        key={status}
                        onPress={() => handleRecord(item.courseId, status)}
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
                  
                  {currentStatus && (
                    <View style={styles.statusBadgeContainer}>
                      <StatusBadge status={currentStatus} size="small" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.border} />
            <Text variant="body" color="secondaryText" align="center" style={{ marginTop: 8 }}>
              No classes scheduled for today, add some classes to your timetable using the Courses tab
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 0,
    marginBottom: 8,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeline: {
    marginTop: 8,
  },
  timelineItemContainer: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineCourseInfo: {
    flexDirection: 'row',
  },
  timelineLine: {
    width: 4,
  },
  timelineContent: {
    flex: 1,
    padding: 12,
  },
  timelineDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
  },
  attendanceActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  actionIcon: {
    padding: 6,
    borderRadius: 15,
  },
  statusBadgeContainer: {
    position: 'absolute',
    top: 12, 
    right: 12,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
