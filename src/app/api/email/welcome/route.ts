import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/resend';

/** POST — send welcome email after registration */
export async function POST(req: NextRequest) {
  try {
    const { email, name, lang } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    await sendWelcomeEmail(email, name || '', lang || 'EN');
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
