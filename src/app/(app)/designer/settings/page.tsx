'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      if (data) { setName(data.name || ''); setCompany(data.company || ''); setPhone(data.phone || ''); }
    })();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from('profiles').update({ name, company, phone, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
      toast({ title: 'Settings saved!', description: 'Your profile has been updated.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <Toaster />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="max-w-md bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
        <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1" /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
        <Button variant="gold" onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Save Changes
        </Button>
      </div>
    </div>
  );
}
