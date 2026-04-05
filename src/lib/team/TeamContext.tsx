'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Profile, TeamMember } from '@/types';

interface TeamInfo {
  id: string;
  name: string;
  elite_slots: number;
  owner_user_id: string;
  maxMembers: number;
  teamMonthlyLimit: number;
  teamUsage: number;
}

interface TeamContextValue {
  teamMembers: TeamMember[];
  teamInfo: TeamInfo | null;
  isOwner: boolean;
  viewingMemberId: string | null;
  viewingAll: boolean;
  isReadOnly: boolean;
  currentUserId: string | null;
  setViewingMember: (id: string | null) => void;
  setViewingAll: (v: boolean) => void;
  getMemberName: (userId: string) => string;
}

const TeamContext = createContext<TeamContextValue>({
  teamMembers: [],
  teamInfo: null,
  isOwner: false,
  viewingMemberId: null,
  viewingAll: false,
  isReadOnly: false,
  currentUserId: null,
  setViewingMember: () => {},
  setViewingAll: () => {},
  getMemberName: () => '',
});

export function useTeamContext() {
  return useContext(TeamContext);
}

interface TeamProviderProps {
  profile: Profile | null;
  children: ReactNode;
}

export function TeamProvider({ profile, children }: TeamProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Read view state from URL
  const viewingMemberId = searchParams.get('teamMember') || null;
  const viewingAll = searchParams.get('teamView') === 'all';
  const isReadOnly = viewingMemberId !== null || viewingAll;

  // Only fetch team data for Elite users with team_id or Elite plan
  const shouldFetch = profile && (profile.plan === 'elite' || profile.team_id);

  useEffect(() => {
    if (!shouldFetch) return;

    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team/members');
        if (!res.ok) return;
        const data = await res.json();

        // Only enable team features for OWNER
        if (!data.isOwner) return;

        setIsOwner(true);
        setTeamInfo(data.team);

        const ownerId = data.team?.owner_user_id;
        setCurrentUserId(ownerId || null);

        // Build active members list, ensuring the owner is always included
        const activeMembers = (data.members || []).filter((m: TeamMember) => m.status === 'active');
        const ownerInList = activeMembers.some((m: TeamMember) => m.user_id === ownerId);
        if (!ownerInList && ownerId) {
          activeMembers.unshift({
            id: 'owner',
            user_id: ownerId,
            email: data.ownerEmail || '',
            name: data.ownerName || data.ownerEmail?.split('@')[0] || 'Owner',
            role: 'owner' as const,
            status: 'active' as const,
          });
        }
        setTeamMembers(activeMembers);
      } catch {
        // Silently fail — team features just won't show
      }
    };

    fetchTeam();
  }, [shouldFetch]);

  const setViewingMember = useCallback((id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('teamView');
    if (id) {
      params.set('teamMember', id);
    } else {
      params.delete('teamMember');
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const setViewingAll = useCallback((v: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('teamMember');
    if (v) {
      params.set('teamView', 'all');
    } else {
      params.delete('teamView');
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const getMemberName = useCallback((userId: string) => {
    const member = teamMembers.find(m => m.user_id === userId);
    return member?.name || member?.email || userId.slice(0, 8);
  }, [teamMembers]);

  return (
    <TeamContext.Provider value={{
      teamMembers,
      teamInfo,
      isOwner,
      viewingMemberId,
      viewingAll,
      isReadOnly,
      currentUserId,
      setViewingMember,
      setViewingAll,
      getMemberName,
    }}>
      {children}
    </TeamContext.Provider>
  );
}
