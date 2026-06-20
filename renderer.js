// Tab switching
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// Version display
window.electronAPI.getVersion().then((version) => {
  document.getElementById('version').textContent = `v${version}`;
});

// Update check
document.getElementById('updateBtn').addEventListener('click', () => {
  document.getElementById('status').textContent = 'Checking...';
  window.electronAPI.checkForUpdate();
});

window.electronAPI.onUpdateStatus((text) => {
  document.getElementById('status').textContent = text;
});
