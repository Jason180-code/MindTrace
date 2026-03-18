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