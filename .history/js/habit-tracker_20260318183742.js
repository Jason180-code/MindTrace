(function(){
  const STORAGE_KEY = 'mindtrace_habits_v1';
  const modal = document.getElementById('habit-modal');
  const openBtn = document.getElementById('add-habit-btn');
  const cancelBtn = document.getElementById('modal-cancel');
  const form = document.getElementById('modal-habit-form');
  const habitsList = document.querySelector('.habits-list');
  const pageStatus = document.getElementById('page-status');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmMessage = document.getElementById('confirm-message');
  const undoToast = document.getElementById('undo-toast');
  const undoBtn = document.getElementById('undo-btn');
  let pendingDelete = null;
  let lastDeleted = null;
  let undoTimer = null;

  // ensure confirm modal and undo toast are hidden on initial load
  if(confirmModal){ confirmModal.classList.remove('show'); confirmModal.setAttribute('aria-hidden','true'); }
  if(undoToast){ undoToast.style.display = 'none'; }

  let storedHabits = loadHabits();
  // load completions map (habitId -> [YYYY-MM-DD])
  let completionsMap = (function(){ try{ return JSON.parse(localStorage.getItem('mindtrace_habit_completions_v1'))||{} }catch(e){return{}} })();
  // sanitize stored completions: remove stray keys and keep only keys matching stored habits
  try{
    const validIds = new Set((storedHabits||[]).map(h=>String(h.id)));
    Object.keys(completionsMap).forEach(k=>{ if(!validIds.has(k)) delete completionsMap[k]; });
    // ensure arrays are arrays and unique
    Object.keys(completionsMap).forEach(k=>{
      if(!Array.isArray(completionsMap[k])) completionsMap[k]=[];
      completionsMap[k] = Array.from(new Set(completionsMap[k]));
    });
    localStorage.setItem('mindtrace_habit_completions_v1', JSON.stringify(completionsMap));
  }catch(e){/* ignore sanitize errors */}

  function loadHabits(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }catch(e){ return []; }
  }

  function saveHabits(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(storedHabits)); }catch(e){ console.warn('Failed to save habits', e); }
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
    // mark checkbox as done if today's completion exists
    try{
      const today = (new Date()).toISOString().slice(0,10);
      const arr = completionsMap[String(h.id)]||[];
      if(arr.includes(today)){
        const btn = card.querySelector('.habit-checkbox');
        if(btn) btn.classList.add('done');
      }
    }catch(e){}
    return card;
  }

  function renderStoredHabits(){
    if(!habitsList || !storedHabits.length) return;
    // render newest first
    for(let i = storedHabits.length - 1; i >= 0; i--){
      const h = storedHabits[i];
      const card = createHabitCard(h);
      habitsList.insertBefore(card, habitsList.firstChild);
    }
  }

  let currentEditId = null;
  function showModal(){ modal.classList.add('show'); modal.setAttribute('aria-hidden','false'); document.getElementById('m-habit-name').focus(); }
  function hideModal(){ modal.classList.remove('show'); modal.setAttribute('aria-hidden','true'); form.reset(); currentEditId = null; }

  // add button now links to add-habit.html — do not open modal here
  cancelBtn && cancelBtn.addEventListener('click', function(){ hideModal(); });

  form && form.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('m-habit-name').value.trim();
    const freq = document.getElementById('m-habit-frequency').value;
    const cat = document.getElementById('m-habit-category').value;
    if(!name || !freq) return;

    if(currentEditId){
      // update existing
      const idx = storedHabits.findIndex(x=>String(x.id)===String(currentEditId));
      if(idx>-1){
        storedHabits[idx].name = name;
        storedHabits[idx].freq = freq;
        storedHabits[idx].category = cat;
        saveHabits();
        // update DOM card
        const card = habitsList.querySelector(`[data-habit-id="${currentEditId}"]`);
        if(card){
          card.querySelector('h3').textContent = name;
          card.querySelector('.habit-frequency').textContent = freq;
        }
        showStatus('Habit updated');
      }
      hideModal();
      return;
    }

    const habitObj = { id: Date.now(), name, freq, category: cat, streak: 0 };
    storedHabits.push(habitObj);
    saveHabits();

    const card = createHabitCard(habitObj);
    habitsList.insertBefore(card, habitsList.firstChild);
    showStatus('Habit saved');
    hideModal();
  });

  // small helper to show brief status at bottom of page
  let statusTimer = null;
  const bottomStatus = document.getElementById('bottom-status');
  const bottomStatusText = document.getElementById('bottom-status-text');
  if(pageStatus) pageStatus.hidden = true; // keep top status hidden
  function showStatus(msg){
    if(bottomStatus && bottomStatusText){
      bottomStatusText.textContent = msg;
      bottomStatus.style.display = 'block';
      if(statusTimer) clearTimeout(statusTimer);
      statusTimer = setTimeout(()=>{ bottomStatus.style.display = 'none'; statusTimer = null; }, 2000);
      return;
    }
    // fallback to pageStatus if bottomStatus missing
    if(pageStatus){
      pageStatus.hidden = false;
      pageStatus.querySelector('.status-text').textContent = msg;
      setTimeout(()=>{ pageStatus.hidden = true; }, 1800);
    }
  }

  // simple escape to prevent accidental html injection
  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // delegate click for newly created check buttons (no persistence for check state yet)
  // track recent user toggles to avoid programmatic/duplicate writes
  const lastUserToggle = {};
  document.addEventListener('click', function(e){
    const target = e.target;
    if(!target) return;
    // mark done
    if(target.classList && target.classList.contains('habit-checkbox')){
      const card = target.closest('.habit-card');
      if(!card) return;
      const id = card.dataset.habitId;
      if(!id){ console.warn('habit-checkbox clicked but card has no data-habit-id, ignoring'); return; }
      // mark this id as recently toggled by user
      lastUserToggle[id] = Date.now();
      const today = (new Date()).toISOString().slice(0,10);
      // Other scripts (reminders.js) may also toggle classes; wait a tick and read final state
      setTimeout(function(){
        try{
          // only save if user recently toggled this id (within 2s)
          if(!lastUserToggle[id] || (Date.now() - lastUserToggle[id] > 2000)) return;
          // support multiple sources of truth: reminders.js uses card.completed-today and aria-pressed
          const isNowDone = (card.classList && card.classList.contains('completed-today')) || target.classList.contains('done') || (target.getAttribute && target.getAttribute('aria-pressed') === 'true');
          const KEY = 'mindtrace_habit_completions_v1';
          const raw = localStorage.getItem(KEY);
          const map = raw ? JSON.parse(raw) : {};
          const arr = Array.isArray(map[id]) ? map[id] : [];
          if(isNowDone){
            if(!arr.includes(today)) arr.push(today);
          } else {
            const idx = arr.indexOf(today);
            if(idx>-1) arr.splice(idx,1);
          }
          // de-duplicate
          map[id]=Array.from(new Set(arr));
          localStorage.setItem(KEY, JSON.stringify(map));
          completionsMap[id]=map[id];
        }catch(e){ console.warn('save completion failed', e); }
      }, 0);
      return;
    }
    // delete (show custom confirm modal)
    if(target.classList && target.classList.contains('habit-delete')){
      const card = target.closest('.habit-card');
      if(!card) return;
      const id = card.dataset.habitId;
      pendingDelete = { id, card };
      const name = card.querySelector('h3') ? card.querySelector('h3').textContent : '';
      confirmMessage.textContent = `Delete "${name}"?`;
      confirmModal.classList.add('show');
      confirmModal.setAttribute('aria-hidden','false');
      return;
    }
    // edit
    if(target.classList && target.classList.contains('habit-edit')){
      const card = target.closest('.habit-card');
      if(!card) return;
      const id = card.dataset.habitId;
      const habit = storedHabits.find(h=>String(h.id)===String(id));
      if(!habit) return;
      // populate modal and set edit id
      document.getElementById('m-habit-name').value = habit.name || '';
      document.getElementById('m-habit-frequency').value = habit.freq || '';
      document.getElementById('m-habit-category').value = habit.category || '';
      currentEditId = id;
      showModal();
      return;
    }
  });

  // confirm modal handlers
  confirmCancel && confirmCancel.addEventListener('click', function(){
    pendingDelete = null;
    confirmModal.classList.remove('show');
    confirmModal.setAttribute('aria-hidden','true');
  });

  confirmOk && confirmOk.addEventListener('click', function(){
    if(!pendingDelete) return;
    const { id, card } = pendingDelete;
    // capture deleted object for undo
    const idx = storedHabits.findIndex(h=>String(h.id)===String(id));
    if(idx > -1){
      lastDeleted = storedHabits.splice(idx,1)[0];
      saveHabits();
    } else {
      lastDeleted = null;
    }
    // remove completions for this habit
    try{ if(lastDeleted && completionsMap && completionsMap[String(lastDeleted.id)]){ delete completionsMap[String(lastDeleted.id)]; localStorage.setItem('mindtrace_habit_completions_v1', JSON.stringify(completionsMap)); } }catch(e){}
    if(card) card.remove();
    showStatus('Habit deleted');
    pendingDelete = null;
    confirmModal.classList.remove('show');
    confirmModal.setAttribute('aria-hidden','true');

    // show undo toast for a few seconds
    if(undoTimer) clearTimeout(undoTimer);
    if(undoToast){ undoToast.style.display = 'flex'; }
    undoTimer = setTimeout(function(){
      if(undoToast) undoToast.style.display = 'none';
      lastDeleted = null;
      undoTimer = null;
    }, 6000);
  });

  undoBtn && undoBtn.addEventListener('click', function(){
    if(!lastDeleted) return;
    storedHabits.push(lastDeleted);
    saveHabits();
    const card = createHabitCard(lastDeleted);
    habitsList.insertBefore(card, habitsList.firstChild);
    if(undoToast) undoToast.style.display = 'none';
    if(undoTimer) clearTimeout(undoTimer);
    undoTimer = null;
    showStatus('Restore successful');
    lastDeleted = null;
  });

  // initial render from storage
  renderStoredHabits();
})();
