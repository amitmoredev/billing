import { User } from '../models/user.model.js';
import { escapeRegex } from '../utils/regex.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

export const create = (payload) => User.create(payload);

export const findById = (id) => User.findById(id);

export const findByPhone = (phone) => User.findOne({ phone });

/** `$ne` rather than an equality match, so rows saved before roles existed still match. */
export const findMany = async ({ excludeRole, search, page, limit }) => {
  const filter = {};
  if (excludeRole) filter.role = { $ne: excludeRole };
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { phone: rx }, { email: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total };
};

export const markSignedIn = (id) =>
  User.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } }, { returnDocument: 'after' });
