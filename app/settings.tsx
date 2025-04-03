import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, ActivityIndicator, Pressable, Alert, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useData } from '../src/context/DataContext';
import { generateAttendanceCsv } from '../src/utils/export';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { AppData } from '../src/data/types';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { Text } from '../src/components/Text';
import { Card } from '../src/components/Card';
import { getThemeColors } from '../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import ReactNativeModal from 'react-native-modal';

const { width } = Dimensions.get('window');

// Predefined colors for accent color selection
const accentColors = [
  '#4F46E5', // Indigo
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Blue
  '#D946EF', // Fuchsia
];

// Reusable Button for Settings actions
const SettingsButton = ({ title, onPress, disabled, icon, color }: { 
  title: string; 
  onPress: () => void; 
  disabled?: boolean;
  icon: React.ReactNode;
  color: string;
}) => (
  <Pressable 
    style={({ pressed }) => [
      styles.settingsButton,
      { 
        backgroundColor: color + '15',
        opacity: (pressed || disabled) ? 0.7 : 1
      }
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <View style={styles.buttonContent}>
      {icon}
      <Text variant="body" weight="semibold" style={[styles.buttonText, { color }]}>
        {title}
      </Text>
    </View>
  </Pressable>
);

const SettingsScreen = () => {
  // Get settings, courses, and update function from context
  const { settings, courses, isLoading, updateSettings, restoreAllData } = useData(); 
  const { showActionSheetWithOptions } = useActionSheet();
  const colors = getThemeColors(settings?.theme || 'light');

  // State for loading indicators during backup/restore
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // State for Color Picker Modal
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  // Define reminder time options
  const reminderTimeOptions = ['Cancel', '5 minutes', '10 minutes', '15 minutes', '30 minutes', '60 minutes'];
  const reminderTimeValues = [null, 5, 10, 15, 30, 60]; // Corresponding values (null for cancel)

  // Handle loading state
  if (isLoading || !settings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} /> 
      </View>
    );
  }

  // Export Data Handler
  const handleExportData = async () => { 
      console.log('Export Data Pressed');
      const appData = { courses, settings }; // Get current data
      const csvData = generateAttendanceCsv(appData);

      if (!csvData) {
          Alert.alert("Export Failed", "No attendance data found to export.");
          return;
      }

      const filename = `student_attendance_export_${Date.now()}.csv`;
      const fileUri = FileSystem.documentDirectory + filename;

      try {
          await FileSystem.writeAsStringAsync(fileUri, csvData, {
              encoding: FileSystem.EncodingType.UTF8,
          });
          console.log('CSV file written to:', fileUri);

          // Check if sharing is available
          if (!(await Sharing.isAvailableAsync())) {
              Alert.alert("Sharing Error", "Sharing is not available on this device.");
              // Optionally: Inform user where file was saved locally
              // Alert.alert("File Saved", `Data exported successfully to internal storage: ${filename}`);
              return;
          }

          // Share the file
          await Sharing.shareAsync(fileUri, {
              mimeType: 'text/csv',
              dialogTitle: 'Share Attendance Data',
              UTI: 'public.comma-separated-values-text',
          });

      } catch (error) {
          console.error("Error exporting or sharing data:", error);
          Alert.alert("Export Error", "Failed to export or share data. Please try again.");
      }
  }; 
  
  // Backup Data Handler
  const handleBackupData = async () => { 
      setIsBackingUp(true);
      console.log('Backup Data Pressed');
      const appData: AppData = { courses, settings: settings! }; // Ensure settings is not null
      
      if (!settings) {
          Alert.alert("Backup Error", "Settings are not loaded yet.");
          setIsBackingUp(false);
          return;
      }

      const filename = `attendance_manager_backup_${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      try {
          const jsonString = JSON.stringify(appData, null, 2); // Pretty print JSON
          await FileSystem.writeAsStringAsync(fileUri, jsonString, {
              encoding: FileSystem.EncodingType.UTF8,
          });
          console.log('Backup file written to:', fileUri);

          if (!(await Sharing.isAvailableAsync())) {
              Alert.alert("Sharing Not Available", `Backup saved successfully to internal storage: ${filename}. You can access it using a file manager.`);
              setIsBackingUp(false);
              return;
          }

          await Sharing.shareAsync(fileUri, {
              mimeType: 'application/json',
              dialogTitle: 'Share Backup File',
              UTI: 'public.json',
          });

      } catch (error) {
          console.error("Error backing up data:", error);
          Alert.alert("Backup Error", "Failed to create or share backup file. Please try again.");
      } finally {
          setIsBackingUp(false);
      }
  }; 

  // Restore Data Handler
  const handleRestoreData = async () => { 
      Alert.alert(
          "Confirm Restore",
          "Restoring data will overwrite your current courses and settings. Are you sure you want to proceed?",
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Restore", 
                  style: "destructive", 
                  onPress: async () => {
                      setIsRestoring(true);
                      console.log('Restore Data Confirmed');
                      try {
                          const result = await DocumentPicker.getDocumentAsync({
                              type: 'application/json', // Allow only JSON files
                              copyToCacheDirectory: true, // Recommended for reliable access
                          });

                          // Check if the user cancelled or if there was an issue
                          if (!result || result.canceled) {
                            console.log('Document picking cancelled or failed');
                            setIsRestoring(false);
                            return;
                        }

                          // Access the selected asset (file)
                         const asset = result.assets && result.assets[0];
                         if (!asset) {
                           throw new Error('No file selected or asset unavailable.');
                          }

                         console.log('Restore file selected:', asset.uri);
                          const jsonString = await FileSystem.readAsStringAsync(asset.uri, {
                              encoding: FileSystem.EncodingType.UTF8,
                          });

                          const restoredData: AppData = JSON.parse(jsonString);

                          // Basic validation
                          if (!restoredData || !Array.isArray(restoredData.courses) || typeof restoredData.settings !== 'object' || restoredData.settings === null) {
                              throw new Error("Invalid backup file format.");
                          }

                          // Call the context function to update app state
                          await restoreAllData(restoredData);

                          Alert.alert("Restore Complete", "Data has been successfully restored.");

                      } catch (error: any) {
                          console.error("Error restoring data:", error);
                          Alert.alert("Restore Error", `Failed to restore data: ${error.message || 'Unknown error'}. Please ensure the file is a valid backup.`);
                      } finally {
                          setIsRestoring(false);
                      }
                  }
              }
          ]
      );
  };

  // Function to toggle theme
  const toggleTheme = (value: boolean) => {
      updateSettings({ theme: value ? 'dark' : 'light' });
  };
   // Function to toggle notifications
  const toggleNotifications = (value: boolean) => {
      updateSettings({ notificationsEnabled: value });
  };

  // Function to show reminder time options
  const showReminderTimeOptions = () => {
      showActionSheetWithOptions(
          {
              options: reminderTimeOptions,
              cancelButtonIndex: 0, // Index of the 'Cancel' option
              // destructiveButtonIndex: // Optional: if you had a destructive option
              title: 'Set Reminder Time Before Class',
          },
          (selectedIndex?: number) => {
              if (selectedIndex !== undefined && selectedIndex > 0) { // Check if not undefined and not Cancel
                 const selectedValue = reminderTimeValues[selectedIndex];
                 if (selectedValue !== null) {
                     updateSettings({ reminderTime: selectedValue });
                 }
              }
          }
      );
  };

  // Function to format reminder time display
  const getReminderTimeDisplay = () => {
    if (!settings.reminderTime) return 'Not set';
    return `${settings.reminderTime} minutes before`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Settings',
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Card title="Appearance" style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="moon" size={20} color={colors.secondary} style={styles.settingIcon} />
              <Text variant="body" color="text">Dark Theme</Text>
            </View>
            <Switch 
              value={settings.theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <Pressable 
            onPress={() => setColorPickerVisible(true)}
            style={({ pressed }) => [
              styles.settingRow,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <View style={styles.settingLabelContainer}>
              <Ionicons name="color-palette" size={20} color={colors.secondary} style={styles.settingIcon} />
              <Text variant="body" color="text">Accent Color</Text>
            </View>
            <View style={[styles.colorPreview, { backgroundColor: settings.accentColor }]} />
          </Pressable>
        </Card>
        
        {/* Notifications Section */}
        <Card title="Notifications" style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelContainer}>
              <Ionicons name="notifications" size={20} color={colors.secondary} style={styles.settingIcon} />
              <Text variant="body" color="text">Enable Notifications</Text>
            </View>
            <Switch 
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: "#767577", true: colors.primary }}
              thumbColor="#f4f3f4"
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <Pressable 
            onPress={showReminderTimeOptions}
            disabled={!settings.notificationsEnabled}
            style={({ pressed }) => [
              styles.settingRow,
              { 
                opacity: settings.notificationsEnabled ? (pressed ? 0.7 : 1) : 0.5 
              }
            ]}
          >
            <View style={styles.settingLabelContainer}>
              <Ionicons name="time" size={20} color={colors.secondary} style={styles.settingIcon} />
              <Text variant="body" color="text">Reminder Time</Text>
            </View>
            <View style={styles.settingValueContainer}>
              <Text variant="body2" color="secondaryText">{getReminderTimeDisplay()}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.secondaryText} style={{ marginLeft: 4 }} />
            </View>
          </Pressable>
        </Card>
        
        {/* Data Management Section */}
        <Card title="Data Management" style={styles.card}>
          <View style={styles.dataButtonsContainer}>
            <SettingsButton 
              title="Export CSV"
              onPress={handleExportData}
              icon={<Ionicons name="download" size={20} color={colors.primary} />}
              color={colors.primary}
            />
            
            <SettingsButton 
              title="Backup Data"
              onPress={handleBackupData}
              disabled={isBackingUp}
              icon={<Ionicons name="save" size={20} color={colors.success} />}
              color={colors.success}
            />
            
            <SettingsButton 
              title="Restore Data"
              onPress={handleRestoreData}
              disabled={isRestoring}
              icon={<Ionicons name="refresh" size={20} color={colors.warning} />}
              color={colors.warning}
            />
          </View>
        </Card>
        
        {/* About Section */}
        <Card title="About" style={styles.card}>
          <View style={styles.aboutContainer}>
            <Text variant="h2" weight="bold" color="primary" align="center">RollCall Pro</Text>
            <Text variant="body2" color="secondaryText" align="center" style={styles.versionText}>Version 1.0.0</Text>
            <Text variant="caption" color="secondaryText" align="center" style={styles.copyrightText}>
              © 2025 HeaLer | All Rights Reserved
            </Text>
          </View>
        </Card>
      </ScrollView>
      
      {/* Color Picker Modal */}
      <ReactNativeModal
        isVisible={colorPickerVisible}
        onBackdropPress={() => setColorPickerVisible(false)}
        style={styles.modal}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text variant="h3" weight="semibold" color="text" style={styles.modalTitle}>
            Choose Accent Color
          </Text>
          
          <View style={styles.colorGrid}>
            {accentColors.map((colorOption) => (
              <Pressable
                key={colorOption}
                onPress={() => {
                  updateSettings({ accentColor: colorOption });
                  setColorPickerVisible(false);
                }}
                style={({ pressed }) => [
                  styles.colorOption,
                  {
                    backgroundColor: colorOption,
                    borderColor: settings.accentColor === colorOption ? colors.text : 'transparent',
                    opacity: pressed ? 0.7 : 1,
                  }
                ]}
              >
                {settings.accentColor === colorOption && (
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                )}
              </Pressable>
            ))}
          </View>
          
          <Pressable
            onPress={() => setColorPickerVisible(false)}
            style={({ pressed }) => [
              styles.cancelButton,
              { 
                backgroundColor: colors.danger + '15',
                opacity: pressed ? 0.7 : 1
              }
            ]}
          >
            <Text variant="body" weight="semibold" style={{ color: colors.danger }}>Cancel</Text>
          </Pressable>
        </View>
      </ReactNativeModal>
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  dataButtonsContainer: {
    gap: 12,
    paddingVertical: 8,
  },
  settingsButton: {
    borderRadius: 12,
    padding: 14,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 8,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    marginTop: 8,
  },
  copyrightText: {
    marginTop: 16,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  colorOption: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.075,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
});

export default SettingsScreen; 