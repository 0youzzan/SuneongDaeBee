// 여러 페이지(어휘학습, 어휘테스트 등)에서 공통으로 쓰는 단어 데이터 로더.
// csv-parser.js 보다 먼저 로드되면 안 되고, 반드시 뒤에 <script>로 불러와야 한다.

const VOCAB_CSV_PATH = 'vocab.csv';
let vocabList = [];

// data/vocab.csv 를 불러와 vocabList 배열을 채운다.
// statusElId 를 넘기면, 불러오기에 실패했을 때만 그 요소가 들어있는 안내 박스(.data-box)를 보여준다.
// (박스는 HTML에서 기본적으로 hidden 이라서 성공하면 화면에 아무것도 나타나지 않는다.)
// 실패하면 에러를 던지므로, 호출하는 쪽에서 .catch 로 빈 상태 화면을 보여줘야 한다.
async function loadVocabData(statusElId) {
  const statusEl = statusElId ? document.getElementById(statusElId) : null;
  try {
    const res = await fetch(VOCAB_CSV_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error('파일을 찾을 수 없어요');
    const text = await res.text();
    vocabList = csvToVocabList(text);
  } catch (e) {
    vocabList = [];
    if (statusEl) {
      statusEl.textContent = `data/vocab.csv 파일을 불러오지 못했어요. (${e.message})`;
      const box = statusEl.closest('.data-box');
      if (box) box.classList.remove('hidden');
    }
    throw e;
  }

  return vocabList;
}

// ---------- 일본어 발음 재생 (Web Speech API, 브라우저 내장 기능) ----------

let ttsVoices = [];

function refreshTtsVoices() {
  ttsVoices = ('speechSynthesis' in window) ? window.speechSynthesis.getVoices() : [];
}

if ('speechSynthesis' in window) {
  refreshTtsVoices();
  window.speechSynthesis.onvoiceschanged = refreshTtsVoices; // 크롬은 목소리 목록이 나중에 도착한다
}

// 히라가나/가타카나 문자열을 그대로 읽는다. (한자를 넣으면 엉뚱하게 읽을 수 있어 항상 읽기 필드를 쓴다)
function speakJapanese(text) {
  if (!text || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // 이전에 재생 중이던 소리를 끊고 새로 재생
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ja-JP';
  const jaVoice = ttsVoices.find(v => v.lang && v.lang.startsWith('ja'));
  if (jaVoice) utter.voice = jaVoice;
  window.speechSynthesis.speak(utter);
}

let ttsEnabled = localStorage.getItem('tts-enabled') === '1';

// 페이지의 '발음 자동 재생' 체크박스를 켜고 끄는 상태와 연결한다.
// 설정은 localStorage에 저장되어 다른 페이지에서도 그대로 유지된다.
function initTtsToggle(checkboxId) {
  const el = document.getElementById(checkboxId);
  if (!el) return;
  el.checked = ttsEnabled;
  el.addEventListener('change', () => {
    ttsEnabled = el.checked;
    localStorage.setItem('tts-enabled', ttsEnabled ? '1' : '0');
  });
}