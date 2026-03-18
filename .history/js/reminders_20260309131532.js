document.addEventListener('DOMContentLoaded', function () {
  // build a simple modal listing today's 'Daily' habits and show it once per day
  const habitCards = Array.from(document.querySelectorAll('.habits-list .habit-card'));
  const habits = habitCards.map(card => {
    const nameEl = card.querySelector('h3');
    const freqEl = card.querySelector('.habit-frequency');
    return {
      name: nameEl ? nameEl.textContent.trim() : 'Unnamed habit',
      frequency: freqEl ? freqEl.textContent.trim() : ''
    };
  });

  const todays = habits.filter(h => /daily/i.test(h.frequency));
  if (todays.length === 0) return; // nothing to show

  // only show once per day
  const todayKey = (function(){ const d = new Date(); return d.toISOString().slice(0,10); })();
  const shownKey = 'reminders_shown_' + todayKey;
  if (localStorage.getItem(shownKey)) return;

  // create modal
  const backdrop = document.createElement('div');
  backdrop.className = 'reminder-modal-backdrop';

  const dialog = document.createElement('div');
  dialog.className = 'reminder-modal';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', "Today's habits");

  const title = document.createElement('h2');
  title.textContent = "Today's Habits";
  dialog.appendChild(title);

  const ul = document.createElement('ul');
  todays.forEach(h => {
    const li = document.createElement('li');
    li.textContent = h.name;
    ul.appendChild(li);
  });
  dialog.appendChild(ul);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'button small';
  closeBtn.type = 'button';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => {
    document.body.removeChild(backdrop);
    try { localStorage.setItem(shownKey, '1'); } catch (e) {}
  });
  actions.appendChild(closeBtn);

  dialog.appendChild(actions);
  backdrop.appendChild(dialog);

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) { document.body.removeChild(backdrop); try { localStorage.setItem(shownKey, '1'); } catch (e) {} } });
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { if (document.body.contains(backdrop)) { document.body.removeChild(backdrop); try { localStorage.setItem(shownKey, '1'); } catch (e) {} document.removeEventListener('keydown', onKey); } } });

  document.body.appendChild(backdrop);
});
