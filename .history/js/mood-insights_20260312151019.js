(function(){
  const STORAGE_KEY = 'mindtrace_mood_entries_v1';
  function loadEntries(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||[] }catch(e){return[]} }

  // buckets: emoji -> display label (matches mood-insights.html order)
  const buckets = [
    { emoji: '😃', label: 'Great 😄' },
    { emoji: '😊', label: 'Good 😊' },
    { emoji: '😐', label: 'Okay 😐' },
    { emoji: '😫', label: 'Bad 😟' },
    { emoji: '😢', label: 'Terrible 😢' }
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