/* eslint-disable @typescript-eslint/no-explicit-any */

import { Layout, Menu } from 'antd';
import { FC, HTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { MenuItems } from './MenuItems';

type LayoutSiderProps = {
	collapsed?: boolean;
} & HTMLAttributes<HTMLDivElement>;

const MenuWrapper = styled.div`
	max-height: calc(100vh - 130px);
	overflow: hidden;
	overflow-y: auto;
	::-webkit-scrollbar {
		width: 0.4rem;
	}
	::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: ${(props) => props.theme.colorPrimaryBgHover};
	}
	.ant-menu-item,
	.ant-menu-submenu {
		svg {
			opacity: 0.75;
		}
	}
`;

export const LayoutSider: FC<LayoutSiderProps> = (props) => {
	const location = useLocation();
	const navigate = useNavigate();
	const menuRef = useRef(null);
	const [openKeys, setOpenKeys] = useState<string[]>([]);

	const selectedKeys = useMemo(() => {
		const paths = location.pathname.split('/')?.filter((item) => item !== 'dashboard');
		return paths?.length > 1 ? paths?.filter((path) => path !== '') : paths;
	}, [location.pathname]);

	const getOpenedKey = useCallback(() => {
		const paths = location.pathname.split('/')?.filter((item) => item !== 'dashboard');
		return paths?.length > 1 ? paths?.filter((path) => path !== '').shift() : paths.shift();
	}, [location.pathname]);

	const handleMenuClick = ({ keyPath }: any) => navigate(`${keyPath?.reverse().join('/')}`);

	const handleOpenChange = (keys: any) =>
		setOpenKeys((current) => (current.at(-1) === keys?.at(-1) ? [] : [keys.at(-1)]));

	useEffect(() => {
		setOpenKeys([getOpenedKey() ?? '']);
	}, [getOpenedKey]);

	return (
		<Layout.Sider {...props} theme={'light'} width={232}>
			<Brand>
				<svg
					width='50'
					height='50'
					viewBox='0 0 64 64'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
				>
					<rect width='64' height='64' rx='10' fill='#4F46E5' />
					<circle cx='32' cy='20' r='10' fill='#fff' />
					<path d='M16 48c0-8.837 7.163-16 16-16s16 7.163 16 16v4H16v-4z' fill='#fff' />
					<path d='M46 14h6v2h-6v-2zm0 6h6v2h-6v-2zm0 6h6v2h-6v-2z' fill='#c7d2fe' />
					<circle cx='48' cy='48' r='10' fill='#22C55E' />
					<path
						d='M45.5 48.5l2 2 5-5'
						stroke='#fff'
						strokeWidth='2'
						strokeLinecap='round'
						strokeLinejoin='round'
					/>
					<text
						x='32'
						y='62'
						fontFamily='Arial, sans-serif'
						fontSize='5'
						fill='#fff'
						textAnchor='middle'
					>
						Attendify
					</text>
				</svg>
			</Brand>

			<MenuWrapper>
				<Menu
					mode='inline'
					defaultSelectedKeys={selectedKeys}
					openKeys={openKeys}
					onClick={handleMenuClick}
					onOpenChange={handleOpenChange}
					items={MenuItems()}
					ref={menuRef}
				/>
			</MenuWrapper>
		</Layout.Sider>
	);
};

const Brand = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 64px;
	svg {
		width: 50px;
		height: 50px;
	}
`;
