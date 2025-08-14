import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get student's enrolled subjects
router.get(
	'/subjects',
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

			const subjects = await prisma.studentSubject.findMany({
				where: { studentId: req.user.id },
				include: {
					subject: {
						include: {
							teacherAssignments: {
								include: {
									teacher: {
										select: { id: true, name: true, email: true },
									},
								},
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

export default router;
