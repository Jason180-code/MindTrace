document.addEventListener('DOMContentLoaded', function () {
  const panel = document.getElementById('reminder-panel');
  const listEl = document.getElementById('reminder-list');
  const dismissBtn = document.getElementById('dismiss-reminders');
  const markAllBtn = document.getElementById('mark-all-done');
  const pageStatus = document.getElementById('page-status');
  const pageStatusText = pageStatus ? pageStatus.querySelector('.status-text') : null;

  if (!panel || !listEl) return;

  const todayKey = (function(){
    const d = new Date();
    return d.toISOString().slice(0,10); // YYYY-MM-DD
  })();
