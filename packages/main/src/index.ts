import { app, BrowserWindow, protocol, session, shell } from 'electron';
import * as path from 'path';
import installExtension, {
  REACT_DEVELOPER_TOOLS,
  REDUX_DEVTOOLS,
} from 'electron-devtools-installer';
import contextMenu from 'electron-context-menu';
import { LOCAL_FILE_HOST } from './constants';
import prepare from './prepare';
import fs from 'fs';
import { getFileObjectBySourceId, parseFileRequest } from './lib/helper';
import './global';
import { getServer } from './server';
import { getSharedVar, setSharedVar } from './global';
import { File, Photo } from './models';
import { createDecryptStream } from '@egos/storage/dist/security';
import { md5 } from '@egos/storage';

let mainWindow: any;
const publicDir = path.join(__dirname, './public');
const fileURL = path.join('file:', publicDir, 'index.html');
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
  protocol.registerFileProtocol('app', (request, respond) => {
    let pathName = new URL(request.url).pathname;
    pathName = decodeURI(pathName); // Needed in case URL contains spaces

    const filePath = path.join(__dirname, pathName);
    respond({ path: filePath });
  });
  protocol.registerFileProtocol('egos', async (request, callback) => {
    const stream = await parseFileRequest(request);
    console.log('sssss', stream);
    if (!stream) {
      return callback({ statusCode: 404 });
    }
    callback({ data: stream, statusCode: 200 });
  });
  protocol.registerStreamProtocol('atom', async (request, callback) => {
    // const params = new URL(request.url);
    // const fileId = params.searchParams.get('fileId');
    // const type = params.searchParams.get('type');
    // const fileObj = await getFileObjectBySourceId(fileId);
    // if (!fileObj) {
    //   return callback({ statusCode: 404 });
    // }
    // const readable = fs.createReadStream(fileObj.path);
    // const model = type === 'image' ? Photo : File;
    // const file = await model.findOne({ objectId: fileObj.id });
    // if (!file) {
    //   return callback({ statusCode: 404 });
    // }
    // if (file.isEncrypt) {
    //   setSharedVar(`file:preview:secret:${fileId}`, '123');
    //   const secret = getSharedVar(`file:preview:secret:${fileId}`);
    //   const stream = await createDecryptStream(fileObj.path, md5(secret));
    //   return callback({
    //     statusCode: 200,
    //     data: stream,
    //     method: 'GET',
    //     mimeType: fileObj.mime,
    //   });
    // }
    // const readable = fs.createReadStream(filePath);
    const res = await parseFileRequest(request);
    if (!res) {
      return callback({ statusCode: 404 });
    }

    callback(res);
  });

  session.defaultSession.webRequest.onBeforeRequest(
    { urls: [`${LOCAL_FILE_HOST}/*`] },
    (details, callback) => {
      callback({
        redirectURL: details.url.replace('http', 'atom'),
      });
    },
  );
  await prepare(mainWindow);
});
app.on('ready', () => {
  // createWindow();
});

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } },
]);

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

getServer().then(({ app, ip, port }) => {
  app.listen(port as number, '0.0.0.0', () => {
    console.log(`http server listen on----- http://${ip}:${port}`);
  });
});
