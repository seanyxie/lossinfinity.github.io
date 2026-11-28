const one = (selector, root = document) => root.querySelector(selector);
const all = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const entries = all('.entry');
const dialog = one('#viewer');
const viewer = one('#viewer-body');
const title = one('#dialog-title');
const search = one('#search');
let category = 'role';
let kind = '';
let opener;

function filterEntries() {
  const query = search.value.trim().toLocaleLowerCase();
  let visible = 0;
  for (const card of entries) {
    const words = (card.textContent + ' ' + card.dataset.alias).toLocaleLowerCase();
    card.hidden = card.dataset.cat !== category || (kind && card.dataset.kind !== kind) || !words.includes(query);
    if (!card.hidden) visible++;
  }
  one('#empty').hidden = visible > 0;
}

for (const tab of all('[data-category]')) {
  tab.addEventListener('click', () => {
    category = tab.dataset.category;
    kind = '';
    search.value = '';
    all('[data-category]').forEach(button => button.setAttribute('aria-pressed', button === tab));
    all('[data-filter]').forEach(button => button.setAttribute('aria-pressed', !button.dataset.filter));
    one('#kinds').hidden = category !== 'build';
    filterEntries();
  });
}
for (const button of all('[data-filter]')) {
  button.addEventListener('click', () => {
    kind = button.dataset.filter;
    all('[data-filter]').forEach(item => item.setAttribute('aria-pressed', item === button));
    filterEntries();
  });
}
search.addEventListener('input', filterEntries);

function openViewer(label, content, trigger) {
  title.textContent = label;
  viewer.replaceChildren(content);
  if (!dialog.open) {
    opener = trigger;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }
}
function showArt(slug, trigger) {
  const gallery = trigger.closest('.screens-grid') || one('#media');
  const pictures = all('.media-tile[data-art]', gallery);
  const index = pictures.findIndex(item => item.dataset.art === slug);
  const figure = document.createElement('div');
  const image = document.createElement('img');
  image.className = 'large-art';
  image.src = 'assets/' + slug + '.webp';
  image.alt = pictures[index].dataset.title;
  const controls = document.createElement('div');
  controls.className = 'art-controls';
  for (const [step, label] of [[-1, viewer.dataset.previous], [1, viewer.dataset.next]]) {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      const next = (index + step + pictures.length) % pictures.length;
      showArt(pictures[next].dataset.art, trigger);
      all('button', one('.art-controls'))[step === -1 ? 0 : 1].focus();
    });
    controls.append(button);
  }
  figure.append(image, controls);
  openViewer(image.alt, figure, trigger);
}
for (const button of all('[data-art]')) {
  button.addEventListener('click', () => showArt(button.dataset.art, button));
}
for (const button of all('[data-clip]')) {
  button.addEventListener('click', () => {
    const slug = button.dataset.clip;
    const label = one('.media-tile[data-clip="' + slug + '"]').dataset.title;
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.poster = 'assets/' + slug + '.webp';
    video.src = 'assets/' + slug + '.mp4';
    video.setAttribute('aria-label', label);
    openViewer(label, video, button);
    video.play().catch(() => {});
  });
}
for (const card of entries) {
  card.addEventListener('click', () => {
    const layout = document.createElement('div');
    layout.className = 'detail';
    const description = document.createElement('div');
    description.append(one('template', card).content.cloneNode(true));
    layout.append(one('.portrait', card).firstElementChild.cloneNode(true), description);
    openViewer(one('strong', card).textContent, layout, card);
  });
}
one('.close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  one('video', viewer)?.pause();
  viewer.replaceChildren();
  document.body.style.overflow = '';
  opener?.focus({preventScroll:true});
});
