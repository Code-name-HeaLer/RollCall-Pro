import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { AppData, Course, AppSettings, Session, AttendanceStatus, TimetableEntry } from '../data/types';
import { loadAppData, saveAppData } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid
import { scheduleCourseReminders, cancelAllCourseReminders } from '../utils/notifications'; // Import notification utilities
import { debounce } from 'lodash'; // Assuming lodash is installed or installable

// Define the type for the data passed to addCourse, including optional fields
type AddCourseData = Omit<Course, 'id' | 'sessions' | 'attendanceThreshold' | 'professor'> & {
    professor?: string;
    attendanceThreshold?: number;
};

// Type for data passed to updateCourse
type UpdateCourseData = Partial<Omit<Course, 'id' | 'sessions'>>;

interface DataContextProps {
  courses: Course[];
  settings: AppSettings | null;
  timetable: TimetableEntry[];
  isLoading: boolean;
  addCourse: (courseData: AddCourseData) => Promise<void>;
  addAttendanceSession: (courseId: string, session: Omit<Session, 'notes' | 'assignments'>) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateSessionDetails: (courseId: string, date: string, details: { notes?: string; assignments?: string[] }) => Promise<void>;
  // Add course update/delete signatures
  updateCourse: (courseId: string, courseData: UpdateCourseData) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
  deleteTimetableEntry: (entryId: string) => Promise<void>;
  restoreAllData: (restoredData: AppData) => Promise<void>;
  // Add more functions later (updateCourse, deleteCourse, recordAttendance, updateSettings)
}

const defaultSettings: AppSettings = {
  theme: 'light', // Default theme
  accentColor: '#4F46E5', // Default color from readme
  reminderTime: 15,
  notificationsEnabled: true,
};

const DataContext = createContext<DataContextProps | undefined>(undefined);

const DEBOUNCE_DELAY = 500; // Delay in milliseconds

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Debounced Save Function --- 
  const debouncedSave = useCallback(
    debounce((dataToSave: AppData) => {
        console.log('Debounced: Saving data...');
        saveAppData(dataToSave);
    }, DEBOUNCE_DELAY),
    [] // No dependencies, created once
  );

  // --- Debounced Notification Function ---
  const debouncedNotifications = useCallback(
    debounce((currentData: AppData) => {
        if (currentData.settings?.notificationsEnabled) {
            console.log('Debounced: Re-scheduling notifications...');
            scheduleCourseReminders(currentData).catch((err: any) => {
                console.error("Debounced: Error scheduling notifications:", err);
            });
        } else {
            console.log('Debounced: Cancelling all scheduled reminders...');
            cancelAllCourseReminders().catch((err: any) => {
                console.error("Debounced: Error cancelling notifications:", err);
            });
        }
    }, DEBOUNCE_DELAY),
    [] // No dependencies, created once
  );

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await loadAppData();
      if (data) {
        setCourses(data.courses || []);
        setSettings(data.settings || defaultSettings);
        setTimetable(data.timetable || []);
      } else {
        // Initialize with default settings if no data found
        setCourses([]);
        setSettings(defaultSettings);
        setTimetable([]);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Debounced Save Effect
  useEffect(() => {
    if (!isLoading && settings) { 
        const currentData: AppData = { courses, settings, timetable };
        debouncedSave(currentData);
    }
    // Cleanup function to cancel any pending save on unmount
    return () => {
        debouncedSave.cancel();
    };
  }, [courses, settings, timetable, isLoading, debouncedSave]); // Include debouncedSave

  // Debounced Notification Effect
  useEffect(() => {
    if (!isLoading && settings) {
        const currentData: AppData = { courses, settings, timetable };
        debouncedNotifications(currentData);
    }
    // Cleanup function to cancel any pending notification update on unmount
    return () => {
        debouncedNotifications.cancel();
    };
  }, [courses, settings, timetable, isLoading, debouncedNotifications]); // Include debouncedNotifications

  const addCourse = async (courseData: AddCourseData) => {
    const newCourse: Course = {
      id: uuidv4(),
      sessions: [],
      name: courseData.name,
      color: courseData.color,
      // professor and threshold are optional
      ...(courseData.professor && { professor: courseData.professor }),
      ...(courseData.attendanceThreshold && { attendanceThreshold: courseData.attendanceThreshold }),
    };
    setCourses(prevCourses => [...prevCourses, newCourse]);
    // Data saving is handled by the useEffect hook
  };

  const addAttendanceSession = async (courseId: string, sessionData: Omit<Session, 'notes' | 'assignments'>) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          // Check if a session for this date already exists
          const existingSessionIndex = course.sessions.findIndex((s: Session) => s.date === sessionData.date);
          let updatedSessions;

          if (existingSessionIndex > -1) {
            // Update existing session status for that date
            updatedSessions = [...course.sessions];
            updatedSessions[existingSessionIndex] = {
                ...updatedSessions[existingSessionIndex], // Keep existing notes/assignments
                status: sessionData.status,
            };
          } else {
            // Add new session if none exists for the date
             const newSession: Session = {
                ...sessionData,
                // notes and assignments are initially undefined
            };
            updatedSessions = [...course.sessions, newSession];
          }
          
          // Sort sessions by date (newest first) after adding/updating
          updatedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return { ...course, sessions: updatedSessions };
        }
        return course;
      })
    );
     // Data saving is handled by the useEffect hook
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
      setSettings((prevSettings: AppSettings | null) => ({
          ...(prevSettings || defaultSettings), // Base on previous or default
          ...newSettings, // Apply partial updates
      }));
       // Data saving is handled by the useEffect hook
  };

  // Function to update notes/assignments for a specific session
  const updateSessionDetails = async (
      courseId: string, 
      date: string, 
      details: { notes?: string; assignments?: string[] }
  ) => {
      setCourses(prevCourses => 
          prevCourses.map(course => {
              if (course.id === courseId) {
                  const sessionIndex = course.sessions.findIndex((s: Session) => s.date === date);
                  if (sessionIndex > -1) {
                      const updatedSessions = [...course.sessions];
                      const currentSession = updatedSessions[sessionIndex];
                      
                      // Merge new details with existing ones
                      updatedSessions[sessionIndex] = {
                          ...currentSession,
                          ...(details.notes !== undefined && { notes: details.notes }), // Update notes if provided
                          ...(details.assignments !== undefined && { assignments: details.assignments }), // Update assignments if provided
                      };
                      return { ...course, sessions: updatedSessions };
                  } else {
                      console.warn(`Session not found for course ${courseId} on date ${date}`);
                      return course; // Return course unmodified if session not found
                  }
              }
              return course;
          })
      );
      // Data saving handled by useEffect
  };

  // Function to update an existing course
  const updateCourse = async (courseId: string, courseData: UpdateCourseData) => {
    // Remove schedule and location from data being merged
    const { schedule, location, ...restData } = courseData as any; // Type assertion to easily omit
    setCourses(prevCourses =>
        prevCourses.map(course =>
            course.id === courseId 
                ? { ...course, ...restData } 
                : course
        )
    );
  };

  // Function to delete a course
  const deleteCourse = async (courseId: string) => {
    setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    // Also delete related timetable entries
    setTimetable(prev => prev.filter(entry => entry.courseId !== courseId));
  };

  // Function to restore all application data
  const restoreAllData = async (restoredData: AppData) => {
    if (restoredData && restoredData.courses && restoredData.settings) {
        setCourses(restoredData.courses);
        setSettings(restoredData.settings);
        setTimetable(restoredData.timetable || []);
    } else {
        console.error("Invalid data format for restore.");
        throw new Error("Invalid data format provided for restoration.");
    }
  };

  // ADDED: Add Timetable Entry
  const addTimetableEntry = async (entryData: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
        id: uuidv4(),
        ...entryData,
    };
    setTimetable(prev => [...prev, newEntry]);
  };

  // ADDED: Delete Timetable Entry
  const deleteTimetableEntry = async (entryId: string) => {
      setTimetable(prev => prev.filter(entry => entry.id !== entryId));
  };

  return (
    <DataContext.Provider value={{ 
        courses, 
        settings, 
        timetable,
        isLoading, 
        addCourse, 
        addAttendanceSession, 
        updateSettings, 
        updateSessionDetails, 
        updateCourse,
        deleteCourse,
        addTimetableEntry,
        deleteTimetableEntry,
        restoreAllData
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the DataContext
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 