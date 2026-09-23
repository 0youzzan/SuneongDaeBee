// ---------- 상태 ----------

let testType = 'objective';   // 'objective' | 'subjective'
let displayMode = 'all';      // 객관식일 때: 'all' | 'kana' | 'kanji'
let inputMode = 'kana';       // 주관식일 때: 'kana' | 'kanji'
let scope = 'all';            // 'all' | 'partial' | 'classify' | 'daily'
let selectedCategory = null;  // scope === 'classify' 일 때 선택된 품사
let selectedUnit = null;      // scope === 'daily' 일 때 선택된 단원(문자열)
let partialCount = 20;        // scope === 'partial' 일 때 원하는 문제 개수

let classifyGroups = {};
let dailyGroups = {};

let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;

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

function getCurrentPool() {
  if (scope === 'all') return vocabList;
  if (scope === 'partial') {
    const n = Math.max(1, Math.min(partialCount, vocabList.length));
    const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }
  if (scope === 'classify') return selectedCategory ? classifyGroups[selectedCategory] : [];
  if (scope === 'daily') return selectedUnit ? dailyGroups[selectedUnit] : [];
  return [];
}

function updateScopeNote() {
  let count;
  if (scope === 'partial') {
    count = Math.max(1, Math.min(partialCount, vocabList.length));
  } else {
    count = getCurrentPool().length;
  }
  document.getElementById('quiz-word-count').textContent = count;
  document.getElementById('start-quiz-btn').disabled = count === 0;
}

// ---------- 유형 / 표시-입력 방식 / 범위 토글 ----------

document.querySelectorAll('#type-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#type-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    testType = btn.dataset.type;
    document.getElementById('objective-mode-section').classList.toggle('hidden', testType !== 'objective');
    document.getElementById('subjective-mode-section').classList.toggle('hidden', testType !== 'subjective');
  });
});

document.querySelectorAll('#display-mode-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#display-mode-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    displayMode = btn.dataset.mode;
  });
});

document.querySelectorAll('#input-mode-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#input-mode-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    inputMode = btn.dataset.mode;
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

function buildChoices(correctItem) {
  const others = vocabList.filter(v => v !== correctItem);
  const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [correctItem.meaning, ...shuffledOthers.map(o => o.meaning)];
  return choices.sort(() => Math.random() - 0.5);
}

function getObjPromptText(item) {
  if (displayMode === 'kana') return item.word;
  if (displayMode === 'kanji') return item.kanji || item.word;
  return item.kanji ? `${item.word} (${item.kanji})` : item.word; // all
}

function getObjPromptTag(item) {
  if (displayMode === 'kanji' && !item.kanji) return '(한자X)';
  return '';
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
  const choices = buildChoices(item);
  const promptText = getObjPromptText(item);
  const promptTag = getObjPromptTag(item);

  content.innerHTML = `
    <div class="status" style="margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${promptText}${promptTag ? ` <span style="color:var(--ink-faint); font-size:1rem;">${promptTag}</span>` : ''}</div>
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

// ---------- 주관식 ----------

function renderSubjectiveQuestion(content, item) {
  const useKanji = inputMode === 'kanji';
  const targetLabel = useKanji ? '한자' : '히라가나';
  const hasKanji = !!item.kanji;

  let noteHtml = '';
  if (useKanji && !hasKanji) {
    noteHtml = `<div class="status" style="margin-bottom:10px;">이 단어는 한자가 없어요 — 히라가나로 입력해도 정답이에요.</div>`;
  }

  content.innerHTML = `
    <div class="status" style="margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${item.meaning}</div>
      ${noteHtml}
      <input type="text" id="subjective-input" class="btn" style="width:100%; font-size:1.1rem; padding:12px; margin-top:14px;"
        placeholder="${targetLabel}로 입력하세요" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="btn-row mt-24">
        <button class="btn primary" id="submit-answer-btn">정답 확인</button>
      </div>
      <div id="subjective-feedback" style="margin-top:14px;"></div>
    </div>
  `;

  const inputEl = document.getElementById('subjective-input');

  // 히라가나 입력일 때만 로마자 자동변환을 붙인다.
  // 한자 입력은 기기의 일본어 IME에 그대로 맡긴다 (자동변환이 IME 조합을 방해할 수 있어서).
  if (!useKanji && window.wanakana) {
    wanakana.bind(inputEl);
  }
  inputEl.focus();

  function checkAnswer() {
    const raw = inputEl.value.trim();
    if (!raw) return;

    let correct;
    if (useKanji) {
      const target = item.kanji || item.word;
      correct = raw === target;
    } else {
      const normInput = window.wanakana ? wanakana.toHiragana(raw) : raw;
      const normTarget = window.wanakana ? wanakana.toHiragana(item.word) : item.word;
      correct = normInput === normTarget;
    }

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
    updateScopeNote();
  })
  .catch(() => {});