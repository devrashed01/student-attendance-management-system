import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	// Clear existing data
	console.log('Clearing existing data...');
	await prisma.attendance.deleteMany();
	await prisma.studentSubject.deleteMany();
	await prisma.teacherSubject.deleteMany();
	await prisma.subject.deleteMany();
	await prisma.user.deleteMany();
	console.log('Existing data cleared successfully');

	// Create SUPER_ADMIN user
	const superAdminPassword = bcrypt.hashSync('superadmin', 10);
	const superAdmin = await prisma.user.create({
		data: {
			username: 'super_admin',
			password: superAdminPassword,
			role: 'SUPER_ADMIN',
			name: 'Super Administrator',
			email: 'superadmin@example.com',
		},
	});

	// Create ADMIN user
	const adminPassword = bcrypt.hashSync('admin', 10);
	const admin = await prisma.user.create({
		data: {
			username: 'admin',
			password: adminPassword,
			role: 'ADMIN',
			name: 'Administrator',
			email: 'admin@example.com',
		},
	});

	// Create TEACHER users
	const teacherPassword = bcrypt.hashSync('teacher', 10);
	const teacher1 = await prisma.user.create({
		data: {
			username: 'teacher1',
			password: teacherPassword,
			role: 'TEACHER',
			name: 'John Smith',
			email: 'john.smith@example.com',
			department: 'Computer Science',
		},
	});

	const teacher2 = await prisma.user.create({
		data: {
			username: 'teacher2',
			password: teacherPassword,
			role: 'TEACHER',
			name: 'Sarah Johnson',
			email: 'sarah.johnson@example.com',
			department: 'Electrical Engineering',
		},
	});

	// Create STUDENT users
	const studentPassword = bcrypt.hashSync('student', 10);
	const student1 = await prisma.user.create({
		data: {
			username: 'student1',
			password: studentPassword,
			role: 'STUDENT',
			name: 'Alice Brown',
			email: 'alice.brown@example.com',
			studentId: 'STU001',
			department: 'Computer Science',
			semester: '3rd Semester',
		},
	});

	const student2 = await prisma.user.create({
		data: {
			username: 'student2',
			password: studentPassword,
			role: 'STUDENT',
			name: 'Bob Wilson',
			email: 'bob.wilson@example.com',
			studentId: 'STU002',
			department: 'Computer Science',
			semester: '3rd Semester',
		},
	});

	const student3 = await prisma.user.create({
		data: {
			username: 'student3',
			password: studentPassword,
			role: 'STUDENT',
			name: 'Carol Davis',
			email: 'carol.davis@example.com',
			studentId: 'STU003',
			department: 'Electrical Engineering',
			semester: '5th Semester',
		},
	});

	const student4 = await prisma.user.create({
		data: {
			username: 'student4',
			password: studentPassword,
			role: 'STUDENT',
			name: 'David Miller',
			email: 'david.miller@example.com',
			studentId: 'STU004',
			department: 'Electrical Engineering',
			semester: '5th Semester',
		},
	});

	// Create sample subjects
	const subject1 = await prisma.subject.create({
		data: {
			name: 'Introduction to Computer Science',
			code: 'CS101',
			department: 'Computer Science',
			description: 'Basic concepts of computer science and programming',
		},
	});

	const subject2 = await prisma.subject.create({
		data: {
			name: 'Data Structures and Algorithms',
			code: 'CS201',
			department: 'Computer Science',
			description: 'Advanced data structures and algorithm design',
		},
	});

	const subject3 = await prisma.subject.create({
		data: {
			name: 'Digital Electronics',
			code: 'EE101',
			department: 'Electrical Engineering',
			description: 'Fundamentals of digital electronics and logic design',
		},
	});

	const subject4 = await prisma.subject.create({
		data: {
			name: 'Circuit Analysis',
			code: 'EE201',
			department: 'Electrical Engineering',
			description: 'Analysis of electrical circuits and networks',
		},
	});

	// Assign teachers to subjects
	await prisma.teacherSubject.createMany({
		data: [
			{
				teacherId: teacher1.id,
				subjectId: subject1.id,
			},
			{
				teacherId: teacher1.id,
				subjectId: subject2.id,
			},
			{
				teacherId: teacher2.id,
				subjectId: subject3.id,
			},
			{
				teacherId: teacher2.id,
				subjectId: subject4.id,
			},
		],
	});

	// Enroll students in subjects
	await prisma.studentSubject.createMany({
		data: [
			// CS students in CS subjects
			{
				studentId: student1.id,
				subjectId: subject1.id,
			},
			{
				studentId: student1.id,
				subjectId: subject2.id,
			},
			{
				studentId: student2.id,
				subjectId: subject1.id,
			},
			{
				studentId: student2.id,
				subjectId: subject2.id,
			},
			// EE students in EE subjects
			{
				studentId: student3.id,
				subjectId: subject3.id,
			},
			{
				studentId: student3.id,
				subjectId: subject4.id,
			},
			{
				studentId: student4.id,
				subjectId: subject3.id,
			},
			{
				studentId: student4.id,
				subjectId: subject4.id,
			},
		],
	});

	console.log('Seed data created successfully:');
	console.log('- SUPER_ADMIN:', superAdmin.username);
	console.log('- ADMIN:', admin.username);
	console.log('- TEACHERS:', teacher1.username, teacher2.username);
	console.log(
		'- STUDENTS:',
		student1.username,
		student2.username,
		student3.username,
		student4.username
	);
	console.log('- SUBJECTS: CS101, CS201, EE101, EE201');
	console.log('- TEACHER ASSIGNMENTS: Created');
	console.log('- STUDENT ENROLLMENTS: Created');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
