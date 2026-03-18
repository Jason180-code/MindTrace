document.addEventListener('DOMContentLoaded', () => {
  console.log('site-stats: init');
  const statEls = Array.from(document.querySelectorAll('.stats .stat-number'));
  if (!statEls || statEls.length < 3) { console.warn('site-stats: stat elements not found', statEls); return; }

  const updated = [false, false, false];

  // Habits: expect `habits` in localStorage as JSON array (created when adding habits)
  try {
    const habits = JSON.parse(localStorage.getItem('habits') || 'null');
    if (Array.isArray(habits)) { statEls[0].textContent = String(habits.length); updated[0] = true; console.log('site-stats: habits=', habits.length); }
  } catch (e) { console.error('site-stats: habits parse error', e); }

  // Mood entries: expect `mood_entries` in localStorage as JSON array
  try {
    const moods = JSON.parse(localStorage.getItem('mood_entries') || 'null');
    if (Array.isArray(moods)) { statEls[1].textContent = String(moods.length); updated[1] = true; console.log('site-stats: moods=', moods.length); }
  } catch (e) { console.error('site-stats: moods parse error', e); }

  // Days active: count distinct dates with keys like `completed_YYYY-MM-DD`
  try {
    const keys = Object.keys(localStorage || {});
    const dayKeys = new Set();
    keys.forEach(k => {
      const m = k.match(/^completed_(\d{4}-\d{2}-\d{2})$/);
      if (m) dayKeys.add(m[1]);
    });
    if (dayKeys.size > 0) { statEls[2].textContent = String(dayKeys.size); updated[2] = true; console.log('site-stats: days=', dayKeys.size); }
  } catch (e) { console.error('site-stats: days parse error', e); }

  // If nothing was found, show demo values so the user can see the section working
  if (!updated.some(Boolean)) {
    console.info('site-stats: no stored data found — applying demo values for testing');
    statEls[0].textContent = '3';
    statEls[1].textContent = '5';
    statEls[2].textContent = '12';
  }
});