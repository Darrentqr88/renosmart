import type { Metadata } from 'next';
import Link from 'next/link';
import { blogPosts } from '@/content/blog';

export const metadata: Metadata = {
  title: 'Renovation Tips & Guides | RenoSmart Blog',
  description: 'Expert renovation advice for Malaysian and Singaporean homeowners. Cost guides, quotation tips, contractor red flags, and more.',
  openGraph: {
    title: 'Renovation Tips & Guides | RenoSmart Blog',
    description: 'Expert renovation advice for Malaysian and Singaporean homeowners.',
  },
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  'Cost Guide':      { bg: 'bg-blue-500/15',  text: 'text-blue-300',  dot: 'bg-blue-400' },
  'Guides':          { bg: 'bg-emerald-500/15', text: 'text-emerald-300', dot: 'bg-emerald-400' },
  'Tips & Warnings': { bg: 'bg-rose-500/15',   text: 'text-rose-300',   dot: 'bg-rose-400' },
};

const DEFAULT_STYLE = { bg: 'bg-[#F0B90B]/15', text: 'text-[#F0B90B]', dot: 'bg-[#F0B90B]' };

export default function BlogPage() {
  const sorted = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [featured, ...rest] = sorted;

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1A' }}>

      {/* ── Nav bar ───────────────────────────────────────────── */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-black" style={{ background: '#F0B90B' }}>RS</span>
            <span className="text-white font-semibold text-sm group-hover:text-[#F0B90B] transition-colors">RenoSmart</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/register" className="text-xs font-semibold px-4 py-2 rounded-lg transition-all text-black" style={{ background: '#F0B90B' }}>
              Try Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 pt-16 pb-12">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#F0B90B 1px, transparent 1px), linear-gradient(90deg, #F0B90B 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20" style={{ background: '#F0B90B' }} />

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F0B90B]/30 bg-[#F0B90B]/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F0B90B] animate-pulse" />
            <span className="text-[#F0B90B] text-xs font-semibold tracking-widest uppercase">Renovation Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
            Renovation Tips<br />
            <span style={{ color: '#F0B90B' }}>&amp; Guides</span>
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Expert advice for Malaysian &amp; Singaporean homeowners — from budgeting to avoiding renovation scams.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-white/30 text-xs">
            <span>{blogPosts.length} articles</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>MY &amp; SG market</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Updated 2025/2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-20">

        {/* ── Featured Post ──────────────────────────────────── */}
        {featured && (() => {
          const style = CATEGORY_STYLES[featured.category] || DEFAULT_STYLE;
          return (
            <Link href={`/blog/${featured.slug}`} className="block group mb-8">
              <article className="relative rounded-2xl overflow-hidden border border-white/8 transition-all duration-300 group-hover:border-[#F0B90B]/40"
                style={{ background: 'linear-gradient(135deg, #0F1923 0%, #111827 100%)' }}>
                {/* Gold accent line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #F0B90B, transparent)' }} />

                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start">
                  {/* Emoji block */}
                  <div className="flex-shrink-0 w-24 h-24 rounded-2xl flex items-center justify-center text-5xl border border-white/10"
                    style={{ background: 'linear-gradient(135deg, #1a2332, #0d1520)' }}>
                    {featured.coverEmoji}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {featured.category}
                      </span>
                      <span className="text-white/30 text-xs">FEATURED</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight group-hover:text-[#F0B90B] transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-white/50 text-sm leading-relaxed mb-6 max-w-2xl">
                      {featured.description}
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {featured.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/40">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-white/25">·</span>
                      <span className="text-white/40 text-xs">{featured.readTime}</span>
                      <span className="ml-auto text-[#F0B90B] text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block">
                        Read article →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          );
        })()}

        {/* ── Section label ─────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-white/30 text-xs font-semibold tracking-widest uppercase">All Articles</span>
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs">{rest.length} more</span>
        </div>

        {/* ── Post Grid ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {rest.map((post, idx) => {
            const style = CATEGORY_STYLES[post.category] || DEFAULT_STYLE;
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="h-full rounded-xl border border-white/8 p-6 flex flex-col transition-all duration-300 group-hover:border-[#F0B90B]/30 group-hover:-translate-y-0.5"
                  style={{ background: '#0F1923' }}>

                  <div className="flex items-start justify-between mb-5">
                    <div className="text-3xl">{post.coverEmoji}</div>
                    <span className="text-white/15 text-xs font-black tabular-nums">
                      {String(idx + 2).padStart(2, '0')}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit mb-3 ${style.bg} ${style.text}`}>
                    <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                    {post.category}
                  </span>

                  <h2 className="text-sm font-bold text-white/90 leading-snug mb-3 group-hover:text-[#F0B90B] transition-colors flex-1">
                    {post.title}
                  </h2>

                  <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-2">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <time className="text-white/25 text-xs">
                      {new Date(post.date).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </time>
                    <span className="text-white/25 text-xs">{post.readTime}</span>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* ── CTA Banner ────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-[#F0B90B]/20 p-8 md:p-10 text-center">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1400 0%, #0A0F1A 50%, #001a0a 100%)' }} />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #F0B90B22 0%, transparent 50%), radial-gradient(circle at 80% 50%, #22c55e22 0%, transparent 50%)',
          }} />
          <div className="relative">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
              Is your contractor<br />
              <span style={{ color: '#F0B90B' }}>overcharging you?</span>
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
              Upload your renovation quotation. RenoSmart AI checks every line item against 2025 market rates in 30 seconds — free.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl text-black transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: '#F0B90B', boxShadow: '0 0 30px #F0B90B30' }}
            >
              Audit My Quote — Free
              <span>→</span>
            </Link>
            <p className="text-white/20 text-xs mt-3">No credit card · Takes 30 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
