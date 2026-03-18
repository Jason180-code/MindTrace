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

  const dismissedKey = 'reminders_dismissed_' + todayKey;
  const completedKey = 'reminders_completed_' + todayKey;

  // sample habit extraction: read from .habits-list .habit-card
  const habitCards = Array.from(document.querySelectorAll('.habits-list .habit-card'));
  const habits = habitCards.map(card => {
    const nameEl = card.querySelector('h3');
    const freqEl = card.querySelector('.habit-frequency');
    return {
      name: nameEl ? nameEl.textContent.trim() : 'Unnamed habit',
      frequency: freqEl ? freqEl.textContent.trim() : ''
    };
  });

  // filter today's habits (simple rule: 'Daily')
  const todays = habits.filter(h => /daily/i.test(h.frequency));
  if (todays.length === 0) return; // nothing to show

  // if dismissed for today, skip showing
  if (localStorage.getItem(dismissedKey)) return;

  // load completed set
  let completed = JSON.parse(localStorage.getItem(completedKey) || '[]');

  function saveCompleted() { localStorage.setItem(completedKey, JSON.stringify(completed)); }

  function showPanel() {
    listEl.innerHTML = '';
    todays.forEach(h => {
      const li = document.createElement('li');
      li.className = 'reminder-item';
      if (completed.includes(h.name)) li.classList.add('completed');

      const left = document.createElement('div');
      const label = document.createElement('div'); label.className = 'label'; label.textContent = h.name;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = h.frequency || '';
      left.appendChild(label); left.appendChild(meta);

      const right = document.createElement('div');
      const toggle = document.createElement('button');
      toggle.className = 'button reminder-btn';
      toggle.type = 'button';
      toggle.setAttribute('aria-pressed', completed.includes(h.name) ? 'true' : 'false');
      toggle.textContent = completed.includes(h.name) ? 'Completed' : 'Mark done';
      toggle.addEventListener('click', function(){
        if (completed.includes(h.name)) {
          completed = completed.filter(n => n !== h.name);
          li.classList.remove('completed');
          toggle.textContent = 'Mark done';
          toggle.setAttribute('aria-pressed','false');
        } else {
          completed.push(h.name);
          li.classList.add('completed');
          toggle.textContent = 'Completed';
          toggle.setAttribute('aria-pressed','true');
        }
        saveCompleted();
        if (completed.length === todays.length) showPageStatus('success', "All today's habits completed — great job!");
      });

      right.appendChild(toggle);
      li.appendChild(left);
      li.appendChild(right);
      listEl.appendChild(li);
    });

    panel.hidden = false;
    panel.scrollIntoView({behavior: 'smooth', block: 'center'});
  }

  function showPageStatus(type, message) {
    if (!pageStatus || !pageStatusText) return;
    pageStatus.classList.remove('success','error');
    pageStatus.classList.add(type);
    pageStatusText.textContent = message;
    pageStatus.hidden = false;
    setTimeout(()=> pageStatus.hidden = true, 3500);
  }

  dismissBtn.addEventListener('click', function(){
    localStorage.setItem(dismissedKey, '1');
    panel.hidden = true;
    showPageStatus('success','Reminders dismissed for today.');
  });

  markAllBtn.addEventListener('click', function(){
    completed = todays.map(h=>h.name);
    saveCompleted();
    // refresh UI
    Array.from(listEl.querySelectorAll('.reminder-item')).forEach((li, idx)=>{
      li.classList.add('completed');
      const btn = li.querySelector('button'); if (btn) { btn.textContent='Completed'; btn.setAttribute('aria-pressed','true'); }
    });
    showPageStatus('success','All marked completed.');
  });

  showPanel();
});
