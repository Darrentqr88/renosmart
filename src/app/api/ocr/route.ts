import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const OCR_PROMPT = `You are analyzing a construction material receipt or invoice image.
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

Categories must be one of:
tiling_material / electrical_material / plumbing_material / carpentry_material / paint / cement / steel / general_labour / other

If you cannot read part of the receipt clearly, use your best estimate based on context.
Always return valid JSON even if the image is unclear.`;

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            { type: 'text', text: OCR_PROMPT },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to extract receipt data' }, { status: 422 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
  }
}
