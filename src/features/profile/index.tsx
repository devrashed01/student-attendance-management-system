import { IdcardOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import {
	Avatar,
	Button,
	Card,
	Col,
	Descriptions,
	Divider,
	Form,
	Input,
	Modal,
	Row,
	Space,
	Tag,
	Typography,
	message,
} from 'antd';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { ChangePasswordModal } from '~/components/ChangePasswordModal';
import { usersAPI } from '~/libs/api/usersAPI';
import { useStoreSelector } from '~/store';

const { Title, Text } = Typography;

const Profile = () => {
	const { user: currentUser } = useStoreSelector((state) => state.auth);
	const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
	const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
	const [emailForm] = Form.useForm();
	const queryClient = useQueryClient();

	const { data: profileData, isLoading } = useQuery('profile', () => usersAPI.profile(), {
		enabled: !!currentUser,
	});

	// Email update mutation
	const emailMutation = useMutation({
		mutationFn: (email: string) => usersAPI.updateEmail(email),
		onSuccess: () => {
			message.success('Email updated successfully');
			setIsEmailModalVisible(false);
			emailForm.resetFields();
			queryClient.invalidateQueries('profile');
		},
		onError: (error) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update email';
			message.error(errorMessage);
		},
	});

	const user = profileData || currentUser;

	if (isLoading) {
		return (
			<Card>
				<div style={{ textAlign: 'center', padding: '40px' }}>
					<Text>Loading profile...</Text>
				</div>
			</Card>
		);
	}

	if (!user) {
		return (
			<Card>
				<div style={{ textAlign: 'center', padding: '40px' }}>
					<Text>No profile data available</Text>
				</div>
			</Card>
		);
	}

	const getRoleColor = (role: string) => {
		switch (role) {
			case 'SUPER_ADMIN':
				return 'red';
			case 'ADMIN':
				return 'orange';
			case 'TEACHER':
				return 'blue';
			case 'STUDENT':
				return 'green';
			default:
				return 'default';
		}
	};

	const getRoleLabel = (role: string) => {
		switch (role) {
			case 'SUPER_ADMIN':
				return 'Super Administrator';
			case 'ADMIN':
				return 'Administrator';
			case 'TEACHER':
				return 'Teacher';
			case 'STUDENT':
				return 'Student';
			default:
				return role;
		}
	};

	const fullName = user.name || 'No name provided';

	// Handle email change
	const handleEmailChange = (values: { email: string }) => {
		emailMutation.mutate(values.email);
	};

	// Handle password modal close
	const handlePasswordModalClose = () => {
		setIsPasswordModalVisible(false);
	};

	return (
		<div style={{ padding: '24px' }}>
			<Row gutter={[24, 24]}>
				{/* Profile Header Card */}
				<Col xs={24} lg={8}>
					<Card style={{ textAlign: 'center', height: 'fit-content' }}>
						<Space direction='vertical' size='large' style={{ width: '100%' }}>
							<Avatar
								size={120}
								icon={<UserOutlined />}
								style={{
									backgroundColor: '#1890ff',
									fontSize: '48px',
								}}
							/>
							<div>
								<Title level={3} style={{ margin: 0 }}>
									{fullName}
								</Title>
								<Tag
									color={getRoleColor(user.role)}
									style={{ fontSize: '14px', padding: '4px 12px', marginTop: '8px' }}
								>
									{getRoleLabel(user.role)}
								</Tag>
							</div>
						</Space>
					</Card>
				</Col>

				{/* Profile Details Card */}
				<Col xs={24} lg={16}>
					<Card title='Profile Information' style={{ height: 'fit-content' }}>
						<Descriptions
							column={{ xs: 1, sm: 2 }}
							size='middle'
							labelStyle={{ fontWeight: 'bold' }}
						>
							<Descriptions.Item
								label={
									<Space>
										<UserOutlined />
										<Text>Full Name</Text>
									</Space>
								}
							>
								{fullName}
							</Descriptions.Item>

							<Descriptions.Item
								label={
									<Space>
										<MailOutlined />
										<Text>Email</Text>
									</Space>
								}
							>
								{user.email || 'Not provided'}
							</Descriptions.Item>

							<Descriptions.Item
								label={
									<Space>
										<UserOutlined />
										<Text>Username</Text>
									</Space>
								}
							>
								{user.username}
							</Descriptions.Item>
						</Descriptions>

						<Divider />

						{/* Additional Information */}
						<div>
							<Title level={5}>Account Details</Title>
							<Row gutter={[16, 16]}>
								<Col xs={24} sm={12}>
									<Card size='small' style={{ backgroundColor: '#fafafa' }}>
										<Text strong>User ID</Text>
										<br />
										<Text type='secondary'>{user.id}</Text>
									</Card>
								</Col>
								<Col xs={24} sm={12}>
									<Card size='small' style={{ backgroundColor: '#fafafa' }}>
										<Text strong>Account Status</Text>
										<br />
										<Tag color='green'>Active</Tag>
									</Card>
								</Col>
							</Row>
						</div>
					</Card>
				</Col>
			</Row>

			{/* Quick Actions Card */}
			<Row style={{ marginTop: '24px' }}>
				<Col span={24}>
					<Card title='Quick Actions'>
						<Space wrap>
							<Button
								icon={<MailOutlined />}
								onClick={() => {
									setIsEmailModalVisible(true);
									emailForm.setFieldsValue({ email: user.email });
								}}
							>
								Change Email
							</Button>
							<Button icon={<IdcardOutlined />} onClick={() => setIsPasswordModalVisible(true)}>
								Change Password
							</Button>
						</Space>
					</Card>
				</Col>
			</Row>

			{/* Change Email Modal */}
			<Modal
				title='Change Email'
				open={isEmailModalVisible}
				onCancel={() => {
					setIsEmailModalVisible(false);
					emailForm.resetFields();
				}}
				footer={null}
			>
				<Form
					form={emailForm}
					layout='vertical'
					onFinish={handleEmailChange}
					initialValues={{ email: user.email }}
				>
					<Form.Item
						label='New Email'
						name='email'
						rules={[
							{ required: true, message: 'Please enter your new email' },
							{ type: 'email', message: 'Please enter a valid email address' },
						]}
					>
						<Input placeholder='Enter new email address' />
					</Form.Item>

					<Form.Item>
						<Space>
							<Button
								type='primary'
								htmlType='submit'
								loading={emailMutation.isLoading}
								disabled={emailMutation.isLoading}
							>
								Update Email
							</Button>
							<Button
								onClick={() => {
									setIsEmailModalVisible(false);
									emailForm.resetFields();
								}}
								disabled={emailMutation.isLoading}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Modal>

			{/* Change Password Modal */}
			<ChangePasswordModal open={isPasswordModalVisible} onCancel={handlePasswordModalClose} />
		</div>
	);
};

export default Profile;
