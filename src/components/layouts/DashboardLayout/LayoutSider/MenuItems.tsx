import { AuditOutlined, BookOutlined, HomeOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { Popover, type MenuProps } from 'antd';
import { useCallback } from 'react';
import { useAccessContext } from 'react-access-boundary';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';

import { translationKeys } from '~/config/translate/i18next';
import { usersAPI } from '~/libs/api';
import { PRIVATE_ROUTES } from '~/routes/paths';

type ITEM_GROUP = {
	type: 'group';
	label: translationKeys;
	permission?: string | string[];
};

type ITEM = {
	icon: JSX.Element;
	key: string;
	label: string;
	permission?: string | string[];
	children?: Omit<ITEM, 'icon' | 'children'>[];
};

const ITEMS: (ITEM | ITEM_GROUP)[] = [
	{
		icon: <HomeOutlined />,
		key: PRIVATE_ROUTES.DASHBOARD,
		label: 'Dashboard',
		permission: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'],
	},
	{
		label: 'Attendance',
		icon: <AuditOutlined />,
		key: PRIVATE_ROUTES.ATTENDANCE,
		permission: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'],
	},
	{
		label: 'Subject Management',
		icon: <BookOutlined />,
		key: PRIVATE_ROUTES.SUBJECTS,
		permission: ['SUPER_ADMIN', 'ADMIN'],
	},
	{
		label: 'User Management',
		icon: <UsergroupAddOutlined />,
		key: PRIVATE_ROUTES.USER_MANAGEMENT,
		permission: ['SUPER_ADMIN', 'ADMIN'],
	},
];

export const MenuItems = () => {
	const { t } = useTranslation();
	const { data } = useQuery('profile', () => usersAPI.profile());
	const { isAllowedTo } = useAccessContext();
	const isAllowedPermission = useCallback(
		(permission: string | string[]) => {
			if (Array.isArray(permission)) {
				for (const item of permission) {
					return isAllowedTo(item);
				}

				return false;
			}

			return isAllowedTo(permission);
		},
		[isAllowedTo]
	);

	const transform = (items: typeof ITEMS) =>
		items
			?.map((item) =>
				!item?.permission ||
				isAllowedPermission(item?.permission) ||
				(item.permission && data?.role && item.permission.includes(data?.role))
					? {
							...item,
							label: <> {item?.label}</>,
							...('children' in item
								? {
										children: item?.children
											? item.children
													?.map((child) =>
														!child.permission || isAllowedPermission(child?.permission)
															? {
																	...child,
																	label: (
																		<Popover content={t(child.label)}>{t(child.label)} </Popover>
																	),
															  }
															: undefined
													)
													?.filter((item) => item !== undefined)
											: undefined,
								  }
								: {}),
					  }
					: undefined
			)
			?.filter((item) => item !== undefined) as MenuProps['items'];

	return transform(ITEMS);
};
