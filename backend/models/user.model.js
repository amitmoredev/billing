import mongoose from 'mongoose';

// What each role is allowed to do lives in policies/permissions.js, not here.
export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
};

// Sign-up is closed: a number can sign in only once an admin has created a row
// for it. Clients are added from the admin console; admins come from
// scripts/create-user.js, since the first one has nobody to create them.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120, default: '' },
    phone: { type: String, required: true, unique: true, index: true }, // 10 digits, no country code
    email: { type: String, trim: true, lowercase: true, default: '' },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CLIENT },
    isActive: { type: Boolean, default: true }, // false blocks sign-in without deleting the row
    lastLoginAt: { type: Date, default: null },
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

// Admin console list: newest first within a role.
userSchema.index({ role: 1, createdAt: -1 });

export const User = mongoose.model('User', userSchema);
