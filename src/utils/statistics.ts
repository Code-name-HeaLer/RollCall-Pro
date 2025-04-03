import { Course, Session, AttendanceStatus } from "../data/types";

export interface CourseStat {
    id: string;
    name: string;
    attendancePercentage: number | null; // null if no relevant sessions
    totalSessions: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
}

/**
 * Calculates attendance statistics for a single course.
 * Excludes 'Excused' from percentage calculation denominator.
 */
export const calculateCourseAttendance = (course: Course): CourseStat => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    course.sessions.forEach(session => {
        switch (session.status) {
            case 'present':
                present++;
                break;
            case 'absent':
                absent++;
                break;
            case 'late':
                late++;
                break;
            case 'excused':
                excused++;
                break;
        }
    });

    const relevantSessions = present + absent + late; // Denominator for percentage
    const attendancePercentage = relevantSessions > 0 
        ? Math.round((present / relevantSessions) * 100) 
        : null;

    return {
        id: course.id,
        name: course.name,
        attendancePercentage: attendancePercentage,
        totalSessions: course.sessions.length,
        present,
        absent,
        late,
        excused,
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
            totalRelevant += (stats.present + stats.absent + stats.late); 
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
        if (session.status === 'present') {
            currentPotentialStreak++;
        } else {
            // Reset streak if not present (absent, late, excused)
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
    // The current streak IS the currentPotentialStreak if the loop finished on a 'present' run
    if (sortedSessions.length > 0 && sortedSessions[sortedSessions.length - 1].status === 'present') {
        currentStreak = currentPotentialStreak; 
    } else {
        currentStreak = 0; // If the last session wasn't 'present', current streak is 0
    }


    return { current: currentStreak, longest: longestStreak };
};

// TODO: Add streak calculation logic later 