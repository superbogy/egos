import { app, BrowserWindow, protocol, session, shell } from 'electron';
import * as path from 'path';
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';
import contextMenu from 'electron-context-menu';
import { LOCAL_FILE_HOST } from './constants';

let mainWindow: any;
const fileURL = path.join('file:', __dirname, 'index.html');
const isDev = process.env.NODE_ENV === 'development';
const winURL = isDev ? 'http://localhost:8000' : new URL(fileURL).href;

async function devtoolsInstall() {
  try {
    if (isDev) {
      return;
    }
    await installExtension(REACT_DEVELOPER_TOOLS);
    await installExtension(REDUX_DEVTOOLS);
  } catch (err) {
    console.log(err);
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      spellcheck: true,
      // sandbox: true,
      preload: path.join(path.resolve(__dirname), 'preload.js'),
    },
    // frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 5, y: 10 },
  });
  mainWindow.loadURL(winURL);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-frame-finish-load', async () => {
    await devtoolsInstall();
  });
};

app.whenReady().then(async () => {
  // registerEvent(mainWindow);
  contextMenu({
    prepend: (defaultActions, parameters, browserWindow) => {
      return [
        {
          label: 'Translate',
          visible: parameters.selectionText.trim().length > 0,
          click: () => {
            mainWindow.webContents.send('translate', {
              text: parameters.selectionText,
              position: {
                x: parameters.x,
                y: parameters.y,
              },
            });
          },
        },
        {
          label: 'Search Google for “{selection}”',
          visible: parameters.selectionText.trim().length > 0,
          click: () => {
            shell.openExternal(
              `https://google.com/search?q=${encodeURIComponent(
                parameters.selectionText,
              )}`,
            );
          },
        },
      ];
    },
    showLookUpSelection: false,
    showSearchWithGoogle: false,
    showInspectElement: false,
  });
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.substring(8);
    callback({ path: decodeURI(url) });
  });

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: [`${LOCAL_FILE_HOST}/*`] },
    (details, callback) => {
      // console.log('before request', details);
      callback({
        redirectURL: `atom://${details.url.replace(LOCAL_FILE_HOST, '')}`,
      });
    },
  );
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (!mainWindow) {
    createWindow();
  }
});
