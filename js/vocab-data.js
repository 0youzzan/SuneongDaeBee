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