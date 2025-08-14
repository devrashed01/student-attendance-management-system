import { Navigate, useLocation } from 'react-router-dom';
import { useStoreSelector } from '~/store';

interface ProtectedRouteProps {
	children: React.ReactNode;
	allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
	const { user: currentUser } = useStoreSelector((state) => state.auth);
	const location = useLocation();

	// If no user is logged in, redirect to signin
	if (!currentUser || (allowedRoles && !allowedRoles.includes(currentUser.role))) {
		return <Navigate to='/' state={{ from: location }} replace />;
	}

	return <>{children}</>;
};
