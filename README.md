# Task 1: Flashcard Quiz App (Logic)

**Domain:** App Development
**Internship:** CodeAlpha - Month 1

## Overview
A flashcard quiz app built with plain HTML/CSS/JS. Logic is separated from UI in `app.js` (functions: addCard, updateCard, deleteCard, nextCard, prevCard, toggleAnswer, validateCard, loadCards, saveCards, render). Minimal styling so the UI can be restyled later without breaking logic.

## Features
- Show/Hide answer, resets on card change
- Next/Previous navigation, no wrap, disabled at bounds
- Counter "Card X of Y"
- Add card with validation (required, trim, max 500)
- Edit card (prefilled form)
- Delete with confirmation, index clamping, empty state
- Empty state with Add Card button
- localStorage persistence with try/catch fallback to 5 seed cards
- Keyboard: Left/Right arrows, Space/Enter for show answer (when not typing)
- data-testid + id on all interactive elements

## Files
- index.html - markup
- app.js - logic + render
- style not separate (minimal inline in index.html)
- tests/unit.test.js - 21 unit tests (node:test)
- tests/browser.spec.cjs - 8 browser tests (Playwright)
- README.md

## Tests
- Unit: 21/21 pass (node --test)
- Browser: 8/8 pass (Playwright), 0 console errors

## Submission
Upload to Google Drive as CodeAlpha_Flashcard_Quiz_App, post video on LinkedIn, submit via form.
