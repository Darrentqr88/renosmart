import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Renovation Cost Malaysia 2025 | Price Guide by Room & Trade',
  description: 'Complete 2025 renovation cost guide for Malaysia. Average prices for KL, Selangor, Penang, Johor — by room (kitchen, bathroom, living room) and by trade (tiling, carpentry, electrical). Use our free AI to audit your quote.',
  keywords: ['renovation cost Malaysia 2025', 'renovation price Malaysia', 'kitchen renovation cost KL', 'bathroom renovation Malaysia', 'renovation quotation Malaysia'],
  openGraph: {
    title: 'Renovation Cost Malaysia 2025 | Complete Price Guide',
    description: 'Accurate 2025 renovation prices for Malaysian homeowners. Check if your contractor is overcharging with our free AI audit.',
  },
};

const TRADE_PRICES = [
  { trade: 'Tiling (supply & install)', unit: 'per sqft', low: 'RM 8', high: 'RM 20' },
  { trade: 'Carpentry (custom-built)', unit: 'per sqft', low: 'RM 150', high: 'RM 400' },
  { trade: 'Painting (2 coats)', unit: 'per sqft', low: 'RM 1.50', high: 'RM 3.00' },
  { trade: 'Electrical (new point)', unit: 'per point', low: 'RM 120', high: 'RM 200' },
  { trade: 'False ceiling (gypsum)', unit: 'per sqft', low: 'RM 15', high: 'RM 30' },
  { trade: 'Plumbing (new point)', unit: 'per point', low: 'RM 200', high: 'RM 400' },
  { trade: 'Waterproofing', unit: 'per sqft', low: 'RM 8', high: 'RM 20' },
  { trade: 'Air-con (supply & install, 1HP)', unit: 'per unit', low: 'RM 1,200', high: 'RM 2,500' },
  { trade: 'Masonry / Brickwork', unit: 'per sqft', low: 'RM 30', high: 'RM 80' },
  { trade: 'Glass & Aluminium', unit: 'per sqft', low: 'RM 80', high: 'RM 200' },
];

const ROOM_COSTS = [
  { room: '🛋️ Living Room', basic: 'RM 8,000', mid: 'RM 20,000', high: 'RM 50,000+' },
  { room: '🍳 Kitchen (full)', basic: 'RM 15,000', mid: 'RM 35,000', high: 'RM 80,000+' },
  { room: '🚿 Bathroom (full)', basic: 'RM 8,000', mid: 'RM 18,000', high: 'RM 40,000+' },
  { room: '🛏️ Master Bedroom', basic: 'RM 5,000', mid: 'RM 15,000', high: 'RM 35,000+' },
  { room: '🛏️ Common Bedroom', basic: 'RM 3,000', mid: 'RM 8,000', high: 'RM 20,000+' },
];

export default function RenovationCostMalaysiaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-[#0A0F1A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-[#F0B90B] text-sm hover:underline">← RenoSmart Home</Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-6 mb-4">
            Renovation Cost Malaysia 2025
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl">
            Accurate renovation prices by room and by trade — for KL, Selangor, Penang, and Johor. Updated April 2026.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {['KL & Selangor', 'Penang', 'Johor', 'Updated 2025/2026'].map((tag) => (
              <span key={tag} className="bg-white/10 text-sm px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* AI CTA */}
        <div className="bg-[#F0B90B] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-black text-lg">🤖 Is your contractor overcharging?</p>
            <p className="text-black/70 text-sm mt-1">Upload your quotation — AI checks every price in 30 seconds, free.</p>
          </div>
          <Link
            href="/register"
            className="bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors whitespace-nowrap flex-shrink-0"
          >
            Audit My Quote Free →
          </Link>
        </div>

        {/* Full Reno Cost */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Full Renovation Cost by Property Type</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-4 py-3 text-left">Property Type</th>
                  <th className="px-4 py-3 text-left">Basic (RM)</th>
                  <th className="px-4 py-3 text-left">Mid-Range (RM)</th>
                  <th className="px-4 py-3 text-left">High-End (RM)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Condo (800–1,000 sqft)', '30,000–50,000', '60,000–100,000', '120,000+'],
                  ['Terrace House (1,500 sqft)', '50,000–80,000', '100,000–160,000', '200,000+'],
                  ['Semi-D (2,000 sqft)', '80,000–120,000', '150,000–250,000', '300,000+'],
                  ['Bungalow (4,000+ sqft)', '150,000–250,000', '300,000–500,000', '600,000+'],
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 border-b border-gray-100 text-gray-700 font-medium">
                        {j === 0 ? cell : `RM ${cell}`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Room by Room */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cost by Room</h2>
          <div className="grid gap-3">
            {ROOM_COSTS.map((room) => (
              <div key={room.room} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <span className="font-medium text-gray-800">{room.room}</span>
                <div className="flex gap-4 text-sm text-right">
                  <div><div className="text-gray-400 text-xs">Basic</div><div className="font-semibold text-gray-700">{room.basic}</div></div>
                  <div><div className="text-gray-400 text-xs">Mid</div><div className="font-semibold text-[#F0B90B]">{room.mid}</div></div>
                  <div><div className="text-gray-400 text-xs">High-End</div><div className="font-semibold text-gray-700">{room.high}</div></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trade Rates */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Rate by Trade (2025)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-4 py-3 text-left">Trade</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Low End</th>
                  <th className="px-4 py-3 text-left">High End</th>
                </tr>
              </thead>
              <tbody>
                {TRADE_PRICES.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800">{row.trade}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-500">{row.unit}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-green-600 font-medium">{row.low}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-red-500 font-medium">{row.high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">* Prices are for Klang Valley. Other states may be 10–30% lower.</p>
        </section>

        {/* State Comparison */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Comparison by State</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { state: 'Kuala Lumpur', index: '100%', note: 'Baseline' },
              { state: 'Selangor', index: '95–100%', note: 'Similar to KL' },
              { state: 'Penang', index: '90–95%', note: 'Slightly lower' },
              { state: 'Johor Bahru', index: '80–90%', note: 'More competitive' },
              { state: 'Other states', index: '70–85%', note: '15–30% cheaper' },
              { state: 'Singapore', index: '250–350%', note: 'SGD pricing' },
            ].map((s) => (
              <div key={s.state} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <div className="font-bold text-gray-900">{s.state}</div>
                <div className="text-xl font-bold text-[#F0B90B] my-1">{s.index}</div>
                <div className="text-xs text-gray-400">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Blog CTA */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">More Renovation Guides</h2>
          <div className="space-y-2">
            <Link href="/blog/how-to-read-renovation-quotation" className="block text-[#F0B90B] hover:underline text-sm">
              → How to Read a Renovation Quotation (And Avoid Overpaying)
            </Link>
            <Link href="/blog/renovation-red-flags-malaysia" className="block text-[#F0B90B] hover:underline text-sm">
              → 7 Red Flags in Renovation Quotations That Could Cost You RM10,000+
            </Link>
            <Link href="/blog" className="block text-gray-500 hover:underline text-sm">
              → View all articles
            </Link>
          </div>
        </section>

        {/* Final CTA */}
        <div className="bg-[#0A0F1A] rounded-xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Don&apos;t Overpay for Your Renovation</h2>
          <p className="text-gray-400 mb-5 text-sm max-w-lg mx-auto">
            RenoSmart&apos;s AI checks your contractor&apos;s quotation against real market rates. Find out instantly if you&apos;re being overcharged.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#F0B90B] text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Audit My Quotation — Free
          </Link>
          <p className="text-gray-500 text-xs mt-3">No credit card needed · Takes 30 seconds</p>
        </div>
      </div>
    </div>
  );
}
