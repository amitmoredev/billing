import mongoose from 'mongoose';
import { FIELD_TYPES } from '../constants/bill-fields.js';

// The bill parameter form, as data: its sections and the fields in them.
// Values live on each bill under `parameters.<key>`; see bill.model.js.

const toJSON = {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
};

const billFieldGroupSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, immutable: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON }
);

const billFieldSchema = new mongoose.Schema(
  {
    // Where the value lives on a bill. Made from the label once and never
    // changed, so a label can be reworded without touching any bill.
    key: { type: String, required: true, unique: true, immutable: true },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    hint: { type: String, trim: true, maxlength: 160, default: '' },
    group: { type: String, required: true }, // a BillFieldGroup key
    order: { type: Number, default: 0 }, // within its group
    // Fixed once created: stored values were checked against it.
    type: { type: String, enum: Object.values(FIELD_TYPES), required: true },
    unit: { type: String, trim: true, maxlength: 20, default: '' },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    step: { type: Number, default: null },
    required: { type: Boolean, default: false }, // to submit, not to save a draft
    // DISCOMs whose bills carry this field; empty = every DISCOM.
    discoms: { type: [{ type: String, trim: true, maxlength: 120 }], default: [] },
    // Built in (constants/bill-fields.js): the code reads it, so only its
    // label, hint, section and position may change.
    system: { type: Boolean, default: false },
    // Off the form and the export; values already on bills are kept.
    archived: { type: Boolean, default: false },
    inExport: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, toJSON }
);

billFieldSchema.index({ group: 1, order: 1 });

export const BillFieldGroup = mongoose.model('BillFieldGroup', billFieldGroupSchema);
export const BillField = mongoose.model('BillField', billFieldSchema);
