// open external links in a new tab; document$ re-fires on instant navigation
document$.subscribe(() => {
  document.querySelectorAll('a[href^="http"]').forEach(a => {
    if (a.hostname !== location.hostname) {
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
});
