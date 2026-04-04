'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WORKER_TRADES } from '@/types';
import { Plus, Users, Phone, Copy, Check, ExternalLink, Search, Star, UserPlus, Loader2, LinkIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface Worker {
  id: string;
  name: string;
  phone: string;
  trades: string[];
  status: 'active' | 'inactive';
  profile_id?: string;
  worker_rating?: number;
  avatar_url?: string;
  source?: 'own' | 'team';
}

interface SearchResult {
  user_id: string;
  name: string;
  phone: string;
  trades: string[];
  worker_rating?: number;
  avatar_url?: string;
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
  const [sessionUserId, setSessionUserId] = useState('');

  // Phone search state
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      setSessionUserId(authUser.id);

      // Invite link will be generated on demand via API
      setInviteLink('');

      // Load own workers
      const { data } = await supabase
        .from('designer_workers')
        .select('*')
        .eq('designer_id', authUser.id)
        .order('created_at', { ascending: false });

      const ownWorkers: Worker[] = (data || []).map(w => ({ ...w, source: 'own' as const }));

      // Load worker ratings + avatars from profiles
      const withProfile = ownWorkers.filter(w => w.profile_id);
      const withoutProfile = ownWorkers.filter(w => !w.profile_id && w.phone);

      const profileIds = withProfile.map(w => w.profile_id!);
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, worker_rating, avatar_url')
          .in('user_id', profileIds);
        if (profiles) {
          const profileMap = new Map(profiles.map(p => [p.user_id, p]));
          withProfile.forEach(w => {
            if (w.profile_id && profileMap.has(w.profile_id)) {
              const p = profileMap.get(w.profile_id)!;
              w.worker_rating = p.worker_rating || 0;
              w.avatar_url = p.avatar_url || undefined;
            }
          });
        }
      }

      // For workers without profile_id, try matching by phone for avatar
      if (withoutProfile.length > 0) {
        const phones = withoutProfile.map(w => w.phone);
        const { data: phoneProfiles } = await supabase
          .from('profiles')
          .select('phone, avatar_url, worker_rating, user_id')
          .eq('role', 'worker')
          .in('phone', phones);
        if (phoneProfiles) {
          const phoneMap = new Map(phoneProfiles.map(p => [p.phone, p]));
          withoutProfile.forEach(w => {
            if (phoneMap.has(w.phone)) {
              const p = phoneMap.get(w.phone)!;
              w.avatar_url = p.avatar_url || undefined;
              w.worker_rating = p.worker_rating || 0;
              w.profile_id = p.user_id; // link for future
            }
          });
        }
      }

      // Check for team shared workers (Elite plan)
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', authUser.id)
        .single();

      let teamWorkers: Worker[] = [];
      if (myProfile?.team_id) {
        // Get team members
        const { data: members } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', myProfile.team_id)
          .eq('status', 'active')
          .neq('user_id', authUser.id);

        if (members && members.length > 0) {
          const memberIds = members.map(m => m.user_id).filter(Boolean);
          const { data: sharedData } = await supabase
            .from('designer_workers')
            .select('*')
            .in('designer_id', memberIds)
            .eq('status', 'active');

          if (sharedData) {
            // Exclude workers already in own list
            const ownProfileIds = new Set(ownWorkers.filter(w => w.profile_id).map(w => w.profile_id));
            const ownPhones = new Set(ownWorkers.map(w => w.phone));
            teamWorkers = sharedData
              .filter(w => !ownProfileIds.has(w.profile_id) && !ownPhones.has(w.phone))
              .map(w => ({ ...w, source: 'team' as const }));

            // Enrich team workers with avatar from profiles
            const teamProfileIds = teamWorkers.filter(w => w.profile_id).map(w => w.profile_id!);
            if (teamProfileIds.length > 0) {
              const { data: teamProfiles } = await supabase
                .from('profiles')
                .select('user_id, avatar_url')
                .in('user_id', teamProfileIds);
              if (teamProfiles) {
                const avatarMap = new Map(teamProfiles.map(p => [p.user_id, p.avatar_url]));
                teamWorkers.forEach(w => {
                  if (w.profile_id && avatarMap.has(w.profile_id)) {
                    w.avatar_url = avatarMap.get(w.profile_id) || undefined;
                  }
                });
              }
            }
          }
        }
      }

      setWorkers([...ownWorkers, ...teamWorkers]);
      setLoading(false);
    })();
  }, []);

  const handleGenerateInvite = async (): Promise<string | null> => {
    setGeneratingInvite(true);
    try {
      const res = await fetch('/api/worker-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setInviteLink(data.url);
        toast({ title: 'Invite link generated!', description: 'Valid for 72 hours. Share via WhatsApp.' });
        return data.url;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: data.error || 'Failed to generate link' });
        return null;
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Network error' });
      return null;
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    let link = inviteLink;
    if (!link) {
      link = await handleGenerateInvite() || '';
      if (!link) return;
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link copied!', description: 'Share this link with your worker via WhatsApp.' });
  };

  const handleWhatsApp = async () => {
    let link = inviteLink;
    if (!link) {
      link = await handleGenerateInvite() || '';
      if (!link) return;
    }
    const msg = encodeURIComponent(`Hi! You've been invited to join RenoSmart. Just click the link and enter your phone number — no password needed.\n\n${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  // Search existing worker by phone — normalize number for flexible matching
  const handlePhoneSearch = async () => {
    if (searchPhone.length < 4) return;
    setSearching(true);
    setSearchResult(null);
    setSearchNotFound(false);

    // Normalize: strip spaces, dashes, leading +60 or 0
    const raw = searchPhone.replace(/[\s\-()]/g, '');
    // Build multiple search patterns for flexible matching
    const patterns: string[] = [raw];
    // If starts with 0, also try +60 prefix
    if (raw.startsWith('0')) {
      patterns.push(`+6${raw}`);    // 0176... → +60176...
      patterns.push(raw.slice(1));  // 0176... → 176...
    }
    // If starts with 60, also try +60 and 0 prefix
    if (raw.startsWith('60')) {
      patterns.push(`+${raw}`);     // 60176... → +60176...
      patterns.push(`0${raw.slice(2)}`); // 60176... → 0176...
    }
    // If starts with +60, also try 0 prefix
    if (raw.startsWith('+60')) {
      patterns.push(`0${raw.slice(3)}`); // +60176... → 0176...
      patterns.push(raw.slice(1));       // +60176... → 60176...
    }

    // Try each pattern
    let found: SearchResult | null = null;
    for (const pattern of patterns) {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, phone, trades, worker_rating, avatar_url')
        .eq('role', 'worker')
        .ilike('phone', `%${pattern}%`)
        .limit(1);

      if (data && data.length > 0) {
        found = data[0] as SearchResult;
        break;
      }
    }

    if (found) {
      // Check if already in our list
      const alreadyAdded = workers.some(w => w.profile_id === found!.user_id || w.phone === found!.phone);
      if (alreadyAdded) {
        toast({ title: 'Already in your list', description: `${found.name} is already in your workers.` });
        setSearching(false);
        return;
      }
      setSearchResult(found);
    } else {
      setSearchNotFound(true);
    }
    setSearching(false);
  };

  // Add found worker directly
  const handleAddFoundWorker = async () => {
    if (!searchResult || !sessionUserId) return;
    const { data, error } = await supabase.from('designer_workers').insert({
      designer_id: sessionUserId,
      profile_id: searchResult.user_id,
      name: searchResult.name,
      phone: searchResult.phone,
      trades: searchResult.trades || [],
      status: 'active',
    }).select().single();

    if (!error && data) {
      setWorkers(prev => [{ ...data, source: 'own' as const, worker_rating: searchResult.worker_rating, avatar_url: searchResult.avatar_url }, ...prev]);
      setSearchResult(null);
      setSearchPhone('');
      toast({ title: 'Worker added!', description: `${searchResult.name} has been added to your team.` });

      // Notify the worker directly
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'worker_added',
          worker_name: searchResult.name,
          message: `You have been added to a designer's team`,
          exclude_user_id: sessionUserId,
          target_user_id: searchResult.user_id,
        }),
      }).catch(() => {});
    }
  };

  const handleAddWorker = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data, error } = await supabase.from('designer_workers').insert({
      designer_id: authUser.id,
      name,
      phone,
      trades: selectedTrades,
      status: 'active',
    }).select().single();

    if (!error && data) {
      setWorkers(prev => [{ ...data, source: 'own' as const }, ...prev]);
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

  const renderRating = (rating?: number) => {
    if (!rating || rating === 0) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span className="text-xs font-medium text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Toaster />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-500 mt-1">{workers.filter(w => w.source === 'own').length} workers in your team</p>
        </div>
        <Button variant="gold" onClick={() => setShowAddWorker(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Worker
        </Button>
      </div>

      {/* Search existing worker by phone */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Search className="w-4 h-4" /> Search Worker by Phone
        </h3>
        <p className="text-sm text-gray-500 mb-3">Find workers already registered on RenoSmart</p>
        <div className="flex gap-2">
          <Input
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            placeholder="Enter phone number..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()}
          />
          <Button onClick={handlePhoneSearch} disabled={searching || searchPhone.length < 5} className="gap-2">
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {/* Search result */}
        {searchResult && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
              {searchResult.avatar_url ? (
                <img src={searchResult.avatar_url} alt={searchResult.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-green-700">{searchResult.name?.[0]?.toUpperCase() || 'W'}</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{searchResult.name}</p>
              <p className="text-sm text-gray-500">{searchResult.phone}</p>
              {searchResult.trades?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {searchResult.trades.slice(0, 3).map(t => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
            {renderRating(searchResult.worker_rating)}
            <Button size="sm" onClick={handleAddFoundWorker} className="gap-1">
              <UserPlus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>
        )}

        {searchNotFound && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            No registered worker found with this number.{' '}
            <button onClick={handleWhatsApp} className="text-[#4F8EF7] font-medium hover:underline">
              Send WhatsApp invite?
            </button>
          </div>
        )}
      </div>

      {/* Invite Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-blue-900 mb-2">Worker Invite Link</h2>
        <p className="text-sm text-blue-700 mb-3">Generate a link — workers just enter their phone number, no password needed.</p>
        {!inviteLink ? (
          <Button onClick={handleGenerateInvite} disabled={generatingInvite} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            {generatingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            Generate Invite Link
          </Button>
        ) : (
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
        )}
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
        <>
          {/* Own workers */}
          {workers.filter(w => w.source === 'own').length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">My Workers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workers.filter(w => w.source === 'own').map((worker) => (
                  <div key={worker.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#4F8EF7]/20 flex items-center justify-center overflow-hidden">
                        {worker.avatar_url ? (
                          <img src={worker.avatar_url} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-[#4F8EF7]">{worker.name?.[0]?.toUpperCase() || 'W'}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderRating(worker.worker_rating)}
                        <Badge className={worker.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                          {worker.status}
                        </Badge>
                      </div>
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
            </div>
          )}

          {/* Team shared workers */}
          {workers.filter(w => w.source === 'team').length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" /> Team Shared
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {workers.filter(w => w.source === 'team').map((worker) => (
                  <div key={worker.id} className="bg-white rounded-xl border border-dashed border-gray-200 p-5 opacity-90">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                        {worker.avatar_url ? (
                          <img src={worker.avatar_url} alt={worker.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-purple-600">{worker.name?.[0]?.toUpperCase() || 'W'}</span>
                        )}
                      </div>
                      <Badge className="bg-purple-50 text-purple-600 border-purple-200">Team</Badge>
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
            </div>
          )}
        </>
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
