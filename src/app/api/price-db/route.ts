import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createRawClient } from '@supabase/supabase-js';
import { classifyItem, normalizeItemName, extractSupplyType } from '@/lib/utils/item-classifier';

// Use untyped client to avoid Database schema constraint on new tables
function getRawDb() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function recalculatePriceDB(
  category: string,
  subcategory: string,
  materialMethod: string,
  unit: string,
  supplyType: string,
  region: string,
) {
  const db = getRawDb();

  // Fetch all data points for this combination
  const { data } = await db
    .from('price_data_points')
    .select('unit_price')
    .eq('category', category)
    .eq('subcategory', subcategory)
    .eq('material_method', materialMethod)
    .eq('unit', unit)
    .eq('supply_type', supplyType)
    .eq('region', region);

  if (!data || data.length < 10) return;

  const allPrices = (data as { unit_price: number }[]).map(d => d.unit_price).sort((a, b) => a - b);

  // Remove top/bottom 10% outliers
  const trimStart = Math.floor(allPrices.length * 0.1);
  const trimEnd = Math.ceil(allPrices.length * 0.9);
  const trimmed = allPrices.slice(trimStart, trimEnd);

  if (trimmed.length === 0) return;

  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const confidence = data.length >= 50 ? 'high' : data.length >= 20 ? 'mid' : 'low';

  // ≥10 samples → directly use collected data min/avg/max (overrides seed data)
  const newMin = Math.min(...trimmed);
  const newMax = Math.max(...trimmed);

  const { error } = await db.from('price_database').upsert({
    category,
    subcategory,
    material_method: materialMethod,
    unit,
    supply_type: supplyType,
    region,
    min_price: Math.round(newMin * 100) / 100,
    max_price: Math.round(newMax * 100) / 100,
    avg_price: Math.round(avg * 100) / 100,
    sample_count: data.length,
    confidence,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'category,subcategory,material_method,unit,supply_type,region' });
  if (error) console.error('Price DB upsert error:', error.message);
}

export async function POST(request: Request) {
  try {
    const { items, region, projectId } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing items array' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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

      const classification = classifyItem(
        item.name,
        item.subcategory,
        item.materialMethod,
      );

      if (!classification.category) {
        skipped++;
        continue;
      }

      const unit = item.unit || 'unit';
      // extractSupplyType reads the prefix from the raw name; fall back to AI-detected value
      const supplyType = extractSupplyType(item.name) || item.supplyType || 'supply_install';
      const { name: cleanName, productNote } = normalizeItemName(item.name);

      // Deduplicate: skip if same project already has this item at the same price
      if (projectId) {
        const { data: existing } = await db
          .from('price_data_points')
          .select('id')
          .eq('project_id', projectId)
          .eq('item_name', cleanName)
          .eq('unit_price', item.unitPrice)
          .maybeSingle();
        if (existing) { skipped++; continue; }
      }

      const { error: insertErr } = await db.from('price_data_points').insert({
        category: classification.category,
        subcategory: classification.subcategory,
        material_method: classification.materialMethod,
        item_name: cleanName,
        product_note: productNote || null,
        unit,
        unit_price: item.unitPrice,
        supply_type: supplyType,
        region: effectiveRegion,
        source: 'quotation',
        project_id: projectId || null,
        confidence: 0.8,
      });
      if (insertErr) { console.error('Price data point insert error:', insertErr.message); skipped++; continue; }

      await recalculatePriceDB(
        classification.category,
        classification.subcategory,
        classification.materialMethod,
        unit,
        supplyType,
        effectiveRegion,
      );
      processed++;
    }

    return NextResponse.json({ processed, skipped });
  } catch (error) {
    console.error('Price DB update error:', error);
    return NextResponse.json({ error: 'Failed to update price database' }, { status: 500 });
  }
}
