import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Response, Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', authenticateToken, async (_req, res: Response): Promise<void> => {
	try {
		const users = await prisma.user.findMany({
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
		const usersWithoutPassword = users.map(({ password, ...rest }) => rest);
		res.json(usersWithoutPassword);
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Failed to fetch users' });
	}
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const admin = await prisma.user.findUnique({
			where: { id: req.user.id },
			select: {
				id: true,
				username: true,
				role: true,
				name: true,
				email: true,
			},
		});

		if (!admin) {
			res.status(401).json({ error: 'User not found' });
			return;
		}

		res.json(admin);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch user information' });
	}
});

// Update user email
router.put('/email', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
	try {
		const { email } = req.body;

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email || !emailRegex.test(email)) {
			res.status(400).json({ error: 'Invalid email format' });
			return;
		}

		// Check if email is already taken by another user
		const existingUser = await prisma.user.findFirst({
			where: {
				email: email,
				id: { not: req.user.id }, // Exclude current user
			},
		});

		if (existingUser) {
			res.status(409).json({ error: 'Email is already taken by another user' });
			return;
		}

		// Update the user's email
		const updatedUser = await prisma.user.update({
			where: { id: req.user.id },
			data: { email },
			select: {
				id: true,
				username: true,
				role: true,
				name: true,
				email: true,
			},
		});

		res.json(updatedUser);
	} catch (error) {
		console.error('Error updating email:', error);
		res.status(500).json({ error: 'Failed to update email' });
	}
});

// Update user password
router.put(
	'/password',
	authenticateToken,
	async (req: AuthRequest, res: Response): Promise<void> => {
		try {
			const { currentPassword, newPassword } = req.body;

			// Validate input
			if (!currentPassword || !newPassword) {
				res.status(400).json({ error: 'Current password and new password are required' });
				return;
			}

			if (newPassword.length < 6) {
				res.status(400).json({ error: 'New password must be at least 6 characters long' });
				return;
			}

			// Get current user with password
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: {
					id: true,
					password: true,
				},
			});

			if (!user) {
				res.status(404).json({ error: 'User not found' });
				return;
			}

			// Verify current password
			const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, user.password);
			if (!isCurrentPasswordValid) {
				res.status(404).json({ error: 'Current password is incorrect' });
				return;
			}

			// Hash new password
			const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

			// Update password
			await prisma.user.update({
				where: { id: req.user.id },
				data: { password: hashedNewPassword },
			});

			res.json({ message: 'Password updated successfully' });
		} catch (error) {
			console.error('Error updating password:', error);
			res.status(500).json({ error: 'Failed to update password' });
		}
	}
);

// Create new user
router.post('/', authenticateToken, async (req, res: Response): Promise<void> => {
	try {
		const { role, name, email, studentId, department, semester } = req.body;
		await prisma.user.create({
			data: {
				name,
				...(email && { email }),
				...(name && { username: name.toLowerCase().replace(/\s+/g, '') }),
				...(studentId && { studentId }),
				...(department && { department }),
				...(semester && { semester }),
				role,
				password: bcrypt.hashSync(studentId || 'user', 10), // Hash studentId as default password
			},
		});
		res.send('Student created successfully');
	} catch (error) {
		console.log(error);
		res.status(500).json({ error: 'Failed to create student' });
	}
});

// Update user
router.put('/:id', authenticateToken, async (req, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		const { role, name, email, studentId, department, semester } = req.body;
		const student = await prisma.user.update({
			where: { id },
			data: {
				name,
				email,
				studentId,
				department,
				semester,
				role,
			},
		});
		res.json(student);
	} catch (error) {
		res.status(500).json({ error: 'Failed to update student' });
	}
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res: Response): Promise<void> => {
	try {
		const { id } = req.params;
		await prisma.user.delete({
			where: { id },
		});
		res.json({ message: 'Student deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete student' });
	}
});

export default router;
