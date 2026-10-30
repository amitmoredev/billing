import mongoose from 'mongoose';

// A physical location that receives electricity bills (a plant, office, store).
// Every account sees every site, the same as bills; a bill points at one site.
const siteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    code: { type: String, trim: true, uppercase: true, maxlength: 30, default: '' }, // short label, e.g. "PLT-02"
    address: { type: String, trim: true, maxlength: 300, default: '' },
    discom: { type: String, trim: true, maxlength: 120, default: '' }, // distribution company that bills this site
    // Who added it. Clients may edit or delete only their own; null (sites from
    // before this was recorded) leaves a site to admins.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Two sites called "Plant 2" and "plant 2" would be impossible to tell apart in a dropdown.
siteSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export const Site = mongoose.model('Site', siteSchema);
