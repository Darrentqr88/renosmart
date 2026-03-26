import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const OCR_PROMPT = `You are analyzing a construction material receipt or invoice.
Extract the following information and return ONLY valid JSON with no markdown:
{
  "supplier": "supplier name or unknown",
  "date": "YYYY-MM-DD or null",
  "items": [
    {"description": "item name", "category": "category_type", "qty": 1, "unit": "pcs", "unit_cost": 100, "total": 100}
  ],
  "total_amount": 100,
  "receipt_number": "REF123 or null",
  "notes": ""
}

Categories: tiling_material / electrical_material / plumbing_material / carpentry_material / paint / cement / steel / general_labour / other
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
        error: `不支持的格式 (${mimeType})，请上传 JPG / PNG / PDF`
      }, { status: 400 });
    }

    // Gemini Vision: unified handling for images AND PDFs (no beta flag needed)
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: 1024 },
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
      return NextResponse.json({ error: '无法解析单据内容，请重试' }, { status: 422 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('OCR error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: 'OCR 失败: ' + msg.slice(0, 120) }, { status: 500 });
  }
}
