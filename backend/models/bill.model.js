import mongoose from 'mongoose';

export const BILL_STATUS = {
  PENDING_UPLOAD: 'PENDING_UPLOAD', // row reserved, bytes not in R2 yet
  UPLOADED: 'UPLOADED', // file in R2, parameters not submitted
  SUBMITTED: 'SUBMITTED', // parameters filled and submitted
};

// Every extractable field lives here. Adding a param = one line, no migration.
const parametersSchema = new mongoose.Schema(
  {
    customerNumber: { type: String, trim: true },
    consumerName: { type: String, trim: true },
    sanctionedLoad: { type: Number, min: 0 }, // kW
    contractDemand: { type: Number, min: 0 }, // kVA
    connectedLoad: { type: Number, min: 0 }, // kW
    billMonth: { type: String, trim: true }, // YYYY-MM
    kwhConsumption: { type: Number, min: 0 },
    kvahConsumption: { type: Number, min: 0 },
    kvaMd: { type: Number, min: 0 }, // maximum demand in kVA
    kwMd: { type: Number, min: 0 }, // maximum demand in kW
    powerFactor: { type: Number, min: 0, max: 1 },
    powerFactorPenalty: { type: Number }, // INR; can be a rebate (negative)
    currentBillMonth: { type: String, trim: true }, // YYYY-MM
  },
  { _id: false }
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
// Lookups by the fields users actually search on.
billSchema.index({ 'parameters.customerNumber': 1 });
billSchema.index({ 'parameters.consumerName': 'text', 'file.originalName': 'text' });

export const Bill = mongoose.model('Bill', billSchema);
