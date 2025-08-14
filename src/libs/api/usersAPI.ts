/* eslint-disable @typescript-eslint/ban-types */
import config from '~/config';
import { authService } from '../auth';
import { Common } from './common';
import { HttpAuthService } from './httpService';

class UsersAPI extends Common {
	constructor(private http: HttpAuthService) {
		super(config.itemsPerPage);
	}

	profile() {
		return this.http.get<ProfileResponse>('users/me/');
	}

	updateEmail(email: string) {
		return this.http.put<ProfileResponse>('users/email/', { email });
	}

	updatePassword(currentPassword: string, newPassword: string) {
		return this.http.put<{ message: string }>('users/password/', { currentPassword, newPassword });
	}

	getAllUsers() {
		return this.http.get<User[]>('users/');
	}

	logout() {
		return this.http.post<{ detail: string }>('token/logout/', {});
	}

	// Student APIs
	getAll = () => {
		return this.http.get<Student[]>('students');
	};

	getById = (id: string) => {
		return this.http.get<Student>(`users/${id}`);
	};

	create = (data: Partial<Student>) => {
		return this.http.post<Student>('users', data);
	};

	update = (id: string, data: Partial<Student>) => {
		return this.http.put<Student>(`users/${id}`, data);
	};

	delete = (id: string) => {
		return this.http.delete(`users/${id}`);
	};
}

const httpAuthService = new HttpAuthService(config.apiURL, authService);
export const usersAPI = new UsersAPI(httpAuthService);
