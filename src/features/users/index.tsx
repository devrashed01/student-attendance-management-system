import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Modal, Space, Table, Tabs, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { useStoreSelector } from '~/store';
import AddStudent from '../attendance/AddUser';

interface User {
	id: string;
	name: string;
	email: string;
	studentId?: string;
	department?: string;
	semester?: string;
	role: 'STUDENT' | 'TEACHER' | 'ADMIN';
	_count: {
		attendance?: number;
	};
}

const UsersManagement: React.FC = () => {
	const queryClient = useQueryClient();
	const [isModalVisible, setIsModalVisible] = useState(false);
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const { user: currentUser } = useStoreSelector((state) => state.auth);

	// Set initial tab based on user permissions
	const getInitialTab = () => {
		if (currentUser?.role === 'SUPER_ADMIN') return 'STUDENT';
		if (currentUser?.role === 'ADMIN') return 'STUDENT';
		return 'STUDENT';
	};

	const [activeTab, setActiveTab] = useState<string>(getInitialTab());

	const { data: users = [], isLoading: loading } = useQuery('users', async () => {
		const token = localStorage.getItem('token');
		const response = await axios.get('http://localhost:5000/api/users', {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data;
	});

	const handleDelete = async (id: string) => {
		try {
			const token = localStorage.getItem('token');
			await axios.delete(`http://localhost:5000/api/users/${id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			message.success('User deleted successfully');
			queryClient.invalidateQueries('users');
			setEditingUser(null);
		} catch (error) {
			message.error('Failed to delete user');
		}
	};

	const handleEdit = (user: User) => {
		setEditingUser(user);
		setIsModalVisible(true);
	};

	const getColumns = (role: string): ColumnsType<User> => {
		const baseColumns: ColumnsType<User> = [
			{
				title: 'Name',
				dataIndex: 'name',
				key: 'name',
				sorter: (a, b) => a.name.localeCompare(b.name),
			},
			{
				title: 'Email',
				dataIndex: 'email',
				key: 'email',
			},
			{
				title: 'Role',
				dataIndex: 'role',
				key: 'role',
				render: (role) => <span style={{ textTransform: 'capitalize' }}>{role}</span>,
			},
			{
				title: 'Actions',
				key: 'actions',
				render: (_, record) => {
					// Check if current user can modify this specific user
					const canModifyThisUser =
						(canModifyUsers && record.role !== 'ADMIN') ||
						(canModifyAdmins && record.role === 'ADMIN');

					if (!canModifyThisUser) {
						return <span style={{ color: '#999' }}>No actions available</span>;
					}

					return (
						<Space>
							<Button type='primary' icon={<EditOutlined />} onClick={() => handleEdit(record)}>
								Edit
							</Button>
							<Button
								danger
								icon={<DeleteOutlined />}
								onClick={() => {
									Modal.confirm({
										title: 'Delete User',
										content: `Are you sure you want to delete ${record.name}?`,
										okText: 'Yes',
										okType: 'danger',
										cancelText: 'No',
										onOk: () => handleDelete(record.id),
									});
								}}
							>
								Delete
							</Button>
						</Space>
					);
				},
			},
		];

		// Add role-specific columns
		if (role === 'STUDENT') {
			baseColumns.splice(2, 0, {
				title: 'Username',
				dataIndex: 'username',
				key: 'username',
			});
			baseColumns.splice(3, 0, {
				title: 'Student ID',
				dataIndex: 'studentId',
				key: 'studentId',
			});
			baseColumns.splice(4, 0, {
				title: 'Attendances',
				dataIndex: '_count',
				key: 'attendance',
				render: (_, record) => <span>{record._count?.attendance || 0}</span>,
			});
			baseColumns.splice(5, 0, {
				title: 'Department',
				dataIndex: 'department',
				key: 'department',
				filters: Array.from(
					new Set(users.filter((u) => u.role === 'STUDENT').map((s) => s.department))
				).map((dept) => ({
					text: dept || 'N/A',
					value: dept || '',
				})),
				onFilter: (value, record) => record.department === value,
			});
			baseColumns.splice(6, 0, {
				title: 'Semester',
				dataIndex: 'semester',
				key: 'semester',
				sorter: (a, b) => (a.semester || '').localeCompare(b.semester || ''),
			});
		} else if (role === 'TEACHER') {
			baseColumns.splice(2, 0, {
				title: 'Department',
				dataIndex: 'department',
				key: 'department',
				filters: Array.from(
					new Set(users.filter((u) => u.role === 'TEACHER').map((s) => s.department))
				).map((dept) => ({
					text: dept || 'N/A',
					value: dept || '',
				})),
				onFilter: (value, record) => record.department === value,
			});
		}

		return baseColumns;
	};

	// Role-based access control
	const canViewAllTabs = currentUser?.role === 'SUPER_ADMIN';
	const canViewTeacherStudentTabs =
		currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
	const canModifyAdmins = currentUser?.role === 'SUPER_ADMIN';
	const canModifyUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

	// Filter users based on current user's permissions
	const filteredUsers = users.filter((user) => {
		// SUPER_ADMIN can see all users
		if (canViewAllTabs) return user.role === activeTab;

		// ADMIN can only see TEACHER and STUDENT tabs
		if (canViewTeacherStudentTabs && (activeTab === 'TEACHER' || activeTab === 'STUDENT')) {
			return user.role === activeTab;
		}

		return false;
	});

	// Filter out admins if current user is not SUPER_ADMIN
	const displayUsers = filteredUsers.filter((user) => {
		if (user.role === 'ADMIN' && !canModifyAdmins) {
			return false;
		}
		return true;
	});

	const tabItems = [
		{
			key: 'STUDENT',
			label: 'Students',
			children: (
				<Table
					columns={getColumns('STUDENT')}
					dataSource={displayUsers}
					rowKey='id'
					loading={loading}
					scroll={{ x: 1000 }}
					pagination={{
						pageSize: 10,
						showSizeChanger: true,
						showTotal: (total) => `Total ${total} students`,
					}}
				/>
			),
		},
		...(canViewTeacherStudentTabs
			? [
					{
						key: 'TEACHER',
						label: 'Teachers',
						children: (
							<Table
								columns={getColumns('TEACHER')}
								dataSource={displayUsers}
								rowKey='id'
								loading={loading}
								scroll={{ x: 1000 }}
								pagination={{
									pageSize: 10,
									showSizeChanger: true,
									showTotal: (total) => `Total ${total} teachers`,
								}}
							/>
						),
					},
			  ]
			: []),
		...(canViewAllTabs
			? [
					{
						key: 'ADMIN',
						label: 'Admins',
						children: (
							<Table
								columns={getColumns('ADMIN')}
								dataSource={displayUsers}
								rowKey='id'
								loading={loading}
								scroll={{ x: 1000 }}
								pagination={{
									pageSize: 10,
									showSizeChanger: true,
									showTotal: (total) => `Total ${total} admins`,
								}}
							/>
						),
					},
			  ]
			: []),
	];

	return (
		<Card
			title='User Management'
			extra={
				canModifyUsers && (
					<Button
						type='primary'
						icon={<PlusOutlined />}
						onClick={() => {
							setEditingUser(null);
							setIsModalVisible(true);
						}}
					>
						Add User
					</Button>
				)
			}
		>
			<Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

			<Modal
				title={editingUser ? 'Edit User' : 'Add User'}
				open={isModalVisible}
				onCancel={() => {
					setIsModalVisible(false);
					setEditingUser(null);
				}}
				footer={null}
			>
				<AddStudent
					initialValues={editingUser}
					onSuccess={() => {
						setIsModalVisible(false);
						setEditingUser(null);
						queryClient.invalidateQueries('users');
					}}
				/>
			</Modal>
		</Card>
	);
};

export default UsersManagement;
