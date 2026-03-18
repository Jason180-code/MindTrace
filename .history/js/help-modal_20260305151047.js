(function(){
  const HELP_CONTENT = `
    <header>
      <h2 id="help-modal-title">Quick Help</h2>
      <button class="close-btn" aria-label="Close help">✕</button>
    </header>
    <div class="help-body">
      <p>Quick tips to use MindTrace:</p>
      <ul class="help-list">
        <li>Add small, specific habits (e.g., "10-minute walk").</li>
        <li>Use the <strong>Add</strong> button to create habits and track daily progress.</li>
        <li>Visit <a href="resources.html">Resources</a> for guides and examples.</li>
      </ul>
      <p>If you need more help, visit the Resources page for detailed guidance.</p>
    </div>
  `;

  function createModal(trigger) {
    const backdrop = document.createElement('div');
    backdrop.className = 'help-modal-backdrop';
    backdrop.tabIndex = -1;
    backdrop.setAttribute('role', 'presentation');

    const dialog = document.createElement('div');
    dialog.className = 'help-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'help-modal-title');

    dialog.innerHTML = HELP_CONTENT;
    backdrop.appendChild(dialog);

    // close handlers
    function closeModal() {
      document.body.removeChild(backdrop);
      trigger.focus();
      document.removeEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
      // simple focus trap: keep focus within dialog
      if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll('a, button, input, textarea, select');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }

    backdrop.addEventListener('click', function(e){