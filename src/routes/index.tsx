import nProgress from 'nprogress';
import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { Spin } from 'antd';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { useStoreSelector } from '~/store';
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from './paths';
import { publicRoutes } from './publicRoutes';

const SignInLayout = lazy(() => import('~/components/layouts/SignInLayout'));
const DashboardLayout = lazy(() => import('~/components/layouts/DashboardLayout'));
const NotFound = lazy(() => import('~/features/not-found'));

export const BaseRoutes = () => {
	const { routeChange } = useStoreSelector((state) => state.app);

	useEffect(() => {
		if (routeChange === 'start') {
			nProgress.start();
		} else {
			nProgress.done();
		}
	}, [routeChange]);

	// Role-based route configuration
	const allRoutes = [
		{
			path: PRIVATE_ROUTES.DASHBOARD,
			Component: lazy(() => import('~/features/dashboard')),
			roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'], // All roles can access dashboard
		},
		{
			path: `${PRIVATE_ROUTES.ATTENDANCE}`,
			Component: lazy(() => import('~/features/attendance/attendance')),
			roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'], // All roles can access attendance (different views)
		},
		{
			path: `${PRIVATE_ROUTES.USER_MANAGEMENT}`,
			Component: lazy(() => import('~/features/users')),
			roles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can manage users
		},
		{
			path: `${PRIVATE_ROUTES.SUBJECTS}`,
			Component: lazy(() => import('~/features/subjects')),
			roles: ['SUPER_ADMIN', 'ADMIN'], // Only admins can manage subjects
		},
		{
			path: PRIVATE_ROUTES.PROFILE,
			Component: lazy(() => import('~/features/profile')),
			roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'], // All roles can access their profile
		},
	];

	return (
		<BrowserRouter>
			<Routes>
				<Route path='/' element={<SignInLayout />}>
					{publicRoutes.map(({ path, Component }, i) => (
						<Route
							key={i}
							path={path}
							index={path === PUBLIC_ROUTES.SIGNIN}
							element={
								<Suspense fallback={<Spin size='large' />}>
									<Component />
								</Suspense>
							}
						/>
					))}
				</Route>
				<Route path='dashboard' element={<DashboardLayout />}>
					{allRoutes.map(({ path, Component, roles }, i) => (
						<Route
							key={i}
							path={path}
							index={path === PRIVATE_ROUTES.DASHBOARD}
							element={
								<Suspense fallback={<Spin size='large' />}>
									<ProtectedRoute allowedRoles={roles}>
										<Component />
									</ProtectedRoute>
								</Suspense>
							}
						/>
					))}
				</Route>
				<Route path='*' element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
};
