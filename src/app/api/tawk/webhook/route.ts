import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RENOSMART_KNOWLEDGE } from '@/lib/ai/crisp-knowledge';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const TAWK_API_KEY = process.env.TAWK_API_KEY || '';
const TAWK_PROPERTY_ID = '69d247ef1772311c3585e36f';
const WEBHOOK_SECRET = process.env.TAWK_WEBHOOK_SECRET || '';

// Rate limit: max 1 AI reply per chat per 10 seconds
const lastReply: Record<string, number> = {};

/** Send message back to Tawk.to conversation */
async function sendTawkReply(chatId: string, message: string) {
  if (!TAWK_API_KEY) {
    console.log('[Tawk AI] No API key, skipping reply');
    return;
  }

  const url = `https://api.tawk.to/v1/chats/${chatId}/messages`;
  const auth = Buffer.from(`${TAWK_API_KEY}:`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    console.error('[Tawk AI] Reply failed:', res.status, await res.text());
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
    console.error('[Tawk AI] Gemini error:', err);
    return "Thanks for reaching out! Our team will reply shortly. Meanwhile, feel free to explore RenoSmart at renosmart.app 😊";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secret = req.nextUrl.searchParams.get('key');
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    const payload = await req.json();

    // Tawk.to webhook event types
    const event = payload.event;

    // Only handle new chat messages from visitors
    if (event !== 'chat:start' && event !== 'chat:msg:create') {
      return NextResponse.json({ ok: true });
    }

    // Skip if message is from agent (prevent infinite loop)
    const message = payload.message || payload.chat;
    if (!message) return NextResponse.json({ ok: true });

    // For chat:msg:create — check sender type
    if (event === 'chat:msg:create') {
      const senderType = payload.sender?.type;
      if (senderType === 'agent' || senderType === 'system') {
        return NextResponse.json({ ok: true });
      }
    }

    const chatId = payload.chatId || payload.chat?._id || payload._id;
    const visitorMessage = payload.message?.text || payload.text || '';
    const visitorName = payload.visitor?.name || payload.sender?.name;

    if (!chatId || !visitorMessage) {
      return NextResponse.json({ ok: true });
    }

    // Rate limit: 1 reply per chat per 10 seconds
    const now = Date.now();
    if (lastReply[chatId] && now - lastReply[chatId] < 10000) {
      return NextResponse.json({ ok: true, skipped: 'rate_limited' });
    }
    lastReply[chatId] = now;

    // Clean up old entries
    const cutoff = now - 60000;
    for (const key of Object.keys(lastReply)) {
      if (lastReply[key] < cutoff) delete lastReply[key];
    }

    // Generate and send AI response
    const aiReply = await generateAIResponse(visitorMessage, visitorName);
    await sendTawkReply(chatId, aiReply);

    return NextResponse.json({ ok: true, replied: true });
  } catch (error) {
    console.error('[Tawk AI] Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
