const BOM = String.fromCharCode(0xfeff);

// Quotes a cell only when it has to; doubled quotes escape quotes inside it.
const cell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * Downloads `rows` as a CSV file. `columns` is [{ label, csv(row) }]. A BOM
 * leads the file so Excel reads ₹ and other non-ASCII text correctly.
 */
export const downloadCsv = (fileName, columns, rows) => {
  const lines = [
    columns.map((column) => cell(column.label)).join(','),
    ...rows.map((row) => columns.map((column) => cell(column.csv(row))).join(',')),
  ];
  const blob = new Blob([BOM, lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
