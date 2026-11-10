import * as fieldData from '../data/bill-field.data.js';
import { SYSTEM_FIELDS, SYSTEM_GROUPS } from '../constants/bill-fields.js';
import { appliesToDiscom, normalizeDiscom, toFieldKey } from '../utils/bill-fields.js';
import { ApiError } from '../utils/api-error.js';

// Service layer for the bill parameter form: its sections and fields.
//
// Built-in fields (constants/bill-fields.js) are read by analysis and the
// export, so only their label, hint, section and position can change here.
// Every other field is the admin's: added, edited, limited to some DISCOMs,
// archived. A field's key and type never change once made — bills store
// values under the key, checked against the type.

const GAP = 10; // between positions, so an insert never renumbers the rest

// What may change on a built-in field; anything else is the code's.
const SYSTEM_EDITABLE = ['label', 'hint', 'group'];

const toFieldDto = (field) => ({
  id: String(field._id),
  key: field.key,
  label: field.label,
  hint: field.hint ?? '',
  group: field.group,
  order: field.order,
  type: field.type,
  unit: field.unit ?? '',
  min: field.min ?? null,
  max: field.max ?? null,
  step: field.step ?? null,
  required: Boolean(field.required),
  discoms: field.discoms ?? [],
  system: Boolean(field.system),
  archived: Boolean(field.archived),
  inExport: field.inExport !== false,
});

const toGroupDto = (group) => ({ id: String(group._id), key: group.key, title: group.title, order: group.order });

const lean = (doc) => (typeof doc.toObject === 'function' ? doc.toObject() : doc);

/** The same DISCOM typed twice ("MSEDCL", "msedcl ") is kept once. */
const uniqueDiscoms = (discoms = []) => {
  const seen = new Map();
  for (const discom of discoms) {
    const name = discom.trim().replace(/\s+/g, ' ');
    if (name && !seen.has(normalizeDiscom(name))) seen.set(normalizeDiscom(name), name);
  }
  return [...seen.values()];
};

const loadField = async (id) => {
  const field = await fieldData.findFieldById(id);
  if (!field) throw ApiError.notFound('Field not found');
  return field;
};

const loadGroup = async (id) => {
  const group = await fieldData.findGroupById(id);
  if (!group) throw ApiError.notFound('Section not found');
  return group;
};

const assertGroupExists = async (key) => {
  if (!(await fieldData.findGroupByKey(key))) {
    throw ApiError.badRequest('Validation failed', [{ field: 'group', message: 'This section no longer exists' }]);
  }
};

const nextFieldOrder = async (group) => Math.max(0, (await fieldData.lastFieldOrder(group)) + GAP);

/**
 * Brings the database in line with constants/bill-fields.js. Runs on every
 * boot and changes nothing when nothing changed. The sections are seeded
 * once, on an empty database, so a section an admin removed stays removed.
 * A built-in key already used by an admin's field of the same type takes that
 * field over, values and all; of another type, the API refuses to start.
 */
export const ensureSystemFields = async () => {
  const seedGroups = (await fieldData.countGroups()) === 0;

  for (const [index, field] of SYSTEM_FIELDS.entries()) {
    const existing = await fieldData.findFieldByKey(field.key);
    if (existing && existing.type !== field.type) {
      throw new Error(
        `Built-in field "${field.key}" is a ${field.type}, but the database has a ${existing.type} field with that key. Rename one.`
      );
    }

    // A new field's section is created with it, even if an admin removed it.
    const group = SYSTEM_GROUPS.find((g) => g.key === field.group);
    if (seedGroups || !existing) {
      await fieldData.ensureGroup({ ...group, order: SYSTEM_GROUPS.indexOf(group) * GAP });
    }

    await fieldData.upsertSystemField({
      key: field.key,
      locked: {
        type: field.type,
        unit: field.unit ?? '',
        min: field.min ?? null,
        max: field.max ?? null,
        step: field.step ?? null,
        required: Boolean(field.required),
        discoms: [],
        system: true,
        archived: false,
      },
      initial: { label: field.label, hint: '', group: field.group, order: index * GAP },
    });
  }
};

/** Every section and every field (archived included), in form order. */
export const listDefinitions = async () => {
  const [groups, fields] = await Promise.all([fieldData.findAllGroups(), fieldData.findAllFields()]);
  return { groups: groups.map(toGroupDto), fields: fields.map(toFieldDto) };
};

/** The live fields a bill from `discom` takes. */
export const fieldsForDiscom = async (discom) =>
  (await fieldData.findAllFields()).filter((field) => !field.archived && appliesToDiscom(field, discom)).map(toFieldDto);

/** Every field, archived included — for the export, which shows what bills hold. */
export const allFields = async () => (await fieldData.findAllFields()).map(toFieldDto);

export const createField = async (values, user) => {
  await assertGroupExists(values.group);
  const taken = (await fieldData.findAllFields()).map((field) => field.key);

  const field = await fieldData.createField({
    ...values,
    key: toFieldKey(values.label, taken),
    discoms: uniqueDiscoms(values.discoms),
    order: await nextFieldOrder(values.group),
    system: false,
    createdBy: user?._id ?? null,
  });
  return toFieldDto(lean(field));
};

export const updateField = async (id, changes) => {
  const field = await loadField(id);

  if (field.system) {
    const locked = Object.keys(changes).filter((key) => !SYSTEM_EDITABLE.includes(key));
    if (locked.length) {
      throw ApiError.badRequest(
        'Built-in fields drive the analysis, so only their label, hint and section can change.',
        locked.map((key) => ({ field: key, message: 'Fixed for built-in fields' }))
      );
    }
  }

  const next = { ...changes };
  if (next.discoms) next.discoms = uniqueDiscoms(next.discoms);
  if (next.group && next.group !== field.group) {
    await assertGroupExists(next.group);
    next.order = await nextFieldOrder(next.group); // joins the end of its new section
  }

  const min = next.min !== undefined ? next.min : field.min;
  const max = next.max !== undefined ? next.max : field.max;
  if (min != null && max != null && min > max) {
    throw ApiError.badRequest('Validation failed', [{ field: 'max', message: 'Maximum is below the minimum' }]);
  }

  field.set(next);
  await field.save();
  return toFieldDto(lean(field));
};

/**
 * Only a field no bill has a value for can go for good; one in use is
 * archived instead, so no recorded value is ever lost.
 */
export const deleteField = async (id) => {
  const field = await loadField(id);
  if (field.system) throw ApiError.conflict('Built-in fields cannot be deleted.');

  const bills = await fieldData.countBillsWithValue(field.key);
  if (bills) {
    throw ApiError.conflict(
      `${bills} ${bills === 1 ? 'bill has' : 'bills have'} a value for this field. Archive it instead — that keeps ${
        bills === 1 ? 'the value' : 'their values'
      }.`
    );
  }
  await field.deleteOne();
  return { id };
};

/** Swaps a field with its neighbour in its section. At either end, nothing moves. */
export const moveField = async (id, direction) => {
  const field = await loadField(id);
  const neighbour = await fieldData.findFieldNeighbour({ group: field.group, order: field.order, direction });
  if (neighbour) {
    [field.order, neighbour.order] = [neighbour.order, field.order];
    await Promise.all([field.save(), neighbour.save()]);
  }
  return listDefinitions();
};

export const createGroup = async ({ title }) => {
  const taken = (await fieldData.findAllGroups()).map((group) => group.key);
  const group = await fieldData.createGroup({
    key: toFieldKey(title, taken),
    title,
    order: Math.max(0, (await fieldData.lastGroupOrder()) + GAP),
  });
  return toGroupDto(lean(group));
};

export const updateGroup = async (id, { title }) => {
  const group = await loadGroup(id);
  group.title = title;
  await group.save();
  return toGroupDto(lean(group));
};

/** Only an empty section can go — archived fields count, as they still belong to it. */
export const deleteGroup = async (id) => {
  const group = await loadGroup(id);
  const fields = await fieldData.countFieldsInGroup(group.key);
  if (fields) {
    throw ApiError.conflict(
      `${fields} ${fields === 1 ? 'field is' : 'fields are'} still in this section. Move ${fields === 1 ? 'it' : 'them'} first.`
    );
  }
  await group.deleteOne();
  return { id };
};

export const moveGroup = async (id, direction) => {
  const group = await loadGroup(id);
  const neighbour = await fieldData.findGroupNeighbour({ order: group.order, direction });
  if (neighbour) {
    [group.order, neighbour.order] = [neighbour.order, group.order];
    await Promise.all([group.save(), neighbour.save()]);
  }
  return listDefinitions();
};
