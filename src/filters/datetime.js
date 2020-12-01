const { DateTime } = require('luxon');

/**
 * Convert a JS Date to a string in the given format.
 * @param {*} dateObj
 * @param {*} format
 */
module.exports = (dateObj, format = 'yyyy-LL-dd') => {
  return DateTime.fromJSDate(dateObj, {
    zone: 'utc',
  }).toFormat(format);
};
