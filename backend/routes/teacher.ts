import { PrismaClient } from '@prisma/client';
import { Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get teacher's assigned subjects
router.get(
	'/subjects',
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

			const subjects = await prisma.teacherSubject.findMany({
				where: { teacherId: req.user.id },
				include: {
					subject: {
						include: {
							studentEnrollments: {
								include: {
									student: {
										select: { id: true, name: true, email: true, studentId: true },
									},
								},
							},
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

export default router;
