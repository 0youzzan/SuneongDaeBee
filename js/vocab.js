let deck = [];       // 외우기용 순서
let deckIndex = 0;
let showingFront = true;

function showContent(hasData) {
  document.getElementById('memorize-empty').classList.toggle('hidden', hasData);
  document.getElementById('memorize-content').classList.toggle('hidden', !hasData);
}

function resetDeck() {
  deck = vocabList.map((_, i) => i);
  deckIndex = 0;
  showingFront = true;
  renderCard();
}

function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  deckIndex = 0;
  showingFront = true;
  renderCard();
}

function renderCard() {
  if (deck.length === 0) return;
  const item = vocabList[deck[deckIndex]];
  const wordEl = document.getElementById('card-word');
  const subEl = document.getElementById('card-sub');
  const labelEl = document.getElementById('face-label');

  if (showingFront) {
    labelEl.textContent = item.pos || '일본어';
    wordEl.textContent = item.word;
    subEl.textContent = item.kanji ? `한자: ${item.kanji}` : '';
  } else {
    labelEl.textContent = '뜻';
    wordEl.textContent = item.meaning;
    subEl.textContent = item.kanji ? `${item.word} · ${item.kanji}` : item.word;
  }
  document.getElementById('deck-progress').textContent = `${deckIndex + 1} / ${deck.length}`;
}

document.getElementById('flashcard').addEventListener('click', () => {
  showingFront = !showingFront;
  renderCard();
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (deck.length === 0) return;
  deckIndex = (deckIndex + 1) % deck.length;
  showingFront = true;
  renderCard();
});

document.getElementById('prev-btn').addEventListener('click', () => {
  if (deck.length === 0) return;
  deckIndex = (deckIndex - 1 + deck.length) % deck.length;
  showingFront = true;
  renderCard();
});

document.getElementById('shuffle-btn').addEventListener('click', shuffleDeck);

// ---------- 시작 ----------

loadVocabData('data-status')
  .then(() => {
    const hasData = vocabList.length > 0;
    showContent(hasData);
    if (hasData) resetDeck();
  })
  .catch(() => showContent(false));