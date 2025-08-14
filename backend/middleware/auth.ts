import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const secretKey = process.env.SECRET_KEY || '';

export interface AuthRequest extends Request {
	user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
	const token = req.headers['authorization']?.split(' ')[1];
	if (!token) {
		res.status(401).json({ error: 'Unauthorized' });
		return;
	}

	jwt.verify(token, secretKey, (err, user): void => {
		if (err) {
			res.status(403).json({ error: 'Invalid token' });
			return;
		}
		req.user = user;
		next();
	});
};
