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
  document.addEventListener('click', function(e){
    const target = e.target;
    if(!target) return;
    // mark done
    if(target.classList && target.classList.contains('habit-checkbox')){
      const card = target.closest('.habit-card');
      if(!card) return;
      const id = card.dataset.habitId;
      if(!id){ console.warn('habit-checkbox clicked but card has no data-habit-id, ignoring'); return; }
      console.log('habit-tracker: click detected', {id});
      // Persistence is handled by a MutationObserver (see below).
      // Keep click handling minimal and non-invasive so other scripts can update the UI.
      console.log('habit-tracker: click detected (observer will persist)', {id});
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

  // MutationObserver: observe DOM attribute changes (class / aria-pressed) and persist completions
  (function setupObserver(){
    const KEY = 'mindtrace_habit_completions_v1';
    const debounceTimers = new Map();

    function schedulePersist(id, delay = 300){
      if(!id) return;
      if(debounceTimers.has(id)) clearTimeout(debounceTimers.get(id));
      debounceTimers.set(id, setTimeout(()=>{ debounceTimers.delete(id); persistForId(id); }, delay));
    }

    function persistForId(id){
      try{
        const card = document.querySelector(`.habit-card[data-habit-id="${id}"]`);
        if(!card) return;
        const btn = card.querySelector('.habit-checkbox');
        const isNowDone = (card.classList && card.classList.contains('completed-today')) || (btn && btn.classList.contains('done')) || (btn && btn.getAttribute && btn.getAttribute('aria-pressed') === 'true');
        const raw = localStorage.getItem(KEY);
        const map = raw ? JSON.parse(raw) : {};
        const arr = Array.isArray(map[id]) ? map[id] : [];
        const today = (new Date()).toISOString().slice(0,10);
        const hasToday = arr.includes(today);
        if(isNowDone && !hasToday){
          arr.push(today);
          map[id] = Array.from(new Set(arr));
          localStorage.setItem(KEY, JSON.stringify(map));
          completionsMap[id] = map[id];
          try{ console.log('habit-tracker: observer saved (added)', {id, arrAfter: map[id]}); }catch(e){}
        } else if(!isNowDone && hasToday){
          const newArr = arr.filter(d=>d!==today);
          if(newArr.length>0){
            map[id] = newArr;
            completionsMap[id] = map[id];
          } else {
            // remove key entirely to avoid stale empty arrays
            if(map.hasOwnProperty(id)) delete map[id];
            if(completionsMap && completionsMap.hasOwnProperty(id)) delete completionsMap[id];
          }
          localStorage.setItem(KEY, JSON.stringify(map));
          try{ console.log('habit-tracker: observer saved (removed)', {id, arrAfter: map[id]||[]}); }catch(e){}
        }
      }catch(e){ console.warn('habit-tracker: observer persist failed', e); }
    }

    const observer = new MutationObserver(function(mutations){
      mutations.forEach(m=>{
        if(m.type !== 'attributes') return;
        const target = m.target;
        const card = (target.closest && target.closest('.habit-card')) ? target.closest('.habit-card') : (target.classList && target.classList.contains('habit-card') ? target : null);
        if(!card) return;
        const id = card.dataset.habitId;
        if(!id) return;
        if(m.attributeName === 'class' || m.attributeName === 'aria-pressed'){
          schedulePersist(id);
        }
      });
    });

    const root = document.querySelector('.habits-list') || document.body;
    try{ observer.observe(root, { attributes: true, subtree: true, attributeFilter: ['class','aria-pressed'] }); }catch(e){ /* ignore if observation fails */ }
  })();

  // Cleanup: if storage has today's date for a habit but the UI isn't marked completed,
  // remove today's date so Overview won't show false positives.
  try{
    const today = (new Date()).toISOString().slice(0,10);
    const cards = document.querySelectorAll('.habits-list .habit-card');
    let changed = false;
    cards.forEach(card=>{
      const id = card.dataset.habitId;
      if(!id) return;
      const btn = card.querySelector('.habit-checkbox');
      const uiDone = (card.classList && card.classList.contains('completed-today')) || (btn && btn.getAttribute && btn.getAttribute('aria-pressed') === 'true') || (btn && btn.classList.contains('done'));
      const arr = Array.isArray(completionsMap[id]) ? completionsMap[id] : [];
      if(!uiDone && arr.includes(today)){
        completionsMap[id] = arr.filter(d=>d!==today);
        changed = true;
      }
    });
    if(changed) localStorage.setItem('mindtrace_habit_completions_v1', JSON.stringify(completionsMap));
  }catch(e){/* ignore cleanup errors */}
})();
