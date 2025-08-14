import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get subjects for teacher (for TEACHER)
router.get(
	'/teacher',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || user.role !== 'TEACHER') {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const subjects = await prisma.subject.findMany({
				where: {
					teacherAssignments: {
						some: {
							teacherId: req.user.id,
						},
					},
				},
				include: {
					teacherAssignments: {
						include: {
							teacher: {
								select: { id: true, name: true, email: true },
							},
						},
					},
					studentEnrollments: {
						include: {
							student: {
								select: { id: true, name: true, email: true, studentId: true },
							},
						},
					},
					_count: {
						select: {
							teacherAssignments: true,
							studentEnrollments: true,
						},
					},
				},
			});

			res.json(subjects);
		} catch (error) {
			console.error('Error fetching teacher subjects:', error);
			res.status(500).json({ error: 'Failed to fetch teacher subjects' });
		}
	}
);

// Get subjects for student (for STUDENT)
router.get(
	'/student',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || user.role !== 'STUDENT') {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const subjects = await prisma.subject.findMany({
				where: {
					studentEnrollments: {
						some: {
							studentId: req.user.id,
						},
					},
				},
				include: {
					teacherAssignments: {
						include: {
							teacher: {
								select: { id: true, name: true, email: true },
							},
						},
					},
					studentEnrollments: {
						include: {
							student: {
								select: { id: true, name: true, email: true, studentId: true },
							},
						},
					},
				},
			});

			res.json(subjects);
		} catch (error) {
			console.error('Error fetching student subjects:', error);
			res.status(500).json({ error: 'Failed to fetch student subjects' });
		}
	}
);

// Get all subjects (for SUPER_ADMIN and ADMIN)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: { role: true },
		});

		if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
			res.status(403).json({ error: 'Access denied' });
			return;
		}

		const subjects = await prisma.subject.findMany({
			include: {
				teacherAssignments: {
					include: {
						teacher: {
							select: { id: true, name: true, email: true },
						},
					},
				},
				studentEnrollments: {
					include: {
						student: {
							select: { id: true, name: true, email: true, studentId: true },
						},
					},
				},
				_count: {
					select: {
						teacherAssignments: true,
						studentEnrollments: true,
					},
				},
			},
		});

		res.json(subjects);
	} catch (error) {
		console.error('Error fetching subjects:', error);
		res.status(500).json({ error: 'Failed to fetch subjects' });
	}
});

// Create new subject (for SUPER_ADMIN and ADMIN)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const user = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: { role: true },
		});

		if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
			res.status(403).json({ error: 'Access denied' });
			return;
		}

		const { name, code, department, description } = req.body;

		if (!name || !code || !department) {
			res.status(400).json({ error: 'Name, code, and department are required' });
			return;
		}

		// Check if subject code already exists
		const existingSubject = await prisma.subject.findUnique({
			where: { code },
		});

		if (existingSubject) {
			res.status(409).json({ error: 'Subject code already exists' });
			return;
		}

		const subject = await prisma.subject.create({
			data: {
				name,
				code,
				department,
				description,
			},
		});

		res.status(201).json(subject);
	} catch (error) {
		console.error('Error creating subject:', error);
		res.status(500).json({ error: 'Failed to create subject' });
	}
});

// Assign teacher to subject (for SUPER_ADMIN and ADMIN)
router.post(
	'/:subjectId/assign-teacher',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId } = req.params;
			const { teacherId } = req.body;

			if (!teacherId) {
				res.status(400).json({ error: 'Teacher ID is required' });
				return;
			}

			// Check if teacher exists and is a teacher
			const teacher = await prisma.user.findFirst({
				where: { id: teacherId, role: 'TEACHER' },
			});

			if (!teacher) {
				res.status(404).json({ error: 'Teacher not found' });
				return;
			}

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// Check if assignment already exists
			const existingAssignment = await prisma.teacherSubject.findUnique({
				where: { teacherId_subjectId: { teacherId, subjectId } },
			});

			if (existingAssignment) {
				res.status(409).json({ error: 'Teacher is already assigned to this subject' });
				return;
			}

			const assignment = await prisma.teacherSubject.create({
				data: {
					teacherId,
					subjectId,
				},
				include: {
					teacher: {
						select: { id: true, name: true, email: true },
					},
					subject: {
						select: { id: true, name: true, code: true },
					},
				},
			});

			res.status(201).json(assignment);
		} catch (error) {
			console.error('Error assigning teacher:', error);
			res.status(500).json({ error: 'Failed to assign teacher' });
		}
	}
);

// Unassign teacher to subject (for SUPER_ADMIN and ADMIN)
router.delete(
	'/:subjectId/unassign-teacher/:teacherId',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId, teacherId } = req.params;

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// Check if teacher exists and is a teacher
			const teacher = await prisma.user.findFirst({
				where: { id: teacherId, role: 'TEACHER' },
			});

			if (!teacher) {
				res.status(404).json({ error: 'Teacher not found' });
				return;
			}

			// Check if assignment exists
			const existingAssignment = await prisma.teacherSubject.findUnique({
				where: { teacherId_subjectId: { teacherId, subjectId } },
			});

			if (!existingAssignment) {
				res.status(404).json({ error: 'Teacher is not assigned to this subject' });
				return;
			}

			// Remove the assignment
			await prisma.teacherSubject.delete({
				where: { teacherId_subjectId: { teacherId, subjectId } },
			});

			res.json({ message: 'Teacher unassigned from subject successfully' });
		} catch (error) {
			console.error('Error unassigning teacher:', error);
			res.status(500).json({ error: 'Failed to unassign teacher from subject' });
		}
	}
);

// Enroll student in subject (for SUPER_ADMIN and ADMIN)
router.post(
	'/:subjectId/enroll-student',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId } = req.params;
			const { studentId } = req.body;

			if (!studentId) {
				res.status(400).json({ error: 'Student ID is required' });
				return;
			}

			// Check if student exists and is a student
			const student = await prisma.user.findFirst({
				where: { id: studentId, role: 'STUDENT' },
			});

			if (!student) {
				res.status(404).json({ error: 'Student not found' });
				return;
			}

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// Check if enrollment already exists
			const existingEnrollment = await prisma.studentSubject.findUnique({
				where: { studentId_subjectId: { studentId, subjectId } },
			});

			if (existingEnrollment) {
				res.status(409).json({ error: 'Student is already enrolled in this subject' });
				return;
			}

			const enrollment = await prisma.studentSubject.create({
				data: {
					studentId,
					subjectId,
				},
				include: {
					student: {
						select: { id: true, name: true, email: true, studentId: true },
					},
					subject: {
						select: { id: true, name: true, code: true },
					},
				},
			});

			res.status(201).json(enrollment);
		} catch (error) {
			console.error('Error enrolling student:', error);
			res.status(500).json({ error: 'Failed to enroll student' });
		}
	}
);

// Enroll multiple students in subject (for SUPER_ADMIN and ADMIN)
router.post(
	'/:subjectId/enroll-students',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId } = req.params;
			const { studentIds } = req.body;

			if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
				res.status(400).json({ error: 'Student IDs array is required and must not be empty' });
				return;
			}

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// Check if all students exist and are students
			const students = await prisma.user.findMany({
				where: {
					id: { in: studentIds },
					role: 'STUDENT',
				},
			});

			if (students.length !== studentIds.length) {
				res.status(400).json({ error: 'Some students were not found or are not valid students' });
				return;
			}

			// Remove existing enrollments for this subject
			await prisma.studentSubject.deleteMany({
				where: {
					subjectId,
				},
			});

			// Create enrollments for all students
			const enrollments = await prisma.studentSubject.createMany({
				data: studentIds.map((studentId) => ({
					studentId,
					subjectId,
				})),
			});

			// Fetch the created enrollments with student details
			const createdEnrollments = await prisma.studentSubject.findMany({
				where: {
					subjectId,
					studentId: { in: studentIds },
				},
				include: {
					student: {
						select: { id: true, name: true, email: true, studentId: true },
					},
					subject: {
						select: { id: true, name: true, code: true },
					},
				},
			});

			res.status(201).json({
				message: `Successfully enrolled ${enrollments.count} students`,
				enrollments: createdEnrollments,
				count: enrollments.count,
			});
		} catch (error) {
			console.error('Error enrolling students:', error);
			res.status(500).json({ error: 'Failed to enroll students' });
		}
	}
);

// Remove student from subject (for SUPER_ADMIN and ADMIN)
router.delete(
	'/:subjectId/remove-student/:studentId',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId, studentId } = req.params;

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// Check if student exists and is a student
			const student = await prisma.user.findFirst({
				where: { id: studentId, role: 'STUDENT' },
			});

			if (!student) {
				res.status(404).json({ error: 'Student not found' });
				return;
			}

			// Check if enrollment exists
			const existingEnrollment = await prisma.studentSubject.findUnique({
				where: { studentId_subjectId: { studentId, subjectId } },
			});

			if (!existingEnrollment) {
				res.status(404).json({ error: 'Student is not enrolled in this subject' });
				return;
			}

			// Remove the enrollment
			await prisma.studentSubject.delete({
				where: { studentId_subjectId: { studentId, subjectId } },
			});

			res.json({ message: 'Student removed from subject successfully' });
		} catch (error) {
			console.error('Error removing student:', error);
			res.status(500).json({ error: 'Failed to remove student from subject' });
		}
	}
);

// Toggle attendance for subject (for TEACHER, SUPER_ADMIN and ADMIN)
router.patch(
	'/:subjectId/toggle-attendance',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { role: true },
			});

			if (
				!user ||
				(user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'TEACHER')
			) {
				res.status(403).json({ error: 'Access denied' });
				return;
			}

			const { subjectId } = req.params;
			const { enabled } = req.body;

			if (typeof enabled !== 'boolean') {
				res.status(400).json({ error: 'Enabled field must be a boolean' });
				return;
			}

			// Check if subject exists
			const subject = await prisma.subject.findUnique({
				where: { id: subjectId },
			});

			if (!subject) {
				res.status(404).json({ error: 'Subject not found' });
				return;
			}

			// If user is TEACHER, check if they are assigned to this subject
			if (user.role === 'TEACHER') {
				const teacherAssignment = await prisma.teacherSubject.findUnique({
					where: { teacherId_subjectId: { teacherId: req.user.id, subjectId } },
				});

				if (!teacherAssignment) {
					res.status(403).json({ error: 'You are not assigned to this subject' });
					return;
				}
			}

			// Update the subject's attendance enabled status
			const updatedSubject = await prisma.subject.update({
				where: { id: subjectId },
				data: { attendanceEnabled: enabled },
				include: {
					teacherAssignments: {
						include: {
							teacher: {
								select: { id: true, name: true, email: true },
							},
						},
					},
					studentEnrollments: {
						include: {
							student: {
								select: { id: true, name: true, email: true, studentId: true },
							},
						},
					},
				},
			});

			res.json({
				message: `Attendance ${enabled ? 'enabled' : 'disabled'} for subject successfully`,
				subject: updatedSubject,
			});
		} catch (error) {
			console.error('Error toggling attendance:', error);
			res.status(500).json({ error: 'Failed to toggle attendance for subject' });
		}
	}
);

export default router;
