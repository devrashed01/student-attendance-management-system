/* eslint-disable @typescript-eslint/no-explicit-any */
import cors from 'cors';
import express from 'express';

import 'dotenv/config';

// Import routes
import {
	attendanceRoutes,
	authRoutes,
	studentRoutes,
	studentsRoutes,
	subjectsRoutes,
	summaryRoutes,
	teacherRoutes,
	usersRoutes,
} from './routes';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Register API routes
app.use('/api', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/summary', summaryRoutes);

app.use((error: any, req: import('express').Request, res: import('express').Response) => {
	console.log(req.baseUrl);
	console.log(error.message);
	res.status(error.status || 500).json({ error: error.message });
});

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
