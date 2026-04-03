import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const OCR_PROMPT = `You are analyzing a construction material receipt or invoice from Malaysia/Singapore.
Extract the following information and return ONLY valid JSON with no markdown:
{
  "supplier": "supplier name or unknown",
  "date": "YYYY-MM-DD or null",
  "items": [
    {"description": "item name IN ENGLISH", "category": "category_type", "qty": 1, "unit": "sqft", "unit_cost": 8.00, "total": 800}
  ],
  "total_amount": 800,
  "receipt_number": "REF123 or null",
  "notes": ""
}

CRITICAL RULES:
1. ALWAYS translate ALL item descriptions to English. Examples:
   - 瓷砖 600x600 → "Porcelain Tile 600x600"
   - 水泥 → "Cement"
   - Jubin lantai → "Floor Tile"
   - 石膏板天花 → "Plasterboard Ceiling"
   - 防水涂料 → "Waterproofing Coating"
2. unit_cost MUST be the per-unit price, NOT the line total.
   - If receipt shows: 100 sqft x RM8.00 = RM800 → unit_cost=8.00, total=800
   - If receipt shows only total RM500 for 50 pcs → unit_cost=10.00, total=500
   - If only total is shown with no qty → qty=1, unit="lot", unit_cost=total
3. unit values: sqft / pcs / set / unit / lot / m / meter / roll / bag / kg / lump
4. qty must reflect actual quantity (e.g., 100 sqft, 5 pcs), NOT always 1.
5. Categories: tiling_material / electrical_material / plumbing_material / carpentry_material / paint / cement / steel / general_labour / waterproofing / ceiling / flooring / ac / glass / aluminium / roofing / landscape / construction / demolition / other
Always return valid JSON even if the content is unclear.`;

const VO_PROMPT = `You are parsing a Variation Order (VO) document for a renovation project in Malaysia/Singapore.
Extract ALL line items (no limit) and return ONLY valid JSON with no markdown:
{
  "title": "brief VO title or description summary",
  "items": [
    {"no": "1", "description": "VERBATIM item name", "qty": 50, "unit": "sqft", "unit_price": 8, "total": 400, "trade": "tiling"},
    {"no": "2", "description": "Extra carpentry shelving unit", "qty": 1, "unit": "lump", "unit_price": 1200, "total": 1200, "trade": "carpentry"}
  ],
  "total_amount": 1600,
  "notes": ""
}

Trade values (use exactly one): tiling / electrical / plumbing / carpentry / painting / falseCeiling / demolition / waterproofing / aluminium / glass / aircon / cleaning / general
Rules:
- Copy item names VERBATIM from the document. Never translate English names.
- Extract ALL items — do not truncate or summarize.
- If qty or unit_price are not shown, estimate from total or leave as null.
- Always return valid JSON even if some fields are unclear.`;

const VALID_MIME_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
];

export async function POST(request: Request) {
  try {
    // Auth check — caller must be logged in
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageBase64, mimeType, type } = await request.json();
    const isVOMode = type === 'vo';
    const activePrompt = isVOMode ? VO_PROMPT : OCR_PROMPT;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const normalizedMime = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

    if (!VALID_MIME_TYPES.includes(normalizedMime)) {
      return NextResponse.json({
        error: `Unsupported format (${mimeType}). Please upload JPG / PNG / PDF`
      }, { status: 400 });
    }

    // Gemini Vision: unified handling for images AND PDFs (no beta flag needed)
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: isVOMode ? 4096 : 1024 },
    });

    const result = await geminiModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType: normalizedMime } },
          { text: activePrompt },
        ],
      }],
    });

    const responseText = result.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse document content. Please retry.' }, { status: 422 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('OCR error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: 'OCR failed: ' + msg.slice(0, 120) }, { status: 500 });
  }
}
