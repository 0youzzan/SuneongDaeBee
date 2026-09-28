// ---------- 상태 ----------

let testType = 'objective';   // 'objective' | 'subjective'
let direction = 'kana-meaning'; // 출제 방향 (아래 DIRECTIONS 참고)
let scope = 'all';            // 'all' | 'partial' | 'classify' | 'daily'
let selectedCategory = null;  // scope === 'classify' 일 때 선택된 품사
let selectedUnit = null;      // scope === 'daily' 일 때 선택된 단원(문자열)
let partialCount = 20;        // scope === 'partial' 일 때 원하는 문제 개수

let classifyGroups = {};
let dailyGroups = {};

let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;

// ---------- 출제 방향 정의 ----------
// prompt: 문제로 보여줄 것 / answer: 맞혀야 하는 것
//   meaning = 뜻(한국어), kana = 히라가나/가타카나, kanji = 한자
const DIRECTIONS = {
  'meaning-kana':  { prompt: 'meaning', answer: 'kana' },
  'kana-meaning':  { prompt: 'kana',    answer: 'meaning' },
  'kanji-meaning': { prompt: 'kanji',   answer: 'meaning' },
  'kanji-kana':    { prompt: 'kanji',   answer: 'kana' },
  'kana-kanji':    { prompt: 'kana',    answer: 'kanji' },
};

function needsKanji() {
  const d = DIRECTIONS[direction];
  return d.prompt === 'kanji' || d.answer === 'kanji';
}

function getField(item, key) {
  if (key === 'meaning') return item.meaning || '';
  if (key === 'kana') return item.word || '';
  return item.kanji || '';
}

// 비교용으로 문자열을 다듬는다. (공백, 접두/접미 표시(-, ～), 히라가나/가타카나 차이를 무시)
function normalize(str, key) {
  let t = (str || '').trim();
  if (key === 'meaning') return t;
  t = t.replace(/[\s\-－～〜~・]/g, '');
  if (key === 'kana' && window.wanakana) t = wanakana.toHiragana(t);
  return t;
}

// 같은 문제(같은 히라가나/한자/뜻)를 가진 단어들의 정답을 모두 정답으로 인정한다.
// 예: 동음이의어(あさ = 朝 / 麻)는 둘 중 어느 쪽 한자를 써도 정답.
function getAcceptedAnswers(item) {
  const d = DIRECTIONS[direction];
  const promptNorm = normalize(getField(item, d.prompt), d.prompt);
  const accepted = new Set();
  vocabList.forEach(v => {
    if (normalize(getField(v, d.prompt), d.prompt) === promptNorm) {
      const a = normalize(getField(v, d.answer), d.answer);
      if (a) accepted.add(a);
    }
  });
  return accepted;
}

// ---------- 그룹 만들기 (분류학습 / 일일학습 범위용) ----------

function buildGroups() {
  classifyGroups = {};
  vocabList.forEach(item => {
    const key = item.pos && item.pos.trim() ? item.pos.trim() : '기타';
    (classifyGroups[key] = classifyGroups[key] || []).push(item);
  });

  dailyGroups = {};
  vocabList.forEach(item => {
    const key = (item.unit === null || item.unit === undefined) ? '미분류' : String(item.unit);
    (dailyGroups[key] = dailyGroups[key] || []).push(item);
  });
}

function renderClassifyButtons() {
  const categories = Object.keys(classifyGroups).sort((a, b) => classifyGroups[b].length - classifyGroups[a].length);
  const container = document.getElementById('classify-scope-buttons');
  container.innerHTML = categories.map(cat => `
    <button class="picker-btn" data-cat="${encodeURIComponent(cat)}">${cat}<span class="count">${classifyGroups[cat].length}개</span></button>
  `).join('');

  container.querySelectorAll('.picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.picker-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCategory = decodeURIComponent(btn.dataset.cat);
      updateScopeNote();
    });
  });
}

function renderDailyButtons() {
  const keys = Object.keys(dailyGroups);
  const numeric = keys.filter(k => k !== '미분류').map(Number).sort((a, b) => a - b);
  const container = document.getElementById('daily-scope-buttons');

  let html = numeric.map(n => `
    <button class="picker-btn" data-unit="${n}">${n}단원<span class="count">${dailyGroups[String(n)].length}개</span></button>
  `).join('');

  if (dailyGroups['미분류']) {
    html += `<button class="picker-btn" data-unit="미분류">단원 없음<span class="count">${dailyGroups['미분류'].length}개</span></button>`;
  }

  container.innerHTML = html;

  container.querySelectorAll('.picker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.picker-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedUnit = btn.dataset.unit;
      updateScopeNote();
    });
  });
}

function getScopePool() {
  if (scope === 'classify') return selectedCategory ? classifyGroups[selectedCategory] : [];
  if (scope === 'daily') return selectedUnit ? dailyGroups[selectedUnit] : [];
  return vocabList; // all, partial
}

// 출제 방향에 한자가 필요하면 한자가 있는 단어만 대상으로 한다.
function getEligiblePool() {
  const base = getScopePool();
  return needsKanji() ? base.filter(v => v.kanji) : base;
}

function getCurrentPool() {
  const eligible = getEligiblePool();
  if (scope === 'partial') {
    const n = Math.max(1, Math.min(partialCount, eligible.length));
    return [...eligible].sort(() => Math.random() - 0.5).slice(0, n);
  }
  return eligible;
}

function updateScopeNote() {
  let count = getEligiblePool().length;
  if (scope === 'partial' && count > 0) {
    count = Math.max(1, Math.min(partialCount, count));
  }
  document.getElementById('quiz-word-count').textContent = count;
  document.getElementById('start-quiz-btn').disabled = count === 0;
}

function updateModeNote() {
  const d = DIRECTIONS[direction];
  const notes = [];
  if (needsKanji()) notes.push('한자가 있는 단어만 출제돼요.');
  if (testType === 'subjective') {
    if (d.answer === 'kana') notes.push('로마자로 타이핑하면 자동으로 히라가나로 바뀌어요 (예: tabe → たべ).');
    if (d.answer === 'kanji') notes.push('한자는 기기의 일본어 키보드로 입력해야 해요 (히라가나로 치고 한자로 변환).');
    notes.push('뜻을 맞히는 방향은 객관식에서만 선택할 수 있어요.');
  }
  document.getElementById('mode-note').textContent = notes.join(' ');
}

function updateDirectionButtons() {
  document.querySelectorAll('#direction-toggle .timer-opt').forEach(btn => {
    const d = DIRECTIONS[btn.dataset.dir];
    btn.disabled = testType === 'subjective' && d.answer === 'meaning';
    btn.classList.toggle('active', btn.dataset.dir === direction);
  });
}

// ---------- 유형 / 출제 방향 / 범위 토글 ----------

document.querySelectorAll('#type-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#type-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    testType = btn.dataset.type;
    // 주관식에서는 '뜻'을 답으로 하는 방향을 쓸 수 없으므로 기본 방향으로 바꾼다.
    if (testType === 'subjective' && DIRECTIONS[direction].answer === 'meaning') {
      direction = 'meaning-kana';
    }
    updateDirectionButtons();
    updateModeNote();
    updateScopeNote();
  });
});

document.querySelectorAll('#direction-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    direction = btn.dataset.dir;
    updateDirectionButtons();
    updateModeNote();
    updateScopeNote();
  });
});

document.querySelectorAll('#scope-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#scope-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    scope = btn.dataset.scope;
    document.getElementById('partial-scope-picker').classList.toggle('hidden', scope !== 'partial');
    document.getElementById('classify-scope-picker').classList.toggle('hidden', scope !== 'classify');
    document.getElementById('daily-scope-picker').classList.toggle('hidden', scope !== 'daily');
    if (scope === 'all') { selectedCategory = null; selectedUnit = null; }
    updateScopeNote();
  });
});

document.getElementById('partial-count-input').addEventListener('input', () => {
  const input = document.getElementById('partial-count-input');
  let val = parseInt(input.value, 10);
  if (Number.isNaN(val) || val < 1) val = 1;
  if (vocabList.length > 0 && val > vocabList.length) val = vocabList.length;
  partialCount = val;
  updateScopeNote();
});

// ---------- 시험 시작 / 진행 ----------

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

function startQuiz() {
  const pool = getCurrentPool();
  if (pool.length === 0) return;
  quizQueue = [...pool].sort(() => Math.random() - 0.5);
  quizIndex = 0;
  quizScore = 0;
  document.getElementById('quiz-setup').classList.add('hidden');
  document.getElementById('quiz-content').classList.remove('hidden');
  document.getElementById('quiz-active-bar').classList.remove('hidden');
  renderQuizQuestion();
}

document.getElementById('exit-quiz-btn').addEventListener('click', () => {
  if (!confirm('정말 시험을 종료할까요? 지금까지의 진행 상황은 저장되지 않아요.')) return;
  document.getElementById('quiz-content').classList.add('hidden');
  document.getElementById('quiz-active-bar').classList.add('hidden');
  document.getElementById('quiz-setup').classList.remove('hidden');
});

function buildChoices(item) {
  const d = DIRECTIONS[direction];
  const correct = getField(item, d.answer);
  const accepted = getAcceptedAnswers(item); // 같은 문제의 다른 정답은 오답 보기로 안 나오게 한다
  const seen = new Set();
  const distractors = [];

  const candidates = [...vocabList].sort(() => Math.random() - 0.5);
  for (const v of candidates) {
    const val = getField(v, d.answer);
    if (!val) continue;
    const n = normalize(val, d.answer);
    if (accepted.has(n) || seen.has(n)) continue;
    seen.add(n);
    distractors.push(val);
    if (distractors.length === 3) break;
  }

  return [correct, ...distractors].sort(() => Math.random() - 0.5);
}

function getPromptText(item) {
  return getField(item, DIRECTIONS[direction].prompt);
}

function renderQuizQuestion() {
  const content = document.getElementById('quiz-content');

  if (quizIndex >= quizQueue.length) {
    document.getElementById('quiz-active-bar').classList.add('hidden');
    content.innerHTML = `
      <div class="quiz-result">
        <div class="score">${quizScore} / ${quizQueue.length}</div>
        <p style="color:var(--ink-soft)">시험이 끝났어요.</p>
        <div class="btn-row" style="justify-content:center;">
          <button class="btn primary" id="retry-quiz-btn">같은 범위로 다시</button>
          <button class="btn" id="change-setup-btn">범위/유형 바꾸기</button>
        </div>
      </div>
    `;
    document.getElementById('retry-quiz-btn').addEventListener('click', startQuiz);
    document.getElementById('change-setup-btn').addEventListener('click', () => {
      document.getElementById('quiz-content').classList.add('hidden');
      document.getElementById('quiz-setup').classList.remove('hidden');
    });
    return;
  }

  const item = quizQueue[quizIndex];
  if (testType === 'objective') {
    renderObjectiveQuestion(content, item);
  } else {
    renderSubjectiveQuestion(content, item);
  }
}

// ---------- 객관식 ----------

function renderObjectiveQuestion(content, item) {
  const d = DIRECTIONS[direction];
  const correctValue = getField(item, d.answer);
  const choices = buildChoices(item);

  content.innerHTML = `
    <div class="status" style="margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${getPromptText(item)}</div>
      <div class="quiz-choices">
        ${choices.map(c => `<button class="choice-btn" data-value="${encodeURIComponent(c)}">${c}</button>`).join('')}
      </div>
    </div>
  `;

  content.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const chosen = decodeURIComponent(btn.dataset.value);
      const correct = chosen === correctValue;
      if (correct) quizScore++;

      content.querySelectorAll('.choice-btn').forEach(b => {
        b.disabled = true;
        const val = decodeURIComponent(b.dataset.value);
        if (val === correctValue) b.classList.add('correct');
        else if (b === btn) b.classList.add('wrong');
      });

      setTimeout(() => {
        quizIndex++;
        renderQuizQuestion();
      }, 700);
    });
  });
}

// ---------- 주관식 ----------

function renderSubjectiveQuestion(content, item) {
  const d = DIRECTIONS[direction];
  const answerIsKanji = d.answer === 'kanji';
  const targetLabel = answerIsKanji ? '한자' : '히라가나';

  content.innerHTML = `
    <div class="status" style="margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${getPromptText(item)}</div>
      <input type="text" id="subjective-input" class="btn" style="width:100%; font-size:1.1rem; padding:12px; margin-top:14px;"
        placeholder="${targetLabel}로 입력하세요" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="btn-row mt-24">
        <button class="btn primary" id="submit-answer-btn">정답 확인</button>
      </div>
      <div id="subjective-feedback" style="margin-top:14px;"></div>
    </div>
  `;

  const inputEl = document.getElementById('subjective-input');

  // 히라가나를 답으로 입력할 때만 로마자 자동변환을 붙인다.
  // 한자 입력은 기기의 일본어 IME에 그대로 맡긴다 (자동변환이 IME 조합을 방해할 수 있어서).
  if (!answerIsKanji && window.wanakana) {
    wanakana.bind(inputEl);
  }
  inputEl.focus();

  const accepted = getAcceptedAnswers(item);

  function checkAnswer() {
    const raw = inputEl.value.trim();
    if (!raw) return;

    const correct = accepted.has(normalize(raw, d.answer));
    if (correct) quizScore++;

    inputEl.disabled = true;
    document.getElementById('submit-answer-btn').disabled = true;

    const answerLine = item.kanji ? `${item.word} (${item.kanji})` : item.word;

    document.getElementById('subjective-feedback').innerHTML = `
      <div style="color:${correct ? '#4a7c52' : 'var(--csat)'}; font-weight:600; margin-bottom:6px;">${correct ? '정답이에요!' : '오답이에요'}</div>
      <div style="color:var(--ink-soft); font-size:0.92rem;">정답: ${answerLine} — ${item.meaning}</div>
      <button class="btn primary mt-24" id="next-question-btn">다음 문제</button>
    `;
    document.getElementById('next-question-btn').addEventListener('click', () => {
      quizIndex++;
      renderQuizQuestion();
    });
  }

  document.getElementById('submit-answer-btn').addEventListener('click', checkAnswer);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); checkAnswer(); }
  });
}

// ---------- 시작 ----------

loadVocabData('data-status')
  .then(() => {
    if (vocabList.length === 0) return;
    buildGroups();
    renderClassifyButtons();
    renderDailyButtons();
    updateDirectionButtons();
    updateModeNote();
    updateScopeNote();
  })
  .catch(() => {});