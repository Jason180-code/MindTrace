(function(){
  const STORAGE_KEY = 'mindtrace_mood_entries_v1';
  const buttons = document.querySelectorAll('.mood-btn');
  const entriesList = document.getElementById('entries-list');

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function loadEntries(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){return[]} }
  function saveEntries(arr){ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr||[])) }catch(e){} }
  function prependEntryToDOM(obj){
    // remove empty placeholder
    const empty = entriesList.querySelector('.empty'); if(empty) empty.remove();
    const entry = document.createElement('div');
    entry.className = 'entry-item';
    entry.innerHTML = `
      <div class="entry-head">
        <span class="entry-mood">${escapeHtml(obj.emoji)}</span>
        <strong class="entry-label">${escapeHtml(obj.label)}</strong>
        <span class="entry-time">${new Date(obj.ts).toLocaleString()}</span>
      </div>
      <div class="entry-body"><em>${escapeHtml(obj.note||'Recorded via quick mood selector')}</em></div>
    `;
    entriesList.insertBefore(entry, entriesList.firstChild);
  }

  // migrate, dedupe (one entry per date, keep latest), and initialize existing entries
  let existing = loadEntries() || [];
  // allowed mapping (keep only these emojis and normalize labels)
  const allowed = { '😄':'Happy', '😊':'Satisfied', '😐':'Exhausted', '😢':'Sad', '😥':'Anxious' };
  const byDate = {}; // date -> entry (keep latest ts)
  existing.forEach(e=>{
    if(!e || !e.emoji) return;
    if(!(e.emoji in allowed)) return;
    const date = e.date || (e.ts ? new Date(e.ts).toISOString().slice(0,10) : new Date().toISOString().slice(0,10));
    const candidate = Object.assign({}, e, { label: allowed[e.emoji], date });
    if(!byDate[date] || (candidate.ts && (byDate[date].ts||0) < candidate.ts)) byDate[date] = candidate;
  });
  existing = Object.values(byDate).sort((a,b)=> (b.ts||0) - (a.ts||0)); // newest first
  // persist cleaned set
  saveEntries(existing);
  if(existing.length===0){ /* keep placeholder */ } else { existing.forEach(e=> prependEntryToDOM(e)); }

  function addEntry(moodEmoji, moodLabel){
    const time = Date.now();
    const iso = new Date(time).toISOString().slice(0,10);
    const obj = { emoji: moodEmoji, label: moodLabel, ts: time, date: iso };
    // persist: replace any existing entry for today
    const arr = loadEntries();
    const idx = arr.findIndex(x=> x && x.date === iso);
    if(idx >= 0){ arr[idx] = obj; } else { arr.push(obj); }
    saveEntries(arr);

    // re-render list (newest first)
    entriesList.innerHTML = '';
    if(arr.length===0){ entriesList.innerHTML = '<p class="empty">No entries yet. Start by adding your first daily entry!</p>'; }
    else { arr.slice().reverse().forEach(e=> prependEntryToDOM(e)); }
    // notify other tabs via storage event is automatic from localStorage write
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', function(){
      buttons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const moodEmoji = this.getAttribute('data-mood');
      const moodLabel = this.getAttribute('data-label');
      addEntry(moodEmoji, moodLabel);
    });
  });
})();
