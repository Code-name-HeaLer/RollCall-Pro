import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useData } from '../src/context/DataContext';
import { Text } from '../src/components/Text';
import { Card } from '../src/components/Card';
import { Button } from '../src/components/Button';
import { getThemeColors } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

const AddCourseScreen = () => {
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [color, setColor] = useState('#4F46E5');
  const [threshold, setThreshold] = useState('');
  const [classesDone, setClassesDone] = useState('');
  const [classesAttended, setClassesAttended] = useState('');
  
  const { addCourse, settings } = useData();
  const router = useRouter();
  const colors = getThemeColors(settings?.theme || 'light');

  const handleAddCourse = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a course name.');
      return;
    }

    let attendanceThreshold: number | undefined = undefined;
    if (threshold.trim()) {
      const parsedThreshold = parseInt(threshold.trim(), 10);
      if (isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 100) {
        Alert.alert('Error', 'Threshold must be between 0-100.');
        return;
      }
      attendanceThreshold = parsedThreshold;
    }

    // Parse and validate classes done and attended
    let totalClassesDone: number | undefined = undefined;
    let totalClassesAttended: number | undefined = undefined;

    if (classesDone.trim()) {
      totalClassesDone = parseInt(classesDone.trim(), 10);
      if (isNaN(totalClassesDone) || totalClassesDone < 0) {
        Alert.alert('Error', 'Total classes done must be a positive number.');
        return;
      }
    }

    if (classesAttended.trim()) {
      totalClassesAttended = parseInt(classesAttended.trim(), 10);
      if (isNaN(totalClassesAttended) || totalClassesAttended < 0) {
        Alert.alert('Error', 'Total classes attended must be a positive number.');
        return;
      }
    }

    // Validate that attended classes don't exceed total classes
    if (totalClassesDone !== undefined && totalClassesAttended !== undefined) {
      if (totalClassesAttended > totalClassesDone) {
        Alert.alert('Error', 'Attended classes cannot exceed total classes done.');
        return;
      }
    }

    try {
      await addCourse({
        name: name.trim(),
        color,
        professor: professor.trim() || undefined,
        attendanceThreshold,
        totalClassesDone,
        totalClassesAttended,
      });
      router.back();
    } catch (error) {
      console.error("Failed to add course:", error);
      Alert.alert('Error', 'Failed to add the course. Please try again.');
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen
        options={{
          title: 'Add New Course',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />

      <Card title="Course Details" style={styles.card}>
        {/* Course Name Input */}
        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Course Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Calculus II"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {/* Professor Input */}
        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Professor (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={professor}
            onChangeText={setProfessor}
            placeholder="e.g., Dr. Smith"
            placeholderTextColor={colors.secondaryText}
          />
        </View>

        {/* Color Input (Simplified - maybe improve later) */}
        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Course Color (Hex) *</Text>
           <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                    style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    value={color}
                    onChangeText={setColor}
                    placeholder="#RRGGBB"
                    placeholderTextColor={colors.secondaryText}
                    maxLength={7}
                    autoCapitalize="characters"
                />
                <View style={[styles.colorPreview, { backgroundColor: /^#[0-9A-F]{6}$/i.test(color) ? color : colors.border }]} />
            </View>
        </View>

        {/* Threshold Input */}
        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Minimum Attendance % (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={threshold}
            onChangeText={setThreshold}
            placeholder="e.g., 75"
            placeholderTextColor={colors.secondaryText}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        {/* Mid-Semester Entry Fields */}
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={18} color={colors.secondaryText} style={styles.sectionIcon} />
          <Text variant="body" weight="semibold" color="secondaryText">Mid-Semester Entry (Optional)</Text>
        </View>
        
        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Total Classes Done</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={classesDone}
            onChangeText={setClassesDone}
            placeholder="e.g., 10"
            placeholderTextColor={colors.secondaryText}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text variant="body2" color="secondaryText" style={styles.label}>Total Classes Attended</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            value={classesAttended}
            onChangeText={setClassesAttended}
            placeholder="e.g., 8"
            placeholderTextColor={colors.secondaryText}
            keyboardType="numeric"
          />
          <Text variant="caption" color="secondaryText" style={styles.helpText}>
            These values will be used to calculate your attendance percentage for courses you joined mid-semester.
          </Text>
        </View>
      </Card>

      {/* Submit Button */}
      <Button
        title="Create Course"
        onPress={handleAddCourse}
        leftIcon={<Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  colorPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    marginTop: 16,
    height: 52,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionIcon: {
    marginRight: 8,
  },
  helpText: {
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default AddCourseScreen; 