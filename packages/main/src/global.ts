(global as any).shared = {
  password: 'eng',
  username: 'egos',
};
export default global;

export const setSharedVar = (name: string, val: any) => {
  (global as any).shared[name] = val;
  console.log('set global', (global as any).shared);
};

export const getSharedVar = (name: string) => {
  console.log('get global', (global as any).shared, name);
  return (global as any).shared[name];
};
