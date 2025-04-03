import * as Notifications from 'expo-notifications';
import { AppData, Course, TimetableEntry } from '../data/types';
import { Platform } from 'react-native';

// Update dayOfWeekToIndex keys to lowercase strings as stored in TimetableEntry
const dayOfWeekToIndex: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

/**
 * Gets the next occurrence of a given weekday and time
 * @param weekday - Day of week (0-6, 0 = Sunday)
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Date object of next occurrence
 */
const getNextOccurrence = (weekday: number, hour: number, minute: number): Date => {
    const now = new Date();
    const result = new Date(now);
    result.setHours(hour, minute, 0, 0); // Set the target time on today's date initially

    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    let daysUntilNext = weekday - currentDay;

    if (daysUntilNext < 0) {
        // Target day is in the past week, so add 7 days
        daysUntilNext += 7;
    }
    
    if (daysUntilNext === 0 && result.getTime() <= now.getTime()) {
        // Target day is today, but the time has already passed, schedule for next week
        daysUntilNext += 7;
    }

    // Set the date to the correct future date
    result.setDate(now.getDate() + daysUntilNext);

    return result;
};

/**
 * Schedules weekly reminder notifications for all courses based on their schedule
 * and the user's reminder time setting. Cancels existing notifications first.
 * @param data - The current application data (courses, settings, timetable).
 */
export const scheduleCourseReminders = async (data: AppData): Promise<void> => {
    // 1. Cancel all previously scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all previous notifications.');

    // 2. Check if notifications are enabled in settings
    if (!data.settings?.notificationsEnabled) {
        console.log('Notifications are disabled in settings. No reminders scheduled.');
        return;
    }
    // Ensure timetable and courses exist
    if (!data.timetable || !data.courses) {
        console.warn('Timetable or courses data is missing. Cannot schedule reminders.');
        return;
    }

    const reminderMinutes = data.settings.reminderTime || 15; // Default to 15 mins if not set
    console.log(`Scheduling reminders ${reminderMinutes} minutes before each class.`);

    // Set up Android channel if needed
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('course-reminders', {
            name: 'Course Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // 3. Iterate through timetable entries
    for (const slot of data.timetable) {
        // Find the corresponding course
        const course = data.courses.find(c => c.id === slot.courseId);

        if (!course) {
            console.warn(`Course with ID ${slot.courseId} not found for timetable slot ${slot.id}. Skipping reminder.`);
            continue; // Skip this slot if course doesn't exist
        }

        try {
            const [hourStr, minuteStr] = slot.startTime.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);
            const dayName = slot.day.toLowerCase(); // Ensure day name is lowercase for lookup

            if (isNaN(hour) || isNaN(minute) || dayOfWeekToIndex[dayName] === undefined) {
                console.warn(`Invalid time or day format for course ${course.name}, slot ${slot.day} ${slot.startTime}. Skipping.`);
                continue;
            }

            // Calculate trigger time by subtracting reminderMinutes
            let triggerHour = hour;
            let triggerMinute = minute - reminderMinutes;
            let triggerWeekday = dayOfWeekToIndex[dayName]; // 0-6 for getDay()

            // Handle minute/hour/day rollovers (remains the same)
            while (triggerMinute < 0) {
                triggerMinute += 60;
                triggerHour -= 1;
            }
            if (triggerHour < 0) {
                triggerHour += 24;
                triggerWeekday -= 1;
                if (triggerWeekday < 0) {
                    triggerWeekday = 6; // Rolled back from Sunday to Saturday
                }
            }

            // Unique identifier using timetable slot ID
            const identifier = `reminder-${slot.id}`;
            const locationInfo = slot.location ? ` in ${slot.location}` : '';
            const notificationBody = `${course.name} starts at ${slot.startTime}${locationInfo}.`;

            // --- Platform-Specific Trigger --- 
            let trigger: Notifications.NotificationTriggerInput;

            if (Platform.OS === 'ios') {
                trigger = {
                    // Use CalendarTriggerInput for iOS repeating
                    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                    weekday: triggerWeekday + 1, // Expo: Sunday=1, Monday=2,...
                    hour: triggerHour,
                    minute: triggerMinute,
                    repeats: true,
                };
            } else { // Android or other platforms
                // Use DateTriggerInput for Android - schedules only the *next* occurrence
                const nextOccurrence = getNextOccurrence(triggerWeekday, triggerHour, triggerMinute);
                trigger = {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: nextOccurrence, 
                    // channelId: 'course-reminders' // Optional: specify channel if not default
                };
            }
            // --- End Platform-Specific Trigger --- 

            await Notifications.scheduleNotificationAsync({
                identifier: identifier,
                content: {
                    title: `Upcoming Class: ${course.name}`,
                    body: notificationBody,
                    sound: true,
                    data: { courseId: course.id, timetableEntryId: slot.id, time: slot.startTime },
                },
                trigger: trigger, // Use the platform-specific trigger object
            });
            
            // console.log(`Scheduled notification: ${identifier} for ${course.name} (${Platform.OS})`);

        } catch (error: any) {
            console.error(`Failed to schedule notification for ${course?.name || 'Unknown Course'} - ${slot?.day} ${slot?.startTime}:`, error?.message || error);
        }
    }
    console.log('Finished attempting to schedule reminders.');
};

/**
 * Cancels all scheduled course reminder notifications.
 */
export const cancelAllCourseReminders = async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Cancelled all scheduled course reminders.');
}; 