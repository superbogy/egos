(global as any).shared = {
  password: 'eng',
  username: 'egos',
};
export default global;

export const setSharedVar = (name: string, val: any) => {
  (global as any).shared[name] = val;
};

export const getSharedVar = (name: string) => {
  return (global as any).shared[name];
};
