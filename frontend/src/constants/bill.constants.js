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
 * What a bill parameter can hold. The fields themselves come from the API
 * (useBillFields), managed in the admin console under Bill parameters.
 */
export const FIELD_TYPES = {
  NUMBER: 'number',
  TEXT: 'text',
  MONTH: 'month',
};

export const FIELD_TYPE_OPTIONS = [
  { value: FIELD_TYPES.NUMBER, label: 'Number' },
  { value: FIELD_TYPES.TEXT, label: 'Text' },
  { value: FIELD_TYPES.MONTH, label: 'Month' },
];
