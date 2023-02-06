const remote = (window as any).Electron;
export async function queryCurrent() {
  return {};
}

export async function getStorageDrivers() {
  console.log('??getStorageDrivers');
  console.log(window);
  const drivers = await remote.ipcRenderer.invoke('get@account:drivers');
  const buckets = await remote.ipcRenderer.invoke('get@account:buckets', {});
  return { drivers, buckets };
}

export const updateBucket = async ({ bucket }: any) => {
  await remote.ipcRenderer.invoke('update@account:buckets', {
    bucket,
  });
};
