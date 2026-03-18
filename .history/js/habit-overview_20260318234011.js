(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const STORAGE_KEY = 'mindtrace_habits_v1';
    const COMP_KEY = 'mindtrace_habit_completions_v1';
    const loadHabits = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const loadComps = () => JSON.parse(localStorage.getItem(COMP_KEY)) || {};

    const habits = loadHabits();
    const comps = loadComps();
    const container = document.getElementById('habit-progress-list');
    if(!container) return;

    function countLastNDays(dates, n){
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - (n-1));
      const cutoffISO = cutoff.toISOString().slice(0,10);
      return (dates || []).filter(d => d >= cutoffISO).length;
    }

    if(habits.length === 0) {
      container.innerHTML = '<p>No habits yet.</p>';
    } else {
      habits.forEach(h => {
        const last30 = countLastNDays(comps[h.id], 30);
        const rate = Math.min(100, Math.round((last30/30)*100));
        const el = document.createElement('div');
        el.className = 'progress-item';
        el.innerHTML = `
          <div class="progress-header">
            <span class="habit-name">${escapeHtml(h.name)}</span>
            <span class="completion-rate">${rate}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${rate}%;"></div></div>
        `;
        container.appendChild(el);
      });
    }

    (function renderInsights(){
      const root = document.getElementById('insight-cards');
      if(!root || habits.length === 0) return;

      const stats = habits.map(h => {
        const arr = comps[h.id] || [];
        let streak = 0, d = new Date();
        while(arr.includes(d.toISOString().slice(0,10))){ streak++; d.setDate(d.getDate()-1); }
        return { name: h.name, rate: Math.round((countLastNDays(arr, 30)/30)*100), streak };
      });

      const best = stats.sort((a,b) => b.rate - a.rate)[0];
      root.innerHTML = `
        <div class="insight-card"><h3>Best Habit</h3><p>${escapeHtml(best.name)}</p><span>${best.rate}% completion</span></div>
      `;
    })();

    function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  });

  // Weekly dynamic overview: past seven days with daily completion status for each habit, and a summary of how many habits were completed each day
  (function renderWeek(){
    try {
      const grid = document.getElementById('week-grid');
      if(!grid) return;
      grid.innerHTML = '';
      
      const days = [];
      // acceess habit data and completions from localStorage
      const habits = JSON.parse(localStorage.getItem('mindtrace_habits_v1')) || [];
      const comps = JSON.parse(localStorage.getItem('mindtrace_habit_completions_v1')) || {};
      for(let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
      }

      days.forEach(day => {
        const iso = day.toISOString().slice(0, 10);
        // h，如 "Mon", "Tue"
        const dayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
        const isToday = iso === new Date().toISOString().slice(0, 10);

        const cell = document.createElement('div');
        cell.className = `day-cell ${isToday ? 'today' : ''}`; // highlight today

        let completedCount = 0;
        const checksContainer = document.createElement('div');
        checksContainer.className = 'checkmarks';

        if(habits.length === 0) {
          checksContainer.innerHTML = '<span>-</span>';
        } else {
          habits.forEach(h => {
            const done = (comps[String(h.id)] || []).includes(iso);
            if(done) completedCount++;
            
            const mark = document.createElement('span');
            mark.className = done ? 'check' : 'not-check';
            mark.textContent = done ? '✓' : '·'; // use a dot for not done to keep layout consistent
            checksContainer.appendChild(mark);
          });
        }

        cell.innerHTML = `
          <span class="day-name">${dayLabel}${isToday ? ' (Today)' : ''}</span>
          <span class="day-complete">${habits.length > 0 ? completedCount + '/' + habits.length : ''}</span>
        `;
        cell.insertBefore(checksContainer, cell.querySelector('.day-complete'));
        grid.appendChild(cell);
      });
    } catch(err) { 
        console.error('Error rendering week overview:', err);
    }
  })();
})();