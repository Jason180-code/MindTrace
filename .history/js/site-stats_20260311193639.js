document.addEventListener('DOMContentLoaded', () => {
  const statEls = Array.from(document.querySelectorAll('.stats .stat-number'));
  if (!statEls || statEls.length < 3) return;

  // Habits: expect `habits` in localStorage as JSON array (created when adding habits)
  try {
    const habits = JSON.parse(localStorage.getItem('habits') || 'null');
    if (Array.isArray(habits)) statEls[0].textContent = String(habits.length);
  } catch (e) {}

  // Mood entries: expect `mood_entries` in localStorage as JSON array
  try {
    const moods = JSON.parse(localStorage.getItem('mood_entries') || 'null');
    if (Array.isArray(moods)) statEls[1].textContent = String(moods.length);
  } catch (e) {}

  // Days active: count distinct dates with keys like `completed_YYYY-MM-DD`
  try {
    const keys = Object.keys(localStorage);
    const dayKeys = new Set();
    keys.forEach(k => {
      const m = k.match(/^completed_(\d{4}-\d{2}-\d{2})$/);
      if (m) dayKeys.add(m[1]);
    });
    if (dayKeys.size > 0) statEls[2].textContent = String(dayKeys.size);
  } catch (e) {}
});