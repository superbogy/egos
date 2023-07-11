import { setSharedVar } from '../global';
import {
  ipcMain,
  dialog,
  IpcMainEvent,
  IpcMainInvokeEvent,
  BrowserWindow,
} from 'electron';
import { FILE_ENCRYPT_PWD, SHOW_DIALOG } from './constant';

export const registerEvent = (win: BrowserWindow) => {
  ipcMain.handle(SHOW_DIALOG, (event: IpcMainInvokeEvent, ...args: any[]) => {
    return dialog.showOpenDialog(win, {
      title: 'show dialog',
      properties: ['openFile', 'openDirectory', 'multiSelections'],
    });
  });
  ipcMain.handle(
    FILE_ENCRYPT_PWD,
    (ev: IpcMainInvokeEvent, { taskId, password }: any) => {
      const key = 'file:encrypt:pass:' + taskId;
      setSharedVar(key, password);
    },
  );
};
