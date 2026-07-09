/**
 * Quotation analysis eval harness.
 *
 * Runs the REAL production pipeline (extractor logic → buildQuotationPrompt →
 * gemini-2.5-flash @ temperature 0 → sanitize + deriveLumpSumUnits) over a
 * folder of quotation files, and scores each result against automatically
 * extractable ground truth (document grand total, numbered line count) plus
 * internal consistency checks.
 *
 * Usage:  npx tsx scripts/eval/run-quotation-eval.ts "C:/path/to/folder" [--region SG]
 * Output: console table + per-file JSON snapshots in scripts/eval/results/
 *         (results/ is gitignored — contains client data)
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { buildQuotationPrompt } from '../../src/lib/ai/quotation-prompt';
import { deriveLumpSumUnits, dedupeRevisionItems } from '../../src/lib/utils/item-derivation';
import type { QuotationItem } from '../../src/types';

const ROOT = join(__dirname, '..', '..');
const RESULTS_DIR = join(__dirname, 'results');

// ── env ──────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
if (!env.GOOGLE_API_KEY) { console.error('GOOGLE_API_KEY missing in .env.local'); process.exit(1); }

// ── extraction (mirror of src/lib/pdf/extractor.ts, Node-compatible) ─────────
function detectFormat(text: string): string {
  const lower = text.toLowerCase();
  if (/序号|项目|单价|数量|合计|工程|装修/.test(text)) return 'TypeC';
  if (/序号|项目/.test(text) && /supply|install|labour|sqft/.test(lower)) return 'TypeD';
  if (/(ground floor|first floor|second floor|living room|master bed|kitchen|toilet|bathroom|bedroom|common area)/i.test(text)) return 'TypeB';
  if (/\bno\.?\s*\t|\bitem\s*\t|\bdescription\s*\t|\bunit\s*price/i.test(text)) return 'TypeA';
  return 'unknown';
}

function detectSupplyTypeHint(line: string): string {
  const lower = line.toLowerCase();
  if (/labour only|lo\b|labor only/.test(lower)) return '[LABOUR_ONLY]';
  if (/supply only|so\b|material only/.test(lower)) return '[SUPPLY_ONLY]';
  if (/supply\s*&?\s*install|s&i|s\/i|supply and install/.test(lower)) return '[SUPPLY_INSTALL]';
  return '';
}
const annotateSupplyTypes = (lines: string[]) =>
  lines.map(l => { const h = detectSupplyTypeHint(l); return h ? `${l} ${h}` : l; });

function extractClientHints(rawText: string): string {
  const hints: string[] = [];
  const tel = rawText.match(/(?:Tel|H\/P|Hp|Phone|Mobile)[:\s]*([+\d\s\-().]{8,18})/i);
  if (tel) hints.push(`Tel: ${tel[1].trim()}`);
  const email = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (email) hints.push(`Email: ${email[0]}`);
  const attn = rawText.match(/(?:^|\n)(?:To|Attn|Attention|Prepared\s+for|Bill\s+To)[:\s]+([^\n]{3,60})/im);
  if (attn) hints.push(`Attn: ${attn[1].trim()}`);
  const addr = rawText.match(/(?:Site\s+Address|Project\s+Address|Property\s+Address|Address)[:\s]+([^\n]{10,100})/i);
  if (addr) hints.push(`Address: ${addr[1].trim()}`);
  const ref = rawText.match(/(?:Ref|Our\s+Ref|Q\/No|Quotation\s+No)[:\s.]*([A-Z0-9][A-Z0-9\-\/]{3,19})/i);
  if (ref) hints.push(`Ref: ${ref[1].trim()}`);
  return hints.length ? `[PRE-EXTRACTED HINTS — verify and use if correct]\n${hints.join('\n')}\n[END HINTS]\n\n` : '';
}

async function extractPdfText(filePath: string): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(readFileSync(filePath));
  const pdf = await getDocument({ data, useWorkerFetch: false, isEvalSupported: false, useSystemFonts: true }).promise;
  const numPages = Math.min(pdf.numPages, 20);
  const pageTexts: string[] = [];
  const headerCounts: Record<string, number> = {};
  for (let p = 1; p <= numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const lineMap: Record<number, { text: string; x: number; w: number }[]> = {};
    for (const item of tc.items) {
      if (!('str' in item)) continue;
      const it = item as { str: string; transform: number[]; width: number };
      if (!it.str.trim()) continue;
      const y = Math.round(it.transform[5] / 2) * 2;
      (lineMap[y] ||= []).push({ text: it.str, x: it.transform[4], w: it.width > 0 ? it.width : it.str.length * 6 });
    }
    const lines: string[] = [];
    for (const y of Object.keys(lineMap).map(Number).sort((a, b) => b - a)) {
      const items = lineMap[y].sort((a, b) => a.x - b.x);
      let line = items[0].text;
      for (let i = 1; i < items.length; i++) {
        const gap = items[i].x - (items[i - 1].x + items[i - 1].w);
        line += (gap > 8 ? '\t' : ' ') + items[i].text;
      }
      const trimmed = line.trim();
      if (!trimmed) continue;
      const norm = trimmed.substring(0, 30).toLowerCase();
      headerCounts[norm] = (headerCounts[norm] || 0) + 1;
      if (headerCounts[norm] > 2 && trimmed.length < 40) continue;
      lines.push(trimmed);
    }
    if (lines.length) pageTexts.push(`--- Page ${p} ---\n${lines.join('\n')}\n`);
  }
  const rawText = pageTexts.join('\n');
  const annotated = annotateSupplyTypes(rawText.split('\n'));
  return [extractClientHints(rawText), `[DETECTED FORMAT: ${detectFormat(rawText)}]`, ...annotated]
    .filter(Boolean).join('\n').slice(0, 40000);
}

async function extractXlsxText(filePath: string): Promise<string> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(readFileSync(filePath), { type: 'buffer' });
  const lines: string[] = [];
  for (const name of wb.SheetNames) {
    lines.push(`=== Sheet: ${name} ===`);
    lines.push(...annotateSupplyTypes(XLSX.utils.sheet_to_csv(wb.Sheets[name]).split('\n')));
  }
  const raw = lines.join('\n');
  return `${extractClientHints(raw)}[DETECTED FORMAT: ${detectFormat(raw)}]\n${raw}`.slice(0, 40000);
}

// ── Gemini call (same config as /api/claude main audit) ──────────────────────
async function callGemini(prompt: string): Promise<{ text: string; finishReason: string; outTokens: number; thoughtTokens: number }> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          // thinkingBudget 0 matches production: thinking tokens share the output
          // budget and truncate the items array on large quotations
          generationConfig: { maxOutputTokens: 65536, temperature: 0, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    );
    if (res.ok) {
      const j = await res.json();
      const cand = j.candidates?.[0];
      return {
        text: cand?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') || '',
        finishReason: cand?.finishReason || '?',
        outTokens: j.usageMetadata?.candidatesTokenCount ?? 0,
        thoughtTokens: j.usageMetadata?.thoughtsTokenCount ?? 0,
      };
    }
    if ((res.status === 429 || res.status === 503) && attempt < 3) {
      console.log(`  ⏳ ${res.status} — retrying in 20s (attempt ${attempt})`);
      await new Promise(r => setTimeout(r, 20000));
      continue;
    }
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  throw new Error('unreachable');
}

// ── JSON repair (mirror of quotation page) ───────────────────────────────────
function parseAiJson(content: string): Record<string, unknown> {
  const m = content.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON in response');
  try { return JSON.parse(m[0]); } catch { /* repair */ }
  const truncated = m[0].replace(/,\s*$/, '').replace(/[\s,]*$/, '');
  const stack: string[] = [];
  for (const ch of truncated) {
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  return JSON.parse(truncated + stack.reverse().join(''));
}

// ── automatic ground truth from raw text ────────────────────────────────────
function docGrandTotal(rawText: string): number | null {
  const matches = [...rawText.matchAll(/(?:GRAND\s+TOTAL|TOTAL)\s*[:：]?\s*(?:RM|SGD|\$)?\s*([\d,]{4,}\.\d{2})/gi)];
  if (matches.length === 0) return null;
  return Math.max(...matches.map(m => parseFloat(m[1].replace(/,/g, ''))));
}
const numberedLineCount = (rawText: string) =>
  (rawText.match(/^\s*\d{1,2}\.\d{1,2}[\t ]/gm) || []).length;

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const folder = process.argv[2];
  const region = process.argv.includes('--region') ? process.argv[process.argv.indexOf('--region') + 1] : 'MY_KL';
  if (!folder) { console.error('Usage: npx tsx scripts/eval/run-quotation-eval.ts <folder> [--region SG]'); process.exit(1); }
  mkdirSync(RESULTS_DIR, { recursive: true });

  const files = readdirSync(folder).filter(f => /\.(pdf|xlsx|xls|csv|txt)$/i.test(f));
  console.log(`Eval: ${files.length} quotation(s) | model gemini-2.5-flash @ temp 0 | region ${region}\n`);

  const report: Record<string, unknown>[] = [];
  for (const file of files) {
    const path = join(folder, file);
    process.stdout.write(`▶ ${file} ... `);
    try {
      const ext = extname(file).toLowerCase();
      const text = ext === '.pdf' ? await extractPdfText(path)
        : (ext === '.xlsx' || ext === '.xls') ? await extractXlsxText(path)
        : readFileSync(path, 'utf8').slice(0, 40000);

      const prompt = buildQuotationPrompt(text, 'English', undefined, region.startsWith('SG') ? 'SG' : 'MY');
      const t0 = Date.now();
      const { text: raw, finishReason, outTokens, thoughtTokens } = await callGemini(prompt);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);

      const parsed = parseAiJson(raw) as {
        items?: QuotationItem[]; totalAmount?: number; client?: Record<string, string>;
        subtotals?: { amount: number }[]; missingCritical?: unknown[]; alerts?: { level: string }[];
        projectType?: string;
      };
      const items = deriveLumpSumUnits(dedupeRevisionItems((parsed.items ?? []).map(i => ({
        ...i, qty: Number(i.qty) || 0, unitPrice: Number(i.unitPrice) || 0, total: Number(i.total) || 0,
      }))));

      const sumItems = items.reduce((s, i) => s + i.total, 0);
      const docTotal = docGrandTotal(text);
      const aiTotal = Number(parsed.totalAmount) || 0;
      const pct = (a: number, b: number) => b > 0 ? Math.abs(a - b) / b : 1;
      const calcErrors = items.filter(i => i.qty > 0 && i.unitPrice > 0 && pct(i.qty * i.unitPrice, i.total) > 0.02).length;
      const nodata = items.filter(i => i.status === 'nodata').length;
      const derived = items.filter(i => i.unitPriceDerived).length;
      const specCoverage = items.filter(i => (i as { spec?: string }).spec !== undefined).length;

      const row = {
        file,
        items: items.length,
        numberedRef: numberedLineCount(text),
        aiTotal,
        docTotal,
        sumItems: Math.round(sumItems * 100) / 100,
        totalOK: docTotal ? (pct(aiTotal, docTotal) < 0.01 ? '✓' : '✗') : '—',
        itemsSumOK: docTotal ? (pct(sumItems, docTotal) < 0.05 ? '✓' : '✗') : '—',
        calcErr: calcErrors,
        nodata,
        derived,
        specField: `${specCoverage}/${items.length}`,
        client: [parsed.client?.attention, parsed.client?.tel, parsed.client?.address].filter(Boolean).length + '/3',
        alerts: (parsed.alerts || []).length,
        missing: (parsed.missingCritical || []).length,
        projectType: parsed.projectType || '',
        finish: finishReason,
        outTok: outTokens,
        thinkTok: thoughtTokens,
        secs,
      };
      report.push(row);
      writeFileSync(join(RESULTS_DIR, `${basename(file, ext)}.json`),
        JSON.stringify({ meta: row, analysis: { ...parsed, items } }, null, 2));
      console.log(`ok (${items.length} items, ${secs}s)`);
    } catch (e) {
      console.log(`FAILED: ${e instanceof Error ? e.message : e}`);
      report.push({ file, error: String(e).slice(0, 120) });
    }
  }

  console.log('\n══ EVAL REPORT ══════════════════════════════════════════════');
  console.table(report);
  writeFileSync(join(RESULTS_DIR, '_report.json'), JSON.stringify(report, null, 2));
  console.log(`Snapshots: ${RESULTS_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
