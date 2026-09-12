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
// 지원하는 열 구성:
//   4열: 히라가나/가타카나, 한자, 품사, 한국어해석  (예: japanese_vocabulary.csv)
//   3열: 일본어, 뜻, 읽는법
//   2열: 일본어, 뜻
// 첫 줄의 첫 칸에 히라가나/가타카나/한자가 없으면 헤더로 보고 건너뛴다.
function csvToVocabList(text) {
  text = text.replace(/^\uFEFF/, ''); // 엑셀에서 저장한 CSV의 BOM 제거
  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  const jpPattern = /[\u3040-\u30FF\u4E00-\u9FFF]/; // 히라가나/가타카나/한자
  let startIdx = 0;
  const firstCell = (rows[0][0] || '').trim();
  if (!jpPattern.test(firstCell)) {
    startIdx = 1; // 첫 줄이 헤더로 보임
  }

  const list = [];
  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i].map(c => c.trim());
    if (cols.length === 0 || !cols[0]) continue;

    if (cols.length >= 4) {
      // 히라가나/가타카나, 한자, 품사, 한국어해석
      const [word, kanji, pos, meaning] = cols;
      if (!word || !meaning) continue;
      list.push({ word, kanji: kanji || '', pos: pos || '', meaning });
    } else if (cols.length === 3) {
      const [word, meaning, reading] = cols;
      if (!word || !meaning) continue;
      list.push({ word, kanji: reading || '', pos: '', meaning });
    } else if (cols.length === 2) {
      const [word, meaning] = cols;
      if (!word || !meaning) continue;
      list.push({ word, kanji: '', pos: '', meaning });
    }
  }
  return list;
}

// (참고) 이 앱은 이제 항상 data/vocab.csv를 그대로 불러와 쓰기 때문에
// localStorage에 따로 저장하지 않습니다.