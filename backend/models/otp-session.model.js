import mongoose from 'mongoose';

// One live OTP per phone number. The raw code is never stored — only a salted
// hash — so a database leak cannot be replayed as a login.
const otpSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Mongo sweeps expired codes itself; nothing has to run a cleanup job.
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpSession = mongoose.model('OtpSession', otpSessionSchema);
