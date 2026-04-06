import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost, type BlogSection } from '@/content/blog';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://renosmart.app';
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    alternates: { canonical: `${BASE}/blog/${slug}` },
  };
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 className="text-xl font-black mt-10 mb-4 flex items-center gap-3" style={{ color: '#F0B90B' }}>
          <span className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: '#F0B90B' }} />
          {section.content}
        </h2>
      );
    case 'h3':
      return <h3 className="text-base font-bold text-white/90 mt-6 mb-2">{section.content}</h3>;
    case 'p':
      return <p className="text-white/60 leading-relaxed mb-4 text-sm">{section.content}</p>;
    case 'ul':
      return (
        <ul className="mb-4 space-y-2">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F0B90B' }} />
              {item}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="mb-4 space-y-2">
          {section.items?.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-white/60">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-black mt-0.5"
                style={{ background: '#F0B90B' }}>
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );
    case 'callout': {
      const configs = {
        tip:     { border: '#22c55e', bg: '#052010', icon: '💡', label: 'TIP' },
        warning: { border: '#f59e0b', bg: '#1a0f00', icon: '⚠️', label: 'WARNING' },
        info:    { border: '#F0B90B', bg: '#14100a', icon: '📌', label: 'RENOSMART TIP' },
      };
      const cfg = configs[section.calloutType || 'info'];
      return (
        <div className="rounded-xl p-5 mb-5 border" style={{ background: cfg.bg, borderColor: `${cfg.border}40` }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{cfg.icon}</span>
            <span className="text-xs font-black tracking-widest" style={{ color: cfg.border }}>{cfg.label}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{section.content}</p>
        </div>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto mb-6 rounded-xl border border-white/10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: '#F0B90B' }}>
                {section.headers?.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-black text-black text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows?.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#0f1923' : '#0a0f1a' }}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 border-b border-white/5 text-xs" style={{ color: j === 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string }> = {
  'Cost Guide':      { bg: 'bg-blue-500/15',   text: 'text-blue-300' },
  'Guides':          { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  'Tips & Warnings': { bg: 'bg-rose-500/15',    text: 'text-rose-300' },
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const catStyle = CATEGORY_STYLES[post.category] || { bg: 'bg-[#F0B90B]/15', text: 'text-[#F0B90B]' };

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1A' }}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-black" style={{ background: '#F0B90B' }}>RS</span>
            <span className="text-white font-semibold text-sm group-hover:text-[#F0B90B] transition-colors">RenoSmart</span>
          </Link>
          <Link href="/blog" className="text-white/40 text-xs hover:text-[#F0B90B] transition-colors flex items-center gap-1">
            ← All Articles
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden px-6 py-14">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(#F0B90B 1px, transparent 1px), linear-gradient(90deg, #F0B90B 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: '#F0B90B' }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${catStyle.bg} ${catStyle.text}`}>
              {post.category}
            </span>
            {post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-white/35">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-5">
            <div className="hidden sm:flex w-16 h-16 rounded-2xl flex-shrink-0 items-center justify-center text-3xl border border-white/10"
              style={{ background: '#0F1923' }}>
              {post.coverEmoji}
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-white/30 text-xs">
                <time>{new Date(post.date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>{post.readTime}</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>RenoSmart Editorial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content + Sidebar ────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="lg:flex lg:gap-10">

          {/* Article */}
          <article className="flex-1 min-w-0 rounded-2xl border border-white/8 p-7 md:p-10 mb-8 lg:mb-0" style={{ background: '#0F1923' }}>
            {/* Intro / description */}
            <p className="text-white/50 text-sm leading-relaxed italic border-l-2 pl-4 mb-8" style={{ borderColor: '#F0B90B' }}>
              {post.description}
            </p>
            <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg, #F0B90B30, transparent)' }} />

            {post.sections.map((section, i) => (
              <RenderSection key={i} section={section} />
            ))}
          </article>

          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0 space-y-4">

            {/* CTA */}
            <div className="rounded-2xl p-6 border border-[#F0B90B]/25 text-center sticky top-6" style={{ background: 'linear-gradient(135deg, #1a1200, #0d1a0d)' }}>
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-white font-black text-base mb-2 leading-tight">Audit Your Quote Free</h3>
              <p className="text-white/40 text-xs mb-4 leading-relaxed">AI checks every line item against 2025 market rates in 30 seconds.</p>

              <Link
                href="/register"
                className="block w-full py-3 rounded-xl font-black text-sm text-black transition-all hover:opacity-90"
                style={{ background: '#F0B90B' }}
              >
                Try Free →
              </Link>
              <p className="text-white/20 text-xs mt-2">No credit card needed</p>
            </div>

            {/* More articles */}
            {otherPosts.length > 0 && (
              <div className="rounded-2xl p-5 border border-white/8" style={{ background: '#0F1923' }}>
                <h3 className="text-white/40 text-xs font-black tracking-widest uppercase mb-4">More Articles</h3>
                <div className="space-y-3">
                  {otherPosts.map(p => (
                    <Link key={p.slug} href={`/blog/${p.slug}`} className="flex items-start gap-3 group">
                      <span className="text-xl flex-shrink-0 mt-0.5">{p.coverEmoji}</span>
                      <div>
                        <p className="text-white/65 text-xs leading-snug group-hover:text-[#F0B90B] transition-colors font-medium line-clamp-2">
                          {p.title}
                        </p>
                        <p className="text-white/25 text-xs mt-1">{p.readTime}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────── */}
        <div className="relative mt-10 rounded-2xl overflow-hidden border border-[#F0B90B]/20 p-8 text-center">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1400 0%, #0A0F1A 60%, #001510 100%)' }} />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, #F0B90B22 0%, transparent 50%)',
          }} />
          <div className="relative">
            <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3">Stop Overpaying</p>
            <h2 className="text-2xl font-black text-white mb-2">
              Check Your Renovation Quote<br />
              <span style={{ color: '#F0B90B' }}>with AI — It&apos;s Free</span>
            </h2>
            <p className="text-white/40 text-sm mb-6 max-w-sm mx-auto">
              Upload your PDF or Excel quotation. RenoSmart finds overpriced items and missing scopes in 30 seconds.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 font-black px-8 py-3.5 rounded-xl text-black transition-all hover:scale-105"
              style={{ background: '#F0B90B', boxShadow: '0 0 30px #F0B90B25' }}
            >
              Try RenoSmart Free — No Credit Card
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
