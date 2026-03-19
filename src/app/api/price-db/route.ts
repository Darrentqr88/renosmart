import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createRawClient } from '@supabase/supabase-js';

// ============================================
// Category detection keywords
// ============================================
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Construction': ['construction', 'brick wall', 'RC slab', 'extension', 'plastering', 'screed', 'retaining', 'column', 'beam', 'staircase', 'drainage', 'boundary wall', 'fence'],
  'Demolition': ['demolition', 'hacking', 'removal', 'demolish', 'hack'],
  'Tiling': ['tile', 'tiling', 'floor tile', 'wall tile', 'mosaic', 'homogeneous', 'porcelain', 'grout'],
  'Electrical': ['electrical', 'wiring', 'socket', 'switch', 'DB', 'circuit', 'lighting', 'LED', 'conduit', 'power point'],
  'Plumbing': ['plumbing', 'pipe', 'sanitary', 'basin', 'WC', 'shower', 'drainage', 'water heater', 'floor trap', 'PPR', 'polypipe'],
  'Painting': ['paint', 'painting', 'primer', 'coating', 'emulsion', 'texture', 'skim coat', 'skimcoat'],
  'False Ceiling': ['ceiling', 'gypsum', 'plaster ceiling', 'cornish', 'cove', 'partition wall', 'cornice', 'L-box'],
  'Carpentry': ['carpentry', 'wardrobe', 'cabinet', 'kitchen cabinet', 'TV console', 'storage', 'timber', 'shoe cabinet', 'vanity', 'bookshelf'],
  'Waterproofing': ['waterproof', 'membrane', 'tanking', 'waterproofing'],
  'Roofing': ['roofing', 'roof tile', 'polycarbonate roof', 'metal deck', 'gutter', 'downpipe', 'aluminium composite roof', 'deco panel'],
  'Aluminium': ['aluminium', 'aluminum', 'window', 'sliding', 'casement', 'bi-fold', 'louvre'],
  'Glass': ['glass', 'tempered', 'glazing', 'shower screen', 'mirror', 'frosted', 'laminated glass'],
  'Flooring': ['flooring', 'timber floor', 'vinyl', 'laminate', 'parquet', 'SPC', 'LVT', 'skirting'],
  'Air Conditioning': ['air con', 'aircon', 'AC', 'ACMV', 'split unit', 'ducted', 'cassette', 'refrigerant'],
  'Metal Work': ['metal', 'steel', 'railing', 'gate', 'grille', 'iron', 'awning'],
  'Landscape': ['landscape', 'landscaping', 'garden', 'turfing', 'paving', 'pergola', 'decking', 'fence', 'irrigation', 'planting'],
  'Cleaning': ['cleaning', 'final clean', 'debris removal', 'chemical wash', 'post-renovation'],
};

// ============================================
// Subcategory detection keywords per category
// ============================================
const SUBCATEGORY_KEYWORDS: Record<string, Record<string, string[]>> = {
  'Construction': {
    'Brick Wall': ['brick wall', 'brick', 'block wall', 'AAC'],
    'Extension Work': ['extension', 'RC slab extension', 'roof extension'],
    'RC Floor Slab': ['RC floor', 'floor slab', 'G25', 'G30'],
    'Plastering': ['plaster', 'plastering'],
    'Screed': ['screed', 'self-levelling'],
    'Retaining Wall': ['retaining wall'],
    'Column/Beam': ['column', 'beam', 'RC column', 'RC beam'],
    'Staircase': ['staircase', 'stair'],
    'Drainage': ['drain', 'drainage', 'HDPE'],
    'Boundary Wall/Fence': ['boundary', 'fence', 'precast panel'],
  },
  'Demolition': {
    'Floor Hacking': ['floor', 'floor tile'],
    'Wall Hacking': ['wall', 'non-structural', 'structural'],
    'Ceiling Removal': ['ceiling', 'false ceiling'],
    'Door/Window Removal': ['door', 'window', 'frame'],
    'Debris Disposal': ['debris', 'disposal', 'removal', 'lorry'],
  },
  'Tiling': {
    'Floor Tiles': ['floor tile', 'floor'],
    'Wall Tiles': ['wall tile', 'wall', 'feature', 'mosaic', 'pattern'],
    'Outdoor/Balcony Tiles': ['outdoor', 'balcony', 'anti-slip', 'porch'],
    'Tile Grouting': ['grout', 'grouting', 'epoxy grout'],
    'Waterline/Skirting': ['waterline', 'skirting', 'border'],
  },
  'Electrical': {
    'Power Points': ['socket', 'power point', '13A', '15A', 'USB'],
    'Lighting Points': ['light', 'lighting', 'downlight', 'cove light', 'LED'],
    'DB Box': ['DB', 'DB box', 'distribution', 'MCB', '12-way', '18-way', '36-way', '48-way'],
    'Rewiring': ['rewire', 'rewiring'],
    'Data/Comms': ['TV point', 'data point', 'telephone', 'data', 'comms'],
    'Fan Points': ['fan', 'ceiling fan', 'exhaust'],
  },
  'Plumbing': {
    'Piping Installation': ['pipe', 'piping', 'PVC', 'PPR', 'copper', 'polypipe'],
    'Sanitary Installation': ['sanitary installation', 'install basin', 'install WC', 'install heater'],
    'Basin/Sink': ['basin', 'sink', 'mixer tap'],
    'WC/Toilet': ['WC', 'toilet', 'cistern', 'pan'],
    'Shower': ['shower', 'rain shower', 'handheld'],
    'Water Heater': ['water heater', 'heater'],
    'Floor Trap': ['floor trap'],
  },
  'Painting': {
    'Interior Wall': ['interior', 'wall paint', '2-coat', '3-coat'],
    'Ceiling': ['ceiling paint', 'ceiling 2-coat'],
    'Feature Wall': ['feature wall', 'texture', 'limewash', 'design finish'],
    'Exterior': ['exterior', 'weather-shield', 'external'],
    'Skimcoat/Prep': ['skim', 'skimcoat', 'sanding', 'wall prep'],
    'Wood/Metal': ['wood', 'metal paint', 'lacquer', 'spray paint'],
  },
  'False Ceiling': {
    'False Ceiling': ['plasterboard', 'calcium silicate', 'flat ceiling', 'false ceiling'],
    'Design Ceiling': ['L-box', 'cove', 'coffered', 'tray', 'design ceiling', 'drop ceiling'],
    'Partition Wall': ['partition', 'drywall', 'fire-rated'],
    'Cornice': ['cornice', 'cornicing', 'PU cornice'],
  },
  'Carpentry': {
    'Kitchen Cabinet': ['kitchen', 'kitchen cabinet', 'lower cabinet', 'upper cabinet'],
    'Wardrobe': ['wardrobe', 'closet'],
    'TV Console/Feature': ['TV', 'console', 'feature wall', 'shelving'],
    'Shoe Cabinet': ['shoe cabinet', 'shoe'],
    'Vanity Cabinet': ['vanity', 'bathroom cabinet'],
    'Study/Bookshelf': ['study', 'bookshelf', 'desk'],
    'Door': ['door', 'hollow core', 'solid core', 'barn door'],
    'Door Frame': ['door frame', 'frame'],
  },
  'Waterproofing': {
    'Bathroom Floor': ['bathroom', 'toilet', 'wet area'],
    'Flat Roof': ['roof', 'flat roof'],
    'Balcony': ['balcony'],
    'Planter Box': ['planter', 'tank'],
  },
  'Roofing': {
    'Glass Roofing': ['glass roof', 'glass roofing'],
    'Aluminium Composite Roofing': ['aluminium composite', 'ACP roof'],
    'Polycarbonate Roof': ['polycarbonate', 'PC roof', 'twinwall'],
    'Aluminium Deco Panel': ['deco panel', 'aluminium deco'],
    'Metal Deck': ['metal deck', 'PU metal', 'PU foam', 'PU foil'],
    'Roof Tiles': ['roof tile', 'clay tile', 'concrete tile', 'metal tile'],
    'Gutter/Downpipe': ['gutter', 'downpipe', 'rain gutter'],
  },
  'Aluminium': {
    'Casement Window': ['casement'],
    'Sliding Window': ['sliding window'],
    'Sliding Door': ['sliding door'],
    'Bi-fold Door': ['bi-fold', 'bifold'],
    'Louvre Window': ['louvre', 'louver'],
    'Fixed Panel / Screen': ['fixed panel', 'screen', 'partition', 'aluminium frame'],
  },
  'Glass': {
    'Shower Screen': ['shower screen', 'shower'],
    'Fixed Glass': ['fixed glass', 'frosted', 'sandblasted', 'fluted'],
    'Glass Panel': ['glass panel', 'clear glass', 'tempered glass', 'laminated glass'],
    'Mirror': ['mirror'],
    'Backsplash': ['backsplash', 'back splash', 'kitchen glass'],
  },
  'Flooring': {
    'Timber': ['timber', 'parquet', 'engineered', 'solid wood floor'],
    'Vinyl': ['vinyl', 'LVT', 'SPC'],
    'Laminate': ['laminate'],
    'Skirting': ['skirting'],
  },
  'Air Conditioning': {
    'Split Unit': ['split', '1.0HP', '1.5HP', '2.0HP', '2.5HP', 'inverter'],
    'Ceiling Cassette': ['cassette', 'ceiling cassette'],
    'Ducted': ['ducted'],
    'Piping': ['refrigerant', 'trunking', 'conduit', 'drain pipe', 'pipe'],
  },
  'Metal Work': {
    'Railing': ['railing', 'handrail', 'balustrade'],
    'Gate': ['gate', 'auto gate'],
    'Grille': ['grille', 'grill'],
    'Awning': ['awning', 'canopy'],
  },
  'Landscape': {
    'Garden Paving': ['paving', 'paver', 'interlocking'],
    'Turfing': ['turf', 'turfing', 'cow grass', 'grass'],
    'Planting': ['planting', 'shrub', 'hedging', 'tree'],
    'Pergola/Gazebo': ['pergola', 'gazebo'],
    'Decking': ['decking', 'deck', 'WPC', 'composite'],
    'Water Feature': ['fountain', 'fish pond', 'water feature'],
    'Fencing': ['fence', 'fencing', 'chain link', 'BRC'],
    'Irrigation': ['irrigation', 'sprinkler', 'drip system'],
  },
  'Cleaning': {
    'Post-renovation': ['post-renovation', 'post renovation', 'final clean', 'cleaning'],
    'Window/Glass': ['window clean', 'glass clean'],
    'Chemical Wash': ['chemical wash', 'chemical clean', 'acid wash'],
  },
};

// ============================================
// Material/Method detection keywords
// ============================================
const MATERIAL_KEYWORDS: Record<string, Record<string, string[]>> = {
  'Tiling': {
    '300x300': ['300x300', '30x30', '12x12'],
    '300x600': ['300x600', '30x60', '12x24'],
    '600x600': ['600x600', '60x60', '24x24'],
    '900x900': ['900x900', '90x90', '36x36'],
    '1200x600': ['1200x600', '120x60', '48x24', 'large format', 'premium'],
    '600x1200': ['600x1200', '60x120'],
    '200x300': ['200x300', '20x30', '8x12'],
    'Feature/Mosaic': ['mosaic', 'pattern', 'feature', 'accent'],
    'Anti-slip': ['anti-slip', 'anti slip', 'non-slip'],
    'Standard Grout': ['standard grout', 'cement grout'],
    'Epoxy Grout': ['epoxy'],
  },
  'Electrical': {
    '13A Socket': ['13A', '13amp'],
    '15A Socket': ['15A', '15amp'],
    'USB Socket': ['USB'],
    'Downlight Cutout': ['downlight'],
    'Cove Light Wiring': ['cove light', 'cove'],
    '12-way': ['12-way', '12 way'],
    '18-way': ['18-way', '18 way'],
    '36-way': ['36-way', '36 way'],
    '48-way': ['48-way', '48 way'],
    'Ceiling Fan': ['ceiling fan'],
    'Exhaust Fan': ['exhaust'],
  },
  'Plumbing': {
    'PVC': ['PVC', 'polypipe'],
    'PPR': ['PPR'],
    'Copper': ['copper'],
    'Stainless Steel': ['stainless', 'SS'],
    'Rain Shower Set': ['rain shower', 'rain'],
    'Handheld Only': ['handheld'],
    'Standard WC': ['standard WC', 'floor mount'],
    'Wall-hung WC': ['wall-hung', 'wall hung', 'wall mount'],
  },
  'Painting': {
    '2-coat': ['2-coat', '2 coat', 'two coat'],
    '3-coat': ['3-coat', '3 coat', 'three coat', 'premium'],
    'Texture Finish': ['texture'],
    'Limewash': ['limewash', 'lime wash'],
    'Weather-shield': ['weather', 'exterior'],
  },
  'False Ceiling': {
    'Plasterboard': ['plasterboard', 'gypsum board', 'gypsum'],
    'Calcium Silicate': ['calcium silicate'],
    'L-box/Cove': ['L-box', 'cove', 'cove light'],
    'Coffered/Tray': ['coffered', 'tray'],
    'Drop Ceiling': ['drop'],
    'Single Layer': ['single layer', 'single side'],
    'Double Layer': ['double layer', 'double side'],
    'Fire-rated': ['fire rated', 'fire-rated'],
    'PU Cornice': ['PU', 'polyurethane'],
    'Standard Plaster': ['plaster cornice'],
  },
  'Carpentry': {
    'Laminated': ['laminated', 'laminate'],
    'Melamine': ['melamine'],
    'Aluminium': ['aluminium', 'aluminum'],
    'Solid Wood': ['solid wood', 'nyatoh', 'oak', 'walnut', 'teak'],
    'Swing Door': ['swing door', 'swing'],
    'Sliding Door': ['sliding door', 'sliding'],
    'Walk-in': ['walk-in', 'walk in'],
    'Glass Door': ['glass door'],
    'Hollow Core': ['hollow core', 'hollow'],
    'Solid Core': ['solid core', 'solid door'],
    'Barn Door': ['barn door', 'barn'],
    'Timber Frame': ['timber frame', 'wood frame'],
    'Aluminium Frame': ['aluminium frame', 'aluminum frame'],
  },
  'Waterproofing': {
    'Cementitious': ['cementitious', 'cement-based'],
    'Membrane': ['membrane'],
    'Torch-on Membrane': ['torch-on', 'torch on'],
    'Liquid Membrane': ['liquid'],
  },
  'Roofing': {
    'PU Metal': ['PU metal'],
    'PU Foam': ['PU foam'],
    'PU Foil': ['PU foil'],
    'Twinwall': ['twinwall', 'twin wall'],
    'Solid Sheet': ['solid sheet'],
    'Clay Tile': ['clay tile'],
    'Concrete Tile': ['concrete tile'],
    'Metal Tile': ['metal tile'],
  },
  'Glass': {
    'Tempered 10mm': ['tempered 10mm', '10mm tempered'],
    'Tempered 12mm': ['tempered 12mm', '12mm tempered'],
    'Clear Tempered': ['clear tempered'],
    'Frosted/Sandblasted': ['frosted', 'sandblasted'],
    'Fluted': ['fluted', 'reeded'],
  },
  'Flooring': {
    'Solid Parquet': ['solid parquet', 'solid timber'],
    'Engineered Timber': ['engineered'],
    'LVT (Glue-down)': ['LVT', 'glue-down', 'glue down'],
    'SPC (Click-lock)': ['SPC', 'click-lock', 'click lock'],
  },
  'Air Conditioning': {
    '1.0HP Inverter': ['1.0HP', '1HP', '9000BTU'],
    '1.5HP Inverter': ['1.5HP', '12000BTU'],
    '2.0HP Inverter': ['2.0HP', '2HP', '18000BTU'],
    '2.5HP Inverter': ['2.5HP', '24000BTU'],
    'Refrigerant Pipe': ['refrigerant'],
    'Trunking/Conduit': ['trunking', 'conduit'],
  },
  'Metal Work': {
    'Mild Steel (Powder Coated)': ['mild steel', 'powder coat'],
    'Stainless Steel SS304': ['SS304', 'stainless steel'],
    'Wrought Iron': ['wrought iron'],
    'Single Leaf': ['single leaf', 'single'],
    'Double Leaf': ['double leaf', 'double'],
    'Auto Gate': ['auto gate', 'automatic'],
  },
};

// ============================================
// Classification function
// ============================================
interface Classification {
  category: string;
  subcategory: string;
  materialMethod: string;
}

function classifyItem(
  itemName: string,
  aiSubcategory?: string,
  aiMaterialMethod?: string,
  aiCategory?: string,
): Classification {
  const lower = itemName.toLowerCase();

  // Step 1: Detect category
  let category = aiCategory || null;
  if (!category) {
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        category = cat;
        break;
      }
    }
  }
  if (!category) return { category: '', subcategory: 'General', materialMethod: 'Standard' };

  // Step 2: Detect subcategory (AI value takes priority)
  let subcategory = aiSubcategory || 'General';
  if (!aiSubcategory || aiSubcategory === 'General') {
    const subcatMap = SUBCATEGORY_KEYWORDS[category];
    if (subcatMap) {
      for (const [subcat, keywords] of Object.entries(subcatMap)) {
        if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          subcategory = subcat;
          break;
        }
      }
    }
  }

  // Step 3: Detect material/method (AI value takes priority)
  let materialMethod = aiMaterialMethod || 'Standard';
  if (!aiMaterialMethod || aiMaterialMethod === 'Standard') {
    const matMap = MATERIAL_KEYWORDS[category];
    if (matMap) {
      for (const [mat, keywords] of Object.entries(matMap)) {
        if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
          materialMethod = mat;
          break;
        }
      }
    }
  }

  return { category, subcategory, materialMethod };
}

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

  const prices = (data as { unit_price: number }[]).map(d => d.unit_price).sort((a, b) => a - b);
  const trimStart = Math.floor(prices.length * 0.1);
  const trimEnd = Math.ceil(prices.length * 0.9);
  const trimmed = prices.slice(trimStart, trimEnd);

  if (trimmed.length === 0) return;

  const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const confidence = data.length >= 50 ? 'high' : data.length >= 20 ? 'mid' : 'low';

  await db.from('price_database').upsert({
    category,
    subcategory,
    material_method: materialMethod,
    unit,
    supply_type: supplyType,
    region,
    min_price: Math.min(...trimmed),
    max_price: Math.max(...trimmed),
    avg_price: Math.round(avg * 100) / 100,
    sample_count: data.length,
    confidence,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'category,subcategory,material_method,unit,supply_type,region' });
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
      const supplyType = item.supplyType || 'supply_install';

      await db.from('price_data_points').insert({
        category: classification.category,
        subcategory: classification.subcategory,
        material_method: classification.materialMethod,
        item_name: item.name,
        unit,
        unit_price: item.unitPrice,
        supply_type: supplyType,
        region: effectiveRegion,
        source: 'quotation',
        project_id: projectId || null,
        confidence: 0.8,
      });

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
