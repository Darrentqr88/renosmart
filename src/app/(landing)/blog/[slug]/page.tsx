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
      return <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">{section.content}</h2>;
    case 'h3':
      return <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">{section.content}</h3>;
    case 'p':
      return <p className="text-gray-600 leading-relaxed mb-4">{section.content}</p>;
    case 'ul':
      return (
        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-600">
          {section.items?.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-600">
          {section.items?.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
      );
    case 'callout': {
      const styles = {
        tip: 'bg-green-50 border-green-400 text-green-800',
        warning: 'bg-amber-50 border-amber-400 text-amber-800',
        info: 'bg-blue-50 border-blue-400 text-blue-800',
      };
      const style = styles[section.calloutType || 'info'];
      return (
        <div className={`border-l-4 rounded-r-lg p-4 mb-4 ${style}`}>
          <p className="text-sm leading-relaxed">{section.content}</p>
        </div>
      );
    }
    case 'table':
      return (
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800 text-white">
                {section.headers?.map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows?.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2 border-b border-gray-100 text-gray-700">{cell}</td>
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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0A0F1A] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-1 text-[#F0B90B] text-sm mb-6 hover:underline">
            ← All Articles
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-3xl">{post.coverEmoji}</span>
            <span className="text-xs font-medium bg-[#F0B90B]/20 text-[#F0B90B] px-2 py-0.5 rounded-full">
              {post.category}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <time>{new Date(post.date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</time>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <article className="bg-white rounded-xl border border-gray-200 p-6 md:p-10">
          {post.sections.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
        </article>

        {/* CTA Box */}
        <div className="mt-8 bg-[#0A0F1A] rounded-xl p-8 text-white text-center">
          <p className="text-2xl mb-2">🤖</p>
          <h2 className="text-xl font-bold mb-2">Audit Your Renovation Quote with AI</h2>
          <p className="text-gray-400 text-sm mb-5">Upload your PDF or Excel quotation. RenoSmart AI checks every line item against market rates in 30 seconds — free.</p>
          <Link
            href="/register"
            className="inline-block bg-[#F0B90B] text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Try Free — No Credit Card Needed
          </Link>
        </div>

        {/* Related Posts */}
        {otherPosts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold text-gray-700 mb-4">More Articles</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#F0B90B] hover:shadow-sm transition-all">
                    <span className="text-2xl">{p.coverEmoji}</span>
                    <h4 className="text-sm font-medium text-gray-800 mt-2 line-clamp-2 hover:text-[#F0B90B]">
                      {p.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">{p.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
