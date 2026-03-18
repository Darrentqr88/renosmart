import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: Request) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: 'Missing imageBase64 or mimeType' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    const isPDF    = mimeType === 'application/pdf';
    const isImage  = VALID_IMAGE_TYPES.includes(mimeType) || VALID_IMAGE_TYPES.includes(mimeType.replace('/jpg', '/jpeg'));
    const imgType  = mimeType === 'image/jpg' ? 'image/jpeg' : mimeType;

    if (!isPDF && !isImage) {
      return NextResponse.json({
        error: `不支持的格式 (${mimeType})，请上传 JPG / PNG / PDF`
      }, { status: 400 });
    }

    let responseText: string;

    if (isPDF) {
      // PDF: use beta.messages with document block
      const resp = await anthropic.beta.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        betas: ['pdfs-2024-09-25'],
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: imageBase64 },
            },
            { type: 'text', text: OCR_PROMPT },
          ],
        }],
      });
      responseText = resp.content[0].type === 'text' ? resp.content[0].text : '';
    } else {
      // Image: use standard messages with image block
      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imgType as Anthropic.ImageBlockParam['source']['media_type'],
                data: imageBase64,
              },
            },
            { type: 'text', text: OCR_PROMPT },
          ],
        }],
      });
      responseText = resp.content[0].type === 'text' ? resp.content[0].text : '';
    }

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
