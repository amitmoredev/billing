/**
 * Indian numbers are stored as bare 10 digits everywhere in this app.
 * Accepts "98765 43210", "+91 9876543210", "919876543210" — returns null if it
 * cannot be read as a valid 10-digit mobile number.
 */
export const normalizePhone10 = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;

  if (local.length !== 10) return null;
  if (!/^[6-9]/.test(local)) return null; // Indian mobiles start 6-9

  return local;
};

/** MSG91 wants the country code attached. */
export const toMsg91Number = (phone10) => `91${phone10}`;

/** "98765 43210" for display in messages we send back to the client. */
export const maskPhone = (phone10) => `${phone10.slice(0, 2)}xxxxx${phone10.slice(-3)}`;
