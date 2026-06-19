const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://github.com/jencendencia/app-update-test/releases/latest/download',
});

const CHECK_TIMEOUT_MS = 15000;
let checkTimeout = null;

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

autoUpdater.on('checking-for-update', () => {
  sendStatus('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatus(`Update available: v${info.version}. Downloading...`);
  autoUpdater.downloadUpdate();
});

autoUpdater.on('update-not-available', (info) => {
  sendStatus(`No update available (current: v${info?.version || app.getVersion()})`);
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

ipcMain.on('check-for-update', () => {
  if (checkTimeout) clearTimeout(checkTimeout);

  sendStatus('Checking for update...');

  checkTimeout = setTimeout(() => {
    sendStatus('Update check timed out. GitHub may be slow or unreachable. Try again later.');
    checkTimeout = null;
  }, CHECK_TIMEOUT_MS);

  autoUpdater.checkForUpdates().finally(() => {
    if (checkTimeout) {
      clearTimeout(checkTimeout);
      checkTimeout = null;
    }
  });
});
