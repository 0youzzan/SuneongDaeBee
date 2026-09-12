let vocabList = [];
let deck = [];       // 외우기용 순서
let deckIndex = 0;
let showingFront = true;

let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;

const VOCAB_CSV_PATH = 'data/vocab.csv';

// ---------- 초기화 ----------

async function loadVocabData() {
  const statusEl = document.getElementById('data-status');
  statusEl.textContent = '단어를 불러오는 중이에요…';

  try {
    const res = await fetch(VOCAB_CSV_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error('파일을 찾을 수 없어요');
    const text = await res.text();
    vocabList = csvToVocabList(text);
  } catch (e) {
    vocabList = [];
    statusEl.textContent = `data/vocab.csv 파일을 불러오지 못했어요. (${e.message})`;
    return;
  }

  refreshDataStatus();
}

function refreshDataStatus() {
  const statusEl = document.getElementById('data-status');
  statusEl.textContent = `data/vocab.csv에서 단어 ${vocabList.length}개를 불러왔어요.`;
  document.getElementById('quiz-word-count').textContent = vocabList.length;

  const hasData = vocabList.length > 0;
  document.getElementById('memorize-empty').classList.toggle('hidden', hasData);
  document.getElementById('memorize-content').classList.toggle('hidden', !hasData);
  document.getElementById('quiz-empty').classList.toggle('hidden', hasData);
  document.getElementById('quiz-setup').classList.toggle('hidden', !hasData);

  if (hasData) resetDeck();
}

// ---------- 탭 전환 ----------

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

// ---------- 외우기 모드 ----------

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
    subEl.textContent = item.kanji ? `${item.word}${item.kanji ? ' · ' + item.kanji : ''}` : item.word;
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

// ---------- 시험보기 모드 ----------

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

function startQuiz() {
  quizQueue = [...vocabList].sort(() => Math.random() - 0.5);
  quizIndex = 0;
  quizScore = 0;
  document.getElementById('quiz-setup').classList.add('hidden');
  document.getElementById('quiz-content').classList.remove('hidden');
  renderQuizQuestion();
}

function buildChoices(correctItem) {
  const others = vocabList.filter(v => v !== correctItem);
  const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [correctItem.meaning, ...shuffledOthers.map(o => o.meaning)];
  return choices.sort(() => Math.random() - 0.5);
}

function renderQuizQuestion() {
  const content = document.getElementById('quiz-content');

  if (quizIndex >= quizQueue.length) {
    content.innerHTML = `
      <div class="quiz-result">
        <div class="score">${quizScore} / ${quizQueue.length}</div>
        <p style="color:var(--ink-soft)">시험이 끝났어요.</p>
        <button class="btn primary" id="retry-quiz-btn">다시 풀기</button>
      </div>
    `;
    document.getElementById('retry-quiz-btn').addEventListener('click', startQuiz);
    return;
  }

  const item = quizQueue[quizIndex];
  const choices = buildChoices(item);

  content.innerHTML = `
    <div style="color:var(--ink-soft); font-size:0.9rem; margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${item.word}${item.kanji ? ` <span style="color:var(--ink-faint); font-size:1rem;">(${item.kanji})</span>` : ''}</div>
      <div class="quiz-choices">
        ${choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = decodeURIComponent(btn.dataset.value);
      const correct = chosen === item.meaning;
      if (correct) quizScore++;

      content.querySelectorAll('.choice-btn').forEach(b => {
        b.disabled = true;
        const val = decodeURIComponent(b.dataset.value);
        if (val === item.meaning) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      setTimeout(() => {
        quizIndex++;
        renderQuizQuestion();
      }, 700);
    });
  });
}

// ---------- 시작 ----------

loadVocabData();