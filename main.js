const { app, BrowserWindow, ipcMain, net } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

const CHECK_TIMEOUT_MS = 10000;
const UPDATE_URL = 'https://github.com/jencendencia/app-update-test/releases/latest/download/latest.yml';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 320,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function sendStatus(text) {
  mainWindow?.webContents.send('update-status', text);
}

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.on('check-for-update', async () => {
  sendStatus('Checking for update...');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    const response = await net.fetch(UPDATE_URL, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      sendStatus(`Error: GitHub returned status ${response.status}`);
      return;
    }

    const data = await response.text();
    const versionMatch = data.match(/^version:\s*(\S+)/m);

    if (!versionMatch) {
      sendStatus('Error: could not parse update info');
      return;
    }

    const remoteVersion = versionMatch[1];
    const currentVersion = app.getVersion();

    if (remoteVersion === currentVersion) {
      sendStatus(`No update available (current: v${currentVersion})`);
      return;
    }

    const pathMatch = data.match(/^path:\s*(\S+)/m);
    const shaMatch = data.match(/^sha512:\s*(\S+)/m);
    const fileName = pathMatch ? pathMatch[1] : `App-Update-Test-Setup-${remoteVersion}.exe`;
    const sha512 = shaMatch ? shaMatch[1] : '';
    const downloadUrl = `https://github.com/jencendencia/app-update-test/releases/download/v${remoteVersion}/${fileName}`;

    sendStatus(`Update available: v${remoteVersion}. Downloading...`);

    autoUpdater.updateInfoAndProvider = {
      info: {
        version: remoteVersion,
        files: [{ url: downloadUrl, sha512 }],
        path: fileName,
        sha512,
        releaseDate: new Date().toISOString(),
      },
      provider: { getUpdateFile: () => {} },
    };
    autoUpdater.downloadUpdate();

  } catch (e) {
    if (e.name === 'AbortError') {
      sendStatus('Update check timed out (10s). Check your network and try again.');
    } else {
      sendStatus(`Error: ${e.message}`);
    }
  }
});

autoUpdater.on('download-progress', (progress) => {
  sendStatus(`Downloading: ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatus(`Update v${info.version} downloaded. Restart to install.`);
});

autoUpdater.on('error', (err) => {
  sendStatus(`Error: ${err.message}`);
});
