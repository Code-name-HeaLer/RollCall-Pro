import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useData } from '../../src/context/DataContext';
// import { Schedule } from '../../src/data/types'; // REMOVED unused import
import DateTimePicker from '@react-native-community/datetimepicker';
import { ColorPicker, fromHsv, toHsv } from 'react-native-color-picker';
import Modal from "react-native-modal";
import { Ionicons } from '@expo/vector-icons';
import EditSchedule from '../components/EditSchedule'; // This should also be removed later if EditSchedule is deleted
// Themed components
import { Text } from '../../src/components/Text';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button'; // Assuming Button component exists
import { getThemeColors } from '../../src/utils/theme';

// TODO: Implement a better color picker later

const EditCourseScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { courses, isLoading, updateCourse, deleteCourse, settings } = useData();
    const router = useRouter();
    const colors = getThemeColors(settings?.theme || 'light');
    const courseToEdit = courses.find(c => c.id === id);

    // Restore color state
    const [name, setName] = useState('');
    const [professor, setProfessor] = useState('');
    const [threshold, setThreshold] = useState('');
    const [color, setColor] = useState(''); // ADD color state

    // Restore color setter in useEffect
    useEffect(() => {
        if (courseToEdit) {
            setName(courseToEdit.name || '');
            setProfessor(courseToEdit.professor || '');
            setThreshold(courseToEdit.attendanceThreshold?.toString() || '');
            setColor(courseToEdit.color || colors.primary); // SET color state
        }
    }, [courseToEdit, colors.primary]); 

    // Restore color validation
    const isValidColor = /^#[0-9A-F]{6}$/i.test(color);

    const handleUpdateCourse = async () => {
        if (!courseToEdit) return;

        // Add color validation
        let attendanceThreshold: number | undefined = undefined;
        if (threshold.trim()) { /* ... */ }
        if (!name.trim()) {
             Alert.alert('Error', 'Course name cannot be empty.'); return;
        }
        if (!isValidColor) { // VALIDATE color
             Alert.alert('Error', 'Invalid hex color code (#RRGGBB).'); return;
        }
        
        try {
            await updateCourse(courseToEdit.id, { 
                name: name.trim(), 
                color, // ADD color to update data
                professor: professor.trim() || undefined, 
                attendanceThreshold, 
            });
             if (router.canGoBack()) { router.back(); }
        } catch (error) { /* ... */ }
    };

    const handleDeleteCourse = () => {
        if (!courseToEdit) return;
        Alert.alert(
            "Delete Course",
            `Are you sure you want to delete "${courseToEdit.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteCourse(courseToEdit.id);
                            // Navigate back two steps to the course list after delete
                             router.back(); // Back from edit screen
                             setTimeout(() => { if (router.canGoBack()) router.back() }, 100); // Back from detail screen
                        } catch (error) {
                             console.error("Failed to delete course:", error);
                             Alert.alert('Error', 'Failed to delete the course.');
                        }
                    }
                 }
            ]
        );
    };

    // Show loading or not found state
    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }
    if (!courseToEdit) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                 <Stack.Screen options={{ title: 'Course Not Found' }} />
                 <Ionicons name="alert-circle" size={64} color={colors.danger} style={styles.errorIcon} />
                 <Text variant="h3" color="danger" align="center">Course not found</Text>
                 {/* Optional: Add Back button like in CourseDetailScreen */}
            </View>
        );
    }

    return (
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
            <Stack.Screen options={{ 
              title: `Edit: ${courseToEdit.name}`,
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              headerTitleStyle: { color: colors.text },
            }} />
            
            {/* Course Details Card */}
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
                {/* ADD Color Input */}
                <View style={styles.inputContainer}>
                    <Text variant="body2" color="secondaryText" style={styles.label}>Course Color *</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, color: colors.text, borderColor: isValidColor ? colors.border : colors.danger }]}
                            value={color}
                            onChangeText={setColor}
                            placeholder="#RRGGBB"
                            placeholderTextColor={colors.secondaryText}
                            maxLength={7}
                            autoCapitalize="characters"
                        />
                        <View style={[styles.colorPreview, { backgroundColor: isValidColor ? color : colors.border }]} />
                    </View>
                    {!isValidColor && color.length > 0 && (
                         <Text variant="caption" color="danger" style={{ marginTop: 4 }}>Invalid hex format</Text>
                    )}
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
            </Card>

            {/* Schedule Card REMOVED */}
           
            {/* Update Button */}
            <Button 
                title="Save Changes"
                onPress={handleUpdateCourse}
                leftIcon={<Ionicons name="save-outline" size={20} color="#FFFFFF" />}
                style={styles.actionButton}
            />

             {/* Delete Button */}
             <Button 
                title="Delete Course"
                onPress={handleDeleteCourse}
                leftIcon={<Ionicons name="trash-outline" size={20} color="#FFFFFF" />}
                style={[styles.actionButton, { backgroundColor: colors.danger }]}
            />
        </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorIcon: {
        marginBottom: 16,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32, // Ensure space at the bottom
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
    actionButton: {
        marginTop: 16,
        height: 52,
    },
    colorPreview: {
        width: 36,
        height: 36,
        borderRadius: 8,
        marginLeft: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
});

export default EditCourseScreen; 