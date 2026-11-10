/* app.js - Flashcard Quiz App */
const STORAGE_KEY = 'flashcards';
const SEED_CARDS = [
  { id: 'seed_1', question: 'What is the capital of France?', answer: 'Paris' },
  { id: 'seed_2', question: 'What is 2 + 2?', answer: '4' },
  { id: 'seed_3', question: 'What is the largest planet?', answer: 'Jupiter' },
  { id: 'seed_4', question: 'What color is the sky?', answer: 'Blue' },
  { id: 'seed_5', question: 'What is H2O?', answer: 'Water' },
];

let state = { cards: [], currentIndex: 0, isAnswerVisible: false, editingCardId: null, mode: 'study' };
let sheetOpen = false;
let deletePending = false;

function uid() { return 'card_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

function validateCard(q, a) {
  const qq = (q == null ? '' : String(q)).trim();
  const aa = (a == null ? '' : String(a)).trim();
  if (!qq) return { ok: false, error: 'Enter a question before saving' };
  if (!aa) return { ok: false, error: 'Enter an answer before saving' };
  if (qq.length > 500) return { ok: false, error: 'Question too long (max 500)' };
  if (aa.length > 500) return { ok: false, error: 'Answer too long (max 500)' };
  return { ok: true, question: qq, answer: aa };
}

function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return SEED_CARDS.map(c => ({ ...c }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not array');
    const cards = parsed
      .filter(c => c && typeof c === 'object' && typeof c.id === 'string' && typeof c.question === 'string' && typeof c.answer === 'string')
      .map(c => ({ id: c.id, question: c.question, answer: c.answer }));
    if (cards.length === 0) return SEED_CARDS.map(c => ({ ...c }));
    return cards;
  } catch (e) {
    return SEED_CARDS.map(c => ({ ...c }));
  }
}

function saveCards() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards)); } catch (e) {}
}

function clampIndex(i, len) {
  if (len <= 0) return 0;
  if (i < 0) return 0;
  if (i >= len) return len - 1;
  return i;
}

function currentCard() {
  if (!state.cards.length) return null;
  return state.cards[state.currentIndex];
}

function next() {
  if (!state.cards.length) return;
  state.currentIndex = (state.currentIndex + 1) % state.cards.length;
  state.isAnswerVisible = false;
}

function previous() {
  if (!state.cards.length) return;
  if (state.currentIndex > 0) {
    state.currentIndex--;
    state.isAnswerVisible = false;
  }
}

function toggleAnswer() {
  if (!state.cards.length) return;
  state.isAnswerVisible = !state.isAnswerVisible;
}

function openAdd() {
  state.mode = 'add';
  state.editingCardId = null;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('form-title').textContent = 'Add card';
  document.getElementById('error-message').classList.add('hidden');
  openSheet();
}

function openEdit() {
  if (!state.cards.length) return;
  const c = currentCard();
  state.mode = 'edit';
  state.editingCardId = c.id;
  document.getElementById('question-input').value = c.question;
  document.getElementById('answer-input').value = c.answer;
  document.getElementById('form-title').textContent = 'Edit card';
  document.getElementById('error-message').classList.add('hidden');
  openSheet();
}

function cancelForm() {
  state.mode = 'study';
  state.editingCardId = null;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  closeSheet();
}

function saveCard() {
  const q = document.getElementById('question-input').value;
  const a = document.getElementById('answer-input').value;
  const err = document.getElementById('error-message');
  const v = validateCard(q, a);
  if (!v.ok) {
    err.textContent = v.error;
    err.classList.remove('hidden');
    // add icon
    if (!err.querySelector('svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '14'); svg.setAttribute('height', '14');
      svg.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
      svg.style.stroke = 'currentColor'; svg.style.fill = 'none'; svg.style.strokeWidth = '2';
      err.prepend(svg);
    }
    return;
  }
  err.classList.add('hidden');
  if (state.mode === 'add') {
    const card = { id: uid(), question: v.question, answer: v.answer };
    state.cards.push(card);
    state.currentIndex = state.cards.length - 1;
    state.isAnswerVisible = false;
    showToast('Card added');
  } else {
    const idx = state.cards.findIndex(c => c.id === state.editingCardId);
    if (idx !== -1) {
      state.cards[idx].question = v.question;
      state.cards[idx].answer = v.answer;
    }
    state.isAnswerVisible = false;
    showToast('Card updated');
  }
  state.mode = 'study';
  state.editingCardId = null;
  saveCards();
  closeSheet();
  render();
}

function deleteCard() {
  if (!state.cards.length) return;
  const c = currentCard();
  document.getElementById('delete-preview').textContent = c.question;
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('delete-modal').classList.add('open');
  deletePending = true;
}

function confirmDelete() {
  if (!deletePending) return;
  const idx = state.currentIndex;
  state.cards.splice(idx, 1);
  if (state.cards.length === 0) state.currentIndex = 0;
  else if (idx >= state.cards.length) state.currentIndex = state.cards.length - 1;
  state.isAnswerVisible = false;
  state.mode = state.cards.length ? 'study' : 'empty';
  saveCards();
  closeDeleteModal();
  showToast('Card deleted');
  render();
}

function closeDeleteModal() {
  deletePending = false;
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('delete-modal').classList.remove('open');
}

function openSheet() {
  sheetOpen = true;
  document.getElementById('backdrop').classList.add('open');
  document.getElementById('sheet').classList.add('open');
}

function closeSheet() {
  sheetOpen = false;
  document.getElementById('backdrop').classList.remove('open');
  document.getElementById('sheet').classList.remove('open');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

function renderSegments() {
  const seg = document.getElementById('segments');
  seg.innerHTML = '';
  const n = state.cards.length;
  if (n === 0) return;
  if (n > 10) {
    const bar = document.createElement('div');
    bar.className = 'segment' + (state.currentIndex >= 0 ? ' filled' : '');
    bar.style.flex = '1';
    seg.appendChild(bar);
    return;
  }
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div');
    d.className = 'segment' + (i <= state.currentIndex ? ' filled' : '');
    seg.appendChild(d);
  }
}

function renderAllCards() {
  const list = document.getElementById('allcards-list');
  list.innerHTML = '';
  state.cards.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `<span class="q">${i+1}. ${escapeHtml(c.question)}</span>
      <button class="edit" data-id="${c.id}" aria-label="Edit"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="del" data-id="${c.id}" aria-label="Delete"><svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>`;
    list.appendChild(row);
  });
  // bind
  list.querySelectorAll('.edit').forEach(b => b.onclick = () => { const id = b.dataset.id; const idx = state.cards.findIndex(c=>c.id===id); if(idx>=0){ state.currentIndex=idx; state.isAnswerVisible=false; openEdit(); closeAllCards(); } });
  list.querySelectorAll('.del').forEach(b => b.onclick = () => { const id = b.dataset.id; const idx = state.cards.findIndex(c=>c.id===id); if(idx>=0){ state.currentIndex=idx; deleteCard(); } });
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function render() {
  const emptyEl = document.getElementById('empty-state');
  const flashcard = document.getElementById('flashcard');
  const counterEl = document.getElementById('card-counter');
  const pctEl = document.getElementById('progress-pct');
  const qEl = document.getElementById('card-question');
  const aEl = document.getElementById('card-answer');
  const showBtn = document.getElementById('show-answer-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (state.cards.length === 0) {
    emptyEl.style.display = 'block';
    flashcard.style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    document.querySelector('.progress-wrap').style.display = 'none';
  } else {
    emptyEl.style.display = 'none';
    flashcard.style.display = 'block';
    document.querySelector('.controls').style.display = 'flex';
    document.querySelector('.progress-wrap').style.display = 'block';
  }

  if (state.cards.length) {
    const c = state.cards[state.currentIndex];
    counterEl.textContent = 'Card ' + (state.currentIndex + 1) + ' of ' + state.cards.length;
    const pct = Math.round(((state.currentIndex + 1) / state.cards.length) * 100);
    pctEl.textContent = pct + '% done';
    qEl.textContent = c.question;
    aEl.textContent = c.answer;
    // flip
    const fc = document.getElementById('flashcard');
    if (state.isAnswerVisible) fc.classList.add('flipped'); else fc.classList.remove('flipped');
    showBtn.textContent = state.isAnswerVisible ? 'Hide answer' : 'Show answer';
    showBtn.classList.toggle('hide', state.isAnswerVisible);
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = false;
  }
  renderSegments();
}

function openAllCards() {
  renderAllCards();
  document.getElementById('allcards-view').classList.add('open');
}
function closeAllCards() {
  document.getElementById('allcards-view').classList.remove('open');
}

// init
function init() {
  try {
    const raw = localStorage.getItem('flashcards');
    if (raw === null) state.cards = SEED_CARDS.map(c => ({...c}));
    else {
      const p = JSON.parse(raw);
      if (!Array.isArray(p)) throw 0;
      const cards = p.filter(c => c && typeof c.id==='string' && typeof c.question==='string' && typeof c.answer==='string').map(c=>({id:c.id,question:c.question,answer:c.answer}));
      state.cards = cards.length ? cards : SEED_CARDS.map(c=>({...c}));
    }
  } catch (e) { state.cards = SEED_CARDS.map(c => ({...c})); }
  state.currentIndex = 0;
  state.isAnswerVisible = false;
  state.mode = state.cards.length ? 'study' : 'empty';
  render();
}

// events
document.getElementById('flashcard').addEventListener('click', (e) => {
  if (e.target.closest('button')) return;
  if (state.cards.length) { state.isAnswerVisible = !state.isAnswerVisible; render(); }
});
document.getElementById('show-answer-btn').addEventListener('click', () => { if (state.cards.length) { state.isAnswerVisible = !state.isAnswerVisible; render(); } });
document.getElementById('prev-btn').addEventListener('click', () => { if (state.currentIndex > 0) { state.currentIndex--; state.isAnswerVisible=false; render(); } });
document.getElementById('next-btn').addEventListener('click', () => { next(); render(); });
document.getElementById('edit-btn').addEventListener('click', () => {
  if (!state.cards.length) return;
  const c = state.cards[state.currentIndex];
  state.mode = 'edit'; state.editingCardId = c.id;
  document.getElementById('question-input').value = c.question;
  document.getElementById('answer-input').value = c.answer;
  document.getElementById('form-title').textContent = 'Edit card';
  document.getElementById('error-message').classList.add('hidden');
  openSheet();
});
document.getElementById('edit-btn2').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('edit-btn').click(); });
document.getElementById('delete-btn').addEventListener('click', () => { if (state.cards.length) deleteCard(); });
document.getElementById('delete-btn2').addEventListener('click', (e) => { e.stopPropagation(); document.getElementById('delete-btn').click(); });
document.getElementById('add-btn').addEventListener('click', () => {
  state.mode = 'add'; state.editingCardId = null;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('form-title').textContent = 'Add card';
  document.getElementById('error-message').classList.add('hidden');
  openSheet();
});
document.getElementById('stack-btn').addEventListener('click', openAllCards);
document.getElementById('all-cards-tab').addEventListener('click', openAllCards);
document.getElementById('add-btn').addEventListener('click', () => { openAdd(); });
document.getElementById('add-tab').addEventListener('click', () => { openAdd(); });
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => { document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); }));

document.getElementById('cancel-btn').addEventListener('click', () => {
  state.mode = 'study'; state.editingCardId = null;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  closeSheet();
});
document.getElementById('save-btn').addEventListener('click', () => {
  const q = document.getElementById('question-input').value.trim();
  const a = document.getElementById('answer-input').value.trim();
  const err = document.getElementById('error-message');
  if (!q) { err.textContent = 'Enter a question before saving'; err.classList.remove('hidden'); return; }
  if (!a) { err.textContent = 'Enter an answer before saving'; err.classList.remove('hidden'); return; }
  if (q.length > 500 || a.length > 500) { err.textContent = 'Text too long (max 500)'; err.classList.remove('hidden'); return; }
  err.classList.add('hidden');
  if (state.mode === 'add') {
    const card = { id: uid(), question: q, answer: a };
    state.cards.push(card);
    state.currentIndex = state.cards.length - 1;
    showToast('Card added');
  } else {
    const idx = state.cards.findIndex(c => c.id === state.editingCardId);
    if (idx !== -1) { state.cards[idx].question = q; state.cards[idx].answer = a; }
    showToast('Card updated');
  }
  state.isAnswerVisible = false;
  state.mode = 'study';
  state.editingCardId = null;
  saveCards();
  closeSheet();
  render();
});
document.getElementById('backdrop').addEventListener('click', closeSheet);

document.getElementById('confirm-delete').addEventListener('click', () => {
  const idx = state.currentIndex;
  state.cards.splice(idx, 1);
  if (state.cards.length === 0) state.currentIndex = 0;
  else if (idx >= state.cards.length) state.currentIndex = state.cards.length - 1;
  state.isAnswerVisible = false;
  state.mode = state.cards.length ? 'study' : 'empty';
  saveCards();
  closeDeleteModal();
  showToast('Card deleted');
  render();
});
document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
document.getElementById('modal-backdrop').addEventListener('click', closeDeleteModal);

document.getElementById('close-allcards').addEventListener('click', closeAllCards);


// Header search and quick actions
const cardSearch = document.getElementById('card-search');
if (cardSearch) cardSearch.addEventListener('input', () => {
  const term = cardSearch.value.trim().toLowerCase();
  if (!term) return;
  const found = state.cards.findIndex(card => (card.question + ' ' + card.answer).toLowerCase().includes(term));
  if (found >= 0) { state.currentIndex = found; state.isAnswerVisible = false; render(); }
});
const setQuickAction = (activeId) => document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.toggle('active', chip.id === activeId));
document.getElementById('study-chip')?.addEventListener('click', () => { closeAllCards(); setQuickAction('study-chip'); });
document.getElementById('deck-chip')?.addEventListener('click', () => { setQuickAction('deck-chip'); openAllCards(); });
document.getElementById('add-chip')?.addEventListener('click', () => { setQuickAction('add-chip'); openAdd(); });
// keyboard
document.addEventListener('keydown', (e) => {
  const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); next(); render(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (state.currentIndex > 0) { state.currentIndex--; state.isAnswerVisible=false; render(); } }
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (state.cards.length) { state.isAnswerVisible = !state.isAnswerVisible; render(); } }
});

function saveCards() { try { localStorage.setItem('flashcards', JSON.stringify(state.cards)); } catch(e){} }

// empty state add button
document.getElementById('add-btn').addEventListener('click', () => {}); // already bound above? no, add-btn is the empty-state button? 
// Actually empty-state has no id add-btn. Let me bind empty state button.
const emptyAdd = document.querySelector('#empty-state button');
if (emptyAdd) emptyAdd.addEventListener('click', () => { state.mode='add'; state.editingCardId=null; document.getElementById('question-input').value=''; document.getElementById('answer-input').value=''; document.getElementById('form-title').textContent='Add card'; document.getElementById('error-message').classList.add('hidden'); openSheet(); });

init();
function init() {
  try {
    const raw = localStorage.getItem('flashcards');
    if (raw === null) state.cards = SEED_CARDS.map(c => ({...c}));
    else {
      const p = JSON.parse(raw);
      if (!Array.isArray(p)) throw 0;
      const cards = p.filter(c => c && typeof c.id==='string' && typeof c.question==='string' && typeof c.answer==='string').map(c=>({id:c.id,question:c.question,answer:c.answer}));
      state.cards = cards.length ? cards : SEED_CARDS.map(c=>({...c}));
    }
  } catch (e) { state.cards = SEED_CARDS.map(c => ({...c})); }
  state.currentIndex = 0;
  state.isAnswerVisible = false;
  state.mode = state.cards.length ? 'study' : 'empty';
  render();
}

// all cards view close on escape
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAllCards(); closeSheet(); closeDeleteModal(); } });
