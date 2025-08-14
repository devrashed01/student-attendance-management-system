import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const secretKey = process.env.SECRET_KEY || '';

// Login endpoint
router.post('/login', async (req: Request, res: Response): Promise<void> => {
	try {
		const { username, password } = req.body;
		const user = await prisma.user.findUnique({ where: { username } });

		if (!user || !bcrypt.compareSync(password, user.password)) {
			res.status(401).json({ error: 'Invalid credentials' });
			return;
		}

		const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
			expiresIn: '24h',
		});

		res.json({ token });
	} catch (error) {
		res.status(500).json({ error: 'Login failed' });
	}
});

export default router;
