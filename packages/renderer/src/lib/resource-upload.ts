import { Task } from '@/services/task';

export const upload = async (
  payload: any,
  channel: string = 'photo',
): Promise<any> => {
  const { albumId, local, uid, shootAt } = payload;
  if (Array.isArray(local)) {
    return await Promise.all(
      local.map((file) =>
        upload(
          {
            albumId,
            local: file.path,
            uid: file.uid,
            shootAt: file.shootAt,
          },
          channel,
        ),
      ),
    );
  }
  const photo = {
    albumId,
    local,
    uid,
    shootAt,
  };
  const task = {
    action: 'upload',
    type: 'photo',
    payload: photo,
    status: 'pending',
    retry: 0,
    maxRetry: 3,
    err: '',
  };
  const newTask = await Task.insert(task);
  (window as any).ElectronApi.ipcRenderer.send(channel);
  console.log('send ipc channel', channel);
  return newTask;
};
