import { CompressOutlined, ExpandOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Divider, Dropdown, MenuProps, Space, Switch } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { authService } from '~/libs/auth';
import { PRIVATE_ROUTES } from '~/routes/paths';
import { useStoreSelector } from '~/store';
import { appActions } from '~/store/actions';

export const HeaderUserNav = () => {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const { darkMode, compactMode } = useStoreSelector((state) => state.app);

	const handleLogout = () => {
		authService.removeTokens();
		window.location.href = '/';
	};

	const toggleDarkMode = useCallback(
		(checked: boolean) => dispatch(appActions.updateDarkMode(checked)),
		[dispatch]
	);

	const toggleCompactMode = useCallback(
		(checked: boolean) => dispatch(appActions.updateCompactMode(checked)),
		[dispatch]
	);

	const menuItems: MenuProps = useMemo(() => {
		return {
			items: [
				{
					key: 'profile',
					label: <Link to={PRIVATE_ROUTES.PROFILE}>{t('Your profile')}</Link>,
				},
				// {
				// 	key: 'change-password',
				// 	label: <Link to={`${PRIVATE_ROUTES.PROFILE}?type=password`}>{t('Change password')}</Link>,
				// },
				{
					key: 'divider',
					label: <Divider style={{ margin: 0 }} />,
				},
				{
					key: 'logout',
					label: <Button onClick={() => handleLogout()}>Logout</Button>,
				},
				{
					key: 'view-mode',
					label: (
						<Space>
							<Switch
								checkedChildren={<ExpandOutlined />}
								unCheckedChildren={<CompressOutlined />}
								checked={compactMode}
								onChange={toggleCompactMode}
							/>
						</Space>
					),
				},
			],
			onClick: (info: MenuInfo) => {
				if (info?.key === 'sign-out') {
					handleLogout();
				}
			},
		};
	}, [handleLogout, t, darkMode, toggleDarkMode, toggleCompactMode, compactMode]);

	return (
		<Dropdown menu={menuItems} trigger={['click']} placement='bottomRight'>
			<a className='ant-dropdown-link' onClick={(e) => e.preventDefault()}>
				<Avatar size='large' icon={<UserOutlined />} />
			</a>
		</Dropdown>
	);
};
