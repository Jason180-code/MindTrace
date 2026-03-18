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
  
})();