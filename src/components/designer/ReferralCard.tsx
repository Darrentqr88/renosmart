'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Gift, Copy, Check, Share2 } from 'lucide-react';

interface ReferralStats {
  total: number;
  converted: number;
  rewarded: number;
}

export function ReferralCard() {
  const { lang } = useI18n();
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<ReferralStats>({ total: 0, converted: 0, rewarded: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referral')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCode(data.code);
          setStats(data.stats);
        }
      })
      .catch(() => {});
  }, []);

  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${code}`
    : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = lang === 'ZH'
      ? `我用 RenoSmart 的 AI 审计报价单，节省了很多时间。你也试试吧！${referralUrl}`
      : `I use RenoSmart AI to audit renovation quotations — saves hours per project. Try it free: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!code) return null;

  return (
    <div className="bg-gradient-to-br from-[#F7F8FA] to-[#EEF0FF] border border-[#E2E4EE] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center">
          <Gift className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[#1A1A2E]">
            {lang === 'ZH' ? '邀请同行，双方获益' : 'Refer & Earn'}
          </h4>
          <p className="text-[10px] text-[#8B8BA8]">
            {lang === 'ZH' ? '每成功推荐 = 额外 AI 审计额度' : 'Each referral = bonus AI audits'}
          </p>
        </div>
      </div>

      {/* Code display */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-white rounded-lg px-3 py-2 border border-[#E2E4EE]">
          <span className="text-xs text-[#8B8BA8]">{lang === 'ZH' ? '你的推荐码' : 'Your code'}</span>
          <p className="text-sm font-mono font-bold text-[#1A1A2E]">{code}</p>
        </div>
        <button
          onClick={handleCopy}
          className="p-2.5 bg-white border border-[#E2E4EE] rounded-lg hover:bg-gray-50 transition-colors"
          title="Copy link"
        >
          {copied
            ? <Check className="w-4 h-4 text-green-500" />
            : <Copy className="w-4 h-4 text-[#6B7280]" />
          }
        </button>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handleWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#25D366] text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-[#E2E4EE] rounded-lg text-xs font-semibold text-[#4B5563] hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          {copied
            ? (lang === 'ZH' ? '已复制!' : 'Copied!')
            : (lang === 'ZH' ? '复制链接' : 'Copy Link')
          }
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 text-center">
        <div className="flex-1 bg-white rounded-lg py-2 border border-[#E2E4EE]">
          <p className="text-lg font-bold text-[#1A1A2E]">{stats.total}</p>
          <p className="text-[10px] text-[#8B8BA8]">{lang === 'ZH' ? '已邀请' : 'Invited'}</p>
        </div>
        <div className="flex-1 bg-white rounded-lg py-2 border border-[#E2E4EE]">
          <p className="text-lg font-bold text-[#4F8EF7]">{stats.converted}</p>
          <p className="text-[10px] text-[#8B8BA8]">{lang === 'ZH' ? '已转化' : 'Converted'}</p>
        </div>
        <div className="flex-1 bg-white rounded-lg py-2 border border-[#E2E4EE]">
          <p className="text-lg font-bold text-[#22C55E]">{stats.rewarded}</p>
          <p className="text-[10px] text-[#8B8BA8]">{lang === 'ZH' ? '已奖励' : 'Rewarded'}</p>
        </div>
      </div>
    </div>
  );
}
