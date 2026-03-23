// PDF text extraction — 3-Layer parsing system
// Layer 1: Format detection (PDF/XLSX/CSV/TXT)
// Layer 2: Structure detection (Type A standard | Type B section | Type C Chinese | Type D mixed)
// Layer 3: AI Enhancement (done in /api/claude)

// ===== LAYER 2: Structure Detection =====

type QuotationFormat = 'TypeA' | 'TypeB' | 'TypeC' | 'TypeD' | 'unknown';

function detectFormat(text: string): QuotationFormat {
  const lower = text.toLowerCase();

  // Type C: Chinese format (序号, 项目, 单价, 数量, 合计)
  if (/序号|项目|单价|数量|合计|工程|装修/.test(text)) return 'TypeC';

  // Type D: Mixed (Chinese headers + English items)
  if (/序号|项目/.test(text) && /supply|install|labour|sqft/.test(lower)) return 'TypeD';

  // Type B: Section-based (GROUND FLOOR, FIRST FLOOR, LIVING ROOM headers)
  const sectionHeaders = /(ground floor|first floor|second floor|living room|master bed|kitchen|toilet|bathroom|bedroom|common area)/i;
  if (sectionHeaders.test(text)) return 'TypeB';

  // Type A: Standard table (No | Description | Unit | Qty | Unit Price | Total)
  if (/\bno\.?\s*\t|\bitem\s*\t|\bdescription\s*\t|\bunit\s*price/i.test(text)) return 'TypeA';

  return 'unknown';
}

// Detect supply type hints from item text
function detectSupplyTypeHint(line: string): string {
  const lower = line.toLowerCase();
  if (/labour only|lo\b|labor only/.test(lower)) return '[LABOUR_ONLY]';
  if (/supply only|so\b|material only/.test(lower)) return '[SUPPLY_ONLY]';
  if (/supply\s*&?\s*install|s&i|s\/i|supply and install/.test(lower)) return '[SUPPLY_INSTALL]';
  return '';
}

// Annotate lines with supply type hints to help AI
function annotateSupplyTypes(lines: string[]): string[] {
  return lines.map(line => {
    const hint = detectSupplyTypeHint(line);
    return hint ? `${line} ${hint}` : line;
  });
}

// Format-specific post-processing
function enhanceByFormat(lines: string[], format: QuotationFormat): string[] {
  if (format === 'TypeB') {
    // Mark section headers in ALL-CAPS or known room names
    return lines.map(line => {
      if (/^(GROUND FLOOR|FIRST FLOOR|SECOND FLOOR|LIVING|MASTER|KITCHEN|TOILET|BATHROOM|BEDROOM|COMMON|BALCONY|CORRIDOR)/i.test(line.trim()) && line.length < 50) {
        return `\n### SECTION: ${line.trim().toUpperCase()} ###`;
      }
      return line;
    });
  }
  if (format === 'TypeC' || format === 'TypeD') {
    // For Chinese formats, note the format type for AI
    return [`[FORMAT: Chinese/Mixed quotation]`, ...lines];
  }
  return lines;
}

// ===== CLIENT HINTS PRE-EXTRACTOR =====

function extractClientHints(rawText: string): string {
  const hints: string[] = [];

  // Tel/HP/Phone/Mobile
  const telMatch = rawText.match(/(?:Tel|H\/P|Hp|Phone|Mobile)[:\s]*([+\d\s\-().]{8,18})/i);
  if (telMatch) hints.push(`Tel: ${telMatch[1].trim()}`);

  // Email
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) hints.push(`Email: ${emailMatch[0]}`);

  // Client name (To / Attn / Attention / Bill To / Prepared for)
  const attnMatch = rawText.match(/(?:^|\n)(?:To|Attn|Attention|Prepared\s+for|Bill\s+To)[:\s]+([^\n]{3,60})/im);
  if (attnMatch) hints.push(`Attn: ${attnMatch[1].trim()}`);

  // Address
  const addrMatch = rawText.match(/(?:Site\s+Address|Project\s+Address|Property\s+Address|Address)[:\s]+([^\n]{10,100})/i);
  if (addrMatch) hints.push(`Address: ${addrMatch[1].trim()}`);

  // Project Ref
  const refMatch = rawText.match(/(?:Ref|Our\s+Ref|Q\/No|Quotation\s+No)[:\s.]*([A-Z0-9][A-Z0-9\-\/]{3,19})/i);
  if (refMatch) hints.push(`Ref: ${refMatch[1].trim()}`);

  if (hints.length === 0) return '';
  return `[PRE-EXTRACTED HINTS — verify and use if correct]\n${hints.join('\n')}\n[END HINTS]\n\n`;
}

// ===== LAYER 1: PDF Extraction =====

export async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
  const numPages = Math.min(pdf.numPages, 20);

  const pageTexts: string[] = [];
  const headerCounts: Record<string, number> = {};
  const allRawLines: string[] = [];

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

      // Join with tab if gap > 20px (column separator)
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
      allRawLines.push(trimmed);
    }

    if (lines.length > 0) {
      pageTexts.push(`--- Page ${pageNum} ---\n${lines.join('\n')}\n`);
    }
  }

  const rawText = pageTexts.join('\n');

  // LAYER 2: Detect format and enhance
  const format = detectFormat(rawText);
  const allLines = rawText.split('\n');
  const sectionEnhanced = enhanceByFormat(allLines, format);
  const supplyAnnotated = annotateSupplyTypes(sectionEnhanced);

  const hints = extractClientHints(rawText);
  const result = [
    hints,
    `[DETECTED FORMAT: ${format}]`,
    ...supplyAnnotated,
  ].filter(Boolean).join('\n');

  return result.slice(0, 20000); // CRITICAL: 20,000 chars max
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

    // Detect and annotate supply types in Excel rows
    const csvLines = csv.split('\n');
    const annotated = annotateSupplyTypes(csvLines);
    lines.push(...annotated);
  }

  const raw = lines.join('\n');
  const format = detectFormat(raw);
  const hints = extractClientHints(raw);
  return `${hints}[DETECTED FORMAT: ${format}]\n${raw}`.slice(0, 20000);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'pdf') {
    return extractPDFText(file);
  } else if (['xlsx', 'xls'].includes(ext)) {
    return extractExcelText(file);
  } else if (['csv', 'txt'].includes(ext)) {
    const text = await file.text();
    const hints = extractClientHints(text);
    const lines = text.split('\n');
    const annotated = annotateSupplyTypes(lines);
    const raw = annotated.join('\n');
    const format = detectFormat(raw);
    return `${hints}[DETECTED FORMAT: ${format}]\n${raw}`.slice(0, 20000);
  }

  throw new Error(`Unsupported file type: .${ext}`);
}
