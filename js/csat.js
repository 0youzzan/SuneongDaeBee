const QUESTION_COUNT = 20;
const CHOICES = [1, 2, 3, 4, 5];

let selectedSeconds = 15;
let answerKey = [];   // 정답 배열 (길이 20, 값 1~5)
let userAnswers = [];
let countdownTimer = null;

const setupStage = document.getElementById('stage-setup');
const memorizeStage = document.getElementById('stage-memorize');
const recallStage = document.getElementById('stage-recall');
const resultStage = document.getElementById('stage-result');

// ---------- 타이머 선택 ----------

document.querySelectorAll('.timer-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.timer-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSeconds = parseInt(btn.dataset.sec, 10);
  });
});

// ---------- 문제 생성 ----------

function generateAnswerKey() {
  return Array.from({ length: QUESTION_COUNT }, () => CHOICES[Math.floor(Math.random() * CHOICES.length)]);
}

function buildGridHTML(mode, key, answers) {
  // mode: 'memorize' | 'recall' | 'result'
  let rows = '';
  for (let i = 0; i < QUESTION_COUNT; i++) {
    let bubbles = '';
    for (const choice of CHOICES) {
      if (mode === 'memorize') {
        const filled = key[i] === choice ? 'filled' : '';
        bubbles += `<div class="omr-bubble ${filled}">${choice}</div>`;
      } else if (mode === 'recall') {
        const filled = answers[i] === choice ? 'filled' : '';
        bubbles += `<div class="omr-bubble clickable ${filled}" data-row="${i}" data-choice="${choice}">${choice}</div>`;
      } else if (mode === 'result') {
        const isUserChoice = answers[i] === choice;
        const isCorrectChoice = key[i] === choice;
        let cls = '';
        if (isCorrectChoice) cls = 'answer-correct';
        else if (isUserChoice && !isCorrectChoice) cls = 'answer-wrong';
        bubbles += `<div class="omr-bubble ${cls}">${choice}</div>`;
      }
    }
    rows += `<div class="omr-row"><div class="omr-num">${i + 1}</div>${bubbles}</div>`;
  }
  return rows;
}

// ---------- 단계 전환 ----------

function showStage(stage) {
  [setupStage, memorizeStage, recallStage, resultStage].forEach(s => s.classList.add('hidden'));
  stage.classList.remove('hidden');
}

document.getElementById('start-btn').addEventListener('click', () => {
  answerKey = generateAnswerKey();
  userAnswers = new Array(QUESTION_COUNT).fill(null);

  document.getElementById('memorize-grid').innerHTML = buildGridHTML('memorize', answerKey, []);
  showStage(memorizeStage);
  runCountdown(selectedSeconds);
});

function runCountdown(seconds) {
  let remaining = seconds;
  const display = document.getElementById('timer-display');
  display.textContent = remaining;

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remaining--;
    display.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      startRecall();
    }
  }, 1000);
}

function startRecall() {
  document.getElementById('recall-grid').innerHTML = buildGridHTML('recall', [], userAnswers);
  showStage(recallStage);
  attachRecallListeners();
}

function attachRecallListeners() {
  document.querySelectorAll('#recall-grid .omr-bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const row = parseInt(bubble.dataset.row, 10);
      const choice = parseInt(bubble.dataset.choice, 10);
      userAnswers[row] = choice;
      document.getElementById('recall-grid').innerHTML = buildGridHTML('recall', [], userAnswers);
      attachRecallListeners();
    });
  });
}

document.getElementById('submit-btn').addEventListener('click', () => {
  let score = 0;
  for (let i = 0; i < QUESTION_COUNT; i++) {
    if (userAnswers[i] === answerKey[i]) score++;
  }
  document.getElementById('result-score').textContent = `${score} / ${QUESTION_COUNT}`;
  document.getElementById('result-grid').innerHTML = buildGridHTML('result', answerKey, userAnswers);
  showStage(resultStage);
});

document.getElementById('retry-btn').addEventListener('click', () => {
  showStage(setupStage);
});
