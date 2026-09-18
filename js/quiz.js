let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;
let studyMode = 'kana'; // 'kana' | 'kanji'

// 현재 모드에서 출제 대상이 되는 단어 목록.
// 한자 모드여도 단어를 제외하지 않는다 - 한자가 없으면 (한자X)로 표시한다.
function getQuizPool() {
  return vocabList;
}

function updateModeNote() {
  const noteEl = document.getElementById('mode-note');
  if (studyMode === 'kanji') {
    noteEl.textContent = '한자가 없는 단어는 히라가나로 나오고 옆에 (한자X)로 표시돼요.';
  } else {
    noteEl.textContent = '';
  }
}

function showContent(hasData) {
  updateModeNote();
  const pool = getQuizPool();
  document.getElementById('quiz-word-count').textContent = pool.length;
  document.getElementById('quiz-empty').classList.toggle('hidden', hasData);
  document.getElementById('quiz-setup').classList.toggle('hidden', !hasData);
}

document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);

document.querySelectorAll('#mode-toggle .timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-toggle .timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    studyMode = btn.dataset.mode;
    showContent(vocabList.length > 0);
  });
});

function startQuiz() {
  const pool = getQuizPool();
  if (pool.length === 0) return;
  quizQueue = [...pool].sort(() => Math.random() - 0.5);
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

function getPromptText(item) {
  if (studyMode === 'kanji') return item.kanji || item.word;
  return item.word;
}

function getPromptHint(item) {
  if (studyMode === 'kanji') return item.kanji ? item.word : '한자X';
  return item.kanji;
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
  const promptText = getPromptText(item);
  const promptHint = getPromptHint(item);

  content.innerHTML = `
    <div style="color:var(--ink-soft); font-size:0.9rem; margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
    <div class="quiz-question">
      ${item.pos ? `<div style="color:var(--ink-faint); font-size:0.8rem; margin-bottom:4px;">${item.pos}</div>` : ''}
      <div class="prompt">${promptText}${promptHint ? ` <span style="color:var(--ink-faint); font-size:1rem;">(${promptHint})</span>` : ''}</div>
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

loadVocabData('data-status')
  .then(() => showContent(vocabList.length > 0))
  .catch(() => showContent(false));