import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/designer/Sidebar';
import { DesignerHeader } from '@/components/designer/DesignerHeader';

export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  let profile = null;
  let aiUsed = 0;
  let aiLimit = 3;

  if (session) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    profile = p;

    const yearMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('usage_count')
      .eq('user_id', session.user.id)
      .eq('year_month', yearMonth)
      .single();

    aiUsed = usage?.usage_count || 0;

    const limits: Record<string, number> = { free: 3, pro: 50, elite: Infinity };
    aiLimit = limits[p?.plan || 'free'] || 3;
  }

  return (
    <>
      <DesignerHeader profile={profile} />
      <div className="designer-layout" style={{ marginTop: 0 }}>
        <Sidebar profile={profile} aiUsed={aiUsed} aiLimit={aiLimit} />
        <main style={{ background: 'var(--bg)', overflowY: 'auto', minHeight: 'calc(100vh - 60px)' }}>
          {children}
        </main>
      </div>
    </>
  );
}
