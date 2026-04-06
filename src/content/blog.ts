export interface BlogSection {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'callout' | 'table';
  content?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
  calloutType?: 'tip' | 'warning' | 'info';
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  coverEmoji: string;
  sections: BlogSection[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'renovation-cost-malaysia-2025',
    title: 'Renovation Cost Malaysia 2025: Complete Price Guide by Room & Trade',
    description: 'Planning a renovation in Malaysia? Get accurate 2025 renovation costs by room (living room, kitchen, bathroom) and by trade (tiling, painting, electrical). Includes KL, Selangor, Penang, and Johor pricing.',
    date: '2026-03-15',
    readTime: '8 min read',
    tags: ['Renovation Cost', 'Malaysia', '2025', 'Budgeting'],
    category: 'Cost Guide',
    coverEmoji: '🏠',
    sections: [
      {
        type: 'p',
        content: 'Renovation costs in Malaysia vary widely depending on the scope of work, quality of materials, and your location. This guide breaks down realistic 2025 renovation costs so you can budget accurately — and avoid overpaying.',
      },
      {
        type: 'callout',
        calloutType: 'tip',
        content: 'Pro tip: Always upload your renovation quotation to RenoSmart\'s AI Audit tool. It automatically checks if the prices are fair, flags missing items, and identifies potential overcharges — for free.',
      },
      {
        type: 'h2',
        content: 'Average Renovation Cost by Property Type',
      },
      {
        type: 'table',
        headers: ['Property Type', 'Basic (RM)', 'Mid-Range (RM)', 'High-End (RM)'],
        rows: [
          ['Condo (800–1,000 sqft)', '30,000–50,000', '60,000–100,000', '120,000+'],
          ['Terrace House (1,500 sqft)', '50,000–80,000', '100,000–160,000', '200,000+'],
          ['Semi-D (2,000 sqft)', '80,000–120,000', '150,000–250,000', '300,000+'],
          ['HDB (Singapore, 900 sqft)', 'SGD 30,000–50,000', 'SGD 60,000–100,000', 'SGD 120,000+'],
        ],
      },
      {
        type: 'h2',
        content: 'Renovation Cost by Room (Malaysia 2025)',
      },
      {
        type: 'h3',
        content: 'Living & Dining Room',
      },
      {
        type: 'table',
        headers: ['Item', 'Unit', 'Price Range (RM)'],
        rows: [
          ['Feature wall (plaster/timber)', 'per wall', '1,500–5,000'],
          ['Ceiling works (false ceiling)', 'per sqft', '15–35'],
          ['Flooring (tiles 60×60)', 'per sqft', '8–18'],
          ['Flooring (vinyl plank)', 'per sqft', '6–14'],
          ['Painting (2 coats)', 'per sqft', '1.50–3.00'],
          ['TV console (custom carpentry)', 'per unit', '3,000–8,000'],
          ['Curtain track + installation', 'per window', '300–800'],
        ],
      },
      {
        type: 'h3',
        content: 'Kitchen Renovation Cost',
      },
      {
        type: 'table',
        headers: ['Item', 'Unit', 'Price Range (RM)'],
        rows: [
          ['Kitchen cabinet (full set)', 'per lineal ft', '350–800'],
          ['Quartz countertop', 'per sqft', '80–200'],
          ['Wall tiles (field)', 'per sqft', '5–15'],
          ['Floor tiles (heavy duty)', 'per sqft', '8–20'],
          ['Plumbing (sink, pipes)', 'lump sum', '1,500–4,000'],
          ['Kitchen hood & hob', 'per set', '1,500–5,000'],
          ['Backsplash (mosaic/subway)', 'per sqft', '15–40'],
        ],
      },
      {
        type: 'h3',
        content: 'Bathroom Renovation Cost',
      },
      {
        type: 'table',
        headers: ['Item', 'Unit', 'Price Range (RM)'],
        rows: [
          ['Full bathroom hacking & rebuild', 'per bathroom', '8,000–20,000'],
          ['Wall tiles (full height)', 'per sqft', '6–18'],
          ['Floor tiles (anti-slip)', 'per sqft', '7–15'],
          ['Waterproofing (critical!)', 'per sqft', '8–20'],
          ['Shower screen', 'per unit', '800–3,500'],
          ['Vanity cabinet', 'per unit', '800–3,000'],
          ['Toilet bowl', 'per unit', '400–2,500'],
          ['Water heater installation', 'per unit', '300–800'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: '⚠️ Waterproofing is the #1 item contractors skip to cut costs. If your quotation doesn\'t list waterproofing for bathrooms separately, demand it be added. A missing waterproofing job can lead to RM30,000+ in damage claims.',
      },
      {
        type: 'h2',
        content: 'Renovation Cost by Trade',
      },
      {
        type: 'table',
        headers: ['Trade', 'Unit', 'Market Rate (RM)'],
        rows: [
          ['Tiling (supply & install)', 'per sqft', '8–20'],
          ['Carpentry (custom)', 'per sqft', '150–400'],
          ['Painting (walls, 2 coats)', 'per sqft', '1.50–3.00'],
          ['Electrical (first point)', 'per point', '120–200'],
          ['Electrical (additional point)', 'per point', '80–150'],
          ['Plumbing (new point)', 'per point', '200–400'],
          ['False ceiling (gypsum)', 'per sqft', '15–30'],
          ['Masonry / Brickwork', 'per sqft', '30–80'],
          ['Glass & Aluminium works', 'per sqft', '80–200'],
          ['Air-con (supply & install, 1HP)', 'per unit', '1,200–2,500'],
        ],
      },
      {
        type: 'h2',
        content: 'Price Differences by State',
      },
      {
        type: 'table',
        headers: ['State', 'Cost Index', 'Notes'],
        rows: [
          ['Kuala Lumpur', '100% (baseline)', 'Highest labour costs'],
          ['Selangor (PJ, SS, Ara Damansara)', '95–100%', 'Similar to KL'],
          ['Penang (Georgetown area)', '90–95%', 'Slightly lower'],
          ['Johor Bahru', '80–90%', 'More competitive'],
          ['Other states', '70–85%', 'Generally 15–30% cheaper'],
          ['Singapore', '250–350%', 'SGD pricing, much higher'],
        ],
      },
      {
        type: 'h2',
        content: 'How to Keep Renovation Costs Under Control',
      },
      {
        type: 'ol',
        items: [
          'Get at least 3 quotations — prices for the same job can vary 40–60% between contractors',
          'Ask for itemised breakdowns — never accept lump sum quotes without line items',
          'Audit your quotation with AI — tools like RenoSmart flag overpriced items instantly',
          'Fix your budget before meeting contractors — tell them your max budget upfront',
          'Don\'t skip waterproofing — it\'s cheap now, catastrophically expensive to fix later',
          'Negotiate payment terms — never pay more than 30% upfront',
          'Get everything in writing — verbal promises mean nothing in disputes',
        ],
      },
      {
        type: 'h2',
        content: 'Frequently Asked Questions',
      },
      {
        type: 'h3',
        content: 'How long does a full renovation take in Malaysia?',
      },
      {
        type: 'p',
        content: 'A full condo renovation (800–1,000 sqft) typically takes 6–10 weeks. Landed property renovations take 10–16 weeks. Major factors affecting timeline: custom carpentry lead time (3–4 weeks), tile delivery, and contractor scheduling.',
      },
      {
        type: 'h3',
        content: 'Is it cheaper to renovate or buy a new property?',
      },
      {
        type: 'p',
        content: 'In most cases, renovating is significantly cheaper. A full gut renovation of a 1,000 sqft condo costs RM60,000–120,000 vs. the RM200,000–500,000 price difference between a sub-sale unit and new launch in the same area.',
      },
      {
        type: 'h3',
        content: 'What is NOT included in most renovation quotations?',
      },
      {
        type: 'ul',
        items: [
          'Furniture (beds, sofas, dining table) — usually separate',
          'Appliances (fridge, washing machine, oven) — usually separate',
          'Curtains and blinds — sometimes excluded',
          'Light fixtures — bulbs often excluded even if wiring included',
          'Rubbish disposal — check if included',
          'Touch-up works after moving in — usually a separate cost',
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 Use RenoSmart\'s free AI Quotation Audit to instantly check if your renovation quote is fair. Upload your PDF or Excel file and get a detailed analysis in under 30 seconds — including which items are overpriced, what\'s missing, and the estimated fair price.',
      },
    ],
  },
  {
    slug: 'how-to-read-renovation-quotation',
    title: 'How to Read a Renovation Quotation (And Avoid Overpaying)',
    description: 'Most homeowners don\'t know what to look for in a renovation quote. Learn how to read line items, spot vague descriptions, and use these questions to negotiate a fair price from your contractor.',
    date: '2026-03-22',
    readTime: '6 min read',
    tags: ['Quotation', 'Tips', 'Malaysia', 'Beginner Guide'],
    category: 'Guides',
    coverEmoji: '📋',
    sections: [
      {
        type: 'p',
        content: 'Renovation quotations are often long, confusing documents filled with industry jargon. Most homeowners sign them without fully understanding what they\'re paying for — and end up surprised by extra charges later. This guide teaches you exactly what to look for.',
      },
      {
        type: 'h2',
        content: 'The Anatomy of a Renovation Quotation',
      },
      {
        type: 'p',
        content: 'A proper renovation quotation should have these 5 elements for every line item:',
      },
      {
        type: 'ol',
        items: [
          'Description — What exactly is being done (not just "tiling works")',
          'Quantity — How many sqft, lineal ft, or units',
          'Unit — sqft, point, unit, lump sum (avoid "LS" for big items)',
          'Unit Price — Price per unit',
          'Total — Quantity × Unit Price',
        ],
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: '🚨 Red flag: Any line item listed as "Lump Sum" (LS) for more than RM500 without a breakdown. This is how contractors hide markup. Always ask: "Can you break this down by item and quantity?"',
      },
      {
        type: 'h2',
        content: '7 Things to Check in Every Quotation',
      },
      {
        type: 'h3',
        content: '1. Waterproofing is listed separately',
      },
      {
        type: 'p',
        content: 'Waterproofing for bathrooms and wet areas should appear as its own line item, typically RM8–20/sqft. If it\'s not listed, ask specifically — some contractors bundle it vaguely into "tiling works" or skip it entirely.',
      },
      {
        type: 'h3',
        content: '2. Material brands and specifications are stated',
      },
      {
        type: 'p',
        content: 'A quote saying "tiles" is not the same as "Seagull porcelain tiles 60×60cm, Grade A". Without specifications, a contractor can swap expensive materials for cheap ones after you sign. Always get the brand, model, and grade in writing.',
      },
      {
        type: 'h3',
        content: '3. Electrical points are counted individually',
      },
      {
        type: 'p',
        content: 'Electrical work should list: number of power points, light points, switch points, and circuit breaker works separately. A vague "electrical works — RM5,000 LS" could mean anything.',
      },
      {
        type: 'h3',
        content: '4. Hacking and disposal is included',
      },
      {
        type: 'p',
        content: 'If you\'re renovating an existing unit, hacking old tiles, walls, or cabinets has a cost. So does disposing of the rubble. If it\'s not in the quote, you\'ll likely get an extra bill on day one.',
      },
      {
        type: 'h3',
        content: '5. Payment schedule is reasonable',
      },
      {
        type: 'p',
        content: 'A healthy payment schedule: 20–30% deposit, 30–40% at midpoint, remaining 30% upon completion. Never pay more than 30% before work starts. Be very cautious of contractors demanding 50%+ upfront.',
      },
      {
        type: 'h3',
        content: '6. Defect liability period is stated',
      },
      {
        type: 'p',
        content: 'A reputable contractor offers a defect liability period — typically 12 months — during which they fix any workmanship defects for free. If this isn\'t in the contract, add it before signing.',
      },
      {
        type: 'h3',
        content: '7. Variation Order (VO) process is defined',
      },
      {
        type: 'p',
        content: 'Changes during renovation are common. Make sure the contract states that all variations must be approved in writing with a price agreed before work begins. Verbal VOs that become surprise invoices are a common dispute.',
      },
      {
        type: 'h2',
        content: 'Questions to Ask Your Contractor',
      },
      {
        type: 'ul',
        items: [
          '"Can you show me the material specifications for each item?"',
          '"What is your defect liability period?"',
          '"Does this include rubbish disposal?"',
          '"Is waterproofing included in the bathroom tiling?"',
          '"What happens if I want to make changes during the renovation?"',
          '"Can I see photos of your recent completed projects?"',
          '"Are you registered with CIDB (Construction Industry Development Board)?"',
        ],
      },
      {
        type: 'h2',
        content: 'Use AI to Audit Your Quotation Instantly',
      },
      {
        type: 'p',
        content: 'Manually checking every line item in a 30-page quotation is tedious and requires industry knowledge most homeowners don\'t have. RenoSmart\'s AI Quotation Audit tool does this in 30 seconds.',
      },
      {
        type: 'ul',
        items: [
          'Upload your PDF or Excel quotation',
          'AI checks every line item against current market rates',
          'Flags overpriced items with suggested fair prices',
          'Highlights missing items (like waterproofing)',
          'Gives you an overall "quotation score" out of 100',
          'Completely free to try',
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 RenoSmart users have found an average of RM8,000+ in savings after auditing their renovation quotations. Upload yours free at renosmart.app',
      },
    ],
  },
  {
    slug: 'renovation-red-flags-malaysia',
    title: '7 Red Flags in Renovation Quotations That Could Cost You RM10,000+',
    description: 'These 7 warning signs in renovation quotations have caused Malaysian homeowners to overpay by thousands. Learn what to look for before you sign anything.',
    date: '2026-04-01',
    readTime: '5 min read',
    tags: ['Red Flags', 'Renovation Tips', 'Malaysia', 'Consumer Guide'],
    category: 'Tips & Warnings',
    coverEmoji: '🚨',
    sections: [
      {
        type: 'p',
        content: 'Every year, thousands of Malaysian homeowners overpay for renovation work — not because contractors are always dishonest, but because most people don\'t know what a fair quotation looks like. Here are 7 red flags that should make you pause before signing.',
      },
      {
        type: 'h2',
        content: 'Red Flag #1: Everything is "Lump Sum"',
      },
      {
        type: 'p',
        content: 'A quotation that lists most major items as "Lump Sum (LS)" without breakdowns is a major warning sign. How can you verify the price is fair if you don\'t know what\'s included? Ask for an itemised breakdown with quantities and unit prices for any item over RM1,000.',
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: 'Example: "Kitchen renovation — RM25,000 LS" tells you nothing. A proper quote lists: cabinet lineal footage × unit price, countertop sqft × price, tiling sqft × price, etc.',
      },
      {
        type: 'h2',
        content: 'Red Flag #2: No Material Specifications',
      },
      {
        type: 'p',
        content: 'If the quote says "vinyl flooring" without specifying brand, thickness, or wear layer — you could receive cheap 0.3mm residential vinyl when you expected 0.5mm commercial grade. Always get brand and model in writing.',
      },
      {
        type: 'h2',
        content: 'Red Flag #3: Suspiciously Low Price',
      },
      {
        type: 'p',
        content: 'A quote that\'s 40–50% below other quotes isn\'t a great deal — it\'s a warning. Contractors who win on price often make it back through: skipping waterproofing, using substandard materials, demanding expensive Variation Orders mid-project, or disappearing after collecting deposit.',
      },
      {
        type: 'table',
        headers: ['Scenario', 'Quoted Price', 'Real Cost After VOs & Fixes'],
        rows: [
          ['Too-cheap contractor', 'RM40,000', 'RM65,000+'],
          ['Mid-range contractor', 'RM60,000', 'RM62,000'],
          ['Slightly premium contractor', 'RM70,000', 'RM70,000'],
        ],
      },
      {
        type: 'h2',
        content: 'Red Flag #4: No Waterproofing Line Item',
      },
      {
        type: 'p',
        content: 'Waterproofing for bathrooms, wet kitchen, and balcony areas is non-negotiable. If it\'s not explicitly listed in your quotation, it\'s likely not being done. Water leaks into the unit below will cost you RM20,000–50,000 to fix and may trigger legal disputes.',
      },
      {
        type: 'h2',
        content: 'Red Flag #5: More Than 30% Required as Deposit',
      },
      {
        type: 'p',
        content: 'Legitimate contractors don\'t need more than 30% upfront. Requesting 50% or more before starting is a major red flag — especially from a contractor you\'ve just met. If they disappear with your deposit, you have limited legal recourse.',
      },
      {
        type: 'ul',
        items: [
          'Safe: 20–30% deposit',
          'Acceptable: 30–40% if contractor has strong track record',
          'Risky: >40% — ask yourself why they need so much upfront',
          'Run: 50%+ from an unverified contractor',
        ],
      },
      {
        type: 'h2',
        content: 'Red Flag #6: No Defect Liability Period',
      },
      {
        type: 'p',
        content: 'A quality contractor stands behind their work. The contract should state a defect liability period — typically 12 months — during which they fix any workmanship defects at no charge. If a contractor refuses to include this, ask why.',
      },
      {
        type: 'h2',
        content: 'Red Flag #7: Pressure to Sign Immediately',
      },
      {
        type: 'p',
        content: '"This price is only valid for 24 hours" or "We have another client who wants this slot" are classic high-pressure tactics. A legitimate contractor is happy for you to take a few days to review the quote, compare with others, and get a second opinion. Never sign under pressure.',
      },
      {
        type: 'h2',
        content: 'What To Do If You Spot These Red Flags',
      },
      {
        type: 'ol',
        items: [
          'Don\'t sign anything until you get a proper itemised quotation',
          'Get at least 2 other quotes for comparison',
          'Run your quotation through RenoSmart\'s free AI Audit — it checks every line item against market rates in under 30 seconds',
          'Ask the contractor to address each concern in writing',
          'Trust your gut — if something feels off, it probably is',
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 RenoSmart\'s AI has analysed thousands of renovation quotations. Upload yours free and get a detailed audit including: overpriced items, missing items, and an overall fairness score.',
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
