import mongoose from 'mongoose';
import { FIELD_TYPES, SYSTEM_FIELDS } from '../constants/bill-fields.js';

export const BILL_STATUS = {
  PENDING_UPLOAD: 'PENDING_UPLOAD', // row reserved, bytes not in R2 yet
  UPLOADED: 'UPLOADED', // file in R2, parameters not submitted
  SUBMITTED: 'SUBMITTED', // parameters filled and submitted
};

const toPath = ({ type, min, max }) =>
  type === FIELD_TYPES.NUMBER
    ? { type: Number, ...(min != null && { min }), ...(max != null && { max }) }
    : { type: String, trim: true };

// One value per parameter, keyed by its field key. Built-in parameters are
// typed here from constants/bill-fields.js; parameters added from the admin
// console (`strict: false`) are checked against their BillField definition
// before they reach this schema, so a new one needs no code and no migration.
const parametersSchema = new mongoose.Schema(
  Object.fromEntries(SYSTEM_FIELDS.map((field) => [field.key, toPath(field)])),
  { _id: false, strict: false }
);

const fileSchema = new mongoose.Schema(
  {
    key: { type: String, required: true }, // R2 object key — the source of truth
    bucket: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    file: { type: fileSchema, required: true },
    // Which site the bill belongs to. Picked by hand; null until someone does.
    site: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', default: null },
    status: {
      type: String,
      enum: Object.values(BILL_STATUS),
      default: BILL_STATUS.PENDING_UPLOAD,
      index: true,
    },
    parameters: { type: parametersSchema, default: () => ({}) },
    uploadedAt: { type: Date },
    submittedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// List view: newest-first within a status filter.
billSchema.index({ status: 1, createdAt: -1 });
// Same list narrowed to one site; also serves "bills at this site" counts.
billSchema.index({ site: 1, status: 1, createdAt: -1 });
// Lookups by the fields users actually search on.
billSchema.index({ 'parameters.customerNumber': 1 });
billSchema.index({ 'parameters.consumerName': 'text', 'file.originalName': 'text' });

export const Bill = mongoose.model('Bill', billSchema);
