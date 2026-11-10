/* app.js - Flashcard Quiz App (logic only, minimal UI) */
const STORAGE_KEY = 'flashcards';

const SEED_CARDS = [
  { id: 'seed_1', question: 'What is the capital of France?', answer: 'Paris' },
  { id: 'seed_2', question: 'What is 2 + 2?', answer: '4' },
  { id: 'seed_3', question: 'What is the largest planet?', answer: 'Jupiter' },
  { id: 'seed_4', question: 'What color is the sky?', answer: 'Blue' },
  { id: 'seed_5', question: 'What is H2O?', answer: 'Water' },
];

let state = { cards: [], currentIndex: 0, isAnswerVisible: false, editingCardId: undefined };

function uid() { return 'card_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

function validateCard(q, a) {
  const qq = (q == null ? '' : String(q)).trim();
  const aa = (a == null ? '' : String(a)).trim();
  if (!qq) return { ok: false, error: 'Question is required' };
  if (!aa) return { ok: false, error: 'Answer is required' };
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

function render() {
  const emptyEl = document.getElementById('empty-state');
  const studyEl = document.getElementById('study');
  const formEl = document.getElementById('form');
  const counterEl = document.getElementById('card-counter');
  const qEl = document.getElementById('card-question');
  const aEl = document.getElementById('card-answer');
  const showBtn = document.getElementById('show-answer-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const editBtn = document.getElementById('edit-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const errEl = document.getElementById('error-message');

  if (state.cards.length === 0) {
    emptyEl.classList.remove('hidden');
    studyEl.classList.add('hidden');
  } else {
    emptyEl.classList.add('hidden');
    studyEl.classList.remove('hidden');
  }

  if (formIsOpen) {
    formEl.classList.remove('hidden');
  } else {
    formEl.classList.add('hidden');
  }

  errEl.classList.add('hidden');
  errEl.textContent = '';

  if (state.cards.length) {
    const c = currentCard();
    counterEl.textContent = 'Card ' + (state.currentIndex + 1) + ' of ' + state.cards.length;
    qEl.textContent = c.question;
    if (state.isAnswerVisible) {
      aEl.textContent = c.answer;
      aEl.classList.remove('hidden');
    } else {
      aEl.classList.add('hidden');
    }
    showBtn.textContent = state.isAnswerVisible ? 'Hide Answer' : 'Show Answer';
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = state.currentIndex === state.cards.length - 1;
    editBtn.disabled = false;
    deleteBtn.disabled = false;
    showBtn.disabled = false;
  } else {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    editBtn.disabled = true;
    deleteBtn.disabled = true;
    showBtn.disabled = true;
  }

  // prefill form on edit
  if (formIsOpen && state.editingCardId !== null && state.editingCardId !== undefined) {
    const c = state.cards.find(x => x.id === state.editingCardId);
    if (c) {
      document.getElementById('question-input').value = c.question;
      document.getElementById('answer-input').value = c.answer;
    }
  }

  const listEl = document.getElementById('list');
  if (listEl) {
    listEl.innerHTML = '';
    state.cards.forEach(function (c, i) {
      const d = document.createElement('div');
      d.className = 'list-item';
      d.textContent = (i + 1) + '. ' + c.question;
      listEl.appendChild(d);
    });
  }
}

let formIsOpen = false;

function toggleAnswer() {
  if (!state.cards.length) return;
  state.isAnswerVisible = !state.isAnswerVisible;
  render();
}

function nextCard() {
  if (!state.cards.length) return;
  if (state.currentIndex < state.cards.length - 1) {
    state.currentIndex++;
    state.isAnswerVisible = false;
    render();
  }
}

function prevCard() {
  if (!state.cards.length) return;
  if (state.currentIndex > 0) {
    state.currentIndex--;
    state.isAnswerVisible = false;
    render();
  }
}

function openAdd() {
  state.editingCardId = null;
  formIsOpen = true;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('error-message').classList.add('hidden');
  render();
}

function openEdit() {
  if (!state.cards.length) return;
  state.editingCardId = state.cards[state.currentIndex].id;
  formIsOpen = true;
  render();
}

function cancelForm() {
  state.editingCardId = undefined;
  formIsOpen = false;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  render();
}

function saveCard() {
  const q = document.getElementById('question-input').value;
  const a = document.getElementById('answer-input').value;
  const errEl = document.getElementById('error-message');
  const v = validateCard(q, a);
  if (!v.ok) {
    errEl.textContent = v.error;
    errEl.classList.remove('hidden');
    return;
  }
  if (state.editingCardId === null) {
    // add
    const card = { id: uid(), question: v.question, answer: v.answer };
    state.cards.push(card);
    state.currentIndex = state.cards.length - 1;
  } else if (state.editingCardId !== undefined) {
    // edit
    const idx = state.cards.findIndex(c => c.id === state.editingCardId);
    if (idx !== -1) {
      state.cards[idx].question = v.question;
      state.cards[idx].answer = v.answer;
    }
  }
  state.isAnswerVisible = false;
  state.editingCardId = undefined;
  formIsOpen = false;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  saveCards();
  render();
}

function deleteCard() {
  if (!state.cards.length) return;
  if (!confirm('Delete this card?')) return;
  const idx = state.currentIndex;
  state.cards.splice(idx, 1);
  if (state.cards.length === 0) {
    state.currentIndex = 0;
  } else if (idx >= state.cards.length) {
    state.currentIndex = state.cards.length - 1;
  }
  state.isAnswerVisible = false;
  state.editingCardId = undefined;
  formIsOpen = false;
  saveCards();
  render();
}

function init() {
  state.cards = loadCards();
  state.currentIndex = 0;
  state.isAnswerVisible = false;
  state.editingCardId = undefined;
  formIsOpen = false;
  // clamp
  if (state.cards.length === 0) state.currentIndex = 0;
  else if (state.currentIndex >= state.cards.length) state.currentIndex = state.cards.length - 1;
  render();
}

// keyboard support
document.addEventListener('keydown', function (e) {
  const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
  else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (state.cards.length) toggleAnswer();
  }
});

window.onload = init;
window.toggleAnswer = toggleAnswer;
window.nextCard = nextCard;
window.prevCard = prevCard;
window.openAdd = openAdd;
window.openEdit = openEdit;
window.cancelForm = cancelForm;
window.saveCard = saveCard;
window.deleteCard = deleteCard;
window.__state = () => state;
window.__loadCards = loadCards;
window.__saveCards = saveCards;
