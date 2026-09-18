// 여러 페이지(어휘학습, 어휘테스트 등)에서 공통으로 쓰는 단어 데이터 로더.
// csv-parser.js 보다 먼저 로드되면 안 되고, 반드시 뒤에 <script>로 불러와야 한다.

const VOCAB_CSV_PATH = 'vocab.csv';
let vocabList = [];

// data/vocab.csv 를 불러와 vocabList 배열을 채운다.
// statusElId 를 넘기면 그 요소에 진행 상태 문구를 표시한다.
// 실패하면 에러를 던지므로, 호출하는 쪽에서 .catch 로 빈 상태 화면을 보여줘야 한다.
async function loadVocabData(statusElId) {
  const statusEl = statusElId ? document.getElementById(statusElId) : null;
  if (statusEl) statusEl.textContent = '단어를 불러오는 중이에요…';

  try {
    const res = await fetch(VOCAB_CSV_PATH, { cache: 'no-store' });
    if (!res.ok) throw new Error('파일을 찾을 수 없어요');
    const text = await res.text();
    vocabList = csvToVocabList(text);
  } catch (e) {
    vocabList = [];
    if (statusEl) statusEl.textContent = `data/vocab.csv 파일을 불러오지 못했어요. (${e.message})`;
    throw e;
  }

  if (statusEl) statusEl.textContent = `data/vocab.csv에서 단어 ${vocabList.length}개를 불러왔어요.`;
  return vocabList;
}