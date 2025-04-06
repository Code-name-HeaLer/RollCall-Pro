import { Course, Session, AttendanceStatus } from "../data/types";

export interface CourseStat {
    id: string;
    name: string;
    attendancePercentage: number | null; // null if no relevant sessions
    totalSessions: number;
    present: number;
    absent: number;
    canceled: number;
    holiday: number;
}

/**
 * Calculates attendance statistics for a single course.
 * Excludes 'Holiday' and 'Canceled' from percentage calculation denominator.
 */
export const calculateCourseAttendance = (course: Course): CourseStat => {
    let present = 0;
    let absent = 0;
    let canceled = 0;
    let holiday = 0;

    // Factor in pre-existing attendance data if available
    let totalClassesDone = course.totalClassesDone || 0;
    let totalClassesAttended = course.totalClassesAttended || 0;

    course.sessions.forEach(session => {
        switch (session.status) {
            case 'present':
                present++;
                break;
            case 'absent':
                absent++;
                break;
            case 'canceled':
                canceled++;
                break;
            case 'holiday':
                holiday++;
                break;
        }
    });

    // Add pre-existing attendance data
    if (totalClassesDone > 0) {
        if (totalClassesAttended > 0) {
            present += totalClassesAttended;
        }
        // Calculate remaining absences
        if (totalClassesDone > totalClassesAttended) {
            absent += (totalClassesDone - totalClassesAttended);
        }
    }

    // Only present and absent count toward attendance percentage
    const relevantSessions = present + absent;
    const attendancePercentage = relevantSessions > 0 
        ? Math.round((present / relevantSessions) * 100) 
        : null;

    return {
        id: course.id,
        name: course.name,
        attendancePercentage: attendancePercentage,
        totalSessions: course.sessions.length + (totalClassesDone || 0),
        present,
        absent,
        canceled,
        holiday,
    };
};

/**
 * Calculates the overall attendance percentage across all courses.
 */
export const calculateOverallAttendance = (courses: Course[]): number | null => {
    let totalPresent = 0;
    let totalRelevant = 0;

    courses.forEach(course => {
        const stats = calculateCourseAttendance(course);
        if (stats.attendancePercentage !== null) {
            // We need the raw counts, not the percentage, to calculate overall correctly
            totalPresent += stats.present;
            totalRelevant += (stats.present + stats.absent); 
        }
    });

    return totalRelevant > 0 ? Math.round((totalPresent / totalRelevant) * 100) : null;
};

/**
 * Finds the courses with the highest and lowest attendance percentages.
 * Returns null for best/worst if no courses have valid stats.
 */
export const findBestAndWorstCourses = (courseStats: CourseStat[]): { best: CourseStat | null; worst: CourseStat | null } => {
    let best: CourseStat | null = null;
    let worst: CourseStat | null = null;

    const validStats = courseStats.filter(stat => stat.attendancePercentage !== null);

    if (validStats.length === 0) {
        return { best: null, worst: null };
    }

    validStats.forEach(stat => {
        if (best === null || stat.attendancePercentage! > best.attendancePercentage!) {
            best = stat;
        }
        if (worst === null || stat.attendancePercentage! < worst.attendancePercentage!) {
            worst = stat;
        }
    });

    return { best, worst };
};

/**
 * Calculates the current and longest attendance streak for a course.
 * A streak consists of consecutive 'present' sessions, sorted by date.
 * Returns { current: number, longest: number }.
 */
export const calculateAttendanceStreaks = (course: Course): { current: number; longest: number } => {
    if (course.sessions.length === 0) {
        return { current: 0, longest: 0 };
    }

    // Sort sessions by date ascending (oldest first)
    const sortedSessions = [...course.sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let currentPotentialStreak = 0;

    for (let i = 0; i < sortedSessions.length; i++) {
        const session = sortedSessions[i];
        // Holiday and canceled sessions don't break the streak
        if (session.status === 'present') {
            currentPotentialStreak++;
        } else if (session.status === 'holiday' || session.status === 'canceled') {
            // Skip holiday/canceled without breaking streak
            continue;
        } else {
            // Reset streak if absent
            if (currentPotentialStreak > longestStreak) {
                longestStreak = currentPotentialStreak;
            }
            currentPotentialStreak = 0;
        }
    }

    // Check the streak ending at the last session
    if (currentPotentialStreak > longestStreak) {
        longestStreak = currentPotentialStreak;
    }

    // Determine the actual current streak (ending at the most recent session)
    // Find the most recent non-holiday, non-canceled session
    for (let i = sortedSessions.length - 1; i >= 0; i--) {
        const session = sortedSessions[i];
        if (session.status !== 'holiday' && session.status !== 'canceled') {
            if (session.status === 'present') {
                currentStreak = currentPotentialStreak;
            } else {
                currentStreak = 0; // Last relevant session was an absence
            }
            break;
        }
    }

    return { current: currentStreak, longest: longestStreak };
};

// TODO: Add streak calculation logic later 