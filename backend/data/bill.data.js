import { Bill } from '../models/bill.model.js';
import { escapeRegex } from '../utils/regex.js';

// Data layer: Mongo queries only. No business rules, no HTTP concepts.

export const create = (payload) => Bill.create(payload);

export const findById = (id) => Bill.findById(id);

export const findMany = async ({ status, search, page, limit }) => {
  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { 'file.originalName': rx },
      { 'parameters.consumerName': rx },
      { 'parameters.customerNumber': rx },
    ];
  }

  const [items, total] = await Promise.all([
    Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Bill.countDocuments(filter),
  ]);

  return { items, total };
};

export const updateById = (id, update) =>
  Bill.findByIdAndUpdate(id, update, { returnDocument: 'after', runValidators: true });

export const deleteById = (id) => Bill.findByIdAndDelete(id);

export const countByStatus = () =>
  Bill.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
