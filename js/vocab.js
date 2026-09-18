let deck = [];       // 외우기용 순서 (vocabList 인덱스)
let deckIndex = 0;
let showingFront = true;
let studyMode = 'kana'; // 'kana' | 'kanji'

function showContent(hasData) {
  document.getElementById('memorize-empty').classList.toggle('hidden', hasData);
  document.getElementById('memorize-content').classList.toggle('hidden', !hasData);
}

// 현재 모드에 맞는 단어 목록(인덱스)을 만든다.
// 한자 모드여도 단어를 제외하지 않는다 - 한자가 없으면 카드에 '(한자X)'로 표시한다.
function buildDeckIndices() {
  return vocabList.map((_, i) => i);
}

function updateModeNote() {
  const noteEl = document.getElementById('mode-note');
  if (studyMode === 'kanji') {
    noteEl.textContent = '한자가 없는 단어는 히라가나로 보이고 옆에 (한자X)로 표시돼요.';
  } else {
    noteEl.textContent = '';
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

function renderCard() {
  if (deck.length === 0) return;
  const item = vocabList[deck[deckIndex]];
  const wordEl = document.getElementById('card-word');
  const subEl = document.getElementById('card-sub');
  const labelEl = document.getElementById('face-label');

  if (studyMode === 'kanji') {
    if (showingFront) {
      labelEl.textContent = item.pos || '한자';
      if (item.kanji) {
        wordEl.textContent = item.kanji;
        subEl.textContent = '';
      } else {
        wordEl.textContent = item.word;
        subEl.textContent = '(한자X)';
      }
    } else {
      labelEl.textContent = '읽기 · 뜻';
      wordEl.textContent = item.word;
      subEl.textContent = item.meaning;
    }
  } else {
    if (showingFront) {
      labelEl.textContent = item.pos || '일본어';
      wordEl.textContent = item.word;
      subEl.textContent = item.kanji ? `한자: ${item.kanji}` : '';
    } else {
      labelEl.textContent = '뜻';
      wordEl.textContent = item.meaning;
      subEl.textContent = item.kanji ? `${item.word} · ${item.kanji}` : item.word;
    }
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