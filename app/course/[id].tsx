import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter, Href, Link } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { getThemeColors } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import CourseDetailsSection from '../../src/components/CourseDetailsSection';
import CourseScheduleSection from '../../src/components/CourseScheduleSection';
import AttendanceHistoryList from '../../src/components/AttendanceHistoryList';

// Helper function to format date as YYYY-MM-DD
const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const CourseDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { courses, isLoading, settings, timetable } = useData();
  const colors = getThemeColors(settings?.theme || 'light');

  const course = courses.find(c => c.id === id);

  // Filter timetable for the current course
  const courseTimetableEntries = timetable.filter(entry => entry.courseId === course?.id);

  if (isLoading) {
    return (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} /> 
        </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Course Not Found' }} />
        <Ionicons name="alert-circle" size={64} color={colors.danger} style={styles.errorIcon} />
        <Text variant="h3" color="danger" align="center">Course not found</Text>
        <Text variant="body" color="secondaryText" align="center" style={styles.errorMessage}>
          The course you're looking for doesn't exist or was deleted.
        </Text>
        <Link href="/courses" asChild>
          <Button 
            title="Back to Courses" 
            variant="outline"
            leftIcon={<Ionicons name="arrow-back" size={16} color={colors.primary} />}
            style={styles.errorButton}
          />
        </Link>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen 
        options={{
          title: course.name,
        }}
      />
      
      <CourseDetailsSection course={course} />

      {/* Edit Icon Button (Outside/After Card) */}
      <View style={styles.editButtonContainer}>
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: colors.primary + '15' }]}
          activeOpacity={0.7}
          onPress={() => {
              if (course?.id) {
                 router.push({
                     pathname: '/edit-course/[id]',
                     params: { id: course.id },
                 });
              }
          }}
        >
          <Text style={{ color: colors.primary, marginRight: 4 }} variant="button">Edit</Text>
          <Ionicons name="pencil" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Pass filtered timetable entries to CourseScheduleSection */}
      <CourseScheduleSection timetableEntries={courseTimetableEntries} />
      <AttendanceHistoryList sessions={course.sessions} courseId={course.id} />
      
      {/* TODO: Add Statistics/Forecasting Section Component */}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorMessage: {
    marginTop: 8,
    marginBottom: 24,
    maxWidth: '80%',
  },
  errorButton: {
    marginTop: 16,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 140,
    marginTop: -170,
    paddingRight: 16,
    zIndex: 1,
  },
  editButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});

export default CourseDetailScreen; 