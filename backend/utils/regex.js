/** Makes user input safe to embed in a RegExp, so a search for "a.b" matches a literal dot. */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
