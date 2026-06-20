const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;
autoUpdater.forceDevUpdateConfig = true;

let mainWindow;
let downloadInProgress = false;

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

app.whenReady().then(() => {
  createWindow();

  // Configure the GitHub release provider (repo is public, no token needed)
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'jencendencia',
    repo: 'app-update-test',
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function sendStatus(text) {
  mainWindow?.webContents.send('update-status', text);
}

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.on('check-for-update', () => {
  if (downloadInProgress) {
    sendStatus('Download already in progress...');
    return;
  }
  sendStatus('Checking for update...');
  autoUpdater.checkForUpdates().catch((e) => {
    sendStatus(`Error: ${e.message}`);
  });
});

autoUpdater.on('checking-for-update', () => {
  sendStatus('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatus(`Update available: v${info.version}. Downloading...`);
  downloadInProgress = true;
  autoUpdater.downloadUpdate().catch((e) => {
    downloadInProgress = false;
    sendStatus(`Download error: ${e.message}`);
  });
});

autoUpdater.on('update-not-available', (info) => {
  sendStatus(`No update available (current: v${app.getVersion()})`);
});

autoUpdater.on('download-progress', (progress) => {
  sendStatus(`Downloading: ${Math.round(progress.percent)}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  downloadInProgress = false;
  sendStatus(`Update v${info.version} downloaded. Click restart to install.`);
});

autoUpdater.on('error', (err) => {
  downloadInProgress = false;
  sendStatus(`Error: ${err.message}`);
});
