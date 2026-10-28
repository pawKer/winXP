(function() {
  var query = new URLSearchParams(window.location.search);
  var view = query.get('view');
  var saved = window.history.state && window.history.state.state;
  if (
    window.location.pathname !== '/' ||
    view === 'read' ||
    (view !== 'desktop' && saved && saved.presentation === 'read')
  )
    return;

  document.documentElement.classList.add('desktop-starting');
  // Preserve the readable HTML if the application scripts cannot start.
  window.__desktopStartupTimer = window.setTimeout(function() {
    document.documentElement.classList.remove('desktop-starting');
  }, 12000);
})();
