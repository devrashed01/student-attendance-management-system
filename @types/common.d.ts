interface SectionLayoutHeader {
	isBack?: boolean;
	isCancel?: boolean;
	isCompany?: boolean;
	isLoading?: boolean;
	noMargin?: boolean;
	isBorderless?: boolean;
	title: string;
	backPath?: string;
	badgeText?: string;
	items: {
		to: string;
		title: translationKeys;
	}[];
}

interface LayoutProps extends SectionLayoutHeader {
	redirectTo: string;
	routes: {
		path: string;
		Component: React.FC;
	}[];
	permissions?: string | string[];
}

interface Attendance {
	id: string;
	studentId: string;
	subjectId: string;
	date: string;
	status: 'present' | 'absent' | 'late';
	createdAt: string;
	student: {
		id: string;
		name: string;
		email: string;
		studentId: string;
	};
	subject: {
		id: string;
		name: string;
		code: string;
		department: string;
	};
}
