(function(){
  const STORAGE_KEY = 'mindtrace_habits_v1';
  const modal = document.getElementById('habit-modal');
  const cancelBtn = document.getElementById('modal-cancel');
  const form = document.getElementById('modal-habit-form');
  const habitsList = document.querySelector('.habits-list');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmMessage = document.getElementById('confirm-message');
  const undoToast = document.getElementById('undo-toast');
  const undoBtn = document.getElementById('undo-btn');
  let pendingDelete = null;
  let lastDeleted = null;
  let undoTimer = null;

  if(confirmModal){ 
    confirmModal.classList.remove('show'); 
    confirmModal.setAttribute('aria-hidden','true'); 
  }
  if(undoToast) undoToast.style.display = 'none';

  let storedHabits = (function(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }catch(e){ return []; }
  })();

  let completionsMap = (function(){ 
    try{ 
      const map = JSON.parse(localStorage.getItem('mindtrace_habit_completions_v1')) || {};
      const validIds = new Set(storedHabits.map(h => String(h.id)));
      Object.keys(map).forEach(k => { if(!validIds.has(k)) delete map[k]; });
      return map;
    }catch(e){ return {}; } 
  })();

  function saveHabits(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedHabits));
  }

  function createHabitCard(h){
    const card = document.createElement('div');
    card.className = 'habit-card';
    card.dataset.habitId = h.id || '';
    card.innerHTML = `
      <div class="habit-info">
        <h3>${escapeHtml(h.name)}</h3>
        <p class="habit-frequency">${escapeHtml(h.freq)}</p>
        <p class="habit-streak">🔥 ${Number(h.streak||0)}-day streak</p>
      </div>
      <div class="habit-actions">
        <button class="habit-edit" title="Edit">✎</button>
        <button class="habit-delete" title="Delete">🗑</button>
        <button class="habit-checkbox" title="Mark done">✓</button>
      </div>
    `;
    const today = (new Date()).toISOString().slice(0,10);
    if((completionsMap[String(h.id)] || []).includes(today)){
      const btn = card.querySelector('.habit-checkbox');
      if(btn) btn.classList.add('done');
    }
    return card;
  }

  function renderStoredHabits(){
    if(!habitsList) return;
    habitsList.innerHTML = '';
    storedHabits.slice().reverse().forEach(h => {
      habitsList.appendChild(createHabitCard(h));
    });
  }

  let currentEditId = null;
  function showModal(){ modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.getElementById('m-habit-name').focus(); }
  function hideModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.reset(); currentEditId = null; }

  cancelBtn && cancelBtn.addEventListener('click', hideModal);

  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('m-habit-name').value.trim();
    const freq = document.getElementById('m-habit-frequency').value;
    const cat = document.getElementById('m-habit-category').value;
    if(!name || !freq) return;

    if(currentEditId){
      const idx = storedHabits.findIndex(x => String(x.id) === String(currentEditId));
      if(idx > -1){
        storedHabits[idx] = { ...storedHabits[idx], name, freq, category: cat };
        saveHabits();
        renderStoredHabits();
        showStatus('Habit updated');
      }
    } else {
      const habitObj = { id: Date.now(), name, freq, category: cat, streak: 0 };
      storedHabits.push(habitObj);
      saveHabits();
      renderStoredHabits();
      showStatus('Habit saved');
    }
    hideModal();
  });

  let statusTimer = null;
  const bottomStatus = document.getElementById('bottom-status');
  function showStatus(msg){
    if(!bottomStatus) return;
    document.getElementById('bottom-status-text').textContent = msg;
    bottomStatus.style.display = 'block';
    if(statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { bottomStatus.style.display = 'none'; }, 2000);
  }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  document.addEventListener('click', function(e){
    const target = e.target;
    if(!target.classList) return;

    const card = target.closest('.habit-card');
    if(!card) return;
    const id = card.dataset.habitId;

    if(target.classList.contains('habit-checkbox')){
      target.classList.toggle('done');
    } else if(target.classList.contains('habit-delete')){
      pendingDelete = { id, card };
      confirmMessage.textContent = `Delete "${card.querySelector('h3').textContent}"?`;
      confirmModal.classList.add('show');
    } else if(target.classList.contains('habit-edit')){
      const habit = storedHabits.find(h => String(h.id) === String(id));
      if(!habit) return;
      document.getElementById('m-habit-name').value = habit.name;
      document.getElementById('m-habit-frequency').value = habit.freq;
      document.getElementById('m-habit-category').value = habit.category;
      currentEditId = id;
      showModal();
    }
  });

  if(confirm)
  confirmOk && confirmOk.addEventListener('click', function(){
    if(!pendingDelete) return;
    const { id, card } = pendingDelete;
    const idx = storedHabits.findIndex(h => String(h.id) === String(id));
    if(idx > -1){
      lastDeleted = storedHabits.splice(idx,1)[0];
      saveHabits();
      delete completionsMap[String(id)];
      localStorage.setItem('mindtrace_habit_completions_v1', JSON.stringify(completionsMap));
      card.remove();
      showStatus('Habit deleted');
      
      if(undoTimer) clearTimeout(undoTimer);
      undoToast.style.display = 'flex';
      undoTimer = setTimeout(() => { undoToast.style.display = 'none'; }, 6000);
    }
    confirmModal.classList.remove('show');
  });

  undoBtn && undoBtn.addEventListener('click', function(){
    if(!lastDeleted) return;
    storedHabits.push(lastDeleted);
    saveHabits();
    renderStoredHabits();
    undoToast.style.display = 'none';
    showStatus('Restore successful');
    lastDeleted = null;
  });

  (function setupObserver(){
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const card = m.target.closest('.habit-card');
        if(!card) return;
        const id = card.dataset.habitId;
        const btn = card.querySelector('.habit-checkbox');
        const isDone = btn.classList.contains('done');
        const today = (new Date()).toISOString().slice(0,10);
        
        let dates = completionsMap[id] || [];
        if(isDone && !dates.includes(today)) dates.push(today);
        else if(!isDone) dates = dates.filter(d => d !== today);
        
        completionsMap[id] = dates;
        localStorage.setItem('mindtrace_habit_completions_v1', JSON.stringify(completionsMap));
      });
    });
    observer.observe(habitsList || document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
  })();

  renderStoredHabits();
})();