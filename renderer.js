document.getElementById('version').textContent = `v${window.electronAPI?.version || '1.0.0'}`;

document.getElementById('updateBtn').addEventListener('click', () => {
  document.getElementById('status').textContent = 'Checking...';
  window.electronAPI.checkForUpdate();
});

window.electronAPI.onUpdateStatus((text) => {
  document.getElementById('status').textContent = text;
});
