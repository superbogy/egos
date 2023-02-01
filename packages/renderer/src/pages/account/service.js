const remote = window.ElectronApi;
export async function queryCurrent() {
  return {};
}

export async function getStorageDrivers() {
  const drivers = await remote.ipcRenderer.invoke('account:drivers');
  const buckets = await remote.ipcRenderer.invoke('account:buckets', {});
  return { drivers, buckets };
}

export const updateBucket = async ({ bucket }) => {
  await remote.ipcRenderer.invoke('account:buckets:update', {
    bucket,
  });
};
