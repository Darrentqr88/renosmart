---
description: Replicate exact UI/UX from reference index.html into Next.js app
---

# RENOSMART UI REPLICATION — Exact Reference HTML

I have an existing index.html that contains the EXACT design, logic, and features I want.
Your job is to replicate this 1:1 into the Next.js app.

The reference HTML file is at: `../index.html` (or I will place it as `reference/index.html`)

---

## STEP 1: Read the reference HTML

```bash
# First, read the reference HTML to understand everything
cat reference/index.html | head -200  # Read CSS variables
grep -n "function " reference/index.html  # All JS functions
```

---

## STEP 2: DESIGN SYSTEM — Copy EXACTLY from reference HTML

### Fonts (in src/app/layout.tsx)
```tsx
// EXACT fonts from reference HTML
import { DM_Sans, DM_Mono } from 'next/font/google'

// Also load Cormorant Garamond for brand/headings
// Add to <head>: 
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Variables (src/app/globals.css) — COPY EXACTLY
```css
:root {
  --bg:       #F7F8FA;
  --surface:  #FFFFFF;
  --surface2: #F0F2F7;
  --surface3: #E4E7F0;
  --gold:     #F0B90B;
  --gold2:    #F8D33A;
  --gold-lt:  #FFF8DC;
  --gold-dk:  #C89B09;
  --teal:     #00C9A7;
  --teal-lt:  #E0FAF5;
  --red:      #E53935;
  --green:    #16A34A;
  --blue:     #2E6BE6;
  --orange:   #F97316;
  --text:     #1B2336;
  --text2:    #3D4A60;
  --text3:    #6B7A94;
  --border:   rgba(240,185,11,0.2);
  --border2:  #D8DCE8;
  
  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(27,35,54,.05);
  --shadow-md: 0 4px 12px rgba(27,35,54,.08);
  --shadow-lg: 0 8px 28px rgba(27,35,54,.10);
}

* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', 'Corbel', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

---

## STEP 3: COMPONENT LIBRARY — Replicate exact CSS classes

Create `src/styles/components.css` with ALL of these (copy exact values):

### Navigation Bar
```css
.portal-bar {
  position: fixed; top:0; left:0; right:0; z-index:100;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border2);
  box-shadow: 0 1px 8px rgba(27,35,54,.06);
  display: flex; align-items: center;
  padding: 0 24px; height: 60px; gap: 8px;
}
.brand {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; color: var(--gold);
  margin-right: 20px; letter-spacing: 0.5px;
}
.brand span { 
  color: var(--text3); font-size: 11px; display:block;
  margin-top:-4px; letter-spacing:2px; font-weight:500;
}
.portal-btn {
  padding: 7px 18px; border-radius: 6px; border: 1px solid var(--border2);
  cursor: pointer; font-size: 13px; font-weight: 500;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.2s; color: var(--text2); background: transparent;
  display: flex; align-items: center; gap: 7px;
}
.portal-btn.active {
  background: var(--gold); color: #1B2336; border-color: var(--gold);
  box-shadow: 0 3px 10px rgba(240,185,11,.3);
}
.portal-btn:not(.active):hover { border-color: var(--gold); color: var(--gold); }
.region-toggle, .lang-toggle {
  display: flex; background: var(--surface2);
  border: 1px solid var(--border2); border-radius: 8px;
  padding: 3px; gap: 2px;
}
.region-btn, .lang-btn {
  font-size: 11px; font-weight: 600; color: var(--text3);
  background: transparent; border: none; border-radius: 6px;
  padding: 4px 12px; cursor: pointer; transition: all .18s;
}
.region-btn:hover, .lang-btn:hover { color: var(--text); background: var(--surface3); }
.lang-btn.active { background: rgba(46,107,230,0.12); color: var(--blue); }
```

### Designer Layout
```css
.designer-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: calc(100vh - 60px);
}
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border2);
  padding: 24px 0; overflow-y: auto;
}
.sidebar-label {
  font-size: 10px; letter-spacing:2px; color: var(--text3);
  font-weight:600; padding: 12px 12px 6px; text-transform:uppercase;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 12px; border-radius: 8px; cursor: pointer;
  font-size: 13.5px; color: var(--text2); transition: all 0.15s;
  margin-bottom: 2px;
}
.nav-item:hover { background: var(--surface2); color: var(--text); }
.nav-item.active { background: rgba(240,185,11,0.12); color: var(--gold); }
.nav-icon { font-size:16px; width:20px; text-align:center; }
.nav-badge { margin-left:auto; background: var(--red); color:#fff; font-size:10px; padding:2px 7px; border-radius:10px; font-weight:600; }
.main-content { overflow-y: auto; background: var(--bg); }
.panel { display:none; padding: 28px 32px; }
.panel.active { display:block; }
.panel-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 26px; color: var(--text); margin-bottom: 4px;
}
.panel-sub { font-size: 13px; color: var(--text2); margin-bottom: 28px; }
```

### Upload Zone
```css
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 12px; padding: 48px;
  text-align: center; cursor: pointer;
  transition: all 0.2s; background: var(--surface);
}
.upload-zone:hover { border-color: var(--gold); background: rgba(240,185,11,0.04); }
.upload-zone.drag-active { border-color: var(--gold); background: rgba(240,185,11,0.06); transform: scale(1.01); }
.upload-icon { font-size: 40px; margin-bottom: 12px; }
.upload-text { font-size: 15px; color: var(--text2); }
.upload-text strong { color: var(--gold); }
.upload-formats { font-size: 12px; color: var(--text3); margin-top: 6px; }
```

### AI Review Card
```css
.ai-review-card {
  background: var(--surface); border-radius: 12px;
  border: 1px solid var(--border2); overflow: hidden; margin-bottom: 16px;
}
.ai-header {
  background: linear-gradient(135deg, rgba(240,185,11,0.08), rgba(0,201,167,0.05));
  padding: 16px 20px; border-bottom: 1px solid var(--border2);
  display: flex; align-items: center; gap: 12px;
}
.ai-badge {
  background: var(--gold); color: #1B2336;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  padding: 3px 8px; border-radius: 4px;
}
.score-row { display:flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.score-circle {
  width: 80px; height: 80px; border-radius: 50%;
  border: 3px solid var(--gold);
  display: flex; flex-direction:column; align-items:center; justify-content:center;
  background: rgba(240,185,11,0.08); flex-shrink: 0;
}
.score-num { font-size: 24px; font-weight: 700; color: var(--gold); line-height:1; }
.score-label { font-size: 9px; color: var(--text3); letter-spacing:1px; }
.score-item { display:flex; align-items:center; gap: 10px; margin-bottom: 8px; }
.score-item-label { font-size: 12px; color: var(--text2); width: 100px; }
.score-bar-bg { flex:1; height:6px; background: var(--surface3); border-radius:3px; border:1px solid var(--border2); }
.score-bar { height:6px; border-radius:3px; transition: width 1s ease; }
.score-item-val { font-size: 12px; color: var(--text); width: 30px; text-align:right; font-weight:600; }
```

### Alert Cards
```css
.alert { display:flex; gap:12px; padding: 12px 16px; border-radius:8px; margin-bottom: 10px; align-items:flex-start; }
.alert-critical { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); }
.alert-warning  { background: rgba(251,146,60,0.1);  border: 1px solid rgba(251,146,60,0.25);  }
.alert-info     { background: rgba(96,165,250,0.1);  border: 1px solid rgba(96,165,250,0.25);  }
.alert-ok       { background: rgba(22,163,74,0.1);   border: 1px solid rgba(74,222,128,0.25);  }
.alert-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.alert-critical .alert-title { color: var(--red); }
.alert-warning  .alert-title { color: var(--orange); }
.alert-info     .alert-title { color: var(--blue); }
.alert-ok       .alert-title { color: var(--green); }
.alert-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }
```

### Quotation Table
```css
.q-table { width:100%; border-collapse: collapse; font-size: 13px; }
.q-table th { padding: 10px 12px; text-align:left; font-size:11px; letter-spacing:1.5px; color: var(--text3); font-weight:600; text-transform:uppercase; border-bottom: 1px solid var(--border2); }
.q-table td { padding: 11px 12px; border-bottom: 1px solid var(--surface3); color: var(--text2); }
.q-table tr:hover td { background: var(--surface2); }
.q-table .flag { color: var(--red); }
.q-table .ok   { color: var(--green); }
.q-table .warn { color: var(--orange); }
.q-page-tab {
  padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--border2); background: var(--surface2);
  color: var(--text2); cursor: pointer; transition: all .15s;
}
.q-page-tab.active { background: rgba(240,185,11,.15); border-color: var(--gold); color: var(--gold); }
```

### Gantt Chart
```css
.gantt-wrap { overflow-x: auto; }
.gantt-cal-header { display:flex; margin-left: 160px; }
.gantt-col-week { flex:1; border-left: 1px solid var(--border2); padding: 4px 3px 3px; text-align:center; }
.gantt-col-week.weekend-col { background: rgba(255,255,255,0.025); }
.gantt-col-week.holiday-col { background: rgba(251,146,60,0.07); }
.gantt-week-date  { font-size:9px; color:var(--text3); font-weight:600; }
.gantt-week-label { font-size:10px; color:var(--text2); font-weight:700; margin-top:1px; }
.gantt-row { display:flex; align-items:center; margin-bottom:5px; }
.gantt-label { width:160px; font-size:11px; color:var(--text2); padding-right:10px; flex-shrink:0; line-height:1.3; cursor:pointer; }
.gantt-track { flex:1; height:26px; position:relative; }
.gantt-bar {
  position:absolute; height:100%; border-radius:4px;
  display:flex; align-items:center; padding:0 8px;
  font-size:10px; font-weight:600; color:#0d0f14;
  transition: filter .2s; cursor:pointer;
}
.gantt-bar:hover { filter:brightness(1.2); }
.gantt-today-line {
  position:absolute; top:-4px; bottom:-4px; width:2px;
  background:var(--gold); z-index:3; pointer-events:none;
}
.gantt-today-line::after {
  content:'今天'; position:absolute; top:-14px; left:50%;
  transform:translateX(-50%); font-size:9px; color:var(--gold);
  white-space:nowrap; font-weight:700;
}
```

### Stat Cards
```css
.stats-row { display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--surface); border: 1px solid var(--border2); border-radius: 10px; padding: 18px 20px; }
.stat-val { font-size: 28px; font-weight:700; line-height:1; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: var(--text2); }
```

### Mobile Frame (Owner/Worker portals)
```css
.mobile-frame {
  width: 375px; background: var(--surface); border-radius: 40px;
  border: 1.5px solid var(--border2); overflow: hidden; margin: 0 auto;
  box-shadow: 0 12px 40px rgba(27,35,54,0.10);
}
.mobile-notch { background: #1B2336; height: 44px; display:flex; align-items:flex-end; justify-content:center; padding-bottom: 8px; }
.mobile-notch-pill { width:120px; height:5px; background: rgba(255,255,255,.25); border-radius:3px; }
.mobile-project-card {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, #1B2336, #2A3350);
  border-radius: 16px; padding: 20px;
  border: 1px solid rgba(240,185,11,.2);
}
.mobile-tab { flex:1; text-align:center; padding: 12px 4px; font-size: 12px; font-weight: 500; color: var(--text2); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
.mobile-tab.active { color: var(--gold); border-bottom-color: var(--gold); }
```

### Timeline (Owner progress)
```css
.tl-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.tl-done    { background: var(--green); }
.tl-active  { background: var(--gold); box-shadow: 0 0 0 3px rgba(240,185,11,0.2); }
.tl-pending { background: var(--surface3); border: 2px solid var(--border2); }
```

### Pricing Cards
```css
.pricing-card { background:var(--surface); border:1.5px solid var(--border2); border-radius:20px; cursor:pointer; transition:all .2s; position:relative; overflow:visible; }
.pricing-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(27,35,54,.08); }
.pricing-card-pro { border-color:rgba(240,185,11,.4); box-shadow:0 0 0 1px rgba(240,185,11,.15), 0 8px 32px rgba(240,185,11,.06); }
.pricing-card-inner { padding:28px; }
.pricing-popular-tag { position:absolute; top:-14px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#c9a84c,#f0c060); color:#0d0f14; font-size:11px; font-weight:800; padding:4px 16px; border-radius:20px; white-space:nowrap; }
.pricing-plan-name { font-size:18px; font-weight:800; color:var(--text); }
.pricing-price { font-size:52px; font-weight:900; color:var(--text); line-height:1; }
.pricing-btn { width:100%; padding:13px 20px; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .2s; }
.pricing-btn-gold { background:linear-gradient(135deg,var(--gold),var(--gold2)); color:#1B2336; }
.pricing-btn-gold:hover { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 20px rgba(240,185,11,.35); }
.feat-yes { color:var(--text2); }
.feat-gold { color:var(--gold) !important; font-weight:600; }
.feat-no { color:var(--text3); opacity:.5; }
```

---

## STEP 4: PORT EXACT JAVASCRIPT LOGIC

### Core State Variables (from reference HTML)
```typescript
// src/lib/store/appStore.ts
// Port these EXACT variables from reference HTML:

const GANTT_TASK_DB = [
  // Copy ENTIRE array from reference HTML (survey, demolition, M&E, etc.)
  // Each task has: id, names{zh,en,ms}, workDays, offsetDays, color, subItems, materialPrep
]

const PRICE_DB = {
  MY: {
    currency: 'RM',
    ranges: {
      '批土 Skim Coat':    { min:0.80, max:1.50, avg:1.10, unit:'sqft' },
      '防水 Waterproofing':{ min:3.50, max:8.00, avg:5.20, unit:'sqft' },
      '地砖 Floor Tiling': { min:5.00, max:12.00,avg:7.50, unit:'sqft' },
      '石膏板吊顶 Ceiling':{ min:8.00, max:18.00,avg:12.50,unit:'sqft' },
      '全屋水电 Rewiring': { min:5500, max:16000,avg:9200, unit:'unit' },
      '室内油漆 Paint':    { min:1.20, max:2.80, avg:1.80, unit:'sqft' },
      '木工柜体 Cabinet':  { min:800,  max:2000, avg:1200, unit:'ft'   },
    }
  },
  SG: {
    currency: 'SGD',
    ranges: { /* SG prices */ }
  }
}

// MY/SG Public Holidays (copy exactly from reference HTML PUBLIC_HOLIDAYS array)
// TRANSLATIONS object (copy entire EN/BM/ZH translations from reference)
```

### Quotation Analysis Logic (PORT EXACTLY)
```typescript
// src/lib/ai/analyzeQuotation.ts
// Port processFile(), analyzeWithClaude(), renderAnalysisResult() logic

// CRITICAL: textForAI = 20,000 chars (NOT 4,000 as in old reference)
// The reference HTML has a bug: it uses 4,000. Fix it to 20,000.
const textForAI = quotationText.substring(0, 20000);

// AI Prompt — use the BILINGUAL prompt from reference HTML (规则0-规则5)
// It handles both English and Chinese quotations
// Identifies: contractor (issuer) vs client (recipient)
// Returns: client{}, score{}, items[], subtotals[], missing[], alerts[]
```

### Schedule/Gantt Engine (PORT EXACTLY)
```typescript
// src/lib/gantt/scheduleEngine.ts
// Port these functions from reference HTML:
// - buildRuleBasedSchedule(items, totalAmt) — rule-based from quotation items
// - computeSchedule() — apply offsets to get calendar dates
// - rebuildGantt() — render SVG gantt with week headers + today line
// - isWorkingDay(date) — skips weekends + MY holidays  
// - addWorkDays(date, n) — adds N working days
// - workDayOffset(start, n) — returns date N working days from start
// - openOverrideModal() — allow designer to override holidays

// GANTT_TASK_DB: copy all 15+ task definitions with sub-items and material prep
// Scale logic: totalAmt > 300000 → scale=3.5, > 150000 → 2.5, etc.
// Parallel tasks: M&E + masonry run together, finishes phase all parallel
```

### Payment System (PORT EXACTLY)
```typescript
// src/lib/payments/paymentLogic.ts
// renderPayment() — renders 4-phase default payment table
// cycleStatus() — 未到期 → 待收款 → 已收款 → 未到期
// updatePayField(id, field, val) — inline edit
// addVORow() — add VO, auto-add to payments, update total
// updatePaySummary() — recalculate total, collected, outstanding
```

### Worker Calendar (PORT EXACTLY)
```typescript
// Port renderWorkerCalendar(), wkSelectDay(), renderWorkerTodayTasks()
// Multi-site color dots on calendar
// Click date → show tasks for that day
// wkCheckin() — check in/out with timestamp
```

---

## STEP 5: BUILD PAGES THAT REPLICATE REFERENCE HTML STRUCTURE

### Designer Dashboard (/designer/page.tsx)
```
REPLICATE: portal-designer > designer-layout > sidebar + main-content
- Sidebar: EXACT same nav items as reference HTML (报价单导入, AI审核结果, 工程进度编排, 导出报告, 工人名册, 价格库)
- Main content: panels switching with showPanel()
- Panel upload: EXACT same upload zone + AI loading state + results
- Panel schedule: EXACT same Gantt chart + controls
- Panel workers: EXACT same worker roster + add worker flow
- Panel review: EXACT same AI review report page
```

### Key UI Interactions to Port
```
1. handleFileDrop / handleFileSelect → processFile()
2. AI progress bar (setAIProgress) with percentage + label
3. renderQTable() with section headers, page tabs, status badges
4. renderAnalysisResult() with client card + score + alerts + table
5. rebuildGantt() with week columns, today line, holiday markers
6. renderPayment() with inline editable payment rows
7. renderPhotos() with approve/reject workflow  
8. renderWorkerCalendar() with multi-site dot view
9. switchPortal() / showPanel() navigation
10. syncUsageUI() for AI quota display
```

### Pricing Page (/designer/pricing/page.tsx)
```
REPLICATE: portal-pricing with 3 plan cards
- FREE: usage bar + feature list + "当前方案" button
- PRO: gold border + "🔥 最多人选择" tag + feature list + upgrade button
- ELITE: blue theme + feature list + upgrade button
- Compare table at bottom
- FAQ section (accordion)
- handleUpgradeClick() → Billplz checkout modal
- NEVER blocked by auth gate
```

### Owner Dashboard (/owner/page.tsx)
```
REPLICATE: portal-owner > mobile-frame structure
- Mobile notch + dark header
- Project card with dark gradient + progress
- Tabs: 进度 / 文件 / 付款 / 照片
- Timeline with colored dots (done/active/pending)
- Notification banners
```

### Worker Dashboard (/worker/page.tsx)
```
REPLICATE: portal-worker > mobile-frame structure  
- Worker header with avatar (click to change)
- Month calendar with site color dots
- Click date → today's task list
- Task cards with subtasks checklist
- Check-in/out button
- wkCheckin() function
```

---

## STEP 6: LANGUAGE SYSTEM (Port EXACT translations)

```typescript
// src/lib/i18n/translations.ts
// Copy ENTIRE TRANSLATIONS object from reference HTML
// Includes: EN, BM (Bahasa Malaysia), ZH keys for every UI string
// t(key) function for translation lookup
// setLang() to switch language
// All Gantt task names in zh/en/ms
```

---

## STEP 7: IMPLEMENTATION COMMANDS

Run in order:

```bash
# 1. Copy reference CSS to globals
cp reference-css.css src/app/globals.css

# 2. Create components mirroring reference HTML structure
mkdir -p src/components/{nav,sidebar,gantt,quotation,payment,owner,worker,pricing}

# 3. Build each component from reference HTML sections

# 4. Port all JS functions to TypeScript equivalents

# 5. Test
npm run build
npm run dev

# 6. Open localhost:3000 and compare side by side with reference HTML
# Every section should look IDENTICAL to the reference
```

---

## CRITICAL DIFFERENCES FROM REFERENCE HTML TO FIX

1. **textForAI: 4,000 → 20,000 chars** (reference had bug)
2. **PDF extraction: Use unpkg CDN** (not cdnjs — Edge blocks it)
3. **Supabase: user_id in ALL writes** (not designer_id)
4. **Auth: Google OAuth** (reference used phone-only workaround)
5. **API routes: /api/claude** with proper quota enforcement
6. **No portal-designer/owner/worker tabs in top nav** (reference had these for demo; real app uses auth + role-based routing)

---

## QUALITY CHECK

After implementation, open browser and verify:
- [ ] Brand "RenoSmart PLATFORM" in Cormorant Garamond gold font
- [ ] Sidebar exact same items and gold hover state
- [ ] Upload zone with dashed gold border on hover
- [ ] AI score circle with gold border, animated bars
- [ ] Alert cards with color-coded left borders
- [ ] Quotation table with section header rows (📁 label)
- [ ] Gantt with week columns, gold today line, holiday markers
- [ ] Payment rows with inline editing + status cycling
- [ ] Mobile frame for owner/worker portals
- [ ] Pricing cards with PRO card gold glow effect
- [ ] All 3 languages switch correctly (EN/BM/ZH)
- [ ] MY/SG region toggle updates currency
