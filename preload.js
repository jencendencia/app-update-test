const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('get-version'),
  checkForUpdate: () => ipcRenderer.send('check-for-update'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (_event, text) => callback(text));
  },
});
