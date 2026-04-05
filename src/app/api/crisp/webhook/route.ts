import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RENOSMART_KNOWLEDGE } from '@/lib/ai/crisp-knowledge';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || '';
const CRISP_TOKEN_ID = process.env.CRISP_TOKEN_ID || '';
const CRISP_TOKEN_KEY = process.env.CRISP_TOKEN_KEY || '';
const WEBHOOK_SECRET = process.env.CRISP_WEBHOOK_SECRET || '';

// Simple in-memory rate limit: max 1 AI reply per session per 10 seconds
const lastReply: Record<string, number> = {};

/** Send a message back to Crisp conversation */
async function sendCrispReply(sessionId: string, message: string) {
  if (!CRISP_TOKEN_ID || !CRISP_TOKEN_KEY) {
    console.log('[Crisp AI] No API credentials, skipping reply:', message);
    return;
  }

  const url = `https://api.crisp.chat/v1/website/${CRISP_WEBSITE_ID}/conversation/${sessionId}/message`;
  const auth = Buffer.from(`${CRISP_TOKEN_ID}:${CRISP_TOKEN_KEY}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'X-Crisp-Tier': 'plugin',
    },
    body: JSON.stringify({
      type: 'text',
      from: 'operator',
      origin: 'chat',
      content: message,
    }),
  });

  if (!res.ok) {
    console.error('[Crisp AI] Reply failed:', res.status, await res.text());
  }
}

/** Generate AI response using Gemini */
async function generateAIResponse(visitorMessage: string, visitorName?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: RENOSMART_KNOWLEDGE,
      generationConfig: { maxOutputTokens: 300 },
    });

    const prompt = visitorName
      ? `Visitor "${visitorName}" says: "${visitorMessage}"`
      : `Visitor says: "${visitorMessage}"`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[Crisp AI] Gemini error:', err);
    return "Thanks for reaching out! I'll connect you with our team shortly. In the meantime, feel free to explore our features at renosmart.vercel.app 😊";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Optional: verify webhook secret
    const hookKey = req.nextUrl.searchParams.get('key');
    if (WEBHOOK_SECRET && hookKey !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    const payload = await req.json();

    // Only handle visitor messages (not operator messages)
    if (payload.event !== 'message:send') {
      return NextResponse.json({ ok: true });
    }

    const data = payload.data;

    // Skip if message is from operator (prevent infinite loop!)
    if (data?.from === 'operator') {
      return NextResponse.json({ ok: true });
    }

    // Only handle text messages
    if (data?.type !== 'text' || !data?.content) {
      return NextResponse.json({ ok: true });
    }

    const sessionId = data.session_id;
    const visitorMessage = data.content;
    const visitorName = data.user?.nickname;

    // Rate limit: 1 reply per session per 10 seconds
    const now = Date.now();
    if (lastReply[sessionId] && now - lastReply[sessionId] < 10000) {
      return NextResponse.json({ ok: true, skipped: 'rate_limited' });
    }
    lastReply[sessionId] = now;

    // Clean up old entries (prevent memory leak)
    const cutoff = now - 60000;
    for (const key of Object.keys(lastReply)) {
      if (lastReply[key] < cutoff) delete lastReply[key];
    }

    // Generate AI response
    const aiReply = await generateAIResponse(visitorMessage, visitorName);

    // Send reply back to Crisp
    await sendCrispReply(sessionId, aiReply);

    return NextResponse.json({ ok: true, replied: true });
  } catch (error) {
    console.error('[Crisp AI] Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
