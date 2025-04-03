import Papa from 'papaparse';
import { AppData, Course, Session } from '../data/types';

// Define the structure for each row in the CSV
interface CsvRow {
    course_id: string;
    course_name: string;
    session_date: string;
    status: string;
    notes?: string;
    assignments?: string; // Flatten assignments array
    professor?: string;
    location?: string;
}

export const generateAttendanceCsv = (data: AppData): string => {
    const rows: CsvRow[] = [];

    data.courses.forEach((course: Course) => {
        if (course.sessions.length === 0) {
            // Optionally include courses even if they have no sessions
            // rows.push({
            //     course_id: course.id,
            //     course_name: course.name,
            //     session_date: '',
            //     status: '',
            //     professor: course.professor,
            //     location: course.location,
            // });
        } else {
            course.sessions.forEach((session: Session) => {
                rows.push({
                    course_id: course.id,
                    course_name: course.name,
                    session_date: session.date,
                    status: session.status,
                    notes: session.notes,
                    assignments: session.assignments?.join('; '), // Join assignments with a separator
                    professor: course.professor,
                    location: course.location,
                });
            });
        }
    });

    if (rows.length === 0) {
        return ''; // Return empty string if no data to export
    }

    // Use Papaparse to convert JSON to CSV string
    const csv = Papa.unparse(rows, {
        header: true, // Include headers based on keys
        quotes: true, // Ensure fields with commas/quotes are handled
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        newline: "\r\n"
    });

    return csv;
}; 