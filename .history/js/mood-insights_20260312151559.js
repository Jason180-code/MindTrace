(function(){
  const STORAGE_KEY = 'mindtrace_mood_entries_v1';
  function loadEntries(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){return[]} }

  // buckets: emoji -> display label (matches mood-insights.html order)
  const buckets = [
    { emoji: '😄', label: 'Happy 😄' },
    { emoji: '😊', label: 'Satisfied 😊' },
    { emoji: '😐', label: 'Exhausted 😐' },
    { emoji: '😢', label: 'Sad 😢' },
    { emoji: '😥', label: 'Anxious 😥' }
  ];

  function countLast30(entries){
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-29); // include today -> 30 days
    const cutoffISO = cutoff.toISOString().slice(0,10);
    const counts = {};
    let total = 0;
    (entries||[]).forEach(e=>{
      if(!e || !e.date) return;
      if(e.date < cutoffISO) return;
      total++;
      counts[e.emoji] = (counts[e.emoji]||0) + 1;
    });
    return { counts, total };
  }

  function updateChart(){
    const entries = loadEntries();
    const { counts, total } = countLast30(entries);
    const chart = document.querySelector('.chart-placeholder');
    if(!chart) return;

    // find chart-bars in order and update
    const bars = chart.querySelectorAll('.chart-bar');
    buckets.forEach((b, idx)=>{
      const barWrap = bars[idx];
      if(!barWrap) return;
      const bar = barWrap.querySelector('.bar');
      const value = barWrap.querySelector('.bar-value');
      const cnt = counts[b.emoji] || 0;
      const pct = total > 0 ? Math.round((cnt/total)*100) : 0;
      if(bar) bar.style.width = pct + '%';
      if(value) value.textContent = pct + '%';
      // also update label to show counts optionally
      const labelEl = barWrap.querySelector('.bar-label');
      if(labelEl) labelEl.textContent = `${b.label}`;
    });

    // if no data, show subtle hint
    const noDataHint = chart.querySelector('.no-data-hint');
    if(total===0){
      if(!noDataHint){
        const p = document.createElement('p'); p.className='no-data-hint'; p.textContent = 'No mood entries in the last 30 days.';
        chart.appendChild(p);
      }
    } else {
      if(noDataHint) noDataHint.remove();
    }
  }

  // run on load
  document.addEventListener('DOMContentLoaded', updateChart);
  // also observe storage events so other tabs update
  window.addEventListener('storage', function(e){ if(e.key===STORAGE_KEY) updateChart(); });
})();
