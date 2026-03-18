(function(){
  const STORAGE_KEY = 'mindtrace_mood_entries_v1';
  const map = { 'Happy':'😄', 'Satisfied':'😊', 'Exhausted':'😐', 'Sad':'😢', 'Anxious':'😥' };
  
  function load(){ 
    try { 
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
    } catch(e) { 
      return []; 
    } 
  }
  
  function save(v){ 
    try { 
      localStorage.setItem(STORAGE_KEY, JSON.stringify(v || [])); 
    } catch(e) {} 
  }

  const sel = document.getElementById('mood-select');
  const note = document.getElementById('mood-note');
  const btn = document.getElementById('save-entry');

  if(btn){
    btn.addEventListener('click', function(){
      const label = sel.value;
      const emoji = map[label] || '😐';
      const ts = Date.now();
      const date = new Date(ts).toISOString().slice(0, 10);
      const entry = { emoji, label, ts, date, note: note.value };

      const arr = load();
      const idx = arr.findIndex(x => x && x.date === date);
      
      // Update existing entry for today or push a new one
      if(idx >= 0) arr[idx] = entry; 
      else arr.push(entry);
      
      save(arr);
      
      // Navigate to insights page after saving
      window.location.href = 'mood-insights.html';
    });
  }
})();