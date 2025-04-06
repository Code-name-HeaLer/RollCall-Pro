import { Course, TimetableEntry, Session, DailyAttendance } from '../data/types';

// Convert date to string in YYYY-MM-DD format
export const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Convert string in YYYY-MM-DD format to Date
export const parseStringToDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

// Get current week dates (Monday to Sunday)
export const getCurrentWeekDates = (): Date[] => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust if today is Sunday
  
  // Get Monday of current week
  const monday = new Date(today);
  monday.setDate(today.getDate() - diff);
  
  // Generate array of dates for the week
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    weekDates.push(date);
  }
  
  return weekDates;
};

// Format date as day name (e.g., "Monday")
export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// Interface for calendar data prepared for rendering
export interface DailyCalendarData {
  date: Date;
  dateString: string;
  dayName: string;
  dayOfMonth: number;
  isToday: boolean;
  classes: (TimetableEntry & { course: Course })[];
}

// Prepare calendar data for a week view
export const prepareCalendarData = (
  courses: Course[],
  timetable: TimetableEntry[],
  selectedWeek: Date[] = getCurrentWeekDates()
): DailyCalendarData[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return selectedWeek.map(date => {
    const dateString = formatDateToString(date);
    const dayName = getDayName(date);
    const isToday = date.getTime() === today.getTime();
    
    // Find classes for this day
    const dayClasses = timetable
      .filter(entry => entry.day.toLowerCase() === dayName.toLowerCase())
      .map(entry => {
        const course = courses.find(c => c.id === entry.courseId);
        if (!course) {
          console.warn(`Course not found for ID: ${entry.courseId}`);
          return null;
        }
        return { ...entry, course };
      })
      .filter(Boolean) as (TimetableEntry & { course: Course })[];
    
    // Sort classes by start time
    dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    return {
      date,
      dateString,
      dayName,
      dayOfMonth: date.getDate(),
      isToday,
      classes: dayClasses,
    };
  });
};

// Interface for daily attendance records
export interface DailyAttendance {
  date: string;
  dayName: string;
  status: string | null;
}

// Get attendance records for a course
export const getAttendanceForCourse = (course: Course): DailyAttendance[] => {
  // Process sessions into a more usable format
  return course.sessions.map(session => {
    const date = new Date(session.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      date: session.date,
      dayName,
      status: session.status,
    };
  });
}; 