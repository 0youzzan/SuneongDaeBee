let vocabList = loadVocabList();
let deck = [];       // 외우기용 순서
let deckIndex = 0;
let showingFront = true;

let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;

// ---------- 초기화 ----------

function refreshDataStatus() {
  const statusEl = document.getElementById('data-status');
  if (vocabList.length === 0) {
    statusEl.textContent = '아직 불러온 단어가 없어요. CSV 파일(일본어, 뜻, 읽는법 순서)을 올려주세요.';
  } else {
    statusEl.textContent = `단어 ${vocabList.length}개가 저장되어 있어요.`;
  }
  document.getElementById('quiz-word-count').textContent = vocabList.length;

  const hasData = vocabList.length > 0;
  document.getElementById('memorize-empty').classList.toggle('hidden', hasData);
  document.getElementById('memorize-content').classList.toggle('hidden', !hasData);
  document.getElementById('quiz-empty').classList.toggle('hidden', hasData);
  document.getElementById('quiz-setup').classList.toggle('hidden', !hasData);

  if (hasData) resetDeck();
}

document.getElementById('csv-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const parsed = csvToVocabList(ev.target.result);
    if (parsed.length === 0) {
      alert('CSV에서 단어를 찾지 못했어요. 형식을 확인해주세요 (일본어,뜻,읽는법).');
      return;
    }
    vocabList = parsed;
    saveVocabList(vocabList);
    refreshDataStatus();
  };
  reader.readAsText(file, 'UTF-8');
  e.target.value = '';
});

document.getElementById('clear-data-btn').addEventListener('click', () => {
  if (!confirm('저장된 단어를 모두 지울까요?')) return;
  vocabList = [];
  saveVocabList(vocabList);
  refreshDataStatus();
});

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
  const labelEl = document.getElementById('face-label');

  if (showingFront) {
    labelEl.textContent = '일본어';
    wordEl.textContent = item.word;
  } else {
    labelEl.textContent = '뜻';
    wordEl.textContent = item.reading ? `${item.meaning} (${item.reading})` : item.meaning;
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
      <div class="prompt">${item.word}${item.reading ? ` <span style="color:var(--ink-faint); font-size:1rem;">(${item.reading})</span>` : ''}</div>
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

refreshDataStatus();
