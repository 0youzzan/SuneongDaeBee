let deck = [];       // 외우기용 순서 (vocabList 인덱스)
let deckIndex = 0;
let showingFront = true;
let studyMode = 'all'; // 'all' | 'kana' | 'kanji'

function showContent(hasData) {
  document.getElementById('memorize-empty').classList.toggle('hidden', hasData);
  document.getElementById('memorize-content').classList.toggle('hidden', !hasData);
}

function buildDeckIndices() {
  return vocabList.map((_, i) => i);
}

function updateModeNote() {
  const noteEl = document.getElementById('mode-note');
  if (studyMode === 'kana') {
    noteEl.textContent = '한자 없이 히라가나만 보여줘요.';
  } else if (studyMode === 'kanji') {
    noteEl.textContent = '한자만 보여줘요. 한자가 없는 단어는 히라가나 옆에 (한자X)로 표시돼요.';
  } else {
    noteEl.textContent = '히라가나와 한자를 같이 보여줘요.';
  }
}

function resetDeck() {
  deck = buildDeckIndices();
  deckIndex = 0;
  showingFront = true;
  updateModeNote();
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

// 카드 앞면(문제) 내용을 모드에 맞게 만든다.
function getFrontContent(item) {
  if (studyMode === 'kana') {
    return { label: item.pos || '일본어', main: item.word, sub: '' };
  }
  if (studyMode === 'kanji') {
    if (item.kanji) {
      return { label: item.pos || '한자', main: item.kanji, sub: '' };
    }
    return { label: item.pos || '한자', main: item.word, sub: '(한자X)' };
  }
  // all
  const main = item.kanji ? `${item.word} (${item.kanji})` : item.word;
  return { label: item.pos || '일본어', main, sub: '' };
}

// 카드 뒷면(정답) 내용 - 모드와 상관없이 항상 뜻 + 읽기를 보여준다.
function getBackContent(item) {
  const reading = item.kanji ? `${item.word} · ${item.kanji}` : item.word;
  return { label: '뜻', main: item.meaning, sub: reading };
}

function renderCard() {
  if (deck.length === 0) return;
  const item = vocabList[deck[deckIndex]];
  const wordEl = document.getElementById('card-word');
  const subEl = document.getElementById('card-sub');
  const labelEl = document.getElementById('face-label');

  const c = showingFront ? getFrontContent(item) : getBackContent(item);
  labelEl.textContent = c.label;
  wordEl.textContent = c.main;
  subEl.textContent = c.sub;

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

document.querySelectorAll('#mode-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    studyMode = btn.dataset.mode;
    resetDeck();
  });
});

// ---------- 시작 ----------

loadVocabData('data-status')
  .then(() => {
    const hasData = vocabList.length > 0;
    showContent(hasData);
    if (hasData) resetDeck();
  })
  .catch(() => showContent(false));