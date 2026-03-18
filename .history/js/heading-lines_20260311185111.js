// Wrap segments separated by <br> inside h1.tracking-in-expand into
// <span class="tracking-line"> so each visual line can animate separately.

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('h1.tracking-in-expand').forEach(h1 => {
    // If already processed, skip
    if (h1.dataset.linesProcessed === 'true') return;

    // Use the HTML content and split on <br> tags (support multiple formats)
    const html = h1.innerHTML.trim();
    // Normalize <br> forms
    const parts = html.split(/<br\s*\/?>/i).map(s => s.trim()).filter(Boolean);
    if (parts.length <= 1) {
      // nothing to split, ensure it's wrapped for consistency
      h1.innerHTML = `<span class="tracking-line">${html}</span>`;
    } else {
      h1.innerHTML = parts.map(p => `<span class="tracking-line">${p}</span>`).join('');
    }
    h1.dataset.linesProcessed = 'true';
  });
});
