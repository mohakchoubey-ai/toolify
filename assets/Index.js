const yearNode = document.querySelector('.site-footer p');
if (yearNode) {
  const year = new Date().getFullYear();
  yearNode.textContent = `© ${year} Toolify`;
}
