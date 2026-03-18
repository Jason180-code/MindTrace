(function(){
  const FORM = document.querySelector('.habit-form');
  const STORAGE_KEY = 'mindtrace_habits_v1';
  function loadHabits(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch(e){ return []; } }
  function saveHabits(h){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h)); } catch(e){ console.warn(e); } }

  FORM && FORM.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('habit-name').value.trim();
    const freq = document.getElementById('habit-frequency').value;
    const category = document.getElementById('habit-category').value;
    const description = document.getElementById('habit-description').value.trim();
    const time = document.getElementById('habit-time').value.trim();
    if(!name || !freq) return;

    const arr = loadHabits();
    const item = {
      id: Date.now(),
      name: name,
      freq: freq,
      category: category,
      description: description,
      time: time,
      streak: 0
    };
    arr.push(item);
    saveHabits(arr);
    // go back to habit tracker where stored habits will be rendered
    window.location.href = 'habit-tracker.html';
  });
})();
