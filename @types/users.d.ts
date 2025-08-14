/* eslint-disable @typescript-eslint/no-explicit-any */
interface Permissions {
	codename: string;
	content_type_id: number;
	id: number;
	name: string;
}

interface Group {
	id: number;
	name: string;
}

interface ProfileResponse {
	id: string;
	username: string;
	role: string;
	name: string;
	email: string;
}

interface UserUpdatePayload {
	first_name: string;
	last_name: string;
	groups: number[];
	is_superuser: boolean;
	is_staff: boolean;
	is_passenger: boolean;
}

interface GroupsDetail {
	id: number;
	name: string;
}

interface User {
	id: string;
	username: string;
	role: string;
	name: string;
	email: string;
}

interface UserCreatePayload {
	first_name: string;
	last_name: string;
	email: string;
	groups: number[];
	is_superuser?: boolean;
	is_passenger?: boolean;
}

interface UsersPragmas extends PaginateParams {
	email?: string;
	name?: string;
	is_passenger?: string;
}
