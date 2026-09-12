// 아주 단순한 CSV 파서. 큰따옴표로 감싼 필드와 그 안의 쉼표/줄바꿈을 처리한다.
// 반환값: 2차원 배열 (행 x 열)
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  // 윈도우 줄바꿈 정리
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  // 마지막 필드/행 처리
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter(r => r.some(cell => cell.trim() !== ''));
}

// CSV 텍스트를 어휘 배열로 변환한다.
// 기대하는 열 순서: 일본어, 뜻, (선택) 읽는법
// 첫 줄이 헤더로 보이면(예: '일본어' 포함) 건너뛴다.
function csvToVocabList(text) {
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  let startIdx = 0;
  const firstRow = rows[0].map(c => c.trim());
  if (firstRow.some(c => /단어|일본어|뜻|word|meaning/i.test(c))) {
    startIdx = 1;
  }

  const list = [];
  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i].map(c => c.trim());
    if (cols.length < 2) continue;
    const [word, meaning, reading] = cols;
    if (!word || !meaning) continue;
    list.push({ word, meaning, reading: reading || '' });
  }
  return list;
}

const VOCAB_STORAGE_KEY = 'jp-vocab-list-v1';

function saveVocabList(list) {
  localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(list));
}

function loadVocabList() {
  const raw = localStorage.getItem(VOCAB_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
