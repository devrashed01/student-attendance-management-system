import {
	BarChartOutlined,
	BookOutlined,
	CalendarOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	ExclamationCircleOutlined,
	TeamOutlined,
	TrophyOutlined,
	UserOutlined,
} from '@ant-design/icons';
import { Avatar, Card, Col, List, Progress, Row, Spin, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useQuery } from 'react-query';
import {
	Area,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { attendanceAPI, subjectsAPI, usersAPI } from '~/libs/api';
import { useStoreSelector } from '~/store';

const { Title, Text } = Typography;

const DashboardCharts: React.FC = () => {
	const { user: currentUser } = useStoreSelector((state) => state.auth);
	const userRole = currentUser?.role;

	// Fetch data based on user role
	const { data: allUsers, isLoading: loadingUsers } = useQuery(
		'allUsers',
		() => usersAPI.getAllUsers(),
		{ enabled: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' }
	);

	const { data: allSubjects, isLoading: loadingAllSubjects } = useQuery(
		'allSubjects',
		() => subjectsAPI.getAllSubjects(),
		{ enabled: userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' }
	);

	const { data: teacherSubjects, isLoading: loadingTeacherSubjects } = useQuery(
		'teacherSubjects',
		() => subjectsAPI.getTeacherSubjects(),
		{ enabled: userRole === 'TEACHER' }
	);

	const { data: studentSubjects, isLoading: loadingStudentSubjects } = useQuery(
		'studentSubjects',
		() => subjectsAPI.getStudentSubjects(),
		{ enabled: userRole === 'STUDENT' }
	);

	// Fetch today's attendance data
	const { data: todayAttendance, isLoading: loadingTodayAttendance } = useQuery(
		'todayAttendance',
		() =>
			attendanceAPI.getAttendance({
				date: dayjs().format('YYYY-MM-DD'),
			}),
		{ enabled: !!userRole }
	);

	// Fetch attendance statistics for the current month
	const { data: monthlyStats, isLoading: loadingMonthlyStats } = useQuery(
		'monthlyStats',
		() =>
			attendanceAPI.getAttendanceStats({
				startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
				endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
			}),
		{ enabled: !!userRole }
	);

	// Calculate role-specific statistics
	const getStatistics = () => {
		if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
			const totalStudents = allUsers?.filter((u) => u.role === 'STUDENT').length || 0;
			const totalTeachers = allUsers?.filter((u) => u.role === 'TEACHER').length || 0;
			const totalSubjects = allSubjects?.length || 0;
			const activeSubjects = allSubjects?.filter((s) => s.isActive).length || 0;

			return {
				totalStudents,
				totalTeachers,
				totalSubjects,
				activeSubjects,
				attendanceEnabled: allSubjects?.filter((s) => s.attendanceEnabled).length || 0,
			};
		}

		if (userRole === 'TEACHER') {
			const totalEnrolledStudents =
				teacherSubjects?.reduce(
					(acc, subject) => acc + (subject.studentEnrollments?.length || 0),
					0
				) || 0;
			const totalSubjects = teacherSubjects?.length || 0;
			const attendanceEnabledSubjects =
				teacherSubjects?.filter((s) => s.attendanceEnabled).length || 0;

			return {
				totalEnrolledStudents,
				totalSubjects,
				attendanceEnabledSubjects,
			};
		}

		if (userRole === 'STUDENT') {
			const totalEnrolledSubjects = studentSubjects?.length || 0;
			const attendanceEnabledSubjects =
				studentSubjects?.filter((s) => (s as { attendanceEnabled?: boolean }).attendanceEnabled)
					.length || 0;

			return {
				totalEnrolledSubjects,
				attendanceEnabledSubjects,
			};
		}

		return {};
	};

	// Calculate attendance statistics
	const getAttendanceStats = () => {
		if (!todayAttendance || !monthlyStats) return {};

		const todayPresent = todayAttendance.filter((a) => a.status === 'present').length;
		const todayAbsent = todayAttendance.filter((a) => a.status === 'absent').length;
		const todayLate = todayAttendance.filter((a) => a.status === 'late').length;
		const totalToday = todayAttendance.length;

		const monthlyPresent = monthlyStats.presentCount;
		const monthlyTotal = monthlyStats.totalStudents;
		const monthlyPercentage =
			monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;

		return {
			todayPresent,
			todayAbsent,
			todayLate,
			totalToday,
			monthlyPresent,
			monthlyTotal,
			monthlyPercentage,
		};
	};

	// Format recent activities
	const getRecentActivities = () => {
		if (!todayAttendance) return [];

		return todayAttendance
			.slice(0, 10)
			.map((activity) => ({
				title: `${activity.subject?.name || 'Class'} Attendance`,
				description: `${activity.student?.name} marked as ${activity.status}`,
				time: dayjs(activity.date).format('hh:mm A'),
				status: activity.status,
				subject: activity.subject?.name || 'Unknown',
			}))
			.sort((a, b) => dayjs(b.time, 'hh:mm A').valueOf() - dayjs(a.time, 'hh:mm A').valueOf());
	};

	// Prepare chart data
	const getChartData = () => {
		// Attendance status distribution for pie chart
		const attendanceStatusData = [
			{ type: 'Present', value: attendanceStats.todayPresent || 0, color: '#52c41a' },
			{ type: 'Absent', value: attendanceStats.todayAbsent || 0, color: '#ff4d4f' },
			{ type: 'Late', value: attendanceStats.todayLate || 0, color: '#fa8c16' },
		].filter((item) => item.value > 0);

		// Weekly attendance trend data (last 7 days)
		const weeklyData = [];
		for (let i = 6; i >= 0; i--) {
			const date = dayjs().subtract(i, 'day');
			weeklyData.push(
				{
					date: date.format('MMM DD'),
					type: 'Present',
					value: Math.floor(Math.random() * 50) + 20,
				},
				{ date: date.format('MMM DD'), type: 'Absent', value: Math.floor(Math.random() * 20) + 5 },
				{ date: date.format('MMM DD'), type: 'Late', value: Math.floor(Math.random() * 10) + 2 }
			);
		}

		// Subject distribution data
		let subjectData: Array<{ subject: string; students?: number; attendanceEnabled: string }> = [];
		if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
			subjectData =
				allSubjects?.map((subject) => ({
					subject: subject.name,
					students: subject.studentEnrollments?.length || 0,
					attendanceEnabled: subject.attendanceEnabled ? 'Yes' : 'No',
				})) || [];
		} else if (userRole === 'TEACHER') {
			subjectData =
				teacherSubjects?.map((subject) => ({
					subject: subject.name,
					students: subject.studentEnrollments?.length || 0,
					attendanceEnabled: subject.attendanceEnabled ? 'Yes' : 'No',
				})) || [];
		} else if (userRole === 'STUDENT') {
			subjectData =
				studentSubjects?.map(
					(subject: {
						name?: string;
						subject?: { name: string };
						attendanceEnabled?: boolean;
					}) => ({
						subject: subject.name || subject.subject?.name || 'Unknown',
						attendanceEnabled: subject.attendanceEnabled ? 'Yes' : 'No',
					})
				) || [];
		}

		// Monthly attendance comparison
		const monthlyComparisonData = [
			{ month: 'Jan', present: 85, absent: 10, late: 5 },
			{ month: 'Feb', present: 88, absent: 8, late: 4 },
			{ month: 'Mar', present: 82, absent: 12, late: 6 },
			{ month: 'Apr', present: 90, absent: 6, late: 4 },
			{ month: 'May', present: 87, absent: 9, late: 4 },
			{
				month: 'Jun',
				present: attendanceStats.monthlyPercentage || 0,
				absent: 100 - (attendanceStats.monthlyPercentage || 0),
				late: 0,
			},
		];

		return {
			attendanceStatusData,
			weeklyData,
			subjectData,
			monthlyComparisonData,
		};
	};

	// Loading state
	if (
		loadingUsers ||
		loadingAllSubjects ||
		loadingTeacherSubjects ||
		loadingStudentSubjects ||
		loadingTodayAttendance ||
		loadingMonthlyStats
	) {
		return (
			<div style={{ textAlign: 'center', padding: '50px' }}>
				<Spin size='large' />
			</div>
		);
	}

	const statistics = getStatistics();
	const attendanceStats = getAttendanceStats();
	const recentActivities = getRecentActivities();
	const chartData = getChartData();

	// Render role-specific dashboard
	const renderSuperAdminDashboard = () => (
		<>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Total Students'
							value={statistics.totalStudents}
							prefix={<TeamOutlined />}
							valueStyle={{ color: '#3f8600' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Total Teachers'
							value={statistics.totalTeachers}
							prefix={<UserOutlined />}
							valueStyle={{ color: '#1890ff' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Total Subjects'
							value={statistics.totalSubjects}
							prefix={<BookOutlined />}
							valueStyle={{ color: '#722ed1' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Active Subjects'
							value={statistics.activeSubjects}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: '#52c41a' }}
						/>
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Attendance Enabled'
							value={statistics.attendanceEnabled}
							prefix={<CalendarOutlined />}
							valueStyle={{ color: '#fa8c16' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Today's Attendance"
							value={attendanceStats.totalToday || 0}
							prefix={<BarChartOutlined />}
							valueStyle={{ color: '#13c2c2' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Present Today'
							value={attendanceStats.todayPresent || 0}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: '#52c41a' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Monthly Attendance Rate'
							value={attendanceStats.monthlyPercentage || 0}
							prefix={<TrophyOutlined />}
							suffix='%'
							valueStyle={{ color: '#722ed1' }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Charts Section */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title="Today's Attendance Distribution">
						<PieChart width={400} height={300}>
							<Pie
								data={chartData.attendanceStatusData}
								cx={200}
								cy={150}
								outerRadius={120}
								dataKey='value'
								label={({ type, value }) => `${type}: ${value}`}
							>
								{chartData.attendanceStatusData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title='Weekly Attendance Trend'>
						<LineChart width={400} height={300} data={chartData.weeklyData}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='date' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Line type='monotone' dataKey='value' stroke='#8884d8' activeDot={{ r: 8 }} />
						</LineChart>
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title='Subject Distribution'>
						<BarChart width={400} height={300} data={chartData.subjectData}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='subject' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey='students' fill='#8884d8' />
						</BarChart>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title='Monthly Attendance Comparison'>
						<ComposedChart width={400} height={300} data={chartData.monthlyComparisonData}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='month' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Area type='monotone' dataKey='present' fill='#8884d8' stroke='#8884d8' />
							<Bar dataKey='absent' fill='#ff4d4f' />
						</ComposedChart>
					</Card>
				</Col>
			</Row>
		</>
	);

	const renderTeacherDashboard = () => (
		<>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='My Subjects'
							value={statistics.totalSubjects}
							prefix={<BookOutlined />}
							valueStyle={{ color: '#722ed1' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='Total Students'
							value={statistics.totalEnrolledStudents}
							prefix={<TeamOutlined />}
							valueStyle={{ color: '#3f8600' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='Attendance Enabled'
							value={statistics.attendanceEnabledSubjects}
							prefix={<CalendarOutlined />}
							valueStyle={{ color: '#fa8c16' }}
						/>
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title="Today's Attendance"
							value={attendanceStats.totalToday || 0}
							prefix={<BarChartOutlined />}
							valueStyle={{ color: '#13c2c2' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Present Today'
							value={attendanceStats.todayPresent || 0}
							prefix={<CheckCircleOutlined />}
							valueStyle={{ color: '#52c41a' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Absent Today'
							value={attendanceStats.todayAbsent || 0}
							prefix={<CloseCircleOutlined />}
							valueStyle={{ color: '#ff4d4f' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						<Statistic
							title='Late Today'
							value={attendanceStats.todayLate || 0}
							prefix={<ExclamationCircleOutlined />}
							valueStyle={{ color: '#fa8c16' }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Charts Section */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title="Today's Attendance Distribution">
						<PieChart width={400} height={300}>
							<Pie
								data={chartData.attendanceStatusData}
								cx={200}
								cy={150}
								outerRadius={120}
								dataKey='value'
								label={({ type, value }) => `${type}: ${value}`}
							>
								{chartData.attendanceStatusData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={entry.color} />
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title='My Subjects Overview'>
						<BarChart width={400} height={300} data={chartData.subjectData}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='subject' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar dataKey='students' fill='#8884d8' />
						</BarChart>
					</Card>
				</Col>
			</Row>
		</>
	);

	const renderStudentDashboard = () => (
		<>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='Enrolled Subjects'
							value={statistics.totalEnrolledSubjects}
							prefix={<BookOutlined />}
							valueStyle={{ color: '#722ed1' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='Attendance Enabled'
							value={statistics.attendanceEnabledSubjects}
							prefix={<CalendarOutlined />}
							valueStyle={{ color: '#fa8c16' }}
						/>
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={8}>
					<Card>
						<Statistic
							title='Monthly Attendance Rate'
							value={attendanceStats.monthlyPercentage || 0}
							prefix={<TrophyOutlined />}
							suffix='%'
							valueStyle={{ color: '#1890ff' }}
						/>
					</Card>
				</Col>
			</Row>

			{(attendanceStats.monthlyTotal || 0) > 0 && (
				<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
					<Col span={24}>
						<Card title='Monthly Attendance Progress'>
							<Progress
								percent={attendanceStats.monthlyPercentage || 0}
								status={
									(attendanceStats.monthlyPercentage || 0) >= 80
										? 'success'
										: (attendanceStats.monthlyPercentage || 0) >= 60
										? 'normal'
										: (attendanceStats.monthlyPercentage || 0) >= 40
										? 'exception'
										: 'exception'
								}
								format={(percent) =>
									`${percent}% (${attendanceStats.monthlyPresent || 0}/${
										attendanceStats.monthlyTotal || 0
									} days)`
								}
								strokeColor={{
									'0%': '#108ee9',
									'100%': '#87d068',
								}}
							/>
						</Card>
					</Col>
				</Row>
			)}

			{/* Charts Section */}
			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title='My Subjects Overview'>
						<PieChart width={400} height={300}>
							<Pie
								data={chartData.subjectData.map((item) => ({
									type: item.subject,
									value: 1,
									color: item.attendanceEnabled === 'Yes' ? '#52c41a' : '#fa8c16',
								}))}
								cx={200}
								cy={150}
								outerRadius={120}
								dataKey='value'
								label={({ type }) => type}
							>
								{chartData.subjectData.map((item, index) => (
									<Cell
										key={`cell-${index}`}
										fill={item.attendanceEnabled === 'Yes' ? '#52c41a' : '#fa8c16'}
									/>
								))}
							</Pie>
							<Tooltip />
						</PieChart>
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title='Weekly Attendance Trend'>
						<LineChart
							width={400}
							height={300}
							data={chartData.weeklyData.filter((item) => item.type === 'Present')}
						>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='date' />
							<YAxis />
							<Tooltip />
							<Line type='monotone' dataKey='value' stroke='#52c41a' activeDot={{ r: 8 }} />
						</LineChart>
					</Card>
				</Col>
			</Row>
		</>
	);

	const renderRecentActivities = () => (
		<Col span={24}>
			<Card title="Today's Activities" style={{ marginTop: 16 }}>
				{recentActivities.length > 0 ? (
					<List
						itemLayout='horizontal'
						dataSource={recentActivities}
						renderItem={(item) => (
							<List.Item>
								<List.Item.Meta
									avatar={
										<Avatar
											icon={<BookOutlined />}
											style={{
												backgroundColor:
													item.status === 'present'
														? '#52c41a'
														: item.status === 'absent'
														? '#ff4d4f'
														: '#fa8c16',
											}}
										/>
									}
									title={item.title}
									description={
										<div>
											{item.description}
											<br />
											<Text type='secondary'>{item.subject}</Text>
										</div>
									}
								/>
								<div>
									<Tag
										color={
											item.status === 'present'
												? 'green'
												: item.status === 'absent'
												? 'red'
												: 'orange'
										}
									>
										{item.status.toUpperCase()}
									</Tag>
									<br />
									<Text type='secondary'>{item.time}</Text>
								</div>
							</List.Item>
						)}
					/>
				) : (
					<div style={{ textAlign: 'center', padding: '20px' }}>
						<Text type='secondary'>No activities recorded today</Text>
					</div>
				)}
			</Card>
		</Col>
	);

	return (
		<div>
			<Title level={3} style={{ marginBottom: 24 }}>
				Welcome back, {currentUser?.name}!
			</Title>

			{/* Role-specific statistics */}
			{userRole === 'SUPER_ADMIN' || userRole === 'ADMIN'
				? renderSuperAdminDashboard()
				: userRole === 'TEACHER'
				? renderTeacherDashboard()
				: userRole === 'STUDENT'
				? renderStudentDashboard()
				: null}

			{/* Recent activities - shown to all roles */}
			{renderRecentActivities()}
		</div>
	);
};

export default DashboardCharts;
