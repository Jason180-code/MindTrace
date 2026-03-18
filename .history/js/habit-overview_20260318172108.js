(function(){
  const STORAGE_KEY = 'mindtrace_habits_v1';
  const COMP_KEY = 'mindtrace_habit_completions_v1';
  function loadHabits(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){return[];} }
  function loadComps(){ try{ return JSON.parse(localStorage.getItem(COMP_KEY))||{} }catch(e){return{}} }

  const habits = loadHabits();
  const comps = loadComps();
  const container = document.getElementById('habit-progress-list');
  if(!container) return;