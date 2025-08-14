import { Button, Form, Input, Modal, Space, message } from 'antd';
import { useMutation } from 'react-query';
import { usersAPI } from '~/libs/api/usersAPI';

interface ChangePasswordModalProps {
	open: boolean;
	onCancel: () => void;
}

interface PasswordFormData {
	currentPassword: string;
	newPassword: string;
	confirmPassword: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ open, onCancel }) => {
	const [form] = Form.useForm();

	// Password update mutation
	const passwordMutation = useMutation({
		mutationFn: ({
			currentPassword,
			newPassword,
		}: {
			currentPassword: string;
			newPassword: string;
		}) => usersAPI.updatePassword(currentPassword, newPassword),
		onSuccess: () => {
			message.success('Password updated successfully');
			onCancel();
			form.resetFields();
		},
		onError: (error) => {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
			message.error(errorMessage);
		},
	});

	// Handle password change
	const handlePasswordChange = (values: PasswordFormData) => {
		if (values.newPassword !== values.confirmPassword) {
			message.error('New passwords do not match');
			return;
		}
		passwordMutation.mutate({
			currentPassword: values.currentPassword,
			newPassword: values.newPassword,
		});
	};

	const handleCancel = () => {
		form.resetFields();
		onCancel();
	};

	return (
		<Modal title='Change Password' open={open} onCancel={handleCancel} footer={null}>
			<Form form={form} layout='vertical' onFinish={handlePasswordChange}>
				<Form.Item
					label='Current Password'
					name='currentPassword'
					rules={[{ required: true, message: 'Please enter your current password' }]}
				>
					<Input.Password placeholder='Enter current password' />
				</Form.Item>

				<Form.Item
					label='New Password'
					name='newPassword'
					rules={[
						{ required: true, message: 'Please enter your new password' },
						{ min: 6, message: 'Password must be at least 6 characters' },
					]}
				>
					<Input.Password placeholder='Enter new password' />
				</Form.Item>

				<Form.Item
					label='Confirm New Password'
					name='confirmPassword'
					rules={[
						{ required: true, message: 'Please confirm your new password' },
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue('newPassword') === value) {
									return Promise.resolve();
								}
								return Promise.reject(new Error('Passwords do not match'));
							},
						}),
					]}
				>
					<Input.Password placeholder='Confirm new password' />
				</Form.Item>

				<Form.Item>
					<Space>
						<Button
							type='primary'
							htmlType='submit'
							loading={passwordMutation.isLoading}
							disabled={passwordMutation.isLoading}
						>
							Update Password
						</Button>
						<Button onClick={handleCancel} disabled={passwordMutation.isLoading}>
							Cancel
						</Button>
					</Space>
				</Form.Item>
			</Form>
		</Modal>
	);
};
