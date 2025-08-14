import { BookOutlined, DeleteOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import {
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Form,
	Input,
	message,
	Modal,
	Popconfirm,
	Row,
	Select,
	Space,
	Table,
	Tag,
	Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import styled from 'styled-components';
import { subjectsAPI, usersAPI } from '~/libs/api';
import { useStoreSelector } from '~/store';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Subject {
	id: string;
	name: string;
	code: string;
	department: string;
	description?: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	teacherAssignments?: TeacherAssignment[];
	studentEnrollments?: StudentEnrollment[];
	_count?: {
		teacherAssignments: number;
		studentEnrollments: number;
	};
}

interface TeacherAssignment {
	id: string;
	teacherId: string;
	subjectId: string;
	assignedAt: string;
	teacher: {
		id: string;
		name: string;
		email: string;
	};
	subject: {
		id: string;
		name: string;
		code: string;
	};
}

interface StudentEnrollment {
	id: string;
	studentId: string;
	subjectId: string;
	enrolledAt: string;
	student: {
		id: string;
		name: string;
		email: string;
		studentId: string;
	};
	subject: {
		id: string;
		name: string;
		code: string;
	};
}

interface ApiUser {
	id: string;
	name: string;
	email: string;
	role: string;
	studentId?: string;
	department?: string;
}

const SubjectsManagement = () => {
	const [form] = Form.useForm();
	const [assignTeacherForm] = Form.useForm();
	const [enrollStudentForm] = Form.useForm();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [isAssignTeacherModalVisible, setIsAssignTeacherModalVisible] = useState(false);
	const [isEnrollStudentModalVisible, setIsEnrollStudentModalVisible] = useState(false);
	const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
	const [selectedSubjectForAssignment, setSelectedSubjectForAssignment] = useState<Subject | null>(
		null
	);
	const [selectedSubjectForEnrollment, setSelectedSubjectForEnrollment] = useState<Subject | null>(
		null
	);
	const queryClient = useQueryClient();
	const { user: currentUser } = useStoreSelector((state) => state.auth);

	// Check if user has permission to manage subjects
	const canManageSubjects = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

	// Fetch subjects
	const { data: subjects = [], isLoading: subjectsLoading } = useQuery(
		'subjects',
		subjectsAPI.getAllSubjects,
		{
			enabled: canManageSubjects,
		}
	);

	// Fetch teachers for assignment
	const { data: teachers = [], isLoading: teachersLoading } = useQuery(
		'teachers',
		async () => {
			const response = await usersAPI.getAllUsers();
			return response.filter((user: ApiUser) => user.role === 'TEACHER');
		},
		{
			enabled: canManageSubjects,
		}
	);

	// Fetch students for enrollment
	const { data: students = [], isLoading: studentsLoading } = useQuery(
		'students',
		async () => {
			const response = await usersAPI.getAllUsers();
			return response.filter((user: ApiUser) => user.role === 'STUDENT');
		},
		{
			enabled: canManageSubjects,
		}
	);

	// Create subject mutation
	const createSubjectMutation = useMutation({
		mutationFn: (values: {
			name: string;
			code: string;
			department: string;
			description?: string;
		}) => subjectsAPI.createSubject(values),
		onSuccess: () => {
			message.success('Subject created successfully');
			setIsModalVisible(false);
			form.resetFields();
			queryClient.invalidateQueries('subjects');
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
			message.error(errorMessage);
		},
	});

	// Assign teacher mutation
	const assignTeacherMutation = useMutation({
		mutationFn: ({ subjectId, teacherId }: { subjectId: string; teacherId: string }) =>
			subjectsAPI.assignTeacher(subjectId, { teacherId }),
		onSuccess: () => {
			message.success('Teacher assigned successfully');
			setIsAssignTeacherModalVisible(false);
			assignTeacherForm.resetFields();
			queryClient.invalidateQueries('subjects');
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to assign teacher';
			message.error(errorMessage);
		},
	});

	// Unassign teacher mutation
	const unassignTeacherMutation = useMutation({
		mutationFn: ({ subjectId, teacherId }: { subjectId: string; teacherId: string }) =>
			subjectsAPI.removeTeacher(subjectId, teacherId),
		onSuccess: () => {
			message.success('Teacher unassigned successfully');
			queryClient.invalidateQueries('subjects');
			if (isAssignTeacherModalVisible) {
				setIsAssignTeacherModalVisible(false);
				assignTeacherForm.resetFields();
			}
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to unassign teacher';
			message.error(errorMessage);
		},
	});

	// Enroll students mutation
	const enrollStudentsMutation = useMutation({
		mutationFn: ({ subjectId, studentIds }: { subjectId: string; studentIds: string[] }) =>
			subjectsAPI.enrollStudents(subjectId, { studentIds }),
		onSuccess: (data) => {
			message.success(`Successfully updated enrollments: ${data.count} students enrolled`);
			setIsEnrollStudentModalVisible(false);
			enrollStudentForm.resetFields();
			queryClient.invalidateQueries('subjects');
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to enroll students';
			message.error(errorMessage);
		},
	});

	// Remove student mutation
	const removeStudentMutation = useMutation({
		mutationFn: ({ subjectId, studentId }: { subjectId: string; studentId: string }) =>
			subjectsAPI.removeStudent(subjectId, studentId),
		onSuccess: () => {
			message.success('Student removed from subject successfully');
			queryClient.invalidateQueries('subjects');
		},
		onError: (error: unknown) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to remove student';
			message.error(errorMessage);
		},
	});

	const handleCreateSubject = (values: {
		name: string;
		code: string;
		department: string;
		description?: string;
	}) => {
		createSubjectMutation.mutate(values);
	};

	const handleAssignTeacher = (values: { teacherId: string }) => {
		if (selectedSubjectForAssignment) {
			assignTeacherMutation.mutate({
				subjectId: selectedSubjectForAssignment.id,
				teacherId: values.teacherId,
			});
		}
	};

	const handleEnrollStudents = (values: { studentIds: string[] }) => {
		if (selectedSubjectForEnrollment) {
			enrollStudentsMutation.mutate({
				subjectId: selectedSubjectForEnrollment.id,
				studentIds: values.studentIds,
			});
		}
	};

	const handleRemoveStudent = (subjectId: string, studentId: string) => {
		removeStudentMutation.mutate({ subjectId, studentId });
	};

	const showAssignTeacherModal = (subject: Subject) => {
		setSelectedSubjectForAssignment(subject);
		setIsAssignTeacherModalVisible(true);
		assignTeacherForm.resetFields();
		// Auto-fill the form with already assigned teacher if exists
		if (subject.teacherAssignments && subject.teacherAssignments.length > 0) {
			const assignedTeacher = subject.teacherAssignments[0].teacherId;
			assignTeacherForm.setFieldsValue({ teacherId: assignedTeacher });
		} else {
			assignTeacherForm.setFieldsValue({ teacherId: undefined });
		}
	};

	const showEnrollStudentModal = (subject: Subject) => {
		setSelectedSubjectForEnrollment(subject);
		setIsEnrollStudentModalVisible(true);

		// Auto-fill the form with already enrolled students
		if (subject.studentEnrollments && subject.studentEnrollments.length > 0) {
			const enrolledStudentIds = subject.studentEnrollments.map(
				(enrollment) => enrollment.studentId
			);
			enrollStudentForm.setFieldsValue({ studentIds: enrolledStudentIds });
		} else {
			enrollStudentForm.setFieldsValue({ studentIds: [] });
		}
	};

	const showSubjectDetails = (subject: Subject) => {
		setSelectedSubject(subject);
	};

	const columns: ColumnsType<Subject> = [
		{
			title: 'Code',
			dataIndex: 'code',
			key: 'code',
			width: 100,
		},
		{
			title: 'Name',
			dataIndex: 'name',
			key: 'name',
			width: 200,
		},
		{
			title: 'Department',
			dataIndex: 'department',
			key: 'department',
			width: 150,
		},
		{
			title: 'Teachers',
			key: 'teachers',
			width: 120,
			render: (_, record) => (
				<Tag color='blue'>{record._count?.teacherAssignments || 0} assigned</Tag>
			),
		},
		{
			title: 'Students',
			key: 'students',
			width: 120,
			render: (_, record) => (
				<Tag color='green'>{record._count?.studentEnrollments || 0} enrolled</Tag>
			),
		},
		{
			title: 'Status',
			dataIndex: 'isActive',
			key: 'status',
			width: 100,
			render: (isActive: boolean) => (
				<Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
			),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 200,
			render: (_, record) => (
				<Space>
					<Button
						type='link'
						size='small'
						onClick={() => showSubjectDetails(record)}
						icon={<BookOutlined />}
					>
						Details
					</Button>
					<Button
						type='link'
						size='small'
						onClick={() => showAssignTeacherModal(record)}
						icon={<UserAddOutlined />}
					>
						Assign Teacher
					</Button>
					<Button
						type='link'
						size='small'
						onClick={() => showEnrollStudentModal(record)}
						icon={<UserAddOutlined />}
					>
						Enroll Students
					</Button>
				</Space>
			),
		},
	];

	if (!canManageSubjects) {
		return (
			<Container>
				<Card>
					<Title level={3}>Access Denied</Title>
					<Text>You don&apos;t have permission to manage subjects.</Text>
				</Card>
			</Container>
		);
	}

	return (
		<Container>
			<MainCard>
				<Header>
					<Title>Subject Management</Title>
					<Button type='primary' icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
						Add Subject
					</Button>
				</Header>

				<Table
					columns={columns}
					dataSource={subjects}
					rowKey='id'
					loading={subjectsLoading}
					pagination={{
						pageSize: 10,
						showTotal: (total) => `Total ${total} subjects`,
					}}
					bordered
					size='middle'
				/>
			</MainCard>

			{/* Create Subject Modal */}
			<Modal
				title='Create New Subject'
				open={isModalVisible}
				onCancel={() => {
					setIsModalVisible(false);
					form.resetFields();
				}}
				footer={null}
				width={600}
			>
				<Form form={form} layout='vertical' onFinish={handleCreateSubject}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label='Subject Code'
								name='code'
								rules={[{ required: true, message: 'Please enter subject code' }]}
							>
								<Input placeholder='e.g., CS101' />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label='Department'
								name='department'
								rules={[{ required: true, message: 'Please enter department' }]}
							>
								<Input placeholder='e.g., Computer Science' />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item
						label='Subject Name'
						name='name'
						rules={[{ required: true, message: 'Please enter subject name' }]}
					>
						<Input placeholder='e.g., Introduction to Computer Science' />
					</Form.Item>
					<Form.Item label='Description' name='description'>
						<TextArea rows={3} placeholder='Enter subject description' />
					</Form.Item>
					<Form.Item>
						<Space>
							<Button type='primary' htmlType='submit' loading={createSubjectMutation.isLoading}>
								Create Subject
							</Button>
							<Button
								onClick={() => {
									setIsModalVisible(false);
									form.resetFields();
								}}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>

			{/* Assign Teacher Modal */}
			<Modal
				title={`Assign Teacher to ${selectedSubjectForAssignment?.name}`}
				open={isAssignTeacherModalVisible}
				onCancel={() => {
					setIsAssignTeacherModalVisible(false);
					assignTeacherForm.resetFields();
				}}
				footer={null}
				width={500}
			>
				<Form form={assignTeacherForm} layout='vertical' onFinish={handleAssignTeacher}>
					<Form.Item
						label='Select Teacher'
						name='teacherId'
						rules={[{ required: true, message: 'Please select a teacher' }]}
					>
						<Select
							placeholder='Select a teacher'
							loading={teachersLoading}
							showSearch
							optionFilterProp='children'
						>
							{teachers.map((teacher: ApiUser) => (
								<Select.Option key={teacher.id} value={teacher.id}>
									{teacher.name} ({teacher.email})
								</Select.Option>
							))}
						</Select>
					</Form.Item>
					<Form.Item>
						<Space>
							<Button type='primary' htmlType='submit' loading={assignTeacherMutation.isLoading}>
								Assign Teacher
							</Button>
							<Button
								onClick={() => {
									setIsAssignTeacherModalVisible(false);
									assignTeacherForm.resetFields();
								}}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>

			{/* Enroll Students Modal */}
			<Modal
				title={`Enroll Students in ${selectedSubjectForEnrollment?.name}`}
				open={isEnrollStudentModalVisible}
				onCancel={() => {
					setIsEnrollStudentModalVisible(false);
					enrollStudentForm.resetFields();
				}}
				footer={null}
				width={600}
			>
				<div
					style={{
						marginBottom: 16,
						padding: '8px 12px',
						backgroundColor: '#f6f8fa',
						borderRadius: 6,
						fontSize: 14,
					}}
				>
					<Text type='secondary'>
						💡 <strong>Note:</strong> This will replace all current enrollments with the selected
						students. Already enrolled students are pre-selected below.
					</Text>
				</div>
				<Form form={enrollStudentForm} layout='vertical' onFinish={handleEnrollStudents}>
					<Form.Item
						label='Select Students'
						name='studentIds'
						rules={[{ required: true, message: 'Please select at least one student' }]}
					>
						<Select
							mode='multiple'
							placeholder='Select students'
							loading={studentsLoading}
							showSearch
							optionFilterProp='children'
							style={{ width: '100%' }}
						>
							{students.map((student: ApiUser) => (
								<Select.Option key={student.id} value={student.id}>
									{student.name} ({student.studentId}) - {student.department}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
					<Form.Item>
						<Space>
							<Button type='primary' htmlType='submit' loading={enrollStudentsMutation.isLoading}>
								Enroll Students
							</Button>
							<Button
								onClick={() => {
									setIsEnrollStudentModalVisible(false);
									enrollStudentForm.resetFields();
								}}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>

			{/* Subject Details Modal */}
			<Modal
				title={`Subject Details: ${selectedSubject?.name}`}
				open={!!selectedSubject}
				onCancel={() => setSelectedSubject(null)}
				footer={null}
				width={800}
			>
				{selectedSubject && (
					<>
						<Descriptions bordered column={2}>
							<Descriptions.Item label='Code'>{selectedSubject.code}</Descriptions.Item>
							<Descriptions.Item label='Department'>{selectedSubject.department}</Descriptions.Item>
							<Descriptions.Item label='Status'>
								<Tag color={selectedSubject.isActive ? 'success' : 'default'}>
									{selectedSubject.isActive ? 'Active' : 'Inactive'}
								</Tag>
							</Descriptions.Item>
							<Descriptions.Item label='Created'>
								{new Date(selectedSubject.createdAt).toLocaleDateString()}
							</Descriptions.Item>
							<Descriptions.Item label='Description' span={2}>
								{selectedSubject.description || 'No description provided'}
							</Descriptions.Item>
						</Descriptions>

						<Divider />

						<Row gutter={16}>
							<Col span={12}>
								<Title level={5}>
									Assigned Teachers ({selectedSubject.teacherAssignments?.length || 0})
								</Title>
								{selectedSubject.teacherAssignments &&
								selectedSubject.teacherAssignments.length > 0 ? (
									selectedSubject.teacherAssignments.map((assignment) => (
										<Card key={assignment.id} size='small' style={{ marginBottom: 8 }}>
											<Space style={{ float: 'right' }}>
												<Popconfirm
													title='Are you sure you want to unassign this teacher?'
													onConfirm={() =>
														unassignTeacherMutation.mutate({
															subjectId: selectedSubject.id,
															teacherId: assignment.teacherId,
														})
													}
													okText='Yes'
													cancelText='No'
												>
													<Button type='link' danger size='small' icon={<DeleteOutlined />} />
												</Popconfirm>
											</Space>
											<Text strong>{assignment.teacher.name}</Text>
											<br />
											<Text type='secondary'>{assignment.teacher.email}</Text>
											<br />
											<Text type='secondary'>
												Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
											</Text>
										</Card>
									))
								) : (
									<Text type='secondary'>No teachers assigned</Text>
								)}
							</Col>
							<Col span={12}>
								<Title level={5}>
									Enrolled Students ({selectedSubject.studentEnrollments?.length || 0})
								</Title>
								{selectedSubject.studentEnrollments &&
								selectedSubject.studentEnrollments.length > 0 ? (
									selectedSubject.studentEnrollments.map((enrollment) => (
										<Card key={enrollment.id} size='small' style={{ marginBottom: 8 }}>
											<Space style={{ float: 'right' }}>
												<Popconfirm
													title='Are you sure you want to remove this student?'
													onConfirm={() =>
														handleRemoveStudent(selectedSubject.id, enrollment.studentId)
													}
													okText='Yes'
													cancelText='No'
												>
													<Button type='link' danger size='small' icon={<DeleteOutlined />} />
												</Popconfirm>
											</Space>
											<Text strong>{enrollment.student.name}</Text>
											<br />
											<Text type='secondary'>ID: {enrollment.student.studentId}</Text>
											<br />
											<Text type='secondary'>
												Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
											</Text>
										</Card>
									))
								) : (
									<Text type='secondary'>No students enrolled</Text>
								)}
							</Col>
						</Row>
					</>
				)}
			</Modal>
		</Container>
	);
};

export default SubjectsManagement;

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
