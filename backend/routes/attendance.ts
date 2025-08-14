import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all attendance records with subject filtering
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { date, studentId, subject } = req.query;
		const whereClause: Record<string, unknown> = {};

		if (date) whereClause.date = new Date(date as string);
		if (studentId) whereClause.studentId = studentId as string;
		if (subject) whereClause.subjectId = subject as string;

		const attendance = await prisma.subjectAttendance.findMany({
			where: whereClause,
			include: {
				student: true,
				subject: {
					include: {
						teacherAssignments: true,
					},
				},
			},
			orderBy: {
				date: 'desc',
			},
		});
		res.json(attendance);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch attendance records' });
	}
});

// Get attendance for a specific student
router.get(
	'/student/:studentId',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const { studentId } = req.params;
			const attendance = await prisma.subjectAttendance.findMany({
				where: {
					studentId,
				},
				include: {
					student: true,
					subject: {
						include: {
							teacherAssignments: true,
						},
					},
				},
				orderBy: {
					date: 'desc',
				},
			});
			res.json(attendance);
		} catch (error) {
			res.status(500).json({ error: 'Failed to fetch student attendance records' });
		}
	}
);

// Get student attendance by subject
router.get(
	'/student/:studentId/subject/:subjectId',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const { studentId, subjectId } = req.params;

			// Check if student is enrolled in the subject
			const enrollment = await prisma.studentSubject.findUnique({
				where: {
					studentId_subjectId: { studentId, subjectId },
				},
			});

			if (!enrollment) {
				res.status(404).json({ error: 'Student not enrolled in this subject' });
				return;
			}

			// Get attendance records for this student and subject
			const attendance = await prisma.subjectAttendance.findMany({
				where: {
					studentId,
					subjectId,
				},
				include: {
					student: true,
					subject: {
						include: {
							teacherAssignments: true,
						},
					},
				},
				orderBy: {
					date: 'desc',
				},
			});

			res.json(attendance);
		} catch (error) {
			console.error('Error fetching student subject attendance:', error);
			res.status(500).json({ error: 'Failed to fetch student subject attendance records' });
		}
	}
);

// Get attendance by date range
router.get('/range', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { startDate, endDate, subjectId } = req.query;

		// Convert string dates to Date objects
		const start = startDate ? new Date(startDate as string) : null;
		const end = endDate ? new Date(endDate as string) : null;

		// Validate dates
		if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
			res.status(400).json({ error: 'Invalid date format' });
			return;
		}

		const whereClause: Record<string, unknown> = {
			date: {
				gte: start,
				lte: end,
			},
		};

		if (subjectId) {
			whereClause.subjectId = subjectId;
		}

		const attendance = await prisma.subjectAttendance.findMany({
			where: whereClause,
			include: {
				student: true,
				subject: {
					include: {
						teacherAssignments: true,
					},
				},
			},
			orderBy: {
				date: 'desc',
			},
		});
		res.json(attendance);
	} catch (error) {
		console.error('Date range error:', error);
		res.status(500).json({ error: 'Failed to fetch attendance records by date range' });
	}
});

// Bulk attendance submission
router.post('/bulk', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { date, subjectId, attendanceData } = req.body;

		// Check if attendance already exists for the date and subject
		const existingAttendance = await prisma.subjectAttendance.findFirst({
			where: {
				date: new Date(date),
				subjectId,
			},
		});

		if (existingAttendance) {
			res.status(400).json({ error: 'Attendance already marked for this date and subject' });
			return;
		}

		// Create attendance records for all students in the subject
		const createAttendance = attendanceData.map((record: { studentId: string; status: string }) =>
			prisma.subjectAttendance.create({
				data: {
					date: new Date(date),
					status: record.status,
					studentId: record.studentId,
					subjectId,
					takenById: req.user.id, // The teacher taking attendance
				},
			})
		);

		await prisma.$transaction(createAttendance);

		res.json({ message: 'Attendance records created successfully' });
	} catch (error) {
		console.error('Bulk attendance error:', error);
		res.status(500).json({ error: 'Failed to create attendance records' });
	}
});

// Individual student attendance (for students marking their own attendance)
router.post(
	'/student',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const { studentId, subjectId, date, status } = req.body;

			// Verify the student is marking their own attendance
			if (req.user.id !== studentId) {
				res.status(403).json({ error: 'You can only mark your own attendance' });
				return;
			}

			// Check if student is enrolled in the subject
			const enrollment = await prisma.studentSubject.findUnique({
				where: {
					studentId_subjectId: { studentId, subjectId },
				},
			});

			if (!enrollment) {
				res.status(404).json({ error: 'Student not enrolled in this subject' });
				return;
			}

			// Check if attendance already exists for this student, subject, and date
			const existingAttendance = await prisma.subjectAttendance.findUnique({
				where: {
					subjectId_studentId_date: {
						subjectId,
						studentId,
						date: new Date(date),
					},
				},
			});

			if (existingAttendance) {
				res.status(400).json({ error: 'Attendance already marked for this date and subject' });
				return;
			}

			// Create the attendance record
			const attendance = await prisma.subjectAttendance.create({
				data: {
					date: new Date(date),
					status,
					studentId,
					subjectId,
					takenById: req.user.id, // Student marking their own attendance
				},
				include: {
					student: true,
					subject: true,
				},
			});

			res.json(attendance);
		} catch (error) {
			console.error('Individual student attendance error:', error);
			res.status(500).json({ error: 'Failed to mark attendance' });
		}
	}
);

// Update attendance record (for teachers to edit attendance)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		// Validate status
		if (!status || !['present', 'absent', 'late'].includes(status)) {
			res.status(400).json({ error: 'Invalid status. Must be present, absent, or late' });
			return;
		}

		// Get the attendance record
		const attendance = await prisma.subjectAttendance.findUnique({
			where: { id },
			include: {
				subject: {
					include: {
						teacherAssignments: {
							where: {
								teacherId: req.user.id,
							},
						},
					},
				},
			},
		});

		if (!attendance) {
			res.status(404).json({ error: 'Attendance record not found' });
			return;
		}

		// Check if the current user is a teacher assigned to this subject
		if (req.user.role !== 'TEACHER' || attendance.subject.teacherAssignments.length === 0) {
			res.status(403).json({ error: 'Only teachers assigned to this subject can edit attendance' });
			return;
		}

		// Update the attendance record
		const updatedAttendance = await prisma.subjectAttendance.update({
			where: { id },
			data: { status },
			include: {
				student: true,
				subject: true,
			},
		});

		res.json(updatedAttendance);
	} catch (error) {
		console.error('Update attendance error:', error);
		res.status(500).json({ error: 'Failed to update attendance record' });
	}
});

// Delete attendance record (for teachers to delete attendance)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { id } = req.params;

		// Get the attendance record
		const attendance = await prisma.subjectAttendance.findUnique({
			where: { id },
			include: {
				subject: {
					include: {
						teacherAssignments: {
							where: {
								teacherId: req.user.id,
							},
						},
					},
				},
			},
		});

		if (!attendance) {
			res.status(404).json({ error: 'Attendance record not found' });
			return;
		}

		// Check if the current user is a teacher assigned to this subject
		if (req.user.role !== 'TEACHER' || attendance.subject.teacherAssignments.length === 0) {
			res
				.status(403)
				.json({ error: 'Only teachers assigned to this subject can delete attendance' });
			return;
		}

		// Delete the attendance record
		await prisma.subjectAttendance.delete({
			where: { id },
		});

		res.json({ message: 'Attendance record deleted successfully' });
	} catch (error) {
		console.error('Delete attendance error:', error);
		res.status(500).json({ error: 'Failed to delete attendance record' });
	}
});

// Get attendance statistics
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { startDate, endDate, subjectId } = req.query;
		const whereClause: Record<string, unknown> = {};

		if (startDate && endDate) {
			whereClause.date = {
				gte: new Date(startDate as string),
				lte: new Date(endDate as string),
			};
		}

		if (subjectId) {
			whereClause.subjectId = subjectId;
		}

		const [totalStudents, attendanceRecords] = await prisma.$transaction([
			// get student count
			prisma.user.count({
				where: {
					role: 'STUDENT',
				},
			}),
			prisma.subjectAttendance.findMany({
				where: whereClause,
			}),
		]);

		const stats = {
			totalStudents,
			presentCount: attendanceRecords.filter((r) => r.status === 'present').length,
			absentCount: attendanceRecords.filter((r) => r.status === 'absent').length,
			lateCount: attendanceRecords.filter((r) => r.status === 'late').length,
		};

		res.json(stats);
	} catch (error) {
		console.error('Stats error:', error);
		res.status(500).json({ error: 'Failed to fetch attendance statistics' });
	}
});

export default router;
