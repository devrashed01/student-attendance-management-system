/* eslint-disable @typescript-eslint/ban-types */
import config from '~/config';
import { authService } from '../auth';
import { Common } from './common';
import { HttpAuthService } from './httpService';

class AttendanceAPI extends Common {
	constructor(private http: HttpAuthService) {
		super(config.itemsPerPage);
	}

	// Get attendance records with filters
	getAttendance = (params: { date?: string; studentId?: string; subject?: string }) => {
		const url = this.params(params).setURL('attendance').getURL();
		return this.http.get<Attendance[]>(url);
	};

	// Get attendance for a specific student
	getStudentAttendance = (studentId: string) => {
		return this.http.get<Attendance[]>(`attendance/student/${studentId}`);
	};

	// Get student attendance by subject
	getStudentSubjectAttendance = (studentId: string, subjectId: string) => {
		return this.http.get<Attendance[]>(`attendance/student/${studentId}/subject/${subjectId}`);
	};

	// Get attendance by date range
	getAttendanceByDateRange = (params: { startDate: string; endDate: string }) => {
		const url = this.params(params).setURL('attendance/range').getURL();
		return this.http.get<Attendance[]>(url);
	};

	// Mark individual attendance
	markAttendance = (data: {
		studentId: string;
		subjectId: string;
		date: string;
		status: string;
	}) => {
		return this.http.post<Attendance>('attendance/student', data);
	};

	// Update attendance record
	updateAttendance = (id: string, data: Partial<Attendance>) => {
		return this.http.put<Attendance>(`attendance/${id}`, data);
	};

	// Delete attendance record
	deleteAttendance = (id: string) => {
		return this.http.delete<{ message: string }>(`attendance/${id}`);
	};

	// Bulk attendance submission
	submitBulkAttendance = (data: {
		date: string;
		subjectId: string;
		attendanceData: { studentId: string; status: string }[];
	}) => {
		return this.http.post<{ message: string }>('attendance/bulk', data);
	};

	// Get attendance statistics
	getAttendanceStats = (params: { startDate?: string; endDate?: string; subject?: string }) => {
		const url = this.params(params).setURL('attendance/stats').getURL();
		return this.http.get<{
			totalStudents: number;
			presentCount: number;
			absentCount: number;
			lateCount: number;
		}>(url);
	};

	// Get subject-specific attendance statistics
	getSubjectAttendanceStats = (
		subjectId: string,
		params: { startDate?: string; endDate?: string }
	) => {
		const url = this.params({ ...params, subject: subjectId })
			.setURL('attendance/stats')
			.getURL();
		return this.http.get<{
			totalStudents: number;
			presentCount: number;
			absentCount: number;
			lateCount: number;
		}>(url);
	};
}

const httpAuthService = new HttpAuthService(config.apiURL, authService);
export const attendanceAPI = new AttendanceAPI(httpAuthService);
