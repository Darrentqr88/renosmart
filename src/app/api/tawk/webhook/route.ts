import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RENOSMART_KNOWLEDGE } from '@/lib/ai/crisp-knowledge';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const TAWK_API_KEY = process.env.TAWK_API_KEY || '';
const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || '69d247ef1772311c3585e36f';
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1jlemi0pt';
const WEBHOOK_SECRET = process.env.TAWK_WEBHOOK_SECRET || '';

/** Send message back to Tawk.to via REST API */
async function sendTawkMessage(chatId: string, message: string) {
  if (!TAWK_API_KEY) {
    console.log('[Tawk AI] No API key configured');
    return;
  }

  const url = `https://api.tawk.to/v1/chat/${chatId}/message`;
  const auth = Buffer.from(`${TAWK_API_KEY}:`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
    },
    body: JSON.stringify({
      type: 'msg',
      msg: message,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Tawk AI] Reply failed:', res.status, text);
  } else {
    console.log('[Tawk AI] Replied successfully to chat:', chatId);
  }
}

/** Generate AI welcome message using Gemini */
async function generateWelcomeMessage(visitorName?: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: RENOSMART_KNOWLEDGE,
      generationConfig: { maxOutputTokens: 200 },
    });

    const prompt = visitorName && visitorName !== 'visitor'
      ? `A visitor named "${visitorName}" just started a chat. Write a warm, brief welcome message (2-3 sentences max). Introduce yourself as RenoSmart's assistant, ask how you can help with their renovation project or questions about RenoSmart. Be friendly and in English (you can switch to Chinese/Malay if they reply in those languages).`
      : `A new visitor just started a chat. Write a warm, brief welcome message (2-3 sentences max). Introduce yourself as RenoSmart's assistant, ask how you can help with their renovation project or questions about RenoSmart. Be friendly and in English.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('[Tawk AI] Gemini error:', err);
    return "Hi there! 👋 Welcome to RenoSmart! I'm your AI assistant for renovation questions and platform support. How can I help you today?";
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secret = req.nextUrl.searchParams.get('key');
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      console.warn('[Tawk AI] Invalid webhook key');
      return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
    }

    const payload = await req.json();
    console.log('[Tawk AI] Webhook received:', JSON.stringify(payload).slice(0, 300));

    // Tawk.to sends: chatStart, chatEnd, ticketCreate, chatTranscript
    const event = payload.event;

    // Only handle chat start events
    if (event !== 'chatStart') {
      return NextResponse.json({ ok: true, skipped: event });
    }

    // Get chat ID and visitor info
    const chatId = payload.chatId || payload.chat?._id;
    const visitorName = payload.visitor?.name || payload.chat?.visitor?.name;

    if (!chatId) {
      console.warn('[Tawk AI] No chatId found in payload');
      return NextResponse.json({ ok: true });
    }

    console.log(`[Tawk AI] New chat started: ${chatId}, visitor: ${visitorName}`);

    // Generate and send welcome message
    const welcomeMsg = await generateWelcomeMessage(visitorName);
    await sendTawkMessage(chatId, welcomeMsg);

    return NextResponse.json({ ok: true, replied: true, chatId });
  } catch (error) {
    console.error('[Tawk AI] Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
