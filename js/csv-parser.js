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
//   5열: 단원, 히라가나/가타카나, 한자, 품사, 한국어해석
//   4열: 히라가나/가타카나, 한자, 품사, 한국어해석
//   3열: 일본어, 뜻, 읽는법
//   2열: 일본어, 뜻

function csvToVocabList(text) {
  text = text.replace(/^\uFEFF/, ''); // 엑셀 CSV의 BOM 제거

  const rows = parseCSV(text);
  if (rows.length === 0) return [];

  // 첫 줄이 헤더인지 확인
  let startIdx = 0;
  const firstRow = rows[0].map(c => c.trim());

  const isHeader =
    firstRow.includes('단원') ||
    firstRow.includes('히라가나/가타카나') ||
    firstRow.includes('한자') ||
    firstRow.includes('품사') ||
    firstRow.includes('한국어해석');

  if (isHeader) {
    startIdx = 1;
  }

  const list = [];

  for (let i = startIdx; i < rows.length; i++) {
    const cols = rows[i].map(c => c.trim());

    if (cols.length === 0) continue;

    // 5열: 단원, 히라가나/가타카나, 한자, 품사, 한국어해석
    if (cols.length >= 5) {
      const [unit, word, kanji, pos, meaning] = cols;

      if (!word || !meaning) continue;

      list.push({
        unit: unit || '',
        word,
        kanji: kanji || '',
        pos: pos || '',
        meaning
      });

    // 4열: 히라가나/가타카나, 한자, 품사, 한국어해석
    } else if (cols.length === 4) {
      const [word, kanji, pos, meaning] = cols;

      if (!word || !meaning) continue;

      list.push({
        unit: '',
        word,
        kanji: kanji || '',
        pos: pos || '',
        meaning
      });

    // 3열: 일본어, 뜻, 읽는법
    } else if (cols.length === 3) {
      const [word, meaning, reading] = cols;

      if (!word || !meaning) continue;

      list.push({
        unit: '',
        word,
        kanji: reading || '',
        pos: '',
        meaning
      });

    // 2열: 일본어, 뜻
    } else if (cols.length === 2) {
      const [word, meaning] = cols;

      if (!word || !meaning) continue;

      list.push({
        unit: '',
        word,
        kanji: '',
        pos: '',
        meaning
      });
    }
  }

  return list;
}
// (참고) 이 앱은 이제 항상 data/vocab.csv를 그대로 불러와 쓰기 때문에
// localStorage에 따로 저장하지 않습니다.