import { Button, Form, Input, message, Select } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';

interface UserFormData {
	id?: number;
	name: string;
	email: string;
	studentId?: string;
	department?: string;
	semester?: string;
	role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

interface AddUserProps {
	initialValues?: UserFormData | null;
	onSuccess?: () => void;
}

const AddUser = ({ initialValues, onSuccess }: AddUserProps) => {
	const [form] = Form.useForm();
	const queryClient = useQueryClient();
	const [selectedRole, setSelectedRole] = useState<string>(initialValues?.role || 'STUDENT');

	useEffect(() => {
		if (initialValues) {
			setSelectedRole(initialValues.role);
		}
		return () => {
			form.resetFields();
		};
	}, [form, initialValues]);

	const handleSubmit = async (values: UserFormData) => {
		try {
			const token = localStorage.getItem('token');
			if (initialValues) {
				await axios.put(`http://localhost:5000/api/users/${initialValues.id}`, values, {
					headers: { Authorization: `Bearer ${token}` },
				});
				message.success('User updated successfully');
			} else {
				await axios.post('http://localhost:5000/api/users', values, {
					headers: { Authorization: `Bearer ${token}` },
				});
				message.success('User added successfully');
			}

			// Reset form fields
			form.resetFields();

			// Invalidate and refetch users data
			queryClient.invalidateQueries('users');

			// Call success callback (typically closes modal)
			onSuccess?.();
		} catch (error) {
			message.error(initialValues ? 'Failed to update user' : 'Failed to add user');
		}
	};

	const departments = [
		'Computer Science',
		'Electrical Engineering',
		'Mechanical Engineering',
		'Civil Engineering',
		'Business Administration',
	];

	const semesters = Array.from({ length: 8 }, (_, i) => `${i + 1}${getSuffix(i + 1)} Semester`);

	const roles = [
		{ label: 'Student', value: 'STUDENT' },
		{ label: 'Teacher', value: 'TEACHER' },
		{ label: 'Admin', value: 'ADMIN' },
	];

	return (
		<Form form={form} layout='vertical' onFinish={handleSubmit} initialValues={initialValues || {}}>
			<Form.Item
				label='User Name'
				name='name'
				rules={[{ required: true, message: 'Please enter user name' }]}
			>
				<Input placeholder='Enter user name' />
			</Form.Item>

			<Form.Item
				label='Email'
				name='email'
				rules={[
					{ type: 'email', message: 'Please enter a valid email' },
					{ required: true, message: 'Please enter email' },
				]}
			>
				<Input placeholder='Enter email address' />
			</Form.Item>

			<Form.Item
				label='Role'
				name='role'
				rules={[{ required: true, message: 'Please select a role' }]}
			>
				<Select placeholder='Select role' onChange={(value) => setSelectedRole(value)}>
					{roles.map((role) => (
						<Select.Option key={role.value} value={role.value}>
							{role.label}
						</Select.Option>
					))}
				</Select>
			</Form.Item>

			{selectedRole === 'STUDENT' && (
				<>
					<Form.Item
						label='Student ID'
						name='studentId'
						rules={[{ required: true, message: 'Please enter Student ID' }]}
					>
						<Input placeholder='Enter Student ID' />
					</Form.Item>

					<Form.Item
						label='Department'
						name='department'
						rules={[{ required: true, message: 'Please select department' }]}
					>
						<Select allowClear placeholder='Select department'>
							{departments.map((dept) => (
								<Select.Option key={dept} value={dept}>
									{dept}
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item
						label='Semester'
						name='semester'
						rules={[{ required: true, message: 'Please select semester' }]}
					>
						<Select allowClear placeholder='Select semester'>
							{semesters.map((sem) => (
								<Select.Option key={sem} value={sem}>
									{sem}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
				</>
			)}

			{selectedRole === 'TEACHER' && (
				<>
					<Form.Item
						label='Password'
						name='studentId'
						rules={[{ required: true, message: 'Please enter password' }]}
					>
						<Input placeholder='Enter password' />
					</Form.Item>
					<Form.Item
						label='Department'
						name='department'
						rules={[{ message: 'Please select department' }]}
					>
						<Select allowClear placeholder='Select department'>
							{departments.map((dept) => (
								<Select.Option key={dept} value={dept}>
									{dept}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
				</>
			)}

			<Form.Item>
				<Button type='primary' htmlType='submit'>
					{initialValues ? 'Update User' : 'Add User'}
				</Button>
			</Form.Item>
		</Form>
	);
};

// Helper function for semester ordinal suffixes
function getSuffix(num: number): string {
	if (num > 3 && num < 21) return 'th';
	switch (num % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

export default AddUser;
