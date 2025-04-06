import { AppData, AppSettings } from './types';

// Default app settings
export const defaultSettings: AppSettings = {
  theme: 'light',
  accentColor: '#4F46E5',
  reminderTime: 15,
  notificationsEnabled: true,
};

// Default app data structure with no pre-added content
export const defaultAppData: AppData = {
  courses: [],
  timetable: [],
  settings: defaultSettings,
  assignments: [],
};

// Generate empty initial data (no sample data)
export const addDummyData = async (): Promise<AppData> => {
  return {
    courses: [],
    timetable: [],
    settings: defaultSettings,
    assignments: [],
  };
}; 