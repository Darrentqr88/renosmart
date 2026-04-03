import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `avatars/${user.id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload using admin client (bypasses RLS)
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('site-photos')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadErr) {
      console.error('Avatar upload error:', uploadErr);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('site-photos')
      .getPublicUrl(path);

    const url = `${publicUrl}?t=${Date.now()}`;

    // Update profile
    const { error: updateErr } = await supabaseAdmin.from('profiles').update({
      avatar_url: url,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);

    if (updateErr) {
      console.error('Profile avatar_url update error:', updateErr);
      return NextResponse.json({ error: 'Failed to save avatar URL' }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Avatar API error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
