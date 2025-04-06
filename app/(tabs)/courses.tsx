import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Dimensions, Pressable, Button as RNButton } from 'react-native';
import { Stack, Link, useRouter } from 'expo-router';
import { useData } from '../../src/context/DataContext';
import { Course } from '../../src/data/types';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { getThemeColors } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/Card';
import { calculateOverallAttendance } from '../../src/utils/statistics';
import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';

const { width } = Dimensions.get('window');

const CoursesScreen = () => {
  const { courses, isLoading, settings } = useData();
  const router = useRouter();
  const colors = getThemeColors(settings?.theme || 'light');

  const stats = useMemo(() => {
    const totalSessions = courses.reduce((acc, course) => acc + (course.sessions?.length || 0), 0);
    const totalPresent = courses.reduce((acc, course) => 
      acc + (course.sessions?.filter(s => s.status === 'present')?.length || 0), 0
    );
    const attendanceRate = totalSessions ? Math.round((totalPresent / totalSessions) * 100) : 0;
    
    return {
      totalCourses: courses.length,
      totalSessions,
      attendanceRate
    };
  }, [courses]);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <Pressable 
      style={[styles.courseItem, { backgroundColor: colors.card }]}
      onPress={() => router.push(`/course/${item.id}` as any)}
    >
      <View style={[styles.colorBar, { backgroundColor: item.color }]} />
      <View style={styles.courseContent}>
        <View style={styles.courseHeader}>
          <Text variant="h4" weight="semibold" style={styles.courseName}>
            {item.name}
          </Text>
          <View style={[styles.sessionCount, { backgroundColor: colors.primary + '15' }]}>
            <Text variant="caption" color="primary">
              {item.sessions?.length || 0} sessions
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
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

      {courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="book" size={48} color={colors.primary} />
          </View>
          <Text variant="h3" color="secondaryText" align="center" style={styles.emptyTitle}>
            No courses yet
          </Text>
          <Text variant="body" color="secondaryText" align="center" style={styles.emptySubtext}>
            Tap the 'Add' button to create your first course
          </Text>
          <Pressable
            onPress={() => router.push('/add-course')}
            style={({ pressed }) => [
              styles.emptyButton, 
              { backgroundColor: colors.primary }, 
              { opacity: pressed ? 0.8 : 1 } 
            ]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text variant="button" style={{ color: '#FFFFFF', marginLeft: 8 }}>Add Course</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Card style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="book" size={20} color={colors.primary} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text variant="h2" weight="bold" color="primary">
                    {stats.totalCourses}
                  </Text>
                  <Text variant="caption" color="secondaryText">
                    Total Courses
                  </Text>
                </View>
              </View>
            </Card>
            <Card style={[styles.statsCard, { backgroundColor: colors.card }]}>
              <View style={styles.statContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="trending-up" size={20} color={colors.success} />
                </View>
                <View style={styles.statTextContainer}>
                  <Text variant="h2" weight="bold" style={{ color: colors.success }}>
                    {stats.attendanceRate}%
                  </Text>
                  <Text variant="caption" color="secondaryText">
                    Attendance Rate
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          <View style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1, 
            borderBottomColor: colors.border, 
          }}>
             <Link href="/add-course" asChild>
               <TouchableOpacity 
                 style={{
                   flexDirection: 'row',
                   alignItems: 'center',
                   justifyContent: 'center',
                   paddingVertical: 12,
                   borderRadius: 8,
                   elevation: 2,
                   shadowColor: '#000',
                   shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.1,
                   shadowRadius: 2,
                   backgroundColor: colors.primary 
                 }}
                 activeOpacity={0.7}
               >
                 <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                 <Text variant="button" style={{ 
                   color: '#FFFFFF',
                   marginLeft: 8,
                   fontSize: 16,
                 }}>Add New Course</Text>
               </TouchableOpacity>
            </Link>
          </View>

          <View style={styles.timetableButtonContainer}>
            <Button 
                title="Manage Weekly Timetable"
                onPress={() => router.push('/timetable')}
                leftIcon={<Ionicons name="calendar-outline" size={20} color={colors.primary} />}
                variant="outline"
                style={styles.timetableButton} 
            />
          </View>

          <FlatList
            data={courses}
            renderItem={renderCourseItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  colorBar: {
    width: 4,
  },
  courseContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseName: {
    flex: 1,
    marginRight: 8,
  },
  sessionCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtext: {
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  timetableButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  timetableButton: {
  },
});

export default CoursesScreen; 