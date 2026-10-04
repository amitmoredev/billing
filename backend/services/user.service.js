import * as userData from '../data/user.data.js';
import { ROLES } from '../models/user.model.js';
import { ApiError } from '../utils/api-error.js';

// Service layer for the admin console. It manages client accounts only: admins
// are provisioned from the CLI, so nobody can lock out themselves or another
// admin from here.

const PHONE_TAKEN = 'This number is already registered.';

// The unique index on phone is the real guard; a lookup first would still race.
const rethrowDuplicate = (error) => {
  if (error?.code === 11000) throw ApiError.conflict(PHONE_TAKEN);
  throw error;
};

const loadClientOrThrow = async (id) => {
  const user = await userData.findById(id);
  if (!user || user.role === ROLES.ADMIN) throw ApiError.notFound('User not found');
  return user;
};

export const listUsers = async ({ search, page, limit }) => {
  const { items, total } = await userData.findMany({
    excludeRole: ROLES.ADMIN,
    search,
    page,
    limit,
  });

  return {
    items: items.map((user) => user.toJSON()),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  };
};

export const createUser = async ({ name, phone, email }) => {
  const user = await userData
    .create({ name, phone, email, role: ROLES.CLIENT })
    .catch(rethrowDuplicate);
  return user.toJSON();
};

export const updateUser = async (id, changes) => {
  const user = await loadClientOrThrow(id);
  user.set(changes);
  await user.save().catch(rethrowDuplicate);
  return user.toJSON();
};

/** Takes effect immediately: the next request on their session is refused. */
export const deleteUser = async (id) => {
  const user = await loadClientOrThrow(id);
  await user.deleteOne();
  return { id };
};
