/**
 * @fileoverview CSV export utility
 * @description Pure functions to convert data arrays to CSV and trigger browser download.
 * No external dependencies.
 */

/**
 * Converts an array of objects to a CSV string.
 * Handles quoting of values that contain commas, quotes, or newlines.
 *
 * @param headers - Column headers as { key, label } pairs
 * @param rows - Array of data objects
 * @returns CSV string with BOM for Excel compatibility
 */
export function toCsv<T extends Record<string, unknown>>(
    headers: { key: keyof T; label: string }[],
    rows: T[],
): string {
    const escapeCell = (value: unknown): string => {
        const str = value == null ? '' : String(value);
        // Quote if contains comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const headerLine = headers.map(h => escapeCell(h.label)).join(',');
    const dataLines = rows.map(row =>
        headers.map(h => escapeCell(row[h.key])).join(','),
    );

    // BOM prefix for Excel UTF-8 compatibility
    return '\uFEFF' + [headerLine, ...dataLines].join('\n');
}

/**
 * Triggers a browser download of a CSV string.
 *
 * @param csv - The CSV content string
 * @param filename - Download filename (should end in .csv)
 */
export function downloadCsv(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
