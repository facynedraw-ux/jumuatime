const _ps = document.createElement('style');
_ps.textContent = 'img{-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none;}';
document.head.appendChild(_ps);

document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
document.addEventListener('dragstart', e => {
  if (e.target.tagName === 'IMG') e.preventDefault();
});
