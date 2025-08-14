import { lazy } from 'react';
import { PUBLIC_ROUTES } from './paths';

export const publicRoutes = [
	{
		path: PUBLIC_ROUTES.SIGNIN,
		Component: lazy(() => import('~/features/signin')),
	},
];
