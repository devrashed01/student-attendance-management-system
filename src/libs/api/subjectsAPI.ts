import config from '~/config';
import { authService } from '../auth';
import { HttpAuthService } from './httpService';

export interface Subject {
	id: string;
	name: string;
	code: string;
	department: string;
	description?: string;
	isActive: boolean;
	attendanceEnabled: boolean;
	createdAt: string;
	updatedAt: string;
	teacherAssignments?: TeacherAssignment[];
	studentEnrollments?: StudentEnrollment[];
	_count?: {
		teacherAssignments: number;
		studentEnrollments: number;
	};
}

interface TeacherAssignment {
	id: string;
	teacherId: string;
	subjectId: string;
	assignedAt: string;
	teacher: {
		id: string;
		name: string;
		email: string;
	};
	subject: {
		id: string;
		name: string;
		code: string;
	};
}

export interface StudentEnrollment {
	id: string;
	studentId: string;
	subjectId: string;
	enrolledAt: string;
	student: {
		id: string;
		name: string;
		email: string;
		studentId: string;
	};
	subject: {
		id: string;
		name: string;
		code: string;
	};
}

interface CreateSubjectPayload {
	name: string;
	code: string;
	department: string;
	description?: string;
}

interface AssignTeacherPayload {
	teacherId: string;
}

interface EnrollStudentPayload {
	studentId: string;
}

class SubjectsAPI {
	constructor(private http: HttpAuthService) {}

	// Get all subjects (for SUPER_ADMIN and ADMIN)
	getAllSubjects = () => {
		return this.http.get<Subject[]>('subjects/');
	};

	// Create new subject (for SUPER_ADMIN and ADMIN)
	createSubject(payload: CreateSubjectPayload) {
		return this.http.post<Subject>('subjects/', payload);
	}

	// Assign teacher to subject (for SUPER_ADMIN and ADMIN)
	assignTeacher(subjectId: string, payload: AssignTeacherPayload) {
		return this.http.post<TeacherAssignment>(`subjects/${subjectId}/assign-teacher/`, payload);
	}

	// Remove teacher from subject (for SUPER_ADMIN and ADMIN)
	removeTeacher(subjectId: string, teacherId: string) {
		return this.http.delete<{ message: string }>(
			`subjects/${subjectId}/unassign-teacher/${teacherId}/`
		);
	}

	// Enroll student in subject (for SUPER_ADMIN and ADMIN)
	enrollStudent(subjectId: string, payload: EnrollStudentPayload) {
		return this.http.post<StudentEnrollment>(`subjects/${subjectId}/enroll-student/`, payload);
	}

	// Enroll multiple students in subject (for SUPER_ADMIN and ADMIN)
	enrollStudents(subjectId: string, payload: { studentIds: string[] }) {
		return this.http.post<{ message: string; enrollments: StudentEnrollment[]; count: number }>(
			`subjects/${subjectId}/enroll-students/`,
			payload
		);
	}

	// Remove student from subject (for SUPER_ADMIN and ADMIN)
	removeStudent(subjectId: string, studentId: string) {
		return this.http.delete<{ message: string }>(
			`subjects/${subjectId}/remove-student/${studentId}/`
		);
	}

	// Get teacher's assigned subjects
	getTeacherSubjects = () => {
		return this.http.get<Subject[]>('subjects/teacher/');
	};

	// Get student's enrolled subjects
	getStudentSubjects = () => {
		return this.http.get<StudentEnrollment[]>('subjects/student/');
	};

	// Toggle attendance for subject (for TEACHER, SUPER_ADMIN and ADMIN)
	toggleAttendance = (subjectId: string, enabled: boolean) => {
		return this.http.patch<{ message: string; subject: Subject }>(
			`subjects/${subjectId}/toggle-attendance/`,
			{ enabled }
		);
	};
}

const httpAuthService = new HttpAuthService(config.apiURL, authService);
export const subjectsAPI = new SubjectsAPI(httpAuthService);
