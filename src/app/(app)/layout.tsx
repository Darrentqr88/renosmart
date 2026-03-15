import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Toaster } from '@/components/ui/toaster';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
