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

const CATEGORY_COLORS: Record<string, string> = {
  'Cost Guide': 'bg-blue-100 text-blue-700',
  'Guides': 'bg-green-100 text-green-700',
  'Tips & Warnings': 'bg-red-100 text-red-700',
};

export default function BlogPage() {
  const sorted = [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0A0F1A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-[#F0B90B] text-sm mb-6 hover:underline">
            ← Back to RenoSmart
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Renovation Tips & Guides
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Expert advice for Malaysian & Singaporean homeowners — from budgeting to avoiding renovation scams.
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid gap-6">
          {sorted.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-[#F0B90B] transition-all group">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{post.coverEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{post.readTime}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#F0B90B] transition-colors mb-2 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <time className="text-xs text-gray-400">
                        {new Date(post.date).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </time>
                      <span className="text-gray-200">·</span>
                      <div className="flex gap-1">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-[#0A0F1A] rounded-xl p-8 text-center text-white">
          <h2 className="text-xl font-bold mb-2">Check Your Renovation Quotation for Free</h2>
          <p className="text-gray-400 mb-4 text-sm">Upload your PDF or Excel quote. AI audits it in 30 seconds.</p>
          <Link
            href="/register"
            className="inline-block bg-[#F0B90B] text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Try RenoSmart Free →
          </Link>
        </div>
      </div>
    </div>
  );
}
