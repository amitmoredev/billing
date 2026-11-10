import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { SYSTEM_FIELDS } from '../constants/bill-fields.js';
import { buildParametersSchema } from '../validators/bill.validator.js';
import { createFieldSchema, updateFieldSchema } from '../validators/bill-field.validator.js';
import { appliesToDiscom, toFieldKey } from '../utils/bill-fields.js';
import { buildWorkbook } from '../services/bill-export.service.js';

const custom = (key, extra = {}) => ({ key, label: key, type: 'number', group: 'charges', order: 0, ...extra });
const issuesOf = (result) => Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));

describe('field keys', () => {
  test('camelCase from the label', () => {
    assert.equal(toFieldKey('Wheeling Charge'), 'wheelingCharge');
    assert.equal(toFieldKey('  FAC @ 00.00 Ps/U '), 'fac0000PsU');
    assert.equal(toFieldKey('E.D. on (Rs)'), 'eDOnRs');
  });

  test('unique against keys in use, ignoring case, and never reserved', () => {
    assert.equal(toFieldKey('Wheeling charge', ['wheelingCharge']), 'wheelingCharge2');
    assert.equal(toFieldKey('Wheeling charge', ['wheelingCharge', 'wheelingcharge2']), 'wheelingCharge3');
    assert.equal(toFieldKey('Site'), 'site2');
    assert.equal(toFieldKey('Status'), 'status2');
  });

  test('labels with no ASCII letters still get a key that starts with a letter', () => {
    assert.equal(toFieldKey('वीज शुल्क'), 'field');
    assert.equal(toFieldKey('वीज शुल्क', ['field']), 'field2');
    assert.equal(toFieldKey('2200 Hrs Units'), 'field2200HrsUnits');
  });
});

describe('DISCOM scope', () => {
  test('no DISCOMs = every bill, even one whose site has none yet', () => {
    assert.equal(appliesToDiscom({ discoms: [] }, 'MSEDCL'), true);
    assert.equal(appliesToDiscom({ discoms: [] }, ''), true);
  });

  test('listed DISCOMs match whole, ignoring case and spacing', () => {
    const field = { discoms: ['MSEDCL', 'Adani  Electricity Mumbai'] };
    assert.equal(appliesToDiscom(field, ' msedcl '), true);
    assert.equal(appliesToDiscom(field, 'adani electricity mumbai'), true);
    assert.equal(appliesToDiscom(field, 'Tata Power'), false);
    assert.equal(appliesToDiscom(field, 'MSEDCL Pune'), false);
    assert.equal(appliesToDiscom(field, undefined), false);
  });
});

describe('parameters schema', () => {
  const draft = buildParametersSchema(SYSTEM_FIELDS);
  const submit = buildParametersSchema(SYSTEM_FIELDS, { submit: true });

  test('built-in fields keep their rules: numbers, months, limits', () => {
    const parsed = draft.parse({ kwhConsumption: '1200.5', billMonth: '2025-11', powerFactor: '0.9' });
    assert.equal(parsed.kwhConsumption, 1200.5);
    assert.equal(parsed.billMonth, '2025-11');
    assert.equal(parsed.powerFactor, 0.9);

    const bad = draft.safeParse({ powerFactor: '1.2', kvaMd: '-1', billMonth: '2025-13' });
    assert.deepEqual(Object.keys(issuesOf(bad)).sort(), ['billMonth', 'kvaMd', 'powerFactor']);
    assert.equal(draft.safeParse({ powerFactorPenalty: '-250' }).success, true); // a rebate
  });

  test('a draft may leave anything blank; blank clears the value', () => {
    const parsed = draft.parse({ kvaMd: '', customerNumber: '  ' });
    assert.ok('kvaMd' in parsed);
    assert.equal(parsed.kvaMd, undefined);
    assert.equal(parsed.customerNumber, undefined);
  });

  test('submit needs the identifying fields', () => {
    const result = submit.safeParse({ customerNumber: '123', kwhConsumption: '0' });
    assert.deepEqual(Object.keys(issuesOf(result)).sort(), ['billMonth', 'consumerName']);
  });

  test('admin fields are checked by their own definition', () => {
    const fields = [
      custom('wheelingCharge', { min: 0 }),
      custom('meterMake', { type: 'text' }),
      custom('readingMonth', { type: 'month', required: true }),
    ];
    const ok = buildParametersSchema(fields, { submit: true }).parse({
      wheelingCharge: '1.39',
      meterMake: 'Secure',
      readingMonth: '2025-10',
    });
    assert.deepEqual(ok, { wheelingCharge: 1.39, meterMake: 'Secure', readingMonth: '2025-10' });

    const bad = buildParametersSchema(fields, { submit: true }).safeParse({ wheelingCharge: '-1', meterMake: 'x' });
    assert.deepEqual(Object.keys(issuesOf(bad)).sort(), ['readingMonth', 'wheelingCharge']);
    assert.equal(issuesOf(bad).readingMonth, 'Required');
  });

  test('values for fields the bill does not take are dropped, not rejected', () => {
    const parsed = buildParametersSchema([custom('wheelingCharge')]).parse({ wheelingCharge: '5', tod: '9' });
    assert.deepEqual(parsed, { wheelingCharge: 5 });
  });
});

describe('field definitions', () => {
  test('create fills defaults and rejects limits the wrong way round', () => {
    const field = createFieldSchema.parse({ label: ' Wheeling Charge ', group: 'charges', type: 'number' });
    assert.equal(field.label, 'Wheeling Charge');
    assert.deepEqual(field.discoms, []);
    assert.equal(field.required, false);
    assert.equal(field.inExport, true);
    assert.equal(field.min, null);

    const bad = createFieldSchema.safeParse({ label: 'X', group: 'g', type: 'number', min: '10', max: '5' });
    assert.equal(issuesOf(bad).max, 'Maximum is below the minimum');
    assert.equal(createFieldSchema.safeParse({ label: 'X', group: 'g', type: 'select' }).success, false);
  });

  test('an update carries only what was sent, and never a type or key', () => {
    const changes = updateFieldSchema.parse({ label: 'Wheeling', type: 'text', key: 'x' });
    assert.deepEqual(changes, { label: 'Wheeling' });
    assert.deepEqual(updateFieldSchema.parse({ min: '' }), { min: null });
    assert.equal(updateFieldSchema.safeParse({}).success, false);
  });
});

describe('export of admin fields', () => {
  const MSEDCL = { _id: 'a'.repeat(24), name: 'Pune', code: '', discom: 'MSEDCL' };
  const TATA = { _id: 'b'.repeat(24), name: 'Mumbai', code: '', discom: 'Tata Power' };
  let seq = 0;
  const bill = (site, parameters) => {
    seq += 1;
    return {
      _id: String(seq).padStart(24, '0'),
      site,
      file: { originalName: `bill-${seq}.pdf` },
      submittedAt: new Date(2026, 0, 1, 0, 0, seq),
      parameters: { customerNumber: String(seq), billMonth: '2025-11', kwhConsumption: 100, ...parameters },
    };
  };
  const groups = [{ key: 'charges' }, { key: 'other' }];
  const fields = [
    ...SYSTEM_FIELDS.map((field, order) => ({ ...field, order, system: true })),
    custom('electricityDuty', { label: 'Electricity Duty', unit: '₹', order: 20 }),
    custom('wheelingCharge', { label: 'Wheeling Charge', unit: '₹', order: 10, discoms: ['MSEDCL'] }),
    custom('meterMake', { label: 'Meter Make', type: 'text', group: 'other' }),
    custom('adaniOnly', { label: 'Adani Only', discoms: ['Adani Electricity Mumbai'] }),
    custom('retired', { label: 'Retired', archived: true }),
    custom('internal', { label: 'Internal', inExport: false }),
  ];

  const sheetOf = async (bills) => {
    const copy = new ExcelJS.Workbook();
    await copy.xlsx.load(await buildWorkbook(bills, { fields, groups }).xlsx.writeBuffer());
    return copy.worksheets[0];
  };
  const headers = (sheet) => sheet.getRow(2).values.filter(Boolean);

  test('follow the client’s columns in form order; archived, unexported and unused ones are left out', async () => {
    const sheet = await sheetOf([
      bill(MSEDCL, { wheelingCharge: 1.39, electricityDuty: 1110.69, meterMake: 'Secure', retired: 4 }),
      bill(TATA, { electricityDuty: 500 }),
    ]);
    assert.deepEqual(headers(sheet).slice(-3), ['Wheeling Charge (₹)', 'Electricity Duty (₹)', 'Meter Make']);
    assert.equal(headers(sheet).at(-4), 'kVAr Required');
  });

  test('numbers are summed in row 1; a DISCOM’s field is blank on other DISCOMs’ rows', async () => {
    const sheet = await sheetOf([
      bill(MSEDCL, { wheelingCharge: 1.5, electricityDuty: 100 }),
      bill(TATA, { electricityDuty: 50 }),
    ]);
    const column = (header) => headers(sheet).indexOf(header) + 2;
    const duty = column('Electricity Duty (₹)');
    const wheeling = column('Wheeling Charge (₹)');
    assert.equal(sheet.getRow(1).getCell(duty).value.result, 150);
    // Rows sort by site name: Mumbai (Tata) first, then Pune (MSEDCL).
    assert.equal(sheet.getRow(3).getCell(wheeling).value, null);
    assert.equal(sheet.getRow(4).getCell(wheeling).value, 1.5);
  });

  test('without definitions the client’s layout is unchanged', async () => {
    const copy = new ExcelJS.Workbook();
    await copy.xlsx.load(await buildWorkbook([bill(MSEDCL, { wheelingCharge: 3 })]).xlsx.writeBuffer());
    assert.equal(headers(copy.worksheets[0]).at(-1), 'kVAr Required');
  });
});
