interface Permission {
	id: number;
	name: string;
	content_type_id?: number;
	codename: string;
}

interface PermissionsResponse {
	id: number;
	app_label: string;
	model: string;
	model_name: string;
	permissions: Permission[];
}

interface UserRole {
	id: number;
	name: string;
	permissions: number[];
	total_permission: number;
	total_user: number;
}

type UserRolePayload = Omit<UserRole, 'id' | 'total_permission' | 'total_user'>;
