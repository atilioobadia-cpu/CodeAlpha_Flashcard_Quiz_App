const { test } = require('node:test');
const assert = require('node:assert/strict');
const S = require('../flashcardStore.js');

test('validateCard: empty question rejected', () => {
  const r = S.validateCard('', 'ans');
  assert.equal(r.ok, false);
  assert.ok(r.error);
});

test('validateCard: whitespace-only rejected', () => {
  const r = S.validateCard('   ', 'ans');
  assert.equal(r.ok, false);
});

test('validateCard: empty answer rejected', () => {
  const r = S.validateCard('q', '   ');
  assert.equal(r.ok, false);
});

test('validateCard: too long rejected', () => {
  const r = S.validateCard('a'.repeat(501), 'ans');
  assert.equal(r.ok, false);
});

test('validateCard: valid trims', () => {
  const r = S.validateCard('  q  ', '  a  ');
  assert.equal(r.ok, true);
  assert.equal(r.question, 'q');
  assert.equal(r.answer, 'a');
});

test('addCard: appends and moves index', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }]);
  const r = S.addCard(s, 'q2', 'a2');
  assert.equal(r.error, null);
  assert.equal(r.state.cards.length, 2);
  assert.equal(r.state.currentIndex, 1);
  assert.equal(r.state.cards[1].question, 'q2');
});

test('addCard: invalid returns error', () => {
  let s = S.createState([]);
  const r = S.addCard(s, '', 'a');
  assert.ok(r.error);
  assert.equal(r.state.cards.length, 0);
});

test('updateCard: updates in place keeps id', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }]);
  s = { ...s, mode: 'edit', editingCardId: '1' };
  const r = S.updateCard(s, 'newq', 'newa');
  assert.equal(r.error, null);
  assert.equal(r.state.cards[0].id, '1');
  assert.equal(r.state.cards[0].question, 'newq');
  assert.equal(r.state.cards[0].answer, 'newa');
});

test('deleteCard: removes and clamps index', () => {
  let s = S.createState([
    { id: '1', question: 'q1', answer: 'a1' },
    { id: '2', question: 'q2', answer: 'a2' },
    { id: '3', question: 'q3', answer: 'a3' },
  ]);
  s = { ...s, currentIndex: 2 };
  const ns = S.deleteCard(s);
  assert.equal(ns.cards.length, 2);
  assert.equal(ns.currentIndex, 1);
});

test('deleteCard: last card deleted -> empty state', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }]);
  const ns = S.deleteCard(s);
  assert.equal(ns.cards.length, 0);
  assert.equal(ns.mode, 'empty');
});

test('navigation bounds: next disabled at last', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }, { id: '2', question: 'q2', answer: 'a2' }]);
  s = { ...s, currentIndex: 1 };
  const ns = S.next(s);
  assert.equal(ns.currentIndex, 1);
});

test('navigation bounds: previous disabled at first', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }, { id: '2', question: 'q2', answer: 'a2' }]);
  const ns = S.previous(s);
  assert.equal(ns.currentIndex, 0);
});

test('toggleAnswer: toggles', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }]);
  assert.equal(s.isAnswerVisible, false);
  s = S.toggleAnswer(s);
  assert.equal(s.isAnswerVisible, true);
  s = S.toggleAnswer(s);
  assert.equal(s.isAnswerVisible, false);
});

test('next resets isAnswerVisible', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }, { id: '2', question: 'q2', answer: 'a2' }]);
  s = { ...s, isAnswerVisible: true };
  s = S.next(s);
  assert.equal(s.isAnswerVisible, false);
});

test('clampIndex', () => {
  assert.equal(S.clampIndex(5, 3), 2);
  assert.equal(S.clampIndex(-1, 3), 0);
  assert.equal(S.clampIndex(1, 3), 1);
  assert.equal(S.clampIndex(0, 0), 0);
});

test('loadCards: corrupted storage falls back to seed', () => {
  const mock = { getItem: () => '{bad json', setItem: () => {} };
  const cards = S.loadCards(mock);
  assert.equal(cards.length, 5);
});

test('loadCards: null storage returns seed', () => {
  const cards = S.loadCards(null);
  assert.equal(cards.length, 5);
});

test('loadCards: empty array falls back to seed', () => {
  const mock = { getItem: () => '[]', setItem: () => {} };
  const cards = S.loadCards(mock);
  assert.equal(cards.length, 5);
});

test('saveCards + loadCards roundtrip', () => {
  const store = {};
  const mock = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = v; } };
  const cards = [{ id: 'x', question: 'q', answer: 'a' }, { id: 'y', question: 'q2', answer: 'a2' }];
  S.saveCards(cards, mock);
  const loaded = S.loadCards(mock);
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].id, 'x');
});

test('counterText', () => {
  let s = S.createState([{ id: '1', question: 'q1', answer: 'a1' }, { id: '2', question: 'q2', answer: 'a2' }]);
  assert.equal(S.counterText(s), 'Card 1 of 2');
  s = { ...s, currentIndex: 1 };
  assert.equal(S.counterText(s), 'Card 2 of 2');
  const empty = S.createState([]);
  assert.equal(S.counterText(empty), 'Card 0 of 0');
});

test('SEED_CARDS has 5', () => {
  assert.equal(S.SEED_CARDS.length, 5);
});
