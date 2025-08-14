export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface RolePermissions {
	canViewDashboard: boolean;
	canManageAttendance: boolean;
	canManageUsers: boolean;
	canViewProfile: boolean;
	canModifyAdmins: boolean;
	canModifyTeachers: boolean;
	canModifyStudents: boolean;
}

export const getRolePermissions = (role: UserRole): RolePermissions => {
	switch (role) {
		case 'SUPER_ADMIN':
			return {
				canViewDashboard: true,
				canManageAttendance: true,
				canManageUsers: true,
				canViewProfile: true,
				canModifyAdmins: true,
				canModifyTeachers: true,
				canModifyStudents: true,
			};
		case 'ADMIN':
			return {
				canViewDashboard: true,
				canManageAttendance: true,
				canManageUsers: true,
				canViewProfile: true,
				canModifyAdmins: false,
				canModifyTeachers: true,
				canModifyStudents: true,
			};
		case 'TEACHER':
			return {
				canViewDashboard: true,
				canManageAttendance: true,
				canManageUsers: false,
				canViewProfile: true,
				canModifyAdmins: false,
				canModifyTeachers: false,
				canModifyStudents: false,
			};
		case 'STUDENT':
			return {
				canViewDashboard: true,
				canManageAttendance: false,
				canManageUsers: false,
				canViewProfile: true,
				canModifyAdmins: false,
				canModifyTeachers: false,
				canModifyStudents: false,
			};
		default:
			return {
				canViewDashboard: false,
				canManageAttendance: false,
				canManageUsers: false,
				canViewProfile: false,
				canModifyAdmins: false,
				canModifyTeachers: false,
				canModifyStudents: false,
			};
	}
};

export const hasPermission = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
	return requiredRoles.includes(userRole);
};

export const getRoleDisplayName = (role: UserRole): string => {
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

export const getRoleColor = (role: UserRole): string => {
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
