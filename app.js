/* Flashcard Quiz App - simple logic */
let cards = [
  { id: 1, question: 'What is the capital of France?', answer: 'Paris' },
  { id: 2, question: 'What is 2 + 2?', answer: '4' },
  { id: 3, question: 'What is the largest planet?', answer: 'Jupiter' },
  { id: 4, question: 'What color is the sky?', answer: 'Blue' },
  { id: 5, question: 'What is H2O?', answer: 'Water' },
];
let currentIndex = 0;
let isAnswerVisible = false;
let editingId = null; // null = add mode, number = edit mode
let formOpen = false;

function uid() { return Date.now(); }

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
  const errEl = document.getElementById('error-message');

  if (cards.length === 0) {
    emptyEl.classList.remove('hidden');
    studyEl.classList.add('hidden');
  } else {
    emptyEl.classList.add('hidden');
    studyEl.classList.remove('hidden');
  }

  if (formOpen) formEl.classList.remove('hidden');
  else formEl.classList.add('hidden');

  errEl.classList.add('hidden');
  errEl.textContent = '';

  if (cards.length) {
    const c = cards[currentIndex];
    counterEl.textContent = 'Card ' + (currentIndex + 1) + ' of ' + cards.length;
    qEl.textContent = c.question;
    if (isAnswerVisible) {
      aEl.textContent = c.answer;
      aEl.classList.remove('hidden');
    } else {
      aEl.classList.add('hidden');
    }
    showBtn.textContent = isAnswerVisible ? 'Hide Answer' : 'Show Answer';
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === cards.length - 1;
  }

  if (formOpen && editingId !== null) {
    const c = cards.find(x => x.id === editingId);
    if (c) {
      document.getElementById('question-input').value = c.question;
      document.getElementById('answer-input').value = c.answer;
    }
  }
}

function toggleAnswer() {
  if (!cards.length) return;
  isAnswerVisible = !isAnswerVisible;
  render();
}

function nextCard() {
  if (currentIndex < cards.length - 1) {
    currentIndex++;
    isAnswerVisible = false;
    render();
  }
}

function prevCard() {
  if (currentIndex > 0) {
    currentIndex--;
    isAnswerVisible = false;
    render();
  }
}

function openAdd() {
  editingId = null;
  formOpen = true;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  document.getElementById('form-title').textContent = 'Add Card';
  document.getElementById('error-message').classList.add('hidden');
  render();
}

function openEdit() {
  if (!cards.length) return;
  editingId = cards[currentIndex].id;
  formOpen = true;
  document.getElementById('form-title').textContent = 'Edit Card';
  render();
}

function cancelForm() {
  editingId = null;
  formOpen = false;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  render();
}

function saveCard() {
  const q = document.getElementById('question-input').value.trim();
  const a = document.getElementById('answer-input').value.trim();
  const errEl = document.getElementById('error-message');
  if (!q || !a) {
    errEl.textContent = 'Both question and answer are required.';
    errEl.classList.remove('hidden');
    return;
  }
  if (editingId === null) {
    const card = { id: uid(), question: q, answer: a };
    cards.push(card);
    currentIndex = cards.length - 1;
  } else {
    const idx = cards.findIndex(c => c.id === editingId);
    if (idx !== -1) {
      cards[idx].question = q;
      cards[idx].answer = a;
    }
  }
  isAnswerVisible = false;
  editingId = null;
  formOpen = false;
  document.getElementById('question-input').value = '';
  document.getElementById('answer-input').value = '';
  render();
}

function deleteCard() {
  if (!cards.length) return;
  if (!confirm('Delete this card?')) return;
  cards.splice(currentIndex, 1);
  if (cards.length === 0) currentIndex = 0;
  else if (currentIndex >= cards.length) currentIndex = cards.length - 1;
  isAnswerVisible = false;
  editingId = null;
  formOpen = false;
  render();
}

document.addEventListener('keydown', function (e) {
  const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea') return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
  else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (cards.length) toggleAnswer();
  }
});

window.onload = render;
window.toggleAnswer = toggleAnswer;
window.nextCard = nextCard;
window.prevCard = prevCard;
window.openAdd = openAdd;
window.openEdit = openEdit;
window.cancelForm = cancelForm;
window.saveCard = saveCard;
window.deleteCard = deleteCard;
