import ExcelJS from 'exceljs';
import * as billData from '../data/bill.data.js';
import { ApiError } from '../utils/api-error.js';

// Excel export of verified bills, laid out like the client's own "Bill
// Analysis" workbook (its "August Master" sheet): one sheet per bill month,
// their column names in their order, Montserrat, bordered cells, totals in
// row 1 and the header frozen in row 2. Only fields the app captures are
// exported — their Meter Number, Unit Rate, Monthly Bill and Potential
// Savings columns are left out until bills carry those values.

const FONT = 'Montserrat';
// Indian digit grouping (12,34,567.00), as their workbook formats totals.
const INR_FORMAT = '[>9999999]##\\,##\\,##\\,##0.00;[>99999]##\\,##\\,##0.00;##,##0.00';
const THIN = { style: 'thin' };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };
const FIRST_COLUMN = 2; // their sheet leaves column A empty
const HEADER_ROW = 2;
const FIRST_DATA_ROW = 3;

/**
 * Their columns that the app fills, in their order. `total` puts a SUBTOTAL
 * over the column in row 1, as their sheet does: 3 counts, 9 sums.
 */
const COLUMNS = [
  { key: 'serial', header: 'Sr. No.', width: 8.75 },
  { key: 'link', header: 'Electricity Bill Link', width: 50, total: 3 },
  { key: 'discom', header: 'DISCOM', width: 20 },
  { key: 'consumerNumber', header: 'Consumer No.', width: 17, total: 3 },
  { key: 'sanctionedLoad', header: 'Sanctioned Load (kW)', width: 13.63 },
  { key: 'connectedLoad', header: 'Connected Load (kW)', width: 13 },
  { key: 'contractDemand', header: 'Contract Demand (kVA)', width: 13 },
  { key: 'kwMd', header: 'kW MD', width: 13 },
  { key: 'kvaMd', header: 'kVA MD', width: 13, total: 9 },
  { key: 'kwh', header: 'kWh Consumption', width: 13, total: 9 },
  { key: 'kvah', header: 'kVAh Consumption', width: 13 },
  { key: 'pf', header: 'Power Factor', width: 13 },
  { key: 'kvar', header: 'kVAr Required', width: 13, numFmt: '0.00' },
];

const letterOf = (key) => {
  let n = FIRST_COLUMN + COLUMNS.findIndex((column) => column.key === key);
  let letters = '';
  while (n > 0) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** "2026-08" -> "August 2026" */
export const monthTitle = (month) => {
  const [year, mon] = month.split('-').map(Number);
  return `${MONTH_NAMES[mon - 1]} ${year}`;
};

const number = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

/** One bill per site, consumer number and month — the latest saved — as the Analysis page counts them. */
const dedupe = (bills) => {
  const latest = new Map();
  for (const bill of bills) {
    const p = bill.parameters ?? {};
    const key = `${bill.site?._id ?? 'none'}|${p.customerNumber ?? ''}|${p.billMonth}`;
    const kept = latest.get(key);
    const savedAt = bill.submittedAt ?? bill.updatedAt ?? 0;
    if (!kept || savedAt > (kept.submittedAt ?? kept.updatedAt ?? 0)) latest.set(key, bill);
  }
  return [...latest.values()];
};

/** Their kVAr formula — kVA MD × tan(acos(PF)) — left blank when either reading is missing or PF is out of range. */
const kvarFormula = (row) => {
  const md = `${letterOf('kvaMd')}${row}`;
  const pf = `${letterOf('pf')}${row}`;
  return `IF(AND(ISNUMBER(${md}),ISNUMBER(${pf}),${pf}>0,${pf}<=1),${md}*TAN(ACOS(${pf})),"")`;
};
const kvarResult = (md, pf) => (md != null && pf > 0 && pf <= 1 ? md * Math.tan(Math.acos(pf)) : '');

const siteName = (site) => (site ? [site.name, site.code].filter(Boolean).join(' · ') : '');

/** A link back to the bill in the app, when the app's address is known. */
const billUrl = (bill, appUrl) =>
  appUrl ? `${appUrl}/sites/${bill.site?._id ?? 'unassigned'}/bills/${bill._id}` : null;

const addMonthSheet = (workbook, month, bills, appUrl) => {
  const sheet = workbook.addWorksheet(`${monthTitle(month)} Master`, {
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
  });
  const lastRow = FIRST_DATA_ROW + bills.length - 1;

  sheet.getColumn(1).width = 8.88;
  COLUMNS.forEach((column, index) => {
    sheet.getColumn(FIRST_COLUMN + index).width = column.width;
  });

  // Row 1: running totals that follow any filter the reader applies (SUBTOTAL skips hidden rows).
  const totals = sheet.getRow(1);
  for (const column of COLUMNS.filter((c) => c.total)) {
    const letter = letterOf(column.key);
    const values = bills.map((bill) => rowValues(bill)[column.key]);
    const result =
      column.total === 3
        ? values.filter((value) => value != null && value !== '').length
        : values.reduce((sum, value) => sum + (number(value) ?? 0), 0);
    const cell = totals.getCell(letter);
    cell.value = { formula: `SUBTOTAL(${column.total},${letter}${FIRST_DATA_ROW}:${letter}${lastRow})`, result };
    cell.font = { name: FONT, size: 10 };
    cell.alignment = { horizontal: 'center', wrapText: true };
    if (column.total === 9) cell.numFmt = INR_FORMAT;
  }

  const header = sheet.getRow(HEADER_ROW);
  header.height = 32;
  COLUMNS.forEach((column, index) => {
    const cell = header.getCell(FIRST_COLUMN + index);
    cell.value = column.header;
    cell.font = { name: FONT, size: 10, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  });

  bills.forEach((bill, index) => {
    const rowNumber = FIRST_DATA_ROW + index;
    const row = sheet.getRow(rowNumber);
    const values = { ...rowValues(bill), serial: index + 1 };
    const url = billUrl(bill, appUrl);

    COLUMNS.forEach((column, columnIndex) => {
      const cell = row.getCell(FIRST_COLUMN + columnIndex);
      const value = values[column.key];
      cell.font = { name: FONT, size: 10 };
      cell.alignment = { horizontal: column.key === 'link' ? 'left' : 'center', wrapText: true };
      cell.border = BORDER;
      if (column.numFmt) cell.numFmt = column.numFmt;

      if (column.key === 'kvar') {
        cell.value = { formula: kvarFormula(rowNumber), result: kvarResult(values.kvaMd, values.pf) };
      } else if (column.key === 'link' && url) {
        cell.value = { text: value, hyperlink: url };
        cell.font = { name: FONT, size: 10, color: { argb: 'FF0000FF' }, underline: true };
      } else {
        cell.value = value ?? null;
      }
    });
  });

  return sheet;
};

/** The cells of one bill's row, by column key. Consumer numbers stay text so leading zeros survive. */
const rowValues = (bill) => {
  const p = bill.parameters ?? {};
  return {
    link: bill.file?.originalName ?? '',
    discom: bill.site?.discom || '',
    consumerNumber: p.customerNumber ? String(p.customerNumber) : '',
    sanctionedLoad: number(p.sanctionedLoad),
    connectedLoad: number(p.connectedLoad),
    contractDemand: number(p.contractDemand),
    kwMd: number(p.kwMd),
    kvaMd: number(p.kvaMd),
    kwh: number(p.kwhConsumption),
    kvah: number(p.kvahConsumption),
    pf: number(p.powerFactor),
  };
};

/**
 * The workbook for `bills` (lean docs, `site` populated): a sheet per bill
 * month, oldest first, rows sorted by site then consumer number. Pure — no
 * database — so tests build it straight from bills.
 */
export const buildWorkbook = (bills, { appUrl } = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Energy Intelligence Platform';
  workbook.created = new Date();
  // Excel works every formula out afresh on open, rather than trusting cached results.
  workbook.calcProperties.fullCalcOnLoad = true;

  const byMonth = new Map();
  for (const bill of dedupe(bills.filter((b) => b.parameters?.billMonth))) {
    const month = bill.parameters.billMonth;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month).push(bill);
  }

  const order = (a, b) =>
    siteName(a.site).localeCompare(siteName(b.site)) ||
    String(a.parameters.customerNumber ?? '').localeCompare(String(b.parameters.customerNumber ?? ''));
  for (const month of [...byMonth.keys()].sort()) {
    addMonthSheet(workbook, month, byMonth.get(month).sort(order), appUrl);
  }
  return workbook;
};

/** "Bill data - August 2026.xlsx", "Bill data - Pune Plant 2 - Apr 2025 to Mar 2026.xlsx" */
const fileNameFor = (months, site) => {
  const short = (month) => monthTitle(month).replace(/^(\w{3})\w*/, '$1');
  const span = months.length === 1 ? monthTitle(months[0]) : `${short(months[0])} to ${short(months.at(-1))}`;
  const name = ['Bill data', siteName(site), span].filter(Boolean).join(' - ');
  return `${name.replace(/[\\/:*?"<>|]/g, '-')}.xlsx`;
};

/** The export file for verified bills in `from`..`to` at `site`; 404 when nothing matches. */
export const exportBills = async ({ from, to, site }, { appUrl } = {}) => {
  const bills = await billData.findVerifiedForExport({ from, to, site });
  if (!bills.length) throw ApiError.notFound('No verified bills match this selection');

  const workbook = buildWorkbook(bills, { appUrl });
  const months = [...new Set(bills.map((b) => b.parameters.billMonth))].sort();
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, fileName: fileNameFor(months, site ? bills[0].site : null) };
};

/** Bill months with verified bills, for the export picker. */
export const listMonths = ({ site }) => billData.distinctVerifiedMonths({ site });
