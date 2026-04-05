'use client';

import { useI18n } from '@/lib/i18n/context';
import { Sparkles, Lock, X, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type UpgradeReason =
  | 'quota_hit'
  | 'project_limit'
  | 'feature_locked'
  | 'price_db'
  | 'cost_db'
  | 'workers';

interface UpgradePromptProps {
  reason: UpgradeReason;
  currentPlan?: string;
  usage?: number;
  limit?: number;
  onClose?: () => void;
}

const REASON_CONFIG: Record<UpgradeReason, {
  icon: typeof Sparkles;
  en: { title: string; desc: string; cta: string };
  zh: { title: string; desc: string; cta: string };
}> = {
  quota_hit: {
    icon: Zap,
    en: {
      title: 'AI Audit Limit Reached',
      desc: 'Pro designers catch RM8,000+ in quotation errors every month with 50 AI audits.',
      cta: 'Unlock 50 Audits/Month',
    },
    zh: {
      title: 'AI 审计额度已用完',
      desc: 'Pro 设计师每月通过 50 次 AI 审计，平均发现 RM8,000+ 报价错误。',
      cta: '解锁 50 次/月 审计',
    },
  },
  project_limit: {
    icon: Shield,
    en: {
      title: 'Project Limit Reached',
      desc: 'Free plan supports 1 project. Upgrade to manage unlimited projects with full Gantt scheduling.',
      cta: 'Manage Unlimited Projects',
    },
    zh: {
      title: '项目数量已达上限',
      desc: '免费方案仅支持 1 个项目。升级后可管理无限项目，含完整甘特图排程。',
      cta: '管理无限项目',
    },
  },
  feature_locked: {
    icon: Lock,
    en: {
      title: 'Pro Feature',
      desc: 'This feature is available on the Pro plan. Upgrade to access the full RenoSmart toolkit.',
      cta: 'Upgrade to Pro',
    },
    zh: {
      title: 'Pro 专属功能',
      desc: '此功能需要 Pro 方案。升级以使用 RenoSmart 完整工具集。',
      cta: '升级至 Pro',
    },
  },
  price_db: {
    icon: Sparkles,
    en: {
      title: 'Price Database — Pro Feature',
      desc: 'Access real market prices from 200+ renovation categories across Malaysia & Singapore.',
      cta: 'Unlock Price Intelligence',
    },
    zh: {
      title: '价格数据库 — Pro 功能',
      desc: '查看马来西亚和新加坡 200+ 装修类别的真实市场价格。',
      cta: '解锁价格数据',
    },
  },
  cost_db: {
    icon: Sparkles,
    en: {
      title: 'Cost Database — Elite Feature',
      desc: 'Track actual costs vs quotation prices. See your true profit margin on every project.',
      cta: 'Unlock Cost Tracking',
    },
    zh: {
      title: '成本数据库 — Elite 功能',
      desc: '追踪实际成本与报价的差异，查看每个项目的真实利润率。',
      cta: '解锁成本追踪',
    },
  },
  workers: {
    icon: Users,
    en: {
      title: 'Worker Management — Pro Feature',
      desc: 'Assign tasks to workers, track attendance, and manage your team from one dashboard.',
      cta: 'Unlock Worker Management',
    },
    zh: {
      title: '工人管理 — Pro 功能',
      desc: '分配任务、追踪考勤，在一个面板上管理整个团队。',
      cta: '解锁工人管理',
    },
  },
};

export function UpgradePrompt({ reason, currentPlan, usage, limit, onClose }: UpgradePromptProps) {
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const config = REASON_CONFIG[reason];
  const text = lang === 'ZH' ? config.zh : config.en;
  const Icon = config.icon;

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-[90vw] max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-300">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{text.title}</h3>
        <p className="text-sm text-[#6B7280] mb-1 leading-relaxed">{text.desc}</p>

        {/* Usage bar (if quota related) */}
        {usage !== undefined && limit !== undefined && (
          <div className="mt-3 mb-4">
            <div className="flex justify-between text-xs text-[#8B8BA8] mb-1">
              <span>{lang === 'ZH' ? '已使用' : 'Used'}</span>
              <span>{usage}/{limit}</span>
            </div>
            <div className="h-2 bg-[#ECEEF5] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Plan comparison mini */}
        <div className="bg-[#F7F8FA] rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-[#8B8BA8] mb-2">
            <span className="px-2 py-0.5 bg-gray-200 rounded-full font-medium">
              {currentPlan === 'free' ? 'Free' : currentPlan?.toUpperCase() || 'Free'}
            </span>
            <ArrowRight className="w-3 h-3" />
            <span className="px-2 py-0.5 bg-gradient-to-r from-[#4F8EF7] to-[#8B5CF6] text-white rounded-full font-medium">
              Pro
            </span>
          </div>
          <ul className="space-y-1 text-xs text-[#4B5563]">
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#4F8EF7]" />
              {lang === 'ZH' ? '50 次 AI 审计/月' : '50 AI audits/month'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#4F8EF7]" />
              {lang === 'ZH' ? '无限项目' : 'Unlimited projects'}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-[#4F8EF7]" />
              {lang === 'ZH' ? '价格数据库 + 工人管理' : 'Price database + worker management'}
            </li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href={`/designer/pricing?reason=${reason}`}
          className="block w-full text-center py-3 px-4 bg-gradient-to-r from-[#4F8EF7] to-[#8B5CF6] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity no-underline"
        >
          {text.cta}
        </Link>

        <p className="text-center text-[10px] text-[#C7C7CC] mt-3">
          {lang === 'ZH' ? '从 RM99/月起 · 随时取消' : 'From RM99/mo · Cancel anytime'}
        </p>
      </div>
    </div>
  );
}

/** Inline banner version for embedding in pages */
export function UpgradeBanner({ reason, currentPlan }: { reason: UpgradeReason; currentPlan?: string }) {
  const { lang } = useI18n();
  const config = REASON_CONFIG[reason];
  const text = lang === 'ZH' ? config.zh : config.en;
  const Icon = config.icon;

  return (
    <div className="border border-[#E2E4EE] rounded-xl p-4 bg-gradient-to-r from-[#F7F8FA] to-[#EEF0FF]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4F8EF7] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#1A1A2E] mb-0.5">{text.title}</h4>
          <p className="text-xs text-[#6B7280] mb-2">{text.desc}</p>
          <Link
            href={`/designer/pricing?reason=${reason}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#4F8EF7] hover:text-[#3B7DE4] no-underline"
          >
            {text.cta} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
