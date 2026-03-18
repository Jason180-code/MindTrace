document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('habit-form');
  const pageStatus = document.getElementById('page-status');
  const pageStatusText = pageStatus ? pageStatus.querySelector('.status-text') : null;

  if (!form) return;

  function showFieldError(input, message) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.add('error');
    const err = document.getElementById(input.id + '-error');
    if (err) {
      err.textContent = message;
      err.hidden = false;
    }
    input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(input) {
    const group = input.closest('.form-group');
    if (!group) return;
    group.classList.remove('error');
    const err = document.getElementById(input.id + '-error');
    if (err) {
      err.textContent = '';
      err.hidden = true;
    }
    input.removeAttribute('aria-invalid');
  }

  function showPageStatus(type, message) {
    if (!pageStatus || !pageStatusText) return;
    pageStatus.classList.remove('success', 'error');
    pageStatus.classList.add(type);
    pageStatusText.textContent = message;
    pageStatus.hidden = false;
    // hide after 4s
    setTimeout(() => {
      pageStatus.hidden = true;
    }, 4000);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('habit-name');
    const freq = document.getElementById('habit-frequency');

    // clear previous
    [name, freq].forEach(clearFieldError);

    if (!name.value.trim()) {
      valid = false;
      showFieldError(name, 'Please enter a habit name.');
    }

    if (!freq.value) {
      valid = false;
      showFieldError(freq, 'Please select a frequency.');
    }

    if (!valid) {
      showPageStatus('error', 'Please correct the highlighted fields and try again.');
      // focus the first invalid field
      const firstInvalid = form.querySelector('.form-group.error input, .form-group.error select, .form-group.error textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulate success (in real app, do fetch/ajax here)
    showPageStatus('success', 'Habit saved successfully.');
    form.reset();
  });

  // live validation
  form.addEventListener('input', function (e) {
    const target = e.target;
    if (!target || !target.id) return;
    if (target.id === 'habit-name' && target.value.trim()) clearFieldError(target);
    if (target.id === 'habit-frequency' && target.value) clearFieldError(target);
  });
});
