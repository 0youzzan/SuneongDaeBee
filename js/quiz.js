let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;
let studyMode = 'all'; // 'all' | 'kana' | 'kanji'

function getQuizPool() {
  return vocabList;
}

function updateModeNote() {
  const noteEl = document.getElementById('mode-note');
  if (studyMode === 'kana') {
    noteEl.textContent = '한자 없이 히라가나만 문제로 나와요.';
  } else if (studyMode === 'kanji') {
    noteEl.textContent = '한자만 문제로 나와요. 한자가 없는 단어는 히라가나 옆에 (한자X)로 표시돼요.';
  } else {
    noteEl.textContent = '히라가나와 한자를 같이 문제로 보여줘요.';
  }
}

function showContent(hasData) {
  updateModeNote();
  document.getElementById('quiz-word-count').textContent = getQuizPool().length;
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

// 문제로 보여줄 텍스트를 모드에 맞게 만든다. (힌트 없이 그 모드에 맞는 것만 보여준다)
function getPromptText(item) {
  if (studyMode === 'kana') return item.word;
  if (studyMode === 'kanji') return item.kanji || item.word;
  return item.kanji ? `${item.word} (${item.kanji})` : item.word; // all
}

// 한자 모드인데 한자가 없을 때만 (한자X) 표시. 그 외엔 힌트 없음.
function getPromptTag(item) {
  if (studyMode === 'kanji' && !item.kanji) return '(한자X)';
  return '';
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
  const promptTag = getPromptTag(item);

  content.innerHTML = `
    <div style="color:var(--ink-soft); font-size:0.9rem; margin-bottom:10px;">${quizIndex + 1} / ${quizQueue.length}</div>
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

// ---------- 시작 ----------

loadVocabData('data-status')
  .then(() => showContent(vocabList.length > 0))
  .catch(() => showContent(false));