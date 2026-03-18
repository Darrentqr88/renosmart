'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WORKER_TRADES } from '@/types';
import { Plus, Users, Phone, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface Worker {
  id: string;
  name: string;
  phone: string;
  trades: string[];
  status: 'active' | 'inactive';
}

export default function WorkersPage() {
  const supabase = createClient();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const link = `${window.location.origin}/register?invite=${session.user.id}`;
      setInviteLink(link);

      const { data } = await supabase
        .from('designer_workers')
        .select('*')
        .eq('designer_id', session.user.id)
        .order('created_at', { ascending: false });

      setWorkers(data || []);
      setLoading(false);
    })();
  }, []);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copied!', description: 'Share this link with your worker via WhatsApp.' });
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`Hi! Join my team on RenoSmart to receive project assignments and task updates.\n\nClick here to register: ${inviteLink}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleAddWorker = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.from('designer_workers').insert({
      designer_id: session.user.id,
      name,
      phone,
      trades: selectedTrades,
      status: 'active',
    }).select().single();

    if (!error && data) {
      setWorkers(prev => [data, ...prev]);
      setShowAddWorker(false);
      setName('');
      setPhone('');
      setSelectedTrades([]);
      toast({ title: 'Worker added!', description: `${name} has been added to your team.` });
    }
  };

  const toggleTrade = (trade: string) => {
    setSelectedTrades(prev => prev.includes(trade) ? prev.filter(t => t !== trade) : [...prev, trade]);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-500 mt-1">{workers.length} workers in your team</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddWorker(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Worker
        </Button>
      </div>

      {/* Invite Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">Worker Invite Link</h2>
        <p className="text-sm text-blue-700 mb-3">Share this link with workers to join your team automatically.</p>
        <div className="flex gap-2">
          <Input value={inviteLink} readOnly className="bg-white text-sm font-mono" />
          <Button variant="outline" onClick={handleCopyLink} className="gap-2 border-blue-300">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={handleWhatsApp} className="gap-2 bg-green-500 text-white hover:bg-green-600">
            <ExternalLink className="w-4 h-4" />
            WhatsApp
          </Button>
        </div>
      </div>

      {/* Workers list */}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : workers.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500">No workers yet</p>
          <p className="text-sm text-gray-400 mt-1">Add workers manually or share the invite link</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((worker) => (
            <div key={worker.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center">
                  <span className="font-bold text-[#4F8EF7]">{worker.name?.[0]?.toUpperCase() || 'W'}</span>
                </div>
                <Badge className={worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                  {worker.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900">{worker.name}</h3>
              {worker.phone && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <Phone className="w-3 h-3" /> {worker.phone}
                </div>
              )}
              {worker.trades?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {worker.trades.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Add Worker</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Worker&apos;s name" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+60123456789" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Trades</label>
                <div className="flex flex-wrap gap-2">
                  {WORKER_TRADES.map(trade => (
                    <button key={trade} type="button" onClick={() => toggleTrade(trade)}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selectedTrades.includes(trade) ? 'bg-[#4F8EF7] text-white border-[#4F8EF7]' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>
                      {trade}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddWorker(false)} className="flex-1">Cancel</Button>
              <Button variant="gold" onClick={handleAddWorker} className="flex-1" disabled={!name}>Add Worker</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
