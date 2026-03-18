(function(){
  const STORAGE_KEY = 'mindtrace_habits_v1';
  const modal = document.getElementById('habit-modal');
  const openBtn = document.getElementById('add-habit-btn');
  const cancelBtn = document.getElementById('modal-cancel');
  const form = document.getElementById('modal-habit-form');
  const habitsList = document.querySelector('.habits-list');
  const pageStatus = document.getElementById('page-status');
  const confirmModal = document.getElementById('confirm-modal');
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmMessage = document.getElementById('confirm-message');
  const undoToast = document.getElementById('undo-toast');
  const undoBtn = document.getElementById('undo-btn');
  let pendingDelete = null;
  let lastDeleted = null;
  let undoTimer = null;

  // ensure confirm modal and undo toast are hidden on initial load
  if(confirmModal){ confirmModal.classList.remove('show'); confirmModal.setAttribute('aria-hidden','true'); }
  if(undoToast){ undoToast.style.display = 'none'; }

  let storedHabits = loadHabits();
  // load completions map (habitId -> [YYYY-MM-DD])