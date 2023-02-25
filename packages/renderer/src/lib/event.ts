import { Remote } from './remote';
const ipcRender = Remote.Electron.ipcRenderer;

type RemoteCallback = (event: any, ...payload: any) => void;

class IpcEvent {
  events: string[];
  listeners: string[];
  constructor() {
    this.events = [];
    this.listeners = [];
  }

  register(evName: string, callback: RemoteCallback) {
    console.log('eventssssssss', this.events);
    if (this.events.includes(evName)) {
      console.log('have been listen', evName);
      return;
    }
    this.events.push(evName);
    ipcRender.removeListener(evName, console.log);
    ipcRender.on(evName, callback);
  }

  addListener(name: string, cb: RemoteCallback) {
    if (!this.listeners.includes(name)) {
      window.addEventListener(name, cb);
    }
    this.listeners.push(name);
  }

  removeRegister(evName: string) {
    if (this.events.includes(evName)) {
      ipcRender.removeAllListeners(evName);
    }
  }
}

export const ipcEvent = new IpcEvent();
