import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createRawClient } from '@supabase/supabase-js';
import { classifyItem, normalizeItemName } from '@/lib/utils/item-classifier';

function getRawDb() {
  return createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function recalculateCostDB(
  category: string,
  subcategory: string,
  materialMethod: string,
  unit: string,
  region: string,
) {
  const db = getRawDb();

  const { data } = await db
    .from('cost_data_points')
    .select('unit_cost')
    .eq('category', category)
    .eq('subcategory', subcategory)
    .eq('material_method', materialMethod)
    .eq('unit', unit)
    .eq('region', region);

  if (!data || data.length < 3) return; // Lower threshold than price DB (3 vs 10) since cost data is scarcer

  const allCosts = (data as { unit_cost: number }[])
    .map(d => d.unit_cost)
    .filter(v => v > 0)
    .sort((a, b) => a - b);

  if (allCosts.length < 3) return;

  // Remove top/bottom 10% outliers (only if enough samples)
  const trimStart = allCosts.length >= 10 ? Math.floor(allCosts.length * 0.1) : 0;
  const trimEnd = allCosts.length >= 10 ? Math.ceil(allCosts.length * 0.9) : allCosts.length;
  const trimmed = allCosts.slice(trimStart, trimEnd);

  if (trimmed.length === 0) return;

  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const confidence = allCosts.length >= 50 ? 'high' : allCosts.length >= 20 ? 'mid' : 'low';

  const { error } = await db.from('cost_database').upsert({
    category,
    subcategory,
    material_method: materialMethod,
    unit,
    region,
    min_cost: Math.round(Math.min(...trimmed) * 100) / 100,
    max_cost: Math.round(Math.max(...trimmed) * 100) / 100,
    avg_cost: Math.round(avg * 100) / 100,
    sample_count: allCosts.length,
    confidence,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'category,subcategory,material_method,unit,region' });
  if (error) console.error('Cost DB upsert error:', error.message);
}

export async function POST(request: Request) {
  try {
    const { items, region, projectId, receiptId } = await request.json();

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
      // Calculate proper unit_cost: prefer explicit unit_cost, else derive from total/qty
      const qty = Number(item.qty) || 1;
      const total = Number(item.total) || 0;
      const rawUnitCost = Number(item.unit_cost) || Number(item.unitCost) || 0;

      // If unit_cost provided and looks like a real per-unit price, use it
      // Otherwise derive from total / qty
      let unitCost: number;
      if (rawUnitCost > 0 && rawUnitCost <= total) {
        unitCost = rawUnitCost;
      } else if (total > 0 && qty > 0) {
        unitCost = total / qty;
      } else if (rawUnitCost > 0) {
        unitCost = rawUnitCost;
      } else {
        skipped++;
        continue;
      }

      if (unitCost <= 0) { skipped++; continue; }

      const itemName = item.description || item.name || '';
      if (!itemName) { skipped++; continue; }

      const classification = classifyItem(itemName, item.subcategory, item.materialMethod);

      if (!classification.category) {
        // Try to use the receipt's category as fallback
        if (item.category) {
          classification.category = item.category;
        } else {
          skipped++;
          continue;
        }
      }

      const unit = item.unit || 'unit';
      const { name: cleanName, productNote } = normalizeItemName(itemName);

      // Deduplicate: skip if same receipt already has this item at the same cost
      if (receiptId) {
        const { data: existing } = await db
          .from('cost_data_points')
          .select('id')
          .eq('receipt_id', receiptId)
          .eq('item_name', cleanName)
          .eq('unit_cost', unitCost)
          .maybeSingle();
        if (existing) { skipped++; continue; }
      }

      const { error: insertErr } = await db.from('cost_data_points').insert({
        category: classification.category,
        subcategory: classification.subcategory,
        material_method: classification.materialMethod,
        item_name: cleanName,
        product_note: productNote || null,
        unit,
        unit_cost: unitCost,
        region: effectiveRegion,
        source: 'receipt',
        project_id: projectId || null,
        receipt_id: receiptId || null,
        confidence: 0.8,
      });
      if (insertErr) { console.error('Cost data point insert error:', insertErr.message); skipped++; continue; }

      await recalculateCostDB(
        classification.category,
        classification.subcategory,
        classification.materialMethod,
        unit,
        effectiveRegion,
      );
      processed++;
    }

    return NextResponse.json({ processed, skipped });
  } catch (error) {
    console.error('Cost DB update error:', error);
    return NextResponse.json({ error: 'Failed to update cost database' }, { status: 500 });
  }
}
