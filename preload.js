const { contextBridge, ipcRenderer } = require('electron');
const pkg = require('./package.json');

contextBridge.exposeInMainWorld('electronAPI', {
  version: pkg.version,
  checkForUpdate: () => ipcRenderer.send('check-for-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_event, text) => callback(text));
  },
});
