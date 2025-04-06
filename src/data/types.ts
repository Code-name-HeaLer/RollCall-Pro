export type AttendanceStatus = 'present' | 'absent' | 'canceled' | 'holiday';

export interface Session {
  date: string; // Consider using Date objects, but string (YYYY-MM-DD) is simpler for storage
  status: AttendanceStatus;
  notes?: string;
  assignments?: string[];
}

export interface TimetableEntry {
  id: string;          // Unique ID for the timetable slot
  day: string;         // e.g., 'monday', 'tuesday' (lowercase)
  startTime: string;   // e.g., '10:00'
  endTime: string;     // e.g., '11:00'
  location: string;    // Location for this specific slot
  courseId: string;    // ID of the course scheduled
}

export interface Course {
  id: string;
  name: string;
  color: string;
  professor?: string;
  attendanceThreshold?: number;
  totalClassesDone?: number;     // For mid-semester entry
  totalClassesAttended?: number; // For mid-semester entry
  sessions: Session[];
}

export interface AppSettings {
  theme: 'light' | 'dark';
  accentColor: string;
  reminderTime: number; // minutes before class
  notificationsEnabled: boolean;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string;
  dayOfWeek: string;
  dueDate?: Date;
  completed: boolean;
  completedType?: 'success' | 'failed';
}

export interface AppData {
  courses: Course[];
  settings: AppSettings;
  timetable: TimetableEntry[];
  assignments: Assignment[];
}

// Add DailyAttendance interface
export interface DailyAttendance {
  date: string;
  dayName: string;
  status: string | null;
} 