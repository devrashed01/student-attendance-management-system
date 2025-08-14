/* eslint-disable @typescript-eslint/no-explicit-any */

export const validateEmptyString = (_: any, value: string) => {
	if (value && value.trim() === '') {
		return Promise.reject();
	}
	return Promise.resolve();
};
