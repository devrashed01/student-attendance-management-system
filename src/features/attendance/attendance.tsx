/* eslint-disable @typescript-eslint/no-explicit-any */
import { BookOutlined, CalendarOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import {
	Button,
	Card,
	Col,
	DatePicker,
	Descriptions,
	Divider,
	Form,
	message,
	Modal,
	Progress,
	Row,
	Select,
	Space,
	Statistic,
	Switch,
	Table,
	Tabs,
	Tag,
	Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { attendanceAPI } from '~/libs/api/attendanceAPI';
import type { StudentEnrollment, Subject } from '~/libs/api/subjectsAPI';
import { subjectsAPI } from '~/libs/api/subjectsAPI';
import { useStoreSelector } from '~/store';
import { exportToCSV } from '~/utils/helpers/download.helpers';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Attendance = () => {
	const [form] = Form.useForm();
	const [selectedSubject, setSelectedSubject] = useState<string>('');
	const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
	const [attendanceStatus, setAttendanceStatus] = useState<Record<string, string>>({});
	const [isAttendanceEnabled, setIsAttendanceEnabled] = useState<Record<string, boolean>>({});
	const [showSubjectDetails, setShowSubjectDetails] = useState<Subject | null>(null);
	const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
		dayjs().subtract(30, 'days'),
		dayjs(),
	]);
	const [showStudentAttendanceModal, setShowStudentAttendanceModal] = useState(false);
	const [selectedStudentSubject, setSelectedStudentSubject] = useState<string>('');
	const [studentAttendanceStatus, setStudentAttendanceStatus] = useState<
		'present' | 'absent' | 'late'
	>('present');
	const [showTeacherStudentAttendance, setShowTeacherStudentAttendance] = useState(false);
	const [selectedSubjectForAttendance, setSelectedSubjectForAttendance] = useState<string>('');
	const [teacherSubjectDateRange, setTeacherSubjectDateRange] = useState<
		[dayjs.Dayjs, dayjs.Dayjs]
	>([dayjs().subtract(30, 'days'), dayjs()]);
	const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
	const [editingStatus, setEditingStatus] = useState<string>('');
	const [deletingAttendance, setDeletingAttendance] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const { user: currentUser } = useStoreSelector((state) => state.auth);

	// Check user role
	const isTeacher = currentUser?.role === 'TEACHER';
	const isStudent = currentUser?.role === 'STUDENT';

	// Fetch teacher's subjects
	const { data: teacherSubjects = [], isLoading: teacherSubjectsLoading } = useQuery(
		'teacherSubjects',
		subjectsAPI.getTeacherSubjects,
		{
			enabled: isTeacher,
		}
	);

	// Fetch student's subjects
	const { data: studentSubjects = [], isLoading: studentSubjectsLoading } = useQuery(
		'studentSubjects',
		subjectsAPI.getStudentSubjects,
		{
			enabled: isStudent,
		}
	);

	// Fetch student's attendance records
	const { data: studentAttendance = [], isLoading: studentAttendanceLoading } = useQuery(
		['studentAttendance', currentUser?.id, dateRange],
		() =>
			attendanceAPI.getAttendanceByDateRange({
				startDate: dateRange[0].format('YYYY-MM-DD'),
				endDate: dateRange[1].format('YYYY-MM-DD'),
			}),
		{
			enabled: isStudent && !!currentUser?.id,
		}
	);

	// Filter attendance to only show records for enrolled subjects AND current student
	const filteredStudentAttendance = studentAttendance.filter((attendance) => {
		// Check if this is the current student's attendance
		const isCurrentStudent = attendance.studentId === currentUser?.id;

		// Check if this is for a subject the student is enrolled in
		const isEnrolledSubject = studentSubjects.some(
			(subject) =>
				(subject as any).subjectId === attendance.subjectId || subject.id === attendance.subjectId
		);

		// Debug logging
		console.log('Attendance record:', {
			attendanceId: attendance.id,
			studentId: attendance.studentId,
			currentUserId: currentUser?.id,
			subjectId: attendance.subjectId,
			isCurrentStudent,
			isEnrolledSubject,
			studentSubjects: studentSubjects.map((s) => ({ id: s.id, subjectId: (s as any).subjectId })),
		});

		return isCurrentStudent && isEnrolledSubject;
	});

	// Fetch all students' attendance records for a specific subject
	const { data: teacherSubjectAttendance = [], isLoading: teacherSubjectAttendanceLoading } =
		useQuery(
			['teacherSubjectAttendance', selectedSubjectForAttendance, teacherSubjectDateRange],
			() =>
				attendanceAPI.getAttendance({
					subject: selectedSubjectForAttendance,
				}),
			{
				enabled: isTeacher && !!selectedSubjectForAttendance,
			}
		);

	// Get enrolled students for selected subject (teacher view)
	const selectedSubjectData = teacherSubjects.find((subject) => subject.id === selectedSubject);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const enrolledStudents = selectedSubjectData?.studentEnrollments || [];

	// Initialize attendance status for enrolled students
	useEffect(() => {
		if (enrolledStudents.length > 0) {
			const initialStatus: Record<string, string> = {};
			enrolledStudents.forEach((enrollment: StudentEnrollment) => {
				initialStatus[enrollment.student.id] = 'absent';
			});
			setAttendanceStatus(initialStatus);
		}
	}, [enrolledStudents]);

	// Initialize attendance enabled status for subjects
	useEffect(() => {
		if (teacherSubjects.length > 0) {
			const initialEnabled: Record<string, boolean> = {};
			teacherSubjects.forEach((subject) => {
				initialEnabled[subject.id] = subject.attendanceEnabled;
			});
			setIsAttendanceEnabled(initialEnabled);
		}
	}, [teacherSubjects]);

	// Submit attendance using the API
	const submitAttendanceMutation = useMutation(
		async ({
			subjectId,
			date,
			attendanceData,
		}: {
			subjectId: string;
			date: string;
			attendanceData: { studentId: string; status: string }[];
		}) => {
			return attendanceAPI.submitBulkAttendance({ date, subjectId, attendanceData });
		},
		{
			onSuccess: () => {
				message.success('Attendance submitted successfully');
				form.resetFields();
				setAttendanceStatus({});
				queryClient.invalidateQueries('attendanceHistory');
			},
			onError: (error: unknown) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to submit attendance';
				message.error(errorMessage);
			},
		}
	);

	// Toggle attendance enabled mutation
	const toggleAttendanceMutation = useMutation(
		async ({ subjectId, enabled }: { subjectId: string; enabled: boolean }) => {
			return subjectsAPI.toggleAttendance(subjectId, enabled);
		},
		{
			onSuccess: (data, variables) => {
				const { subjectId, enabled } = variables;
				setIsAttendanceEnabled((prev) => ({
					...prev,
					[subjectId]: enabled,
				}));
				message.success(`Attendance ${enabled ? 'enabled' : 'disabled'} for this subject`);
				// Invalidate and refetch teacher subjects to get updated data
				queryClient.invalidateQueries('teacherSubjects');
			},
			onError: (error: unknown) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to toggle attendance';
				message.error(errorMessage);
			},
		}
	);

	// Student self-attendance mutation
	const studentAttendanceMutation = useMutation(
		async ({ subjectId, date, status }: { subjectId: string; date: string; status: string }) => {
			return attendanceAPI.markAttendance({
				studentId: currentUser!.id,
				subjectId,
				date,
				status,
			});
		},
		{
			onSuccess: () => {
				message.success('Attendance marked successfully');
				setShowStudentAttendanceModal(false);
				setSelectedStudentSubject('');
				setStudentAttendanceStatus('present');
				// Refresh attendance data
				queryClient.invalidateQueries(['studentAttendance', currentUser?.id]);
			},
			onError: (error: unknown) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to mark attendance';
				message.error(errorMessage);
			},
		}
	);

	// Update attendance mutation for teachers
	const updateAttendanceMutation = useMutation(
		async ({
			attendanceId,
			status,
		}: {
			attendanceId: string;
			status: 'present' | 'absent' | 'late';
		}) => {
			return attendanceAPI.updateAttendance(attendanceId, { status });
		},
		{
			onSuccess: () => {
				message.success('Attendance updated successfully');
				setEditingAttendance(null);
				setEditingStatus('');
				// Refresh teacher subject attendance data
				queryClient.invalidateQueries(['teacherSubjectAttendance', selectedSubjectForAttendance]);
			},
			onError: (error: unknown) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to update attendance';
				message.error(errorMessage);
			},
		}
	);

	// Delete attendance mutation for teachers
	const deleteAttendanceMutation = useMutation(
		async (attendanceId: string) => {
			return attendanceAPI.deleteAttendance(attendanceId);
		},
		{
			onSuccess: () => {
				message.success('Attendance deleted successfully');
				setDeletingAttendance(null);
				// Refresh teacher subject attendance data
				queryClient.invalidateQueries(['teacherSubjectAttendance', selectedSubjectForAttendance]);
			},
			onError: (error: unknown) => {
				const errorMessage = error instanceof Error ? error.message : 'Failed to delete attendance';
				message.error(errorMessage);
			},
		}
	);

	const handleAttendanceChange = (studentId: string, status: string) => {
		setAttendanceStatus((prev) => ({
			...prev,
			[studentId]: status,
		}));
	};

	const handleSubmitAttendance = () => {
		if (!selectedSubject || !selectedDate) {
			message.error('Please select a subject and date');
			return;
		}

		const attendanceData = Object.entries(attendanceStatus).map(([studentId, status]) => ({
			studentId,
			status,
		}));

		submitAttendanceMutation.mutate({
			subjectId: selectedSubject,
			date: selectedDate.format('YYYY-MM-DD'),
			attendanceData,
		});
	};

	const handleStudentAttendance = () => {
		if (!selectedStudentSubject) {
			message.error('Please select a subject');
			return;
		}

		studentAttendanceMutation.mutate({
			subjectId: selectedStudentSubject,
			date: dayjs().format('YYYY-MM-DD'),
			status: studentAttendanceStatus,
		});
	};

	const handleEditAttendance = (attendanceId: string, currentStatus: string) => {
		setEditingAttendance(attendanceId);
		setEditingStatus(currentStatus);
	};

	const handleSaveAttendance = (attendanceId: string) => {
		if (!editingStatus) {
			message.error('Please select a status');
			return;
		}

		updateAttendanceMutation.mutate({
			attendanceId,
			status: editingStatus as 'present' | 'absent' | 'late',
		});
	};

	const handleCancelEdit = () => {
		setEditingAttendance(null);
		setEditingStatus('');
	};

	const handleDeleteAttendance = (attendanceId: string) => {
		setDeletingAttendance(attendanceId);
	};

	const confirmDeleteAttendance = () => {
		if (deletingAttendance) {
			deleteAttendanceMutation.mutate(deletingAttendance);
		}
	};

	const handleExportAttendance = () => {
		if (
			!selectedSubjectForAttendance ||
			!teacherSubjectAttendance ||
			teacherSubjectAttendance.length === 0
		) {
			message.error('No attendance data to export');
			return;
		}

		const subjectName =
			teacherSubjects.find((s) => s.id === selectedSubjectForAttendance)?.name || 'Subject';
		const startDate = teacherSubjectDateRange[0].format('YYYY-MM-DD');
		const endDate = teacherSubjectDateRange[1].format('YYYY-MM-DD');

		// Prepare data for export
		const exportData = teacherSubjectAttendance.map((record) => ({
			'Student Name': record.student?.name || 'N/A',
			Email: record.student?.email || 'N/A',
			Date: dayjs(record.date).format('YYYY-MM-DD'),
			Status: record.status.toUpperCase(),
			Subject: subjectName,
		}));

		const fileName = `attendance_${subjectName}_${startDate}_to_${endDate}.csv`;
		exportToCSV(exportData, fileName);
		message.success('Attendance data exported successfully');
	};

	const handleExportStudentAttendance = () => {
		if (!filteredStudentAttendance || filteredStudentAttendance.length === 0) {
			message.error('No attendance data to export');
			return;
		}

		const startDate = dateRange[0].format('YYYY-MM-DD');
		const endDate = dateRange[1].format('YYYY-MM-DD');

		// Prepare data for export
		const exportData = filteredStudentAttendance.map((record) => ({
			Subject: record.subject?.name || 'N/A',
			Date: dayjs(record.date).format('YYYY-MM-DD'),
			Status: record.status.toUpperCase(),
			'Student Name': currentUser?.name || 'N/A',
			'Student ID': record.student?.studentId || 'N/A',
			Email: currentUser?.email || 'N/A',
		}));

		const fileName = `my_attendance_${startDate}_to_${endDate}.csv`;
		exportToCSV(exportData, fileName);
		message.success('Attendance data exported successfully');
	};

	const toggleAttendanceEnabled = (subjectId: string, enabled: boolean) => {
		toggleAttendanceMutation.mutate({ subjectId, enabled });
	};

	// Calculate attendance statistics for student
	const calculateAttendanceStats = () => {
		if (!filteredStudentAttendance.length)
			return { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };

		const total = filteredStudentAttendance.length;
		const present = filteredStudentAttendance.filter((a) => a.status === 'present').length;
		const absent = filteredStudentAttendance.filter((a) => a.status === 'absent').length;
		const late = filteredStudentAttendance.filter((a) => a.status === 'late').length;
		const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

		return { total, present, absent, late, percentage };
	};

	// Teacher view columns
	const teacherSubjectColumns: ColumnsType<Subject> = [
		{
			title: 'Subject Code',
			dataIndex: 'code',
			key: 'code',
			width: 120,
		},
		{
			title: 'Subject Name',
			dataIndex: 'name',
			key: 'name',
			width: 200,
		},
		{
			title: 'Students',
			key: 'students',
			width: 100,
			render: (_, record) => (
				<Tag color='blue'>{record.studentEnrollments?.length || 0} enrolled</Tag>
			),
		},
		{
			title: 'Attendance Enabled',
			key: 'attendanceEnabled',
			width: 150,
			render: (_, record) => (
				<Switch
					checked={isAttendanceEnabled[record.id]}
					onChange={(checked) => toggleAttendanceEnabled(record.id, checked)}
				/>
			),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 250,
			render: (_, record) => (
				<Space>
					<Button type='primary' size='small' onClick={() => setSelectedSubject(record.id)}>
						Take Attendance
					</Button>
					<Button
						type='link'
						size='small'
						onClick={() => setShowSubjectDetails(record)}
						icon={<BookOutlined />}
					>
						Details
					</Button>
					<Button
						type='default'
						size='small'
						onClick={() => {
							setSelectedSubjectForAttendance(record.id);
							setShowTeacherStudentAttendance(true);
						}}
					>
						View Attendance
					</Button>
				</Space>
			),
		},
	];

	// Student view columns
	const studentSubjectColumns: ColumnsType<Subject> = [
		{
			title: 'Subject Code',
			dataIndex: 'code',
			key: 'code',
			width: 120,
		},
		{
			title: 'Subject Name',
			dataIndex: 'name',
			key: 'name',
			width: 200,
		},
		{
			title: 'Teacher',
			key: 'teacherAssignments',
			width: 150,
			render: (_, record) => {
				return (
					<Text type='secondary'>
						{record.teacherAssignments?.find((el) => el.subjectId === record.id)?.teacher.name ||
							'N/A'}
					</Text>
				);
			},
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 150,
			render: (_, record) => (
				<Button
					type='primary'
					size='small'
					onClick={() => {
						setSelectedStudentSubject(record.id);
						setShowStudentAttendanceModal(true);
					}}
					disabled={!record.attendanceEnabled}
				>
					Mark Attendance
				</Button>
			),
		},
	];

	// Student attendance columns
	const studentAttendanceColumns: ColumnsType<Attendance> = [
		{
			title: 'Date',
			dataIndex: 'date',
			key: 'date',
			width: 120,
			render: (date) => dayjs(date).format('YYYY-MM-DD'),
		},
		{
			title: 'Status',
			key: 'status',
			width: 100,
			render: (_, record) => {
				const color =
					record.status === 'present' ? 'green' : record.status === 'late' ? 'orange' : 'red';
				return <Tag color={color}>{record.status.toUpperCase()}</Tag>;
			},
		},
		{
			title: 'Subject',
			key: 'subject',
			width: 150,
			render: (_, record) => record.subject?.name || 'N/A',
		},
	];

	// Attendance taking columns
	const attendanceColumns: ColumnsType<StudentEnrollment> = [
		{
			title: 'Student Name',
			dataIndex: ['student', 'name'],
			key: 'name',
		},
		{
			title: 'Student ID',
			dataIndex: ['student', 'studentId'],
			key: 'studentId',
		},
		{
			title: 'Attendance',
			key: 'attendance',
			render: (_, record) => (
				<Select
					value={attendanceStatus[record.student.id] || 'absent'}
					onChange={(value) => handleAttendanceChange(record.student.id, value)}
					style={{ width: 120 }}
				>
					<Select.Option value='present'>Present</Select.Option>
					<Select.Option value='absent'>Absent</Select.Option>
				</Select>
			),
		},
	];

	if (!isTeacher && !isStudent) {
		return (
			<Container>
				<Card>
					<Title level={3}>Access Denied</Title>
					<Text>Only teachers and students can access attendance features.</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container>
			<MainCard>
				<Header>
					<Title>Attendance Management</Title>
				</Header>

				<Tabs defaultActiveKey={isTeacher ? 'teacher' : 'student'}>
					{isTeacher && (
						<TabPane tab='Teacher View' key='teacher'>
							<Row gutter={[24, 24]}>
								<Col span={24}>
									<Card
										title='My Subjects'
										loading={teacherSubjectsLoading}
										extra={
											<Button
												type='primary'
												icon={<DownloadOutlined />}
												onClick={() => {
													if (teacherSubjects.length === 0) {
														message.error('No subjects to export');
														return;
													}

													const exportData = teacherSubjects.map((subject) => ({
														'Subject Code': subject.code,
														'Subject Name': subject.name,
														Department: subject.department || 'N/A',
														'Students Enrolled': subject.studentEnrollments?.length || 0,
														'Attendance Enabled': isAttendanceEnabled[subject.id] ? 'Yes' : 'No',
													}));

													const fileName = `my_subjects_${dayjs().format('YYYY-MM-DD')}.csv`;
													exportToCSV(exportData, fileName);
													message.success('Subjects data exported successfully');
												}}
												disabled={teacherSubjects.length === 0}
											>
												Export Subjects
											</Button>
										}
									>
										<Table
											columns={teacherSubjectColumns}
											dataSource={teacherSubjects}
											rowKey='id'
											pagination={false}
											bordered
											scroll={{ x: 1000 }}
											size='middle'
										/>
									</Card>
								</Col>
								<Col span={24}>
									{selectedSubject && (
										<Card title='Take Attendance'>
											<Form form={form} layout='vertical'>
												<Form.Item label='Subject' name='subject' initialValue={selectedSubject}>
													<p style={{ display: 'none' }}>{selectedSubject}</p>
													<Select value={selectedSubject} onChange={setSelectedSubject} disabled>
														{teacherSubjects.map((subject) => (
															<Select.Option key={subject.id} value={subject.id}>
																{subject.code} - {subject.name}
															</Select.Option>
														))}
													</Select>
												</Form.Item>

												<Form.Item label='Date' name='date' initialValue={selectedDate}>
													<DatePicker
														value={selectedDate}
														onChange={(date) => setSelectedDate(date || dayjs())}
														style={{ width: '100%' }}
														disabledDate={(current) => current && current > dayjs().endOf('day')}
														format='YYYY-MM-DD'
													/>
												</Form.Item>

												{enrolledStudents.length > 0 && (
													<>
														<Divider />
														<Text strong>
															Mark Attendance for {enrolledStudents.length} students:
														</Text>
														<Table
															columns={attendanceColumns}
															dataSource={enrolledStudents}
															rowKey='id'
															pagination={false}
															size='small'
															scroll={{ x: 1000 }}
															style={{ marginTop: 16 }}
														/>

														<Button
															type='primary'
															onClick={handleSubmitAttendance}
															loading={submitAttendanceMutation.isLoading}
															block
															style={{ marginTop: 16 }}
														>
															Submit Attendance
														</Button>
													</>
												)}
											</Form>
										</Card>
									)}
								</Col>
							</Row>
						</TabPane>
					)}

					{isStudent && (
						<TabPane tab='Student View' key='student'>
							<Row gutter={24}>
								<Col span={16}>
									<Card
										title='My Enrolled Subjects'
										loading={studentSubjectsLoading}
										extra={
											<Button
												type='primary'
												icon={<DownloadOutlined />}
												onClick={() => {
													if (studentSubjects.length === 0) {
														message.error('No subjects to export');
														return;
													}

													const exportData = studentSubjects.map((subject: any) => ({
														'Subject Code':
															(subject as any).code || (subject as any).subject?.code || 'N/A',
														'Subject Name':
															(subject as any).name || (subject as any).subject?.name || 'N/A',
														'Attendance Enabled': (subject as any).attendanceEnabled ? 'Yes' : 'No',
													}));

													const fileName = `my_enrolled_subjects_${dayjs().format(
														'YYYY-MM-DD'
													)}.csv`;
													exportToCSV(exportData, fileName);
													message.success('Enrolled subjects data exported successfully');
												}}
												disabled={studentSubjects.length === 0}
											>
												Export Subjects
											</Button>
										}
									>
										<Table
											columns={studentSubjectColumns}
											dataSource={studentSubjects as unknown as Subject[]}
											rowKey='id'
											pagination={false}
											bordered
											size='middle'
											scroll={{ x: 1000 }}
										/>
									</Card>
								</Col>
								<Col span={8}>
									<Card title='Attendance Overview' loading={studentAttendanceLoading}>
										{(() => {
											const stats = calculateAttendanceStats();
											return (
												<>
													<Row gutter={16} style={{ marginBottom: 16 }}>
														<Col span={12}>
															<Statistic
																title='Total Days'
																value={stats.total}
																prefix={<CalendarOutlined />}
															/>
														</Col>
														<Col span={12}>
															<Statistic
																title='Present'
																value={stats.present}
																valueStyle={{ color: '#3f8600' }}
																prefix={<UserOutlined />}
															/>
														</Col>
													</Row>
													<Row gutter={16} style={{ marginBottom: 16 }}>
														<Col span={12}>
															<Statistic
																title='Absent'
																value={stats.absent}
																valueStyle={{ color: '#cf1322' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic
																title='Late'
																value={stats.late}
																valueStyle={{ color: '#fa8c16' }}
															/>
														</Col>
													</Row>
													<Divider />
													<Text strong>Attendance Rate</Text>
													<Progress
														percent={stats.percentage}
														status={
															stats.percentage >= 80
																? 'success'
																: stats.percentage >= 60
																? 'normal'
																: 'exception'
														}
														style={{ marginTop: 8 }}
													/>
												</>
											);
										})()}
									</Card>
								</Col>
							</Row>

							<Card
								title={`My Attendance Records (${filteredStudentAttendance.length} records)`}
								loading={studentAttendanceLoading}
								style={{ marginTop: 24 }}
								extra={
									<Space>
										<Button
											type='primary'
											icon={<DownloadOutlined />}
											onClick={handleExportStudentAttendance}
											disabled={
												!filteredStudentAttendance || filteredStudentAttendance.length === 0
											}
										>
											Export CSV
										</Button>
										<RangePicker
											value={dateRange}
											onChange={(dates) => {
												if (dates && dates[0] && dates[1]) {
													setDateRange([dates[0], dates[1]]);
												}
											}}
											format='YYYY-MM-DD'
										/>
									</Space>
								}
							>
								{/* Debug info */}
								{process.env.NODE_ENV === 'development' && (
									<div
										style={{ marginBottom: 16, padding: 8, background: '#f0f0f0', borderRadius: 4 }}
									>
										<Text strong>Debug Info:</Text>
										<br />
										Total records: {studentAttendance.length}
										<br />
										Filtered records: {filteredStudentAttendance.length}
										<br />
										Current user ID: {currentUser?.id}
										<br />
										Student subjects count: {studentSubjects.length}
									</div>
								)}
								<Table
									columns={studentAttendanceColumns}
									dataSource={filteredStudentAttendance}
									rowKey='id'
									pagination={{
										pageSize: 10,
										showSizeChanger: true,
										showQuickJumper: true,
									}}
									scroll={{ x: 1000 }}
									bordered
									size='middle'
								/>
							</Card>
						</TabPane>
					)}
				</Tabs>
			</MainCard>

			{/* Subject Details Modal */}
			<Modal
				title={`Subject Details: ${showSubjectDetails?.name}`}
				open={!!showSubjectDetails}
				onCancel={() => setShowSubjectDetails(null)}
				footer={null}
				width={600}
			>
				{showSubjectDetails && (
					<>
						<Descriptions bordered column={2}>
							<Descriptions.Item label='Code'>{showSubjectDetails.code}</Descriptions.Item>
							<Descriptions.Item label='Name'>{showSubjectDetails.name}</Descriptions.Item>
							<Descriptions.Item label='Students Enrolled'>
								{showSubjectDetails.studentEnrollments?.length || 0}
							</Descriptions.Item>
							<Descriptions.Item label='Department'>
								{showSubjectDetails.department}
							</Descriptions.Item>
						</Descriptions>

						<Divider />

						<Title level={5}>Enrolled Students</Title>
						{showSubjectDetails.studentEnrollments?.map((enrollment: StudentEnrollment) => (
							<Card key={enrollment.id} size='small' style={{ marginBottom: 8 }}>
								<Text strong>{enrollment.student.name}</Text>
								<br />
								<Text type='secondary'>ID: {enrollment.studentId}</Text>
								<br />
								<Text type='secondary'>{enrollment.student.email}</Text>
							</Card>
						))}
					</>
				)}
			</Modal>

			{/* Student Attendance Modal */}
			<Modal
				title='Mark Your Attendance'
				open={showStudentAttendanceModal}
				onCancel={() => setShowStudentAttendanceModal(false)}
				footer={[
					<Button key='cancel' onClick={() => setShowStudentAttendanceModal(false)}>
						Cancel
					</Button>,
					<Button
						key='submit'
						type='primary'
						loading={studentAttendanceMutation.isLoading}
						onClick={handleStudentAttendance}
					>
						Mark Attendance
					</Button>,
				]}
				width={500}
			>
				<Form layout='vertical'>
					<Form.Item label='Subject'>
						<Select
							value={selectedStudentSubject}
							onChange={setSelectedStudentSubject}
							placeholder='Select a subject'
						>
							{studentSubjects
								.filter((subject) => (subject as any).attendanceEnabled)
								.map((subject) => (
									<Select.Option key={subject.id} value={(subject as any).subjectId || subject.id}>
										{(subject as any).code || (subject as any).subject?.code} -{' '}
										{(subject as any).name || (subject as any).subject?.name}
									</Select.Option>
								))}
						</Select>
					</Form.Item>

					<Form.Item label='Date'>
						<DatePicker value={dayjs()} disabled style={{ width: '100%' }} format='YYYY-MM-DD' />
						<Text type='secondary'>{`Today's date`}</Text>
					</Form.Item>

					<Form.Item label='Status'>
						<Select
							value={studentAttendanceStatus}
							onChange={setStudentAttendanceStatus}
							style={{ width: '100%' }}
						>
							<Select.Option value='present'>Present</Select.Option>
							<Select.Option value='absent'>Absent</Select.Option>
							<Select.Option value='late'>Late</Select.Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			{/* Teacher Subject Attendance Modal */}
			<Modal
				title={`Subject Attendance Overview - ${
					teacherSubjects.find((s) => s.id === selectedSubjectForAttendance)?.name || 'Subject'
				}`}
				open={showTeacherStudentAttendance}
				onCancel={() => setShowTeacherStudentAttendance(false)}
				footer={[
					<Button key='close' onClick={() => setShowTeacherStudentAttendance(false)}>
						Close
					</Button>,
				]}
				width={1000}
			>
				{selectedSubjectForAttendance && (
					<>
						<Form.Item label='Date Range'>
							<RangePicker
								value={teacherSubjectDateRange}
								onChange={(dates) => {
									if (dates && dates[0] && dates[1]) {
										setTeacherSubjectDateRange([dates[0], dates[1]]);
									}
								}}
								format='YYYY-MM-DD'
								style={{ width: '100%' }}
							/>
						</Form.Item>

						<Divider />

						<Card
							title={`All Students' Attendance Records`}
							extra={
								<Button
									type='primary'
									icon={<DownloadOutlined />}
									onClick={handleExportAttendance}
									disabled={!teacherSubjectAttendance || teacherSubjectAttendance.length === 0}
								>
									Export CSV
								</Button>
							}
						>
							<Table
								columns={[
									{
										title: 'Student Name',
										key: 'studentName',
										width: 150,
										render: (_, record) => record.student?.name || 'N/A',
									},
									{
										title: 'Student ID',
										key: 'studentId',
										width: 120,
										render: (_, record) => record.student?.studentId || 'N/A',
									},
									{
										title: 'Date',
										dataIndex: 'date',
										key: 'date',
										width: 120,
										render: (date) => dayjs(date).format('YYYY-MM-DD'),
									},
									{
										title: 'Status',
										key: 'status',
										width: 150,
										render: (_, record) => {
											if (editingAttendance === record.id) {
												return (
													<Select
														value={editingStatus}
														onChange={setEditingStatus}
														style={{ width: 100 }}
													>
														<Select.Option value='present'>Present</Select.Option>
														<Select.Option value='absent'>Absent</Select.Option>
														<Select.Option value='late'>Late</Select.Option>
													</Select>
												);
											}
											const color =
												record.status === 'present'
													? 'green'
													: record.status === 'late'
													? 'orange'
													: 'red';
											return <Tag color={color}>{record.status.toUpperCase()}</Tag>;
										},
									},
									{
										title: 'Email',
										key: 'email',
										width: 200,
										render: (_, record) => record.student?.email || 'N/A',
									},
									{
										title: 'Actions',
										key: 'actions',
										width: 180,
										render: (_, record) => {
											if (editingAttendance === record.id) {
												return (
													<Space>
														<Button
															type='primary'
															size='small'
															onClick={() => handleSaveAttendance(record.id)}
															loading={updateAttendanceMutation.isLoading}
														>
															Save
														</Button>
														<Button size='small' onClick={handleCancelEdit}>
															Cancel
														</Button>
													</Space>
												);
											}
											return (
												<Space>
													<Button
														type='link'
														size='small'
														onClick={() => handleEditAttendance(record.id, record.status)}
													>
														Edit
													</Button>
													<Button
														type='link'
														size='small'
														danger
														onClick={() => handleDeleteAttendance(record.id)}
													>
														Delete
													</Button>
												</Space>
											);
										},
									},
								]}
								dataSource={teacherSubjectAttendance}
								rowKey='id'
								pagination={{
									pageSize: 15,
									showSizeChanger: true,
									showQuickJumper: true,
								}}
								loading={teacherSubjectAttendanceLoading}
								bordered
								size='middle'
							/>
						</Card>
					</>
				)}
			</Modal>

			{/* Delete Attendance Confirmation Modal */}
			<Modal
				title='Delete Attendance Record'
				open={!!deletingAttendance}
				onCancel={() => setDeletingAttendance(null)}
				footer={[
					<Button key='cancel' onClick={() => setDeletingAttendance(null)}>
						Cancel
					</Button>,
					<Button
						key='delete'
						type='primary'
						danger
						loading={deleteAttendanceMutation.isLoading}
						onClick={confirmDeleteAttendance}
					>
						Delete
					</Button>,
				]}
				width={400}
			>
				<Text>
					Are you sure you want to delete this attendance record? This action cannot be undone.
				</Text>
			</Modal>
		</Container>
	);
};

export default Attendance;

const Container = styled.div`
	padding: 32px;
`;

const MainCard = styled(Card)``;

const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24px;
`;
