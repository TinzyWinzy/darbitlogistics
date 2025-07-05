// Recursively converts all object keys from snake_case to camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function normalizeKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  } else if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const newObj = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const camelKey = toCamelCase(key);
        newObj[camelKey] = normalizeKeys(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
} 