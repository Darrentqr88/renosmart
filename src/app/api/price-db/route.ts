import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createRawClient } from '@supabase/supabase-js';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Tiling': ['tile', 'tiling', 'floor tile', 'wall tile', 'mosaic', 'homogeneous', 'porcelain'],
  'Electrical': ['electrical', 'wiring', 'socket', 'switch', 'DB', 'circuit', 'lighting', 'LED', 'conduit'],
  'Plumbing': ['plumbing', 'pipe', 'sanitary', 'basin', 'WC', 'shower', 'drainage', 'water'],
  'Painting': ['paint', 'painting', 'primer', 'coating', 'emulsion', 'texture'],
  'Carpentry': ['carpentry', 'wardrobe', 'cabinet', 'kitchen cabinet', 'TV console', 'storage', 'timber'],
  'False Ceiling': ['ceiling', 'gypsum', 'plaster ceiling', 'cornish', 'cove'],
  'Waterproofing': ['waterproof', 'membrane', 'tanking'],
  'Demolition': ['demolition', 'hacking', 'removal', 'demolish'],
  'Aluminium': ['aluminium', 'aluminum', 'window', 'sliding', 'casement'],
  'Glass': ['glass', 'tempered', 'glazing'],
  'Flooring': ['flooring', 'timber floor', 'vinyl', 'laminate', 'parquet'],
  'Air Conditioning': ['air con', 'aircon', 'AC', 'ACMV', 'split unit', 'ducted'],
  'Metal Work': ['metal', 'steel', 'railing', 'gate', 'grille', 'iron'],
  'Cleaning': ['cleaning', 'final clean', 'debris removal'],
};

function detectCategory(itemName: string): string | null {
  const lower = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return null;
}

// Use untyped client to avoid Database schema constraint on new tables
function getRawDb() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function recalculatePriceDB(category: string, unit: string, region: string) {
  const db = getRawDb();

  const { data } = await db
    .from('price_data_points')
    .select('unit_price')
    .eq('category', category)
    .eq('unit', unit)
    .eq('region', region);

  if (!data || data.length < 10) return;

  const prices = (data as { unit_price: number }[]).map(d => d.unit_price).sort((a, b) => a - b);
  const trimStart = Math.floor(prices.length * 0.1);
  const trimEnd = Math.ceil(prices.length * 0.9);
  const trimmed = prices.slice(trimStart, trimEnd);

  if (trimmed.length === 0) return;

  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const confidence = data.length >= 50 ? 'high' : data.length >= 20 ? 'mid' : 'low';

  await db.from('price_database').upsert({
    category,
    unit,
    region,
    min_price: Math.min(...trimmed),
    max_price: Math.max(...trimmed),
    avg_price: Math.round(avg * 100) / 100,
    sample_count: data.length,
    confidence,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'category,unit,region' });
}

export async function POST(request: Request) {
  try {
    const { items, region, projectId } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing items array' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getRawDb();
    const effectiveRegion = region || 'MY_KL';
    let processed = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.unitPrice || item.status === 'flag' || item.unitPrice <= 0) {
        skipped++;
        continue;
      }

      const category = detectCategory(item.name);
      if (!category) {
        skipped++;
        continue;
      }

      const unit = item.unit || 'unit';

      await db.from('price_data_points').insert({
        category,
        item_name: item.name,
        unit,
        unit_price: item.unitPrice,
        supply_type: item.supplyType || 'supply_install',
        region: effectiveRegion,
        source: 'quotation',
        project_id: projectId || null,
        confidence: 0.8,
      });

      await recalculatePriceDB(category, unit, effectiveRegion);
      processed++;
    }

    return NextResponse.json({ processed, skipped });
  } catch (error) {
    console.error('Price DB update error:', error);
    return NextResponse.json({ error: 'Failed to update price database' }, { status: 500 });
  }
}
