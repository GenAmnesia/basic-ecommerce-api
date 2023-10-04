// Removes every created_at and id property from an object recursively. Used for testing porpouses.

function removeCreatedAtAndId(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    if (key !== 'created_at' && key !== 'id') {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        acc[key] = removeCreatedAtAndId(obj[key]);
      } else {
        acc[key] = obj[key];
      }
    }
    return acc;
  }, {});
}

module.exports = removeCreatedAtAndId;
