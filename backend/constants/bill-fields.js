// The bill parameters the code depends on. Analysis, the Excel export, search
// and dedupe read these by key, so their key, type, unit, limits and
// requiredness live here, not in the database. Admins can still relabel,
// re-hint, regroup and reorder them. Every other parameter is added from the
// admin console (see bill-field.service.js) and needs no code at all.
//
// On boot `ensureSystemFields` copies this list into the BillField collection.
// Adding a built-in parameter = one entry here; no migration.

export const FIELD_TYPES = {
  NUMBER: 'number',
  TEXT: 'text',
  MONTH: 'month', // YYYY-MM
};

/** The sections the form starts with. Admins may rename, reorder and add to them. */
export const SYSTEM_GROUPS = [
  { key: 'customer', title: 'Customer details' },
  { key: 'load', title: 'Load details' },
  { key: 'period', title: 'Billing period' },
  { key: 'consumption', title: 'Consumption' },
  { key: 'demand', title: 'Demand & power factor' },
];

const { NUMBER, TEXT, MONTH } = FIELD_TYPES;

/**
 * `required` = needed to submit: a bill without these cannot be reconciled
 * against anything. Built-in fields apply to every DISCOM.
 */
export const SYSTEM_FIELDS = [
  { key: 'customerNumber', label: 'Customer Number', type: TEXT, group: 'customer', required: true },
  { key: 'consumerName', label: 'Consumer Name', type: TEXT, group: 'customer', required: true },
  { key: 'sanctionedLoad', label: 'Sanctioned Load', type: NUMBER, unit: 'kW', min: 0, group: 'load' },
  { key: 'contractDemand', label: 'Contract Demand', type: NUMBER, unit: 'kVA', min: 0, group: 'load' },
  { key: 'connectedLoad', label: 'Connected Load', type: NUMBER, unit: 'kW', min: 0, group: 'load' },
  { key: 'billMonth', label: 'Bill Month', type: MONTH, group: 'period', required: true },
  { key: 'currentBillMonth', label: 'Current Bill Month', type: MONTH, group: 'period' },
  { key: 'kwhConsumption', label: 'kWh Consumption', type: NUMBER, unit: 'kWh', min: 0, group: 'consumption', required: true },
  { key: 'kvahConsumption', label: 'kVAh Consumption', type: NUMBER, unit: 'kVAh', min: 0, group: 'consumption' },
  { key: 'kvaMd', label: 'kVA (MD)', type: NUMBER, unit: 'kVA', min: 0, group: 'demand' },
  { key: 'kwMd', label: 'kW (MD)', type: NUMBER, unit: 'kW', min: 0, group: 'demand' },
  { key: 'powerFactor', label: 'Power Factor', type: NUMBER, min: 0, max: 1, step: 0.01, group: 'demand' },
  // ₹; negative when the DISCOM pays a rebate.
  { key: 'powerFactorPenalty', label: 'Power Factor Penalty', type: NUMBER, unit: '₹', group: 'demand' },
];

/** Keys a parameter can never take: they mean something else on a bill or to Mongo. */
export const RESERVED_KEYS = ['site', 'id', '_id', 'status', 'file', 'parameters', 'constructor', 'prototype'];
