// ---------- 표시 방식 (모두 / 히라가나만 / 한자만) ----------
// 모든 학습 방법(전체학습/분류학습/일일학습)에 공통으로 적용된다.

let displayMode = 'all'; // 'all' | 'kana' | 'kanji'

function getFrontContent(item) {
  if (displayMode === 'kana') {
    return { label: item.pos || '일본어', main: item.word, sub: '' };
  }
  if (displayMode === 'kanji') {
    if (item.kanji) {
      return { label: item.pos || '한자', main: item.kanji, sub: '' };
    }
    return { label: item.pos || '한자', main: item.word, sub: '(한자X)' };
  }
  // all
  const main = item.kanji ? `${item.word} (${item.kanji})` : item.word;
  return { label: item.pos || '일본어', main, sub: '' };
}

function getBackContent(item) {
  const reading = item.kanji ? `${item.word} · ${item.kanji}` : item.word;
  return { label: '뜻', main: item.meaning, sub: reading };
}

function updateModeNote() {
  const noteEl = document.getElementById('mode-note');
  if (displayMode === 'kana') {
    noteEl.textContent = '한자 없이 히라가나만 보여줘요.';
  } else if (displayMode === 'kanji') {
    noteEl.textContent = '한자만 보여줘요. 한자가 없는 단어는 히라가나 옆에 (한자X)로 표시돼요.';
  } else {
    noteEl.textContent = '히라가나와 한자를 같이 보여줘요.';
  }
}

// ---------- 플래시카드 위젯 (여러 개를 독립적으로 만들 수 있다) ----------

const allFlashcardWidgets = [];

function createFlashcardWidget() {
  const root = document.createElement('div');
  root.className = 'flashcard-wrap';
  root.innerHTML = `
    <div class="deck-progress">1 / 10</div>
    <div class="flashcard">
      <div class="face-label">일본어</div>
      <div class="word">言葉</div>
      <div class="sub"></div>
      <div class="hint">카드를 클릭하면 뒤집혀요</div>
    </div>
    <div class="btn-row">
      <button class="btn prev-btn">이전</button>
      <button class="btn shuffle-btn">섞기</button>
      <button class="btn next-btn">다음</button>
    </div>
  `;

  const state = { deck: [], index: 0, showingFront: true };

  const progressEl = root.querySelector('.deck-progress');
  const cardEl = root.querySelector('.flashcard');
  const labelEl = root.querySelector('.face-label');
  const wordEl = root.querySelector('.word');
  const subEl = root.querySelector('.sub');
  const prevBtn = root.querySelector('.prev-btn');
  const nextBtn = root.querySelector('.next-btn');
  const shuffleBtn = root.querySelector('.shuffle-btn');

  function render() {
    if (state.deck.length === 0) return;
    const item = state.deck[state.index];
    const c = state.showingFront ? getFrontContent(item) : getBackContent(item);
    labelEl.textContent = c.label;
    wordEl.textContent = c.main;
    subEl.textContent = c.sub;
    progressEl.textContent = `${state.index + 1} / ${state.deck.length}`;
  }

  function load(words) {
    state.deck = words.slice();
    state.index = 0;
    state.showingFront = true;
    render();
  }

  cardEl.addEventListener('click', () => {
    state.showingFront = !state.showingFront;
    render();
  });

  nextBtn.addEventListener('click', () => {
    if (state.deck.length === 0) return;
    state.index = (state.index + 1) % state.deck.length;
    state.showingFront = true;
    render();
  });

  prevBtn.addEventListener('click', () => {
    if (state.deck.length === 0) return;
    state.index = (state.index - 1 + state.deck.length) % state.deck.length;
    state.showingFront = true;
    render();
  });

  shuffleBtn.addEventListener('click', () => {
    for (let i = state.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.deck[i], state.deck[j]] = [state.deck[j], state.deck[i]];
    }
    state.index = 0;
    state.showingFront = true;
    render();
  });

  const widget = { el: root, load, render };
  allFlashcardWidgets.push(widget);
  return widget;
}

document.querySelectorAll('#mode-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    displayMode = btn.dataset.mode;
    updateModeNote();
    allFlashcardWidgets.forEach(w => w.render());
  });
});

// ---------- 탭 전환 ----------

document.querySelectorAll('.tabs .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page > .panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
  });
});

// ---------- 1. 전체 학습 ----------

const allWidget = createFlashcardWidget();
document.getElementById('all-flashcard-slot').appendChild(allWidget.el);

// ---------- 2. 단어보기 ----------

const LIST_PAGE_SIZE = 50;
let listPage = 0;

function totalListPages() {
  return Math.max(1, Math.ceil(vocabList.length / LIST_PAGE_SIZE));
}

function renderWordListPage() {
  document.getElementById('list-content').classList.remove('hidden');

  const start = listPage * LIST_PAGE_SIZE;
  const pageItems = vocabList.slice(start, start + LIST_PAGE_SIZE);

  const rows = pageItems.map((item, i) => `
    <div class="word-row">
      <div class="num">${start + i + 1}</div>
      <div class="jp">${item.word}${item.kanji ? `<span class="kanji-hint">(${item.kanji})</span>` : ''}</div>
      <div>${item.meaning}</div>
      <div class="pos">${item.pos || ''}</div>
    </div>
  `).join('');

  document.getElementById('word-list').innerHTML = `
    <div class="word-row header"><div>#</div><div>단어</div><div>뜻</div><div>품사</div></div>
    ${rows}
  `;
  document.getElementById('list-page-indicator').textContent = `${listPage + 1} / ${totalListPages()}`;
  document.getElementById('list-prev-btn').disabled = listPage === 0;
  document.getElementById('list-next-btn').disabled = listPage >= totalListPages() - 1;
}

document.getElementById('list-prev-btn').addEventListener('click', () => {
  if (listPage > 0) { listPage--; renderWordListPage(); }
});

document.getElementById('list-next-btn').addEventListener('click', () => {
  if (listPage < totalListPages() - 1) { listPage++; renderWordListPage(); }
});

// ---------- 3. 분류학습 ----------

const classifyWidget = createFlashcardWidget();
document.getElementById('classify-flashcard-slot').appendChild(classifyWidget.el);

function initClassifyPicker() {
  const groups = {};
  vocabList.forEach(item => {
    const key = item.pos && item.pos.trim() ? item.pos.trim() : '기타';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const categories = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  const container = document.getElementById('classify-buttons');

  container.innerHTML = categories.map(cat => `
    <button class="picker-btn" data-cat="${encodeURIComponent(cat)}">${cat}<span class="count">${groups[cat].length}개</span></button>
  `).join('');

  container.querySelectorAll('.picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = decodeURIComponent(btn.dataset.cat);
      document.getElementById('classify-picker').classList.add('hidden');
      document.getElementById('classify-study').classList.remove('hidden');
      classifyWidget.load(groups[cat]);
    });
  });
}

document.getElementById('classify-back-btn').addEventListener('click', () => {
  document.getElementById('classify-study').classList.add('hidden');
  document.getElementById('classify-picker').classList.remove('hidden');
});

// ---------- 4. 일일학습 ----------

const dailyWidget = createFlashcardWidget();
document.getElementById('daily-flashcard-slot').appendChild(dailyWidget.el);

const DAILY_UNIT_SIZE = 50;

function initDailyPicker() {
  const units = [];
  for (let i = 0; i < vocabList.length; i += DAILY_UNIT_SIZE) {
    units.push(vocabList.slice(i, i + DAILY_UNIT_SIZE));
  }

  const container = document.getElementById('daily-buttons');
  container.innerHTML = units.map((u, i) => `
    <button class="picker-btn" data-unit="${i}">${i + 1}단원<span class="count">${u.length}개</span></button>
  `).join('');

  container.querySelectorAll('.picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.unit, 10);
      document.getElementById('daily-picker').classList.add('hidden');
      document.getElementById('daily-study').classList.remove('hidden');
      dailyWidget.load(units[idx]);
    });
  });
}

document.getElementById('daily-back-btn').addEventListener('click', () => {
  document.getElementById('daily-study').classList.add('hidden');
  document.getElementById('daily-picker').classList.remove('hidden');
});

// ---------- 시작 ----------

updateModeNote();

loadVocabData('data-status')
  .then(() => {
    const hasData = vocabList.length > 0;
    document.getElementById('empty-notice').classList.toggle('hidden', hasData);
    if (!hasData) {
      document.getElementById('empty-notice').textContent = '단어를 불러오지 못했어요.';
      return;
    }
    allWidget.load(vocabList);
    renderWordListPage();
    initClassifyPicker();
    initDailyPicker();
  })
  .catch(() => {
    document.getElementById('empty-notice').textContent = '단어를 불러오지 못했어요.';
  });