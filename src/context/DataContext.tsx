import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { AppData, Course, AppSettings, Session, AttendanceStatus, TimetableEntry, DailyAttendance, Assignment } from '../data/types';
import { loadAppData, saveAppData } from '../utils/storage';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid
import { scheduleCourseReminders, cancelAllCourseReminders } from '../utils/notifications'; // Import notification utilities
import { debounce } from 'lodash'; // Assuming lodash is installed or installable
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultAppData, addDummyData } from '../data/defaultData';
import { prepareCalendarData } from '../utils/calendarUtils';
import { View, Text } from 'react-native';

// Define the type for the data passed to addCourse, including optional fields
type AddCourseData = Omit<Course, 'id' | 'sessions' | 'attendanceThreshold' | 'professor'> & {
    professor?: string;
    attendanceThreshold?: number;
    totalClassesDone?: number;
    totalClassesAttended?: number;
};

// Type for data passed to updateCourse
type UpdateCourseData = Partial<Omit<Course, 'id' | 'sessions'>>;

interface DataContextProps {
  courses: Course[];
  settings: AppSettings | null;
  timetable: TimetableEntry[];
  assignments: Assignment[];
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
  setCourses: (courses: Course[]) => void;
  setSettings: (settings: AppSettings) => void;
  setTimetable: (timetable: TimetableEntry[]) => void;
  setAssignments: (assignments: Assignment[]) => void;
  getAttendanceForCourse: (courseId: string) => DailyAttendance[];
  recordAttendance: (courseId: string, date: string, status: AttendanceStatus) => void;
  addAssignment: (assignment: Assignment) => void;
  toggleAssignmentStatus: (id: string, status: 'success' | 'failed') => void;
  saveAppData: (data: AppData) => Promise<boolean>;
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
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- Debounced Save Function --- 
  const debouncedSave = useCallback(
    debounce(async (dataToSave: AppData) => {
        console.log('Debounced: Saving data...');
        const success = await saveAppData(dataToSave);
        if (!success) {
          console.error('Failed to save data in debounced save');
          setSaveError('Failed to save data. Please check storage permissions.');
        } else {
          setSaveError(null);
        }
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

  // Explicitly typed save function to ensure proper error handling
  const handleSaveAppData = async (data: AppData): Promise<boolean> => {
    try {
      return await saveAppData(data);
    } catch (error) {
      console.error('Error in handleSaveAppData:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setSaveError(null);
      
      try {
        const storedData = await loadAppData();
        
        if (storedData) {
          setCourses(storedData.courses || []);
          setSettings(storedData.settings || defaultSettings);
          setTimetable(storedData.timetable || []);
          setAssignments(storedData.assignments || []);
        } else {
          // No stored data, initialize with defaults
          const dummyData = await addDummyData();
          setCourses(dummyData.courses || []);
          setSettings(dummyData.settings || defaultSettings);
          setTimetable(dummyData.timetable || []);
          setAssignments(dummyData.assignments || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to default data on error
        setCourses([]);
        setSettings(defaultSettings);
        setTimetable([]);
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Debounced Save Effect
  useEffect(() => {
    if (!isLoading && settings) { 
        const currentData: AppData = { 
          courses, 
          settings, 
          timetable, 
          assignments: assignments || [] 
        };
        debouncedSave(currentData);
    }
    // Cleanup function to cancel any pending save on unmount
    return () => {
        debouncedSave.cancel();
    };
  }, [courses, settings, timetable, assignments, isLoading, debouncedSave]); // Include debouncedSave

  // Debounced Notification Effect
  useEffect(() => {
    if (!isLoading && settings) {
        const currentData: AppData = { 
          courses, 
          settings, 
          timetable, 
          assignments: assignments || [] 
        };
        debouncedNotifications(currentData);
    }
    // Cleanup function to cancel any pending notification update on unmount
    return () => {
        debouncedNotifications.cancel();
    };
  }, [courses, settings, timetable, assignments, isLoading, debouncedNotifications]); // Include debouncedNotifications

  const addCourse = async (courseData: AddCourseData) => {
    const newCourse: Course = {
      id: uuidv4(),
      sessions: [],
      name: courseData.name,
      color: courseData.color,
      // professor and threshold are optional
      ...(courseData.professor && { professor: courseData.professor }),
      ...(courseData.attendanceThreshold && { attendanceThreshold: courseData.attendanceThreshold }),
      ...(courseData.totalClassesDone && { totalClassesDone: courseData.totalClassesDone }),
      ...(courseData.totalClassesAttended && { totalClassesAttended: courseData.totalClassesAttended }),
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
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    setSettings((prevSettings: AppSettings | null) => ({
        ...(prevSettings || defaultSettings), // Base on previous or default
        ...newSettings, // Apply partial updates
    }));
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
  };

  // Function to update an existing course
  const updateCourse = async (courseId: string, courseData: UpdateCourseData) => {
    setCourses(prevCourses =>
        prevCourses.map(course =>
            course.id === courseId 
                ? { ...course, ...courseData } 
                : course
        )
    );
  };

  // Function to delete a course
  const deleteCourse = async (courseId: string) => {
    setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    
    // Also clean up timetable entries for the deleted course
    setTimetable(prevTimetable => prevTimetable.filter(entry => entry.courseId !== courseId));
    
    // Clean up assignments for the deleted course
    setAssignments(prevAssignments => prevAssignments.filter(assignment => assignment.courseId !== courseId));
  };

  // Function to add a timetable entry
  const addTimetableEntry = async (entryData: Omit<TimetableEntry, 'id'>) => {
    const newEntry: TimetableEntry = {
        ...entryData,
        id: uuidv4(),
    };
    setTimetable(prevEntries => [...prevEntries, newEntry]);
  };

  // Function to delete a timetable entry
  const deleteTimetableEntry = async (entryId: string) => {
    setTimetable(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
  };

  // Function to restore all app data (for backup/restore functionality)
  const restoreAllData = async (restoredData: AppData) => {
    setCourses(restoredData.courses || []);
    setSettings(restoredData.settings || defaultSettings);
    setTimetable(restoredData.timetable || []);
    setAssignments(restoredData.assignments || []);
  };

  // Function to add a new assignment
  const addAssignment = (assignment: Assignment) => {
    setAssignments(prev => [...prev, assignment]);
  };

  // Function to toggle assignment completion status
  const toggleAssignmentStatus = (id: string, status: 'success' | 'failed') => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === id 
          ? { ...assignment, completed: true, completedType: status } 
          : assignment
      )
    );
  };

  // Get attendance data for a course
  const getAttendanceForCourse = useCallback((courseId: string): DailyAttendance[] => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return [];
    
    // Build attendance records from sessions
    return course.sessions.map(session => {
      const sessionDate = new Date(session.date);
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(sessionDate);
      
      return {
        date: session.date,
        dayName,
        status: session.status
      };
    });
  }, [courses]);

  // Record attendance for a course on a specific date
  const recordAttendance = useCallback((courseId: string, date: string, status: AttendanceStatus) => {
    setCourses(prevCourses =>
      prevCourses.map(course => {
        if (course.id === courseId) {
          const existingSessionIndex = course.sessions.findIndex(s => s.date === date);
          if (existingSessionIndex > -1) {
            // Update existing session
            const updatedSessions = [...course.sessions];
            updatedSessions[existingSessionIndex] = {
              ...updatedSessions[existingSessionIndex],
              status
            };
            return { ...course, sessions: updatedSessions };
          } else {
            // Add new session
            return {
              ...course,
              sessions: [...course.sessions, { date, status }]
            };
          }
        }
        return course;
      })
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        courses,
        settings,
        timetable,
        assignments,
        isLoading,
        addCourse,
        addAttendanceSession,
        updateSettings,
        updateSessionDetails,
        updateCourse,
        deleteCourse,
        addTimetableEntry,
        deleteTimetableEntry,
        restoreAllData,
        setCourses,
        setSettings,
        setTimetable,
        setAssignments,
        getAttendanceForCourse,
        recordAttendance,
        addAssignment,
        toggleAssignmentStatus,
        saveAppData: handleSaveAppData,
      }}
    >
      {/* Display save error if present */}
      {saveError && (
        <View style={{ 
          backgroundColor: 'rgba(239, 68, 68, 0.9)', 
          padding: 10, 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          zIndex: 9999 
        }}>
          <Text style={{ color: 'white', textAlign: 'center' }}>{saveError}</Text>
        </View>
      )}
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