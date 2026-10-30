export const BILL_STATUS = {
  PENDING_UPLOAD: 'PENDING_UPLOAD',
  UPLOADED: 'UPLOADED',
  SUBMITTED: 'SUBMITTED',
};

export const STATUS_LABELS = {
  [BILL_STATUS.PENDING_UPLOAD]: 'Uploading',
  [BILL_STATUS.UPLOADED]: 'Pending details',
  [BILL_STATUS.SUBMITTED]: 'Verified',
};

/** Site filter value for bills not yet filed under a site (the API's NO_SITE). */
export const NO_SITE = 'none';

export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

/**
 * Form definition for bill parameters. Rendering, defaults and client-side
 * validation all read from this list — adding a field means adding one entry.
 */
export const PARAMETER_GROUPS = [
  {
    title: 'Customer details',
    fields: [
      { name: 'customerNumber', label: 'Customer Number', type: 'text', required: true },
      { name: 'consumerName', label: 'Consumer Name', type: 'text', required: true },
    ],
  },
  {
    title: 'Load details',
    fields: [
      { name: 'sanctionedLoad', label: 'Sanctioned Load', type: 'number', unit: 'kW' },
      { name: 'contractDemand', label: 'Contract Demand', type: 'number', unit: 'kVA' },
      { name: 'connectedLoad', label: 'Connected Load', type: 'number', unit: 'kW' },
    ],
  },
  {
    title: 'Billing period',
    fields: [
      { name: 'billMonth', label: 'Bill Month', type: 'month', required: true },
      { name: 'currentBillMonth', label: 'Current Bill Month', type: 'month' },
    ],
  },
  {
    title: 'Consumption',
    fields: [
      { name: 'kwhConsumption', label: 'kWh Consumption', type: 'number', unit: 'kWh', required: true },
      { name: 'kvahConsumption', label: 'kVAh Consumption', type: 'number', unit: 'kVAh' },
    ],
  },
  {
    title: 'Demand & power factor',
    fields: [
      { name: 'kvaMd', label: 'kVA (MD)', type: 'number', unit: 'kVA' },
      { name: 'kwMd', label: 'kW (MD)', type: 'number', unit: 'kW' },
      { name: 'powerFactor', label: 'Power Factor', type: 'number', step: '0.01', max: 1, hint: '0 to 1' },
      { name: 'powerFactorPenalty', label: 'Power Factor Penalty', type: 'number', unit: '₹' },
    ],
  },
];

export const PARAMETER_FIELDS = PARAMETER_GROUPS.flatMap((group) => group.fields);
