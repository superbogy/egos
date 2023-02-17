import {
  ipcMain,
  dialog,
  IpcMainEvent,
  IpcMainInvokeEvent,
  BrowserWindow,
} from 'electron';
import { SHOW_DIALOG } from './constant';

export const registerEvent = (win: BrowserWindow) => {
  ipcMain.handle(SHOW_DIALOG, (event: IpcMainInvokeEvent, ...args: any[]) => {
    console.log('handle dialog1', args);
    return dialog.showOpenDialog(win, { title: 'show dialog' });
  });
};
