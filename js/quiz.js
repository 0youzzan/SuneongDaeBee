let quizQueue = [];
let quizIndex = 0;
let quizScore = 0;

function showContent(hasData) {
  document.getElementById('quiz-word-count').textContent = vocabList.length;
  document.getElementById('quiz-empty').classList.toggle('hidden', hasData);
  document.getElementById('quiz-setup').classList.toggle('hidden', !hasData);
}

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

loadVocabData('data-status')
  .then(() => showContent(vocabList.length > 0))
  .catch(() => showContent(false));