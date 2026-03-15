// PDF text extraction using pdfjs-dist
// Preserves page structure with page-by-page extraction
// Returns max 20,000 chars

export async function extractPDFText(file: File): Promise<string> {
  // Dynamically import pdfjs to avoid SSR issues
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source using unpkg CDN (Edge-safe)
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const numPages = Math.min(pdf.numPages, 20);

  const pageTexts: string[] = [];
  const headerCounts: Record<string, number> = {};

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y position (same line = same row)
    const lineMap: Record<string, { text: string; x: number }[]> = {};

    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      const str = (item as { str: string; transform: number[] }).str;
      const transform = (item as { str: string; transform: number[] }).transform;
      if (!str.trim()) continue;

      const y = Math.round(transform[5]);
      const x = transform[4];
      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({ text: str, x });
    }

    // Sort lines top-to-bottom (descending Y in PDF coords)
    const sortedYs = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);

    const lines: string[] = [];
    for (const y of sortedYs) {
      const items = lineMap[y].sort((a, b) => a.x - b.x);

      // Join with tab if gap > 20px
      let line = items[0].text;
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].x - (items[i - 1].x + items[i - 1].text.length * 6);
        line += (gap > 20 ? '\t' : ' ') + items[i].text;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      // Smart filter: skip repeated headers (company name > 2x)
      const normalized = trimmed.substring(0, 30).toLowerCase();
      headerCounts[normalized] = (headerCounts[normalized] || 0) + 1;
      if (headerCounts[normalized] > 2 && trimmed.length < 40) continue;

      lines.push(trimmed);
    }

    if (lines.length > 0) {
      pageTexts.push(`--- Page ${pageNum} ---\n${lines.join('\n')}\n`);
    }
  }

  const fullText = pageTexts.join('\n');
  return fullText.slice(0, 20000); // CRITICAL: 20,000 chars max
}

export async function extractExcelText(file: File): Promise<string> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(`=== Sheet: ${sheetName} ===`);
    lines.push(csv);
  }

  return lines.join('\n').slice(0, 20000);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    return extractPDFText(file);
  } else if (['xlsx', 'xls'].includes(ext)) {
    return extractExcelText(file);
  } else if (['csv', 'txt'].includes(ext)) {
    const text = await file.text();
    return text.slice(0, 20000);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
