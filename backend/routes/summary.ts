import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get attendance summary
router.get('/', authenticateToken, async (_req, res: Response): Promise<void> => {
	try {
		const students = await prisma.user.findMany({
			include: {
				attendance: true,
			},
		});

		const summary = students.map((student) => {
			const totalDays = student.attendance.length;
			const presentDays = student.attendance.filter((a) => a.status === 'present').length;
			const percentage = totalDays ? (presentDays / totalDays) * 100 : 0;

			return {
				...student,
				attendancePercentage: percentage,
				totalDays,
				presentDays,
			};
		});

		res.json(summary);
	} catch (error) {
		res.status(500).json({ error: 'Failed to generate summary' });
	}
});

export default router;
