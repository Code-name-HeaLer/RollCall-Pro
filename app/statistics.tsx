import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useData } from '../src/context/DataContext';
import { 
    calculateOverallAttendance, 
    calculateCourseAttendance, 
    findBestAndWorstCourses, 
    calculateAttendanceStreaks,
    CourseStat 
} from '../src/utils/statistics';
import { Text } from '../src/components/Text';
import { Card } from '../src/components/Card';
import { getThemeColors } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const { courses, isLoading, settings } = useData();
  const colors = getThemeColors(settings?.theme || 'light');

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate statistics
  const courseStats: CourseStat[] = courses.map(calculateCourseAttendance);
  const overallPercentage = calculateOverallAttendance(courses);
  const { best, worst } = findBestAndWorstCourses(courseStats);

  // Calculate streaks for each course
  const courseStreaks = courses.map(course => ({
    id: course.id,
    name: course.name,
    streaks: calculateAttendanceStreaks(course),
  }));

  const overallAttendanceText = overallPercentage !== null ? `${overallPercentage}%` : "N/A";
  const bestPerformingCourseText = best ? `${best.name} (${best.attendancePercentage}%)` : "N/A";
  const lowestPerformingCourseText = worst ? `${worst.name} (${worst.attendancePercentage}%)` : "N/A";

  // Helper function to determine attendance percentage color
  const getAttendanceColor = (percentage: number | null) => {
    if (percentage === null) return colors.secondaryText;
    if (percentage >= 90) return colors.success;
    if (percentage >= 75) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Statistics',
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
        }} 
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Card */}
        <Card title="Overall Performance" style={styles.card}>
          <View style={styles.overallStatsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="school" size={24} color={colors.primary} />
              </View>
              <Text variant="caption" color="secondaryText">Overall Attendance</Text>
              <Text 
                variant="h1" 
                weight="bold" 
                style={{ color: getAttendanceColor(overallPercentage) }}
              >
                {overallAttendanceText}
              </Text>
            </View>
          </View>
        </Card>

        {/* Course Breakdown Card */}
        <Card title="Course Breakdown" style={styles.card}>
          <View style={styles.bestWorstContainer}>
            <View style={[styles.bestWorstItem, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up" size={20} color={colors.success} />
              <Text variant="caption" color="secondaryText" style={styles.bestWorstLabel}>Best</Text>
              <Text variant="body2" weight="semibold" numberOfLines={1} style={styles.bestWorstCourse}>
                {bestPerformingCourseText}
              </Text>
            </View>
            <View style={[styles.bestWorstItem, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="trending-down" size={20} color={colors.danger} />
              <Text variant="caption" color="secondaryText" style={styles.bestWorstLabel}>Needs Focus</Text>
              <Text variant="body2" weight="semibold" numberOfLines={1} style={styles.bestWorstCourse}>
                {lowestPerformingCourseText}
              </Text>
            </View>
          </View>

          {courses.length > 0 ? (
            <View style={styles.courseList}>
              {courseStats.map(stat => (
                <View key={stat.id} style={styles.courseItem}>
                  <View style={styles.courseNameContainer}>
                    <View style={[styles.courseIndicator, { 
                      backgroundColor: getAttendanceColor(stat.attendancePercentage) 
                    }]} />
                    <Text variant="body" numberOfLines={1} style={styles.courseName}>
                      {stat.name}
                    </Text>
                  </View>
                  <Text 
                    variant="h4" 
                    weight="semibold" 
                    style={{ color: getAttendanceColor(stat.attendancePercentage) }}
                  >
                    {stat.attendancePercentage !== null ? `${stat.attendancePercentage}%` : "N/A"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondaryText" align="center">
                No courses added yet.
              </Text>
            </View>
          )}
        </Card>

        {/* Streaks Card */}
        <Card title="Attendance Streaks" style={styles.card}>
          {courses.length > 0 ? (
            <View style={styles.streaksList}>
              {courseStreaks.map(item => (
                <View key={item.id} style={styles.streakItem}>
                  <Text variant="body" weight="semibold" numberOfLines={1} style={styles.streakCourseName}>
                    {item.name}
                  </Text>
                  <View style={styles.streakDetails}>
                    <View style={[styles.streakDetail, { backgroundColor: colors.primary + '15' }]}>
                      <Text variant="caption" color="secondaryText">Current</Text>
                      <Text variant="h3" weight="semibold" color="primary">{item.streaks.current}</Text>
                    </View>
                    <View style={[styles.streakDetail, { backgroundColor: colors.success + '15' }]}>
                      <Text variant="caption" color="secondaryText">Longest</Text>
                      <Text variant="h3" weight="semibold" style={{ color: colors.success }}>{item.streaks.longest}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="secondaryText" align="center">
                No attendance data yet to calculate streaks.
              </Text>
            </View>
          )}
        </Card>
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
    overflow: 'hidden',
  },
  overallStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bestWorstContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  bestWorstItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bestWorstLabel: {
    marginTop: 4,
    marginBottom: 2,
  },
  bestWorstCourse: {
    textAlign: 'center',
  },
  courseList: {
    marginTop: 8,
  },
  courseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  courseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  courseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  courseName: {
    flex: 1,
  },
  streaksList: {
    marginTop: 8,
  },
  streakItem: {
    marginBottom: 16,
  },
  streakCourseName: {
    marginBottom: 8,
  },
  streakDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  streakDetail: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
});

export default StatisticsScreen; 