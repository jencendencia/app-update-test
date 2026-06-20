const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
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

ipcMain.on('check-for-update', () => {
  sendStatus('Checking for update...');

  const req = https.get(UPDATE_URL, {
    timeout: CHECK_TIMEOUT_MS,
    headers: { 'Accept-Encoding': 'identity' },
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        if (res.statusCode !== 200) {
          sendStatus(`Error: GitHub returned status ${res.statusCode}`);
          return;
        }
        const versionMatch = data.match(/^version:\s*(\S+)/m);
        if (!versionMatch) {
          sendStatus(`Error: could not parse update info (status ${res.statusCode})`);
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

        autoUpdater.downloadUpdate({
          version: remoteVersion,
          files: [{ url: downloadUrl, sha512 }],
          path: fileName,
          sha512,
          releaseDate: new Date().toISOString(),
        });
      } catch (e) {
        sendStatus(`Error: ${e.message}`);
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    sendStatus('Update check timed out (10s). Check your network and try again.');
  });

  req.on('error', (e) => {
    sendStatus(`Network error: ${e.message}`);
  });
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
