/**
 * Truncate an array to the given size.
 * @param {*} items
 * @param {*} limit
 */
module.exports = (items, limit) => {
  return items.slice(0, limit);
};
