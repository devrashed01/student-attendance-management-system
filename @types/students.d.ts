interface Student {
	id: string;
	name: string;
	email: string;
	studentId: string;
	department?: string;
	semester?: string;
	createdAt: string;
	updatedAt: string;
}

interface Attendance {
	id: string;
	studentId: string;
	date: string;
	status: 'present' | 'absent' | 'late';
	subject?: string;
	createdAt: string;
	updatedAt: string;
	student: Student;
}
