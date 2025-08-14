/* eslint-disable @typescript-eslint/no-explicit-any */

import { DefaultOptionType } from 'antd/lib/select';

export * from './date.helper';
export * from './url.helper';
export * from './validation.helper';

export const hexToRGB = (hex: string, alpha?: number) => {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);

	return alpha !== undefined ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
};

export const readableText = (text: string) => {
	const textWithoutDash = text.replace(/-|_/g, ' ');
	return textWithoutDash.charAt(0).toUpperCase() + textWithoutDash.slice(1);
};

export const groupBy = <T>(
	array: T[],
	predicate: (value: T, index: number, array: T[]) => string
) =>
	array.reduce((acc, value, index, array) => {
		(acc[predicate(value, index, array)] ||= []).push(value);
		return acc;
	}, {} as { [key: string]: T[] });

export const selectFilterBy = (input: string, option: DefaultOptionType | undefined) => {
	const { children, label } = option as unknown as { children: string; label: string };
	return (children || label).toLowerCase().indexOf(input.toLowerCase()) >= 0;
};
