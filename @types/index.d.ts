interface DynamicType {
	[x: string]: string;
}

interface UpdateStausRequest {
	endpoint: string;
	id: number;
	recordType: string;
	payload: {
		[key: string]: boolean;
	};
}

interface UpdateStatusResponse extends DynamicType {
	id: number;
}

interface Pagination<T> {
	count: number;
	next?: string;
	previous?: string;
	results: T;
}

interface PaginateParams {
	page?: number;
	limit?: number;
	is_active?: boolean | string | undefined;
	is_available?: boolean | string | undefined;
	category?: string;
}

interface DEFAULT_LIST_PARAMS extends PaginateParams {
	is_active?: boolean;
}

interface DefaultResponse {
	detail: string;
}

interface BaseOptionType {
	disabled?: boolean;
	[name: string]: Record<string, unknown>;
}

interface SyncResponse {
	detail: string;
	response_list: string[];
}

type ParsedUrlQuery = {
	[key: string]: string | string[] | undefined;
};

type InitMonthType = Intl.DateTimeFormatOptions['month'];

type SearchObject = {
	[key: string]: string | number | undefined;
};

type Mode = 'create' | 'update';
