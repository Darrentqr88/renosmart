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
  {
    slug: 'hdb-renovation-cost-singapore-2025',
    title: 'HDB Renovation Cost Singapore 2025: Complete Guide by Flat Type & Room',
    description: 'Planning to renovate your HDB flat in Singapore? Get accurate 2025 renovation costs for 3-room, 4-room, and 5-room flats (BTO and resale), HDB permit rules, DRC contractor requirements, and renovation loan limits.',
    date: '2026-04-05',
    readTime: '9 min read',
    tags: ['Singapore', 'HDB', 'Renovation Cost', '2025'],
    category: 'Cost Guide',
    coverEmoji: '🇸🇬',
    sections: [
      {
        type: 'p',
        content: 'Renovating an HDB flat in Singapore involves more than just picking tiles and cabinets. You need to navigate HDB permits, use DRC-registered contractors, and budget for costs that many homeowners miss. This guide breaks down everything for 2025.',
      },
      {
        type: 'h2',
        content: 'HDB Renovation Cost by Flat Type (2025)',
      },
      {
        type: 'h3',
        content: 'BTO (New) Flats',
      },
      {
        type: 'table',
        headers: ['Flat Type', 'Cost Range (SGD)'],
        rows: [
          ['3-Room BTO', 'S$25,000 – S$45,000'],
          ['4-Room BTO', 'S$43,000 – S$66,000'],
          ['5-Room BTO', 'S$62,000 – S$85,000'],
        ],
      },
      {
        type: 'h3',
        content: 'Resale Flats (add 20–40% over BTO)',
      },
      {
        type: 'table',
        headers: ['Flat Type', 'Cost Range (SGD)'],
        rows: [
          ['3-Room Resale', 'S$35,000 – S$55,000'],
          ['4-Room Resale', 'S$50,000 – S$80,000'],
          ['5-Room Resale', 'S$70,000 – S$100,000'],
          ['Maisonette', 'S$80,000+'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: 'Resale flats cost more because they typically need full hacking, waterproofing overhaul, and electrical/plumbing upgrades — work that BTO owners skip.',
      },
      {
        type: 'h2',
        content: 'Renovation Cost by Room',
      },
      {
        type: 'table',
        headers: ['Room', 'Cost Range (SGD)'],
        rows: [
          ['Kitchen', 'S$6,000 – S$15,000'],
          ['Bathroom (per unit)', 'S$4,000 – S$8,000'],
          ['Living Room', 'S$5,000 – S$15,000'],
          ['Master Bedroom', 'S$3,000 – S$8,000'],
          ['Common Bedroom', 'S$600 – S$5,000'],
          ['Balcony', 'S$3,000 – S$10,000'],
        ],
      },
      {
        type: 'h2',
        content: 'Hidden Costs Most Homeowners Miss',
      },
      {
        type: 'table',
        headers: ['Item', 'Cost (SGD)'],
        rows: [
          ['Electrical rewiring (full flat)', 'S$4,000 – S$6,000'],
          ['Extra power points (concealed)', 'S$95 – S$130 each'],
          ['Air-con (supply & install, 1 unit)', 'S$700 – S$1,500'],
          ['Plumbing updates', 'S$1,500 – S$4,000'],
          ['Door frame removal', 'S$600 – S$900 per frame'],
          ['PE assessment (if required)', 'S$800 – S$2,000'],
          ['Debris removal & cleaning', 'S$400+'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'tip',
        content: '💡 Always add 10–15% buffer to your total budget for hidden costs. Resale flats almost always need electrical and plumbing upgrades discovered only after hacking begins.',
      },
      {
        type: 'h2',
        content: 'HDB Rules: What You Can and Cannot Do',
      },
      {
        type: 'h3',
        content: 'Strictly Prohibited (No Exceptions)',
      },
      {
        type: 'ul',
        items: [
          'Hacking load-bearing walls, structural beams, or columns',
          'Exceeding 150 kg/sqm floor loading',
          'Modifying external facades or window grilles (unauthorised types)',
          'Creating openings in party walls',
          'Hacking toilet tiles in BTO flats within 3 years of completion',
        ],
      },
      {
        type: 'h3',
        content: 'Requires HDB Permit (Submit Before Starting)',
      },
      {
        type: 'ul',
        items: [
          'Hacking any non-structural walls',
          'New plumbing installations',
          'Electrical rewiring beyond existing points',
          'Window replacement (must use BCA-approved contractors)',
          'Floor modifications and raising',
        ],
      },
      {
        type: 'h3',
        content: 'No Permit Needed',
      },
      {
        type: 'ul',
        items: [
          'Painting walls and ceilings',
          'Installing furniture and light fixtures',
          'Overlay flooring (no hacking of existing tiles)',
          'Minor carpentry works',
        ],
      },
      {
        type: 'h2',
        content: 'The DRC Contractor Requirement',
      },
      {
        type: 'p',
        content: 'This is the #1 rule HDB homeowners must know: you MUST use a contractor from HDB\'s Directory of Renovation Contractors (DRC). Only DRC-registered contractors can submit renovation permits via HDB\'s APEX system.',
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: '⚠️ Using a non-DRC contractor means: no permit can be obtained, work is technically illegal, fines up to S$5,000, and you may be required to restore all works at your own cost.',
      },
      {
        type: 'h2',
        content: 'HDB Renovation Working Hours',
      },
      {
        type: 'table',
        headers: ['Work Type', 'Allowed Hours'],
        rows: [
          ['General renovation', '9am – 6pm, weekdays & Saturdays'],
          ['Noisy work (hacking, drilling)', '9am – 5pm, weekdays ONLY'],
          ['Sundays & Public Holidays', 'No renovation work allowed'],
        ],
      },
      {
        type: 'h2',
        content: 'Renovation Loans in Singapore',
      },
      {
        type: 'ul',
        items: [
          'Maximum loan: S$30,000 or 6× monthly income (whichever is lower)',
          'With co-applicant: up to 12× lower monthly income, still capped at S$30,000',
          'Minimum income: S$24,000/year',
          'CPF Ordinary Account CANNOT be used for renovation',
          'TDSR must not exceed 55% of gross monthly income',
        ],
      },
      {
        type: 'h2',
        content: 'Typical Timeline for HDB Renovation',
      },
      {
        type: 'table',
        headers: ['Flat Type', 'Estimated Duration'],
        rows: [
          ['BTO renovation', '6–10 weeks from permit approval'],
          ['Resale renovation (full)', '8–12+ weeks'],
          ['Planning to move-in (total)', '3–5 months'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 Managing your HDB renovation timeline? RenoSmart auto-generates a Gantt chart from your quotation items, tracks phase progress, and lets your homeowner view updates in real-time. Try free at renosmart.app',
      },
    ],
  },
  {
    slug: 'how-to-choose-renovation-contractor-malaysia',
    title: 'How to Choose a Renovation Contractor in Malaysia: The CIDB Guide',
    description: 'Choosing the wrong renovation contractor in Malaysia is the #1 cause of renovation nightmares. This guide shows you how to verify CIDB registration, check red flags, structure payments safely, and use the right contract.',
    date: '2026-04-08',
    readTime: '7 min read',
    tags: ['Contractor', 'Malaysia', 'CIDB', 'Tips'],
    category: 'Guides',
    coverEmoji: '🔍',
    sections: [
      {
        type: 'p',
        content: 'Most renovation horror stories in Malaysia share one thing in common: the homeowner chose the contractor based on price alone, without verifying their credentials. Here\'s how to do it properly.',
      },
      {
        type: 'h2',
        content: 'Step 1: Verify CIDB Registration',
      },
      {
        type: 'p',
        content: 'All renovation contractors in Malaysia must be registered with CIDB (Construction Industry Development Board Malaysia) under Section 25, Act 520. This is the law — not optional.',
      },
      {
        type: 'table',
        headers: ['CIDB Grade', 'Maximum Project Value'],
        rows: [
          ['G1', 'RM 200,000 (typical for home renovations)'],
          ['G2', 'RM 500,000'],
          ['G3', 'RM 1 million'],
          ['G4', 'RM 3 million'],
          ['G5', 'RM 5 million'],
          ['G6', 'RM 10 million'],
          ['G7', 'Unlimited'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'tip',
        content: 'For typical home renovations under RM200,000, a G1–G3 contractor is standard. Always match the contractor\'s grade to your project value. Verify at cidb.gov.my → Contractor Search.',
      },
      {
        type: 'h2',
        content: 'Step 2: Check SSM Registration',
      },
      {
        type: 'p',
        content: 'In addition to CIDB, ask for their SSM certificate (Companies Commission of Malaysia). CIDB + SSM together = the minimum credibility baseline. Any contractor who cannot produce both documents is a red flag.',
      },
      {
        type: 'h2',
        content: 'Step 3: Get 3 Itemised Quotations',
      },
      {
        type: 'p',
        content: 'Never compare contractors on total price alone. Get at least 3 itemised quotations with quantities and unit prices for every line item. A quote that\'s 40% cheaper is usually not a bargain — it means something is missing.',
      },
      {
        type: 'h2',
        content: '8 Red Flags That Should Make You Walk Away',
      },
      {
        type: 'ul',
        items: [
          'Refuses to show CIDB certificate or gives excuses ("it\'s being processed")',
          'Requests more than 30% deposit upfront',
          'Operates only via WhatsApp with no physical address or office',
          'Cannot provide past project photos or client references',
          'Offers significantly the lowest price with no explanation',
          'Uses very vague contract language or resists adding specific terms',
          'Cannot give a clear timeline with milestone dates',
          'Subcontracts all work to unknown parties without telling you',
        ],
      },
      {
        type: 'h2',
        content: 'Safe Payment Structure',
      },
      {
        type: 'table',
        headers: ['Stage', 'Payment %', 'Trigger'],
        rows: [
          ['Deposit', '10–20%', 'Contract signing'],
          ['First progress', '30%', 'Demolition & structural complete'],
          ['Second progress', '30%', 'Fit-out & tiling complete'],
          ['Penultimate', '20%', 'Handover & final inspection'],
          ['Retention', '10%', 'After defect liability period ends'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: '⚠️ Never pay more than 30% before work starts. Contractors demanding 50%+ upfront are a major red flag — especially from unverified contractors you just met.',
      },
      {
        type: 'h2',
        content: 'Use the CIDB Standard Contract (Free)',
      },
      {
        type: 'p',
        content: 'CIDB publishes a free Standard Terms of Construction Contract for Renovation and Small Projects (STCC-RSP 2015) — downloadable from cidb.gov.my. Use this as your contract template.',
      },
      {
        type: 'ul',
        items: [
          'Itemised scope of work (no vague "lump sum" for major items)',
          'All materials specified by brand, grade, and thickness',
          'Payment schedule tied to completion milestones',
          'Completion date with LAD clause (daily deductions for contractor-caused delays)',
          'Defect Liability Period of minimum 12 months',
          'Variation Order process: written approval required before any changes',
          'Retention sum of 5–10% held until DLP ends',
        ],
      },
      {
        type: 'h2',
        content: 'Where to Find Verified Contractors in Malaysia',
      },
      {
        type: 'ul',
        items: [
          'CIDB Contractor Database — cidb.gov.my',
          'Recommend.my — reviews and verified contractors',
          'Qanvast Malaysia — curated interior firms',
          'Atap.co Malaysia — contractor directory with reviews',
          'Personal referrals from friends who renovated recently',
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 Once you have quotations from verified contractors, use RenoSmart\'s free AI Audit to check if the prices are fair. Upload your PDF or Excel quote and get a detailed analysis in 30 seconds.',
      },
    ],
  },
  {
    slug: 'kitchen-renovation-cost-malaysia-2025',
    title: 'Kitchen Renovation Cost Malaysia 2025: Budget Guide + 8 Mistakes to Avoid',
    description: 'Planning a kitchen renovation in Malaysia? This 2025 guide covers full cost breakdowns (RM15K–RM150K+), wet vs dry kitchen differences, popular styles, hidden costs, and 8 specific mistakes that cause budget overruns.',
    date: '2026-04-10',
    readTime: '8 min read',
    tags: ['Kitchen', 'Renovation Cost', 'Malaysia', '2025'],
    category: 'Cost Guide',
    coverEmoji: '🍳',
    sections: [
      {
        type: 'p',
        content: 'The kitchen is often the most expensive room in a renovation — and the one with the most potential for budget overruns. Here\'s what you can realistically expect to pay in Malaysia in 2025, and how to avoid the most common and costly mistakes.',
      },
      {
        type: 'h2',
        content: 'Kitchen Renovation Cost by Budget Tier',
      },
      {
        type: 'table',
        headers: ['Tier', 'Cost Range', 'What You Get'],
        rows: [
          ['Basic', 'RM 15,000 – RM 25,000', 'Melamine cabinets, standard tiles, basic appliances'],
          ['Mid-Range', 'RM 25,000 – RM 45,000', 'Plywood cabinets, quality tiles, mid-range appliances'],
          ['Premium', 'RM 45,000 – RM 80,000', 'Custom cabinets, quartz/marble countertop, premium appliances'],
          ['Luxury', 'RM 80,000 – RM 150,000+', 'Full custom, sintered stone, smart appliances'],
        ],
      },
      {
        type: 'h2',
        content: 'Cost Breakdown by Component',
      },
      {
        type: 'table',
        headers: ['Component', 'Budget Share', 'Cost Range (RM)'],
        rows: [
          ['Cabinets', '40–50%', 'RM 8,000 – RM 35,000'],
          ['Countertops', '10–15%', 'RM 2,500 – RM 8,000'],
          ['Flooring & Tiles', '10–15%', 'RM 2,000 – RM 6,000'],
          ['Plumbing & Electrical', '10–15%', 'RM 2,500 – RM 5,000'],
          ['Labour', '20–25%', 'RM 3,000 – RM 8,000'],
          ['Miscellaneous', '5–10%', 'RM 1,000 – RM 3,000'],
        ],
      },
      {
        type: 'h2',
        content: 'The Wet Kitchen vs Dry Kitchen Concept',
      },
      {
        type: 'p',
        content: 'Malaysia\'s dual-kitchen setup is unique to the region and significantly impacts renovation costs. Understanding the difference is essential for budgeting.',
      },
      {
        type: 'table',
        headers: ['Feature', 'Wet Kitchen', 'Dry Kitchen'],
        rows: [
          ['Purpose', 'Heavy cooking (frying, boiling)', 'Light prep, drinks, breakfast'],
          ['Location', 'Back of unit, enclosed', 'Facing living/dining area'],
          ['Materials needed', 'Heavy-duty tiles, stainless fittings', 'Aesthetic finishes, island'],
          ['Ventilation', 'Full industrial exhaust hood required', 'Basic ventilation sufficient'],
          ['Cost impact', 'Higher (waterproofing essential)', 'Lower (aesthetic focus)'],
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: 'Doing both wet + dry kitchen renovation? Get separate line-item quotes for each. Contractors who bundle them together make it harder to identify where your money is going.',
      },
      {
        type: 'h2',
        content: '8 Kitchen Renovation Mistakes That Cause Budget Overruns',
      },
      {
        type: 'h3',
        content: '1. Moving plumbing or gas point locations',
      },
      {
        type: 'p',
        content: 'Relocating plumbing or gas points adds RM3,000–RM5,000 unnecessarily. Work around existing positions where possible — rerouting is one of the most wasteful costs in kitchen renovations.',
      },
      {
        type: 'h3',
        content: '2. Choosing appliances after cabinets are ordered',
      },
      {
        type: 'p',
        content: 'Appliance dimensions must be confirmed before cabinet design is finalized. Selecting them later causes costly remakes. Choose your fridge, oven, and built-in appliances first — then design around them.',
      },
      {
        type: 'h3',
        content: '3. Insufficient power points',
      },
      {
        type: 'p',
        content: 'Kitchens need more power points than most homeowners plan for. Budget for pop-up sockets in islands, dedicated circuits for high-wattage appliances, and USB charging points. Adding these after tiling is done costs 3–4× more.',
      },
      {
        type: 'h3',
        content: '4. Wrong flooring material in wet kitchen',
      },
      {
        type: 'p',
        content: 'Standard smooth tiles are a safety hazard in wet kitchens. Specify anti-slip rated tiles (R10 or higher) for all wet areas. Malaysia\'s humidity makes this even more critical than in temperate climates.',
      },
      {
        type: 'h3',
        content: '5. Not accounting for appliance clearances',
      },
      {
        type: 'p',
        content: 'Fridge door swing, oven door opening, and drawer pull-out space must all be measured before ordering cabinets. Missing this causes expensive cabinet remakes or permanent inconvenience.',
      },
      {
        type: 'h3',
        content: '6. Underestimating storage needs',
      },
      {
        type: 'p',
        content: 'Before designing cabinet layout, inventory every item that will be stored in the kitchen. Many homeowners finish their renovation only to realise they have no space for their rice cooker, mixer, or cleaning supplies.',
      },
      {
        type: 'h3',
        content: '7. Prioritising trends over durability',
      },
      {
        type: 'p',
        content: 'Open shelving looks great in photos but collects grease in Malaysian kitchens. Trendy handleless cabinets can have higher failure rates. Balance one or two statement pieces with timeless, durable choices for everything else.',
      },
      {
        type: 'h3',
        content: '8. Skimping on ventilation',
      },
      {
        type: 'p',
        content: 'Malaysian cooking generates extreme grease and moisture. A poor-quality exhaust hood causes long-term cabinet damage, wall staining, and persistent odours. Invest in a proper hood — it saves far more than it costs.',
      },
      {
        type: 'h2',
        content: 'Hidden Costs to Ask About',
      },
      {
        type: 'ul',
        items: [
          'Old cabinet and tile removal and disposal (often quoted separately)',
          'Waterproofing membrane under wet kitchen floor tiles',
          'Mid-project electrical upgrades if inspector finds outdated wiring',
          'Cabinet installation fees (sometimes excluded from cabinet supplier quotes)',
          'Backsplash tiling (often omitted in basic quotes)',
        ],
      },
      {
        type: 'h2',
        content: 'Cost-Saving Strategies That Actually Work',
      },
      {
        type: 'ul',
        items: [
          'Keep existing plumbing and gas point positions (saves RM3,000–5,000)',
          'Choose plywood cabinet carcass over solid wood (30–40% cheaper, comparable durability)',
          'Opt for quartz countertop over marble (lower maintenance, similar look at lower cost)',
          'Buy appliances during major sales (11.11, year-end Harvey Norman sales)',
          'Splurge on countertop and hood, save on cabinet finishes',
          'Always add 10–20% contingency budget for unforeseen costs',
        ],
      },
      {
        type: 'callout',
        calloutType: 'tip',
        content: '💡 Before signing your kitchen renovation quote, run it through RenoSmart\'s free AI Audit. It checks every line item against 2025 market rates and flags items that are missing or overpriced.',
      },
    ],
  },
  {
    slug: 'renovation-timeline-malaysia-how-long',
    title: 'How Long Does Renovation Take in Malaysia? Complete Timeline Guide',
    description: 'From condo refreshes to landed house renovations — find out exactly how long each type of renovation takes in Malaysia, what causes delays, and how to keep your project on schedule.',
    date: '2026-04-12',
    readTime: '7 min read',
    tags: ['Timeline', 'Malaysia', 'Planning', 'Project Management'],
    category: 'Guides',
    coverEmoji: '📅',
    sections: [
      {
        type: 'p',
        content: 'One of the most common questions from homeowners is: "How long will my renovation take?" The honest answer: it depends on scope — but delays are far more common than on-time completions. Here\'s what to realistically expect.',
      },
      {
        type: 'h2',
        content: 'Renovation Duration by Project Type',
      },
      {
        type: 'table',
        headers: ['Project Type', 'Typical Duration'],
        rows: [
          ['Minor refresh (painting, flooring only)', '2–4 weeks'],
          ['Single room renovation (kitchen or bathroom)', '4–8 weeks'],
          ['Full condo renovation (≤1,000 sqft)', '2–3 months'],
          ['Terrace house renovation', '3–6 months'],
          ['Semi-D renovation', '4–8 months'],
          ['Bungalow renovation (extensive)', '6–12 months'],
          ['New construction (landed, from scratch)', '9–18 months'],
        ],
      },
      {
        type: 'h2',
        content: 'The 7 Phases of a Renovation Project',
      },
      {
        type: 'table',
        headers: ['Phase', 'Duration', 'What Happens'],
        rows: [
          ['1. Planning & Design', '2–4 weeks', 'Consultations, measurements, 3D visuals, material selection'],
          ['2. Approvals & Permits', '2–6 weeks', 'Council submissions (longer for structural/landed)'],
          ['3. Demolition & Prep', '1–2 weeks', 'Hacking, waste removal, site protection'],
          ['4. Structural / Wet Works', '1–3 months', 'Walls, waterproofing, plumbing, drainage'],
          ['5. Electrical & M&E', '2–4 weeks', 'Wiring, lighting, HVAC, data points'],
          ['6. Interior Fit-Out', '4–8 weeks', 'Cabinetry, flooring, painting, tiling'],
          ['7. Cleaning & Handover', '1–2 weeks', 'Final inspection, defect snagging, handover'],
        ],
      },
      {
        type: 'h2',
        content: 'Permit Requirements That Add Time',
      },
      {
        type: 'h3',
        content: 'Landed Properties (Terrace, Semi-D, Bungalow)',
      },
      {
        type: 'p',
        content: 'Structural changes, extensions, or additional floors require submitting architectural drawings and engineering reports to the local council (DBKL / MBPJ / MBJB). Approval typically takes 4–8 weeks — sometimes longer. This must happen before any physical work begins.',
      },
      {
        type: 'h3',
        content: 'Condo / Strata Properties',
      },
      {
        type: 'p',
        content: 'You need written approval from the Management Corporation (JMB/MC) before renovation starts. Typical requirements include: refundable deposit (RM500–RM2,000), lift protection arrangement, contractor insurance, and pre/post condition photos.',
      },
      {
        type: 'callout',
        calloutType: 'warning',
        content: '⚠️ Starting renovation without MC approval or council permits can result in a stop-work order that freezes your entire project — sometimes for weeks. Always secure permits first.',
      },
      {
        type: 'h2',
        content: 'Working Hours Regulations in Malaysia',
      },
      {
        type: 'table',
        headers: ['Location Type', 'Allowed Hours'],
        rows: [
          ['Landed residential', 'Typically 8am–6pm weekdays'],
          ['Strata/Condo', 'Usually 9am–5pm weekdays only (check with MC)'],
          ['Noisy works (hacking)', 'Best limited to 9am–3pm to avoid complaints'],
          ['Weekends & Public Holidays', 'Often restricted or prohibited by strata rules'],
        ],
      },
      {
        type: 'h2',
        content: '5 Most Common Causes of Renovation Delays in Malaysia',
      },
      {
        type: 'h3',
        content: '1. Vague Contracts With No Milestone Dates',
      },
      {
        type: 'p',
        content: 'Without specific completion dates tied to milestones (and LAD clauses for delays), contractors have no deadline pressure. Projects drag on indefinitely. Always insist on a Gantt-style schedule in your contract.',
      },
      {
        type: 'h3',
        content: '2. Permit Delays',
      },
      {
        type: 'p',
        content: 'Submitting structural changes late or with incomplete documents causes council queues that add weeks. Apply for permits at the design stage, not when you\'re ready to start demolition.',
      },
      {
        type: 'h3',
        content: '3. Material Lead Times Not Accounted For',
      },
      {
        type: 'p',
        content: 'Imported tiles, custom cabinets, and overseas appliances can take 6–12 weeks to arrive. Order these before structural works begin, not when the walls are already up.',
      },
      {
        type: 'h3',
        content: '4. Unforeseen Site Conditions',
      },
      {
        type: 'p',
        content: 'Hidden structural damage, outdated wiring discovered during hacking, termite damage, or concealed water damage are common surprises — especially in older properties. Budget 10–15% extra time and money for contingencies.',
      },
      {
        type: 'h3',
        content: '5. Contractor Overcommitment',
      },
      {
        type: 'p',
        content: 'A contractor managing too many projects simultaneously will deprioritise yours. Ask your contractor directly: how many active projects are you running right now? More than 5–6 for a small firm is a warning sign.',
      },
      {
        type: 'h2',
        content: '8 Tips to Keep Your Renovation on Schedule',
      },
      {
        type: 'ol',
        items: [
          'Finalise 100% of design before any work begins — mid-project design changes are the #1 cause of overruns',
          'Pre-order long lead-time items (custom cabinets, imported tiles) 4–6 weeks early',
          'Secure all permits before demolition starts',
          'Add 20–30% time buffer to your contractor\'s stated timeline',
          'Use milestone-based payment — ties payment to completion of each phase',
          'Visit site regularly — even once a week makes a significant difference in accountability',
          'Document everything with timestamped photos at each phase',
          'Put an LAD clause in the contract — daily deductions for contractor-caused delays',
        ],
      },
      {
        type: 'callout',
        calloutType: 'info',
        content: '💡 RenoSmart auto-generates a Gantt chart from your renovation quotation items, tracks phase completion dates, skips Malaysian public holidays, and lets homeowners view progress in real-time — eliminating the "when will it be done?" calls. Try free at renosmart.app',
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
