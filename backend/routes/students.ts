import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all students
router.get('/', authenticateToken, async (_req, res: Response): Promise<void> => {
	try {
		const students = await prisma.user.findMany({
			where: {
				role: 'STUDENT',
			},
			orderBy: {
				name: 'asc',
			},
			include: {
				_count: {
					select: {
						attendance: true,
					},
				},
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const studentsWithoutPassword = students.map(({ password, ...rest }) => rest);
		res.json(studentsWithoutPassword);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Failed to fetch students' });
	}
});

export default router;
