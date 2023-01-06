export const objToKVPairs = (obj: any) => {
  if (Array.isArray(obj)) {
    return obj.reduce((acc, cur) => {
      return acc.concat(objToKVPairs(cur));
    }, []);
  }
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const val = Array.isArray(v) ? objToKVPairs(v) : v;
    acc.push({ [k]: val });
    return acc;
  }, []);
};
