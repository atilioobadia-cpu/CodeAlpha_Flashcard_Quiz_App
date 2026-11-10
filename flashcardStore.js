// flashcardStore.js - pure logic module for Flashcard Quiz App
// Works in browser (global FlashcardStore) and Node (module.exports).

function uid() {
  return 'card_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function validateCard(question, answer, maxLen) {
  maxLen = maxLen || 500;
  const q = (question == null ? '' : question).toString().trim();
  const a = (answer == null ? '' : answer).toString().trim();
  if (!q) return { ok: false, error: 'Question is required' };
  if (!a) return { ok: false, error: 'Answer is required' };
  if (q.length > maxLen) return { ok: false, error: 'Question too long (max ' + maxLen + ')' };
  if (a.length > maxLen) return { ok: false, error: 'Answer too long (max ' + maxLen + ')' };
  return { ok: true, question: q, answer: a };
}

const SEED_CARDS = [
  { id: 'seed_1', question: 'What is the capital of France?', answer: 'Paris' },
  { id: 'seed_2', question: 'What is 2 + 2?', answer: '4' },
  { id: 'seed_3', question: 'What is the largest planet?', answer: 'Jupiter' },
  { id: 'seed_4', question: 'What color is the sky?', answer: 'Blue' },
  { id: 'seed_5', question: 'What is H2O?', answer: 'Water' },
];

function loadCards(storage) {
  const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!s) return SEED_CARDS.map(function (c) { return { ...c }; });
  try {
    const raw = s.getItem('flashcards');
    if (raw === null) return SEED_CARDS.map(function (c) { return { ...c }; });
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not array');
    const cards = parsed
      .filter(function (c) { return c && typeof c === 'object' && typeof c.id === 'string' && typeof c.question === 'string' && typeof c.answer === 'string'; })
      .map(function (c) { return { id: c.id, question: c.question, answer: c.answer }; });
    if (cards.length === 0) return SEED_CARDS.map(function (c) { return { ...c }; });
    return cards;
  } catch (e) {
    return SEED_CARDS.map(function (c) { return { ...c }; });
  }
}

function saveCards(cards, storage) {
  const s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!s) return;
  try { s.setItem('flashcards', JSON.stringify(cards)); } catch (e) { /* ignore */ }
}

function clampIndex(index, length) {
  if (length <= 0) return 0;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
}

function createState(cards) {
  const list = Array.isArray(cards) ? cards : [];
  return {
    cards: list,
    currentIndex: 0,
    isAnswerVisible: false,
    mode: list.length ? 'study' : 'empty',
    editingCardId: null,
  };
}

function next(state) {
  if (!state.cards.length) return { ...state };
  const ni = Math.min(state.currentIndex + 1, state.cards.length - 1);
  return { ...state, currentIndex: ni, isAnswerVisible: false };
}

function previous(state) {
  if (!state.cards.length) return { ...state };
  const ni = Math.max(state.currentIndex - 1, 0);
  return { ...state, currentIndex: ni, isAnswerVisible: false };
}

function toggleAnswer(state) {
  return { ...state, isAnswerVisible: !state.isAnswerVisible };
}

function showAnswer(state) { return { ...state, isAnswerVisible: true }; }
function hideAnswer(state) { return { ...state, isAnswerVisible: false }; }

function openAdd(state) {
  return { ...state, mode: 'add', editingCardId: null, isAnswerVisible: false };
}

function openEdit(state) {
  if (!state.cards.length) return state;
  return { ...state, mode: 'edit', editingCardId: state.cards[state.currentIndex].id, isAnswerVisible: false };
}

function cancelForm(state) {
  return { ...state, mode: state.cards.length ? 'study' : 'empty', editingCardId: null };
}

function addCard(state, question, answer) {
  const v = validateCard(question, answer);
  if (!v.ok) return { state, error: v.error };
  const card = { id: uid(), question: v.question, answer: v.answer };
  const cards = state.cards.concat([card]);
  const newState = {
    cards: cards,
    currentIndex: cards.length - 1,
    isAnswerVisible: false,
    mode: 'study',
    editingCardId: null,
  };
  return { state: newState, error: null, card: card };
}

function updateCard(state, question, answer) {
  const v = validateCard(question, answer);
  if (!v.ok) return { state, error: v.error };
  const id = state.editingCardId;
  const cards = state.cards.map(function (c) {
    return c.id === id ? { ...c, question: v.question, answer: v.answer } : c;
  });
  const newState = {
    cards: cards,
    currentIndex: state.currentIndex,
    isAnswerVisible: false,
    mode: 'study',
    editingCardId: null,
  };
  return { state: newState, error: null };
}

function deleteCard(state) {
  if (!state.cards.length) return state;
  const id = state.cards[state.currentIndex].id;
  const cards = state.cards.filter(function (c) { return c.id !== id; });
  let ni = state.currentIndex;
  if (cards.length === 0) ni = 0;
  else if (ni >= cards.length) ni = cards.length - 1;
  if (ni < 0) ni = 0;
  return {
    cards: cards,
    currentIndex: ni,
    isAnswerVisible: false,
    mode: cards.length ? 'study' : 'empty',
    editingCardId: null,
  };
}

function counterText(state) {
  if (!state.cards.length) return 'Card 0 of 0';
  return 'Card ' + (state.currentIndex + 1) + ' of ' + state.cards.length;
}

function currentCard(state) {
  if (!state.cards.length) return null;
  return state.cards[state.currentIndex];
}

const api = {
  uid, validateCard, SEED_CARDS, loadCards, saveCards, clampIndex,
  createState, next, previous, toggleAnswer, showAnswer, hideAnswer,
  openAdd, openEdit, cancelForm, addCard, updateCard, deleteCard,
  counterText, currentCard,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
if (typeof window !== 'undefined') {
  window.FlashcardStore = api;
}
