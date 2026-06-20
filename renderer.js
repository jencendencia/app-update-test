window.electronAPI.getVersion().then((version) => {
  document.getElementById('version').textContent = `v${version}`;
});

document.getElementById('updateBtn').addEventListener('click', () => {
  document.getElementById('status').textContent = 'Checking...';
  window.electronAPI.checkForUpdate();
});

window.electronAPI.onUpdateStatus((text) => {
  document.getElementById('status').textContent = text;
});
