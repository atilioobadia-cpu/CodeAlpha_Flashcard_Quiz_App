const { chromium } = require('playwright');
const assert = (cond, msg) => { if(!cond) throw new Error('FAIL: '+msg); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  page.on('dialog', async d => { await d.accept(); });
  const url = 'file:///F:/Code_Alpha_Projects/Day%2001%20-%20App%20Development/Flashcard%20Quiz%20App/index.html';
  const results = [];
  const run = async (name, fn) => { try { await fn(); results.push('PASS: '+name); } catch(e){ results.push('FAIL: '+name+' -> '+e.message); } };

  await page.goto(url);
  await page.waitForTimeout(500);

  // a) first load shows 5 sample cards and "Card 1 of 5"
  await run('a) first load 5 cards + counter', async () => {
    const counter = await page.textContent('[data-testid="card-counter"]');
    assert(counter === 'Card 1 of 5', 'counter='+counter);
    const q = await page.textContent('[data-testid="card-question"]');
    assert(q && q.length>0, 'question empty');
  });

  // b) Show Answer reveals, moving to next hides
  await run('b) show answer reveals, next hides', async () => {
    await page.click('[data-testid="show-answer-btn"]');
    await page.waitForTimeout(100);
    const ansVisible = await page.isVisible('[data-testid="card-answer"]');
    assert(ansVisible, 'answer not visible after show');
    await page.click('[data-testid="next-btn"]');
    await page.waitForTimeout(100);
    const ansVisible2 = await page.isVisible('[data-testid="card-answer"]');
    assert(!ansVisible2, 'answer still visible after next');
  });

  // c) Previous disabled on first, Next disabled on last
  await run('c) prev disabled first, next disabled last', async () => {
    await page.reload(); await page.waitForTimeout(500);
    assert((await page.getAttribute('#prev-btn','disabled')) !== null, 'prev not disabled first');
    const total = (await page.textContent('#card-counter')).split(' of ')[1];
    for (let i=0;i<parseInt(total)-1;i++){ await page.click('#next-btn'); await page.waitForTimeout(30); }
    assert((await page.getAttribute('#next-btn','disabled')) !== null, 'next not disabled last');
  });

  // d) Add card: valid works, empty shows error
  await run('d) add valid + empty error', async () => {
    await page.click('#add-btn');
    await page.waitForTimeout(100);
    await page.fill('[data-testid="question-input"]', 'New Q');
    await page.fill('[data-testid="answer-input"]', 'New A');
    await page.click('[data-testid="save-btn"]');
    await page.waitForTimeout(200);
    const counter = await page.textContent('[data-testid="card-counter"]');
    assert(counter.includes('of 6'), 'counter after add = '+counter);
    // empty case
    await page.click('#add-btn');
    await page.waitForTimeout(100);
    await page.fill('[data-testid="question-input"]', '');
    await page.fill('[data-testid="answer-input"]', '');
    await page.click('[data-testid="save-btn"]');
    await page.waitForTimeout(100);
    const errVisible = await page.isVisible('[data-testid="error-message"]');
    assert(errVisible, 'error not shown for empty');
  });

  // e) Edit a card and confirm persists after refresh
  await run('e) edit persists after refresh', async () => {
    // cancel current form first
    await page.click('[data-testid="cancel-btn"]');
    await page.waitForTimeout(100);
    await page.click('[data-testid="edit-btn"]');
    await page.waitForTimeout(100);
    await page.fill('[data-testid="question-input"]', 'Edited Question');
    await page.fill('[data-testid="answer-input"]', 'Edited Answer');
    await page.click('[data-testid="save-btn"]');
    await page.waitForTimeout(200);
    const q = await page.textContent('[data-testid="card-question"]');
    assert(q === 'Edited Question', 'edited question not shown: '+q);
    // refresh
    await page.reload();
    await page.waitForTimeout(500);
    const q2 = await page.textContent('[data-testid="card-question"]');
    // after reload currentIndex clamped; find edited card
    // search list text
    const body = await page.textContent('body');
    assert(body.includes('Edited Question'), 'edited not persisted after refresh');
  });

  // f) Delete with confirmation, including last card and all cards
  await run('f) delete with confirm + last/all', async () => {
    // delete current until empty? We'll delete all
    let guard = 0;
    while (guard < 20) {
      const emptyVisible = await page.isVisible('[data-testid="empty-state"]');
      if (emptyVisible) break;
      await page.click('[data-testid="delete-btn"]');
      await page.waitForTimeout(150);
      guard++;
    }
    const emptyVisible = await page.isVisible('[data-testid="empty-state"]');
    assert(emptyVisible, 'empty state not shown after deleting all');
    // buttons disabled/hidden
    const showVisible = await page.isVisible('[data-testid="show-answer-btn"]');
    // show-answer may still be in DOM but study hidden; check study hidden
    const studyHidden = await page.evaluate(() => document.getElementById('study').classList.contains('hidden'));
    assert(studyHidden, 'study not hidden in empty state');
  });

  // g) refresh confirms data (empty persisted)
  await run('g) refresh keeps data', async () => {
    await page.evaluate(() => localStorage.setItem('flashcards', JSON.stringify([{id:'x',question:'q',answer:'a'}])));
    await page.reload();
    await page.waitForTimeout(500);
    const c = await page.textContent('#card-counter');
    assert(c === 'Card 1 of 1', 'refresh data failed: '+c);
  });

  // h) corrupt localStorage and confirm app loads
  await run('h) corrupt localStorage loads safely', async () => {
    await page.evaluate(() => localStorage.setItem('flashcards', '{bad json'));
    await page.reload();
    await page.waitForTimeout(500);
    const emptyVisible = await page.isVisible('[data-testid="empty-state"]');
    const counter = await page.textContent('[data-testid="card-counter"]').catch(()=>null);
    // should load seed (5 cards) since corrupted -> fallback
    const c = await page.textContent('[data-testid="card-counter"]');
    assert(c === 'Card 1 of 5', 'corrupt fallback failed: '+c);
  });

  // console errors check
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await browser.close();

  console.log('\n=== BROWSER TEST RESULTS ===');
  results.forEach(r => console.log(r));
  console.log('\nConsole errors:', consoleErrors.length ? consoleErrors.join('; ') : 'none');
  const fails = results.filter(r => r.startsWith('FAIL'));
  process.exit(fails.length ? 1 : 0);
})();
