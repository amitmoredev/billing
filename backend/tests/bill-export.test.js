import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { buildWorkbook, monthTitle } from '../services/bill-export.service.js';

const SITE_A = { _id: 'a'.repeat(24), name: 'Phoenix Mall', code: 'PT-01', discom: 'Adani Electricity' };
const SITE_B = { _id: 'b'.repeat(24), name: 'Andheri', code: '', discom: 'MSEDCL' };

let seq = 0;
const bill = (site, customerNumber, billMonth, parameters = {}, savedAt) => {
  seq += 1;
  return {
    _id: String(seq).padStart(24, '0'),
    site,
    file: { originalName: `bill-${seq}.pdf` },
    submittedAt: savedAt ?? new Date(2026, 0, 1, 0, 0, seq),
    parameters: { customerNumber, billMonth, kwhConsumption: 1000, ...parameters },
  };
};

/** Writes the workbook and reads it back, as Excel would see it. */
const roundTrip = async (workbook) => {
  const copy = new ExcelJS.Workbook();
  await copy.xlsx.load(await workbook.xlsx.writeBuffer());
  return copy;
};

const headers = (sheet) => sheet.getRow(2).values.filter(Boolean);
const rowOf = (sheet, n) => {
  const cells = {};
  headers(sheet).forEach((header, i) => {
    cells[header] = sheet.getRow(n).getCell(i + 2).value;
  });
  return cells;
};

describe('bill export', () => {
  test('one sheet per month, oldest first, named like the client’s', async () => {
    const wb = await roundTrip(
      buildWorkbook([bill(SITE_A, '1', '2026-09'), bill(SITE_A, '1', '2026-08'), bill(SITE_B, '2', '2026-08')])
    );
    assert.deepEqual(
      wb.worksheets.map((s) => s.name),
      ['August 2026 Master', 'September 2026 Master']
    );
    assert.equal(wb.worksheets[0].rowCount, 4); // totals, header, two bills
  });

  test('their columns, in their order, from column B', async () => {
    const wb = await roundTrip(buildWorkbook([bill(SITE_A, '1', '2026-08')]));
    const sheet = wb.worksheets[0];
    assert.equal(sheet.getRow(2).getCell(1).value, null);
    assert.deepEqual(headers(sheet), [
      'Sr. No.',
      'Electricity Bill Link',
      'DISCOM',
      'Consumer No.',
      'Sanctioned Load (kW)',
      'Connected Load (kW)',
      'Contract Demand (kVA)',
      'kW MD',
      'kVA MD',
      'kWh Consumption',
      'kVAh Consumption',
      'Power Factor',
      'kVAr Required',
    ]);
    assert.equal(sheet.getRow(2).getCell(2).font.name, 'Montserrat');
    assert.equal(sheet.getRow(2).getCell(2).font.bold, true);
    assert.equal(sheet.views[0].ySplit, 2);
  });

  test('values land in the right cells; consumer numbers keep leading zeros', async () => {
    const wb = await roundTrip(
      buildWorkbook([
        bill(SITE_A, '000778895765', '2026-08', {
          sanctionedLoad: 16,
          connectedLoad: 16,
          contractDemand: 20,
          kwMd: 11,
          kvaMd: 12,
          kwhConsumption: 5257,
          kvahConsumption: 5400,
          powerFactor: 0.97,
        }),
      ])
    );
    const row = rowOf(wb.worksheets[0], 3);
    assert.equal(row['Sr. No.'], 1);
    assert.equal(row.DISCOM, 'Adani Electricity');
    assert.equal(row['Consumer No.'], '000778895765');
    assert.equal(row['Sanctioned Load (kW)'], 16);
    assert.equal(row['Contract Demand (kVA)'], 20);
    assert.equal(row['kVA MD'], 12);
    assert.equal(row['kWh Consumption'], 5257);
    assert.equal(row['Power Factor'], 0.97);
  });

  test('kVAr Required is their live formula, kVA MD × TAN(ACOS(PF)), with a cached result', async () => {
    const wb = await roundTrip(buildWorkbook([bill(SITE_A, '1', '2026-08', { kvaMd: 32.14, powerFactor: 0.9568 })]));
    const cell = rowOf(wb.worksheets[0], 3)['kVAr Required'];
    assert.equal(cell.formula, 'IF(AND(ISNUMBER(J3),ISNUMBER(M3),M3>0,M3<=1),J3*TAN(ACOS(M3)),"")');
    assert.ok(Math.abs(cell.result - 32.14 * Math.tan(Math.acos(0.9568))) < 1e-9);
  });

  test('missing readings stay blank, never 0', async () => {
    const wb = await roundTrip(buildWorkbook([bill(SITE_A, '1', '2026-08', { kvaMd: 12 })]));
    const row = rowOf(wb.worksheets[0], 3);
    assert.equal(row['Power Factor'], null);
    assert.equal(row['kW MD'], null);
    assert.equal(row['kVAr Required'].result ?? '', ''); // an empty result isn't stored; Excel recalculates on open
  });

  test('row 1 totals are SUBTOTALs over the data rows', async () => {
    const wb = await roundTrip(
      buildWorkbook([
        bill(SITE_A, '1', '2026-08', { kvaMd: 10, kwhConsumption: 100 }),
        bill(SITE_B, '2', '2026-08', { kvaMd: 5, kwhConsumption: 50 }),
      ])
    );
    const totals = wb.worksheets[0].getRow(1);
    assert.equal(totals.getCell('J').value.formula, 'SUBTOTAL(9,J3:J4)');
    assert.equal(totals.getCell('J').value.result, 15);
    assert.equal(totals.getCell('K').value.result, 150);
    assert.equal(totals.getCell('C').value.formula, 'SUBTOTAL(3,C3:C4)');
    assert.equal(totals.getCell('C').value.result, 2);
  });

  test('the bill link opens the bill in the app', async () => {
    const b = bill(SITE_A, '1', '2026-08');
    const wb = await roundTrip(buildWorkbook([b], { appUrl: 'https://app.example.com' }));
    const link = rowOf(wb.worksheets[0], 3)['Electricity Bill Link'];
    assert.equal(link.text, b.file.originalName);
    assert.equal(link.hyperlink, `https://app.example.com/sites/${SITE_A._id}/bills/${b._id}`);
  });

  test('a bill uploaded twice appears once — the latest saved', async () => {
    const wb = await roundTrip(
      buildWorkbook([
        bill(SITE_A, '1', '2026-08', { kwhConsumption: 100 }, new Date(2026, 0, 1)),
        bill(SITE_A, '1', '2026-08', { kwhConsumption: 120 }, new Date(2026, 0, 5)),
      ])
    );
    const sheet = wb.worksheets[0];
    assert.equal(sheet.rowCount, 3);
    assert.equal(rowOf(sheet, 3)['kWh Consumption'], 120);
  });

  test('rows sort by site, then consumer number', async () => {
    const wb = await roundTrip(
      buildWorkbook([bill(SITE_A, '9', '2026-08'), bill(SITE_B, '5', '2026-08'), bill(SITE_A, '3', '2026-08')])
    );
    const sheet = wb.worksheets[0];
    assert.deepEqual(
      [3, 4, 5].map((n) => rowOf(sheet, n)['Consumer No.']),
      ['5', '3', '9'] // Andheri before Phoenix Mall
    );
  });

  test('month titles', () => {
    assert.equal(monthTitle('2026-01'), 'January 2026');
    assert.equal(monthTitle('2025-12'), 'December 2025');
  });
});
