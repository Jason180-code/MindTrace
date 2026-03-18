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

  // --- Reward system: listen for habit checkbox clicks and award points when all daily habits completed ---
  const completedKey = 'completed_' + todayKey;
  const rewardGivenKey = 'reward_given_' + todayKey;
  const pointsKey = 'reward_points';

  function loadCompleted() {
    try { return JSON.parse(localStorage.getItem(completedKey) || '[]'); } catch (e) { return []; }
  }
  function saveCompleted(arr) { try { localStorage.setItem(completedKey, JSON.stringify(arr)); } catch(e){} }

  function giveReward() {
    if (localStorage.getItem(rewardGivenKey)) return;
    const award = 10; // points per full completion
    const prev = parseInt(localStorage.getItem(pointsKey) || '0', 10) || 0;
    const total = prev + award;
    try { localStorage.setItem(pointsKey, String(total)); localStorage.setItem(rewardGivenKey, '1'); } catch(e){}
    // show a small modal reward
    const rb = document.createElement('div'); rb.className = 'reminder-modal-backdrop';
    const rd = document.createElement('div'); rd.className = 'reminder-modal'; rd.setAttribute('role','dialog'); rd.setAttribute('aria-modal','true');
    const h = document.createElement('h2'); h.textContent = 'Reward Unlocked!'; rd.appendChild(h);
    const p = document.createElement('p'); p.textContent = `You completed all daily habits — +${award} points (Total: ${total}).`; rd.appendChild(p);
    const ok = document.createElement('button'); ok.className='button small'; ok.type='button'; ok.textContent='Awesome'; ok.addEventListener('click', ()=>{ document.body.removeChild(rb); });
    const actions = document.createElement('div'); actions.className='modal-actions'; actions.appendChild(ok); rd.appendChild(actions);
    rb.appendChild(rd);
    rb.addEventListener('click', (e)=>{ if (e.target===rb) document.body.removeChild(rb); });
    document.body.appendChild(rb);
  }

  // attach listener to habit checkbox buttons
  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('.habit-checkbox');
    if (!btn) return;
    const card = btn.closest('.habit-card');
    if (!card) return;
    const nameEl = card.querySelector('h3');
    const name = nameEl ? nameEl.textContent.trim() : null;
    if (!name) return;
    // toggle visual state
    card.classList.toggle('completed-today');
    // update completed list
    const comp = loadCompleted();
    const idx = comp.indexOf(name);
    if (idx === -1) comp.push(name); else comp.splice(idx,1);
    saveCompleted(comp);
    // check if all daily habits completed
    const allNames = todays.map(t=>t.name);
    const fulfilled = allNames.every(n => comp.indexOf(n) !== -1);
    if (fulfilled) giveReward();
  });
});
