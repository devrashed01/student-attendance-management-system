export const fileDownloader = (data: Blob, fileName: string) => {
	const link = document.createElement('a');
	link.href = window.URL.createObjectURL(data);
	link.download = fileName;
	document.body.append(link);
	link.click();
	link.remove();
};

export const exportToCSV = (data: any[], fileName: string) => {
	// Convert data to CSV format
	const csvContent = convertToCSV(data);

	// Create blob and download
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	fileDownloader(blob, fileName);
};

const convertToCSV = (data: any[]): string => {
	if (data.length === 0) return '';

	// Get headers from first object
	const headers = Object.keys(data[0]);

	// Create CSV header row
	const csvRows = [headers.join(',')];

	// Add data rows
	for (const row of data) {
		const values = headers.map((header) => {
			const value = row[header];
			// Handle nested objects and arrays
			if (typeof value === 'object' && value !== null) {
				return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
			}
			// Handle strings with commas
			if (typeof value === 'string' && value.includes(',')) {
				return `"${value.replace(/"/g, '""')}"`;
			}
			return value || '';
		});
		csvRows.push(values.join(','));
	}

	return csvRows.join('\n');
};
