---
description: Apply professional UI/UX design system to all RenoSmart pages
---

# RenoSmart Professional UI/UX Upgrade

You are upgrading RenoSmart to a premium, production-grade SaaS interface.
Reference aesthetic: Linear.app + Vercel Dashboard + Notion — refined, minimal, fast.

## DESIGN SYSTEM — Apply to ALL components

### Color Tokens (src/styles/tokens.css)
```css
:root {
  /* Brand */
  --gold:       #F0B90B;
  --gold-light: #FFF3CD;
  --gold-dark:  #C89B09;
  --gold-glow:  rgba(240,185,11,0.15);

  /* Neutrals — Dark sidebar */
  --slate-950:  #0A0F1A;
  --slate-900:  #0F1923;
  --slate-800:  #162032;
  --slate-700:  #1E2D42;
  --slate-600:  #2A3D56;
  --slate-500:  #3D5470;

  /* Neutrals — Light content */
  --gray-50:    #F7F8FA;
  --gray-100:   #F0F2F7;
  --gray-200:   #E4E7F0;
  --gray-300:   #C8CEDF;
  --gray-400:   #8D96AF;
  --gray-500:   #6B7A94;
  --gray-600:   #4A556A;
  --gray-700:   #2D3748;
  --gray-900:   #1A202C;

  /* Semantic */
  --success:    #10B981;
  --warning:    #F59E0B;
  --danger:     #EF4444;
  --info:       #3B82F6;

  /* Surfaces */
  --bg:         #F7F8FA;
  --surface:    #FFFFFF;
  --surface-2:  #F0F2F7;
  --border:     rgba(0,0,0,0.06);
  --border-2:   rgba(0,0,0,0.10);

  /* Typography */
  --text:       #1A202C;
  --text-2:     #4A556A;
  --text-3:     #8D96AF;
  --text-inv:   #FFFFFF;

  /* Shadows */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
  --shadow-lg:  0 12px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06);
  --shadow-gold: 0 0 0 3px rgba(240,185,11,0.20);

  /* Radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;

  /* Transitions */
  --ease:       cubic-bezier(0.16, 1, 0.3, 1);
  --ease-fast:  cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Typography (add to tailwind.config.ts)
```typescript
// Use Geist font (Next.js built-in) — clean, modern, professional
import { Geist, Geist_Mono } from 'next/font/google'

export const geistSans = Geist({ subsets: ['latin'], variable: '--font-sans' })
export const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

// Font scale:
// Display: 48px/56px, weight 700, tracking -0.02em
// H1: 32px, weight 700, tracking -0.01em
// H2: 24px, weight 600
// H3: 18px, weight 600
// Body: 14px, weight 400, line-height 1.6
// Small: 12px, weight 500
// Mono: Geist Mono for numbers/code
```

---

## PAGE-BY-PAGE UI SPECIFICATIONS

### LANDING PAGE

**Hero Section:**
```tsx
// Dark background (#0A0F1A) with subtle gold grid pattern
// Animated gradient mesh background (CSS animation)
// Badge: "🏆 Trusted by 50+ Interior Designers MY & SG"
// Headline: 3-line, large, white with gold highlight word
// Subheadline: gray-400, max-w-lg
// CTA buttons: Gold primary + ghost secondary
// Hero mockup: Browser frame showing dashboard screenshot
// Floating stat cards: "RM 2.3M analysed" / "1,200+ quotations"

// Animation: staggered fade-in on scroll
// Background: subtle noise texture overlay
```

**Feature Cards:**
```tsx
// 3-column grid, dark cards with colored icon backgrounds
// Icon: rounded square with gradient background
// Hover: lift effect (translateY -4px) + gold border glow
// Stats under each feature (e.g., "80% faster scheduling")
```

**Pricing Section:**
```tsx
// White background section
// 3 cards: Free / Pro (highlighted, gold border + scale(1.05)) / Elite
// Annual toggle with "Save 20%" badge
// Feature comparison table below cards
// CTA: "Start Free" vs "Upgrade Now"
```

---

### DESIGNER SIDEBAR

```tsx
// src/components/designer/Sidebar.tsx

// Width: 260px, fixed position
// Background: var(--slate-900) with subtle noise texture
// Top: Logo + company name
// 
// NAV ITEMS — each item:
// - Icon (20px, Lucide)
// - Label
// - Active: gold text + left border (3px gold) + bg rgba(240,185,11,0.08)
// - Hover: white text + bg rgba(255,255,255,0.05)
// - Badge (notification count): gold pill
//
// BOTTOM SECTION:
// - Usage meter (animated progress bar)
// - Plan badge (FREE/PRO/ELITE) 
// - User avatar + name + role
// - Settings icon

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/designer',              labelZH: '工作台' },
  { icon: FolderOpen,      label: 'Projects',        href: '/designer/projects',     labelZH: '项目' },
  { icon: FileSearch,      label: 'Quotation AI',    href: '/designer/quotation',    labelZH: 'AI报价审核' },
  { icon: Users,           label: 'Workers',         href: '/designer/workers',      labelZH: '工人名册' },
  { icon: TrendingUp,      label: 'Price Database',  href: '/designer/price-database', labelZH: '价格数据库' },
  { icon: Receipt,         label: 'Cost Database',   href: '/designer/cost-database',  labelZH: '成本数据库' },
  { icon: Zap,             label: 'Upgrade Plan',    href: '/designer/pricing',      labelZH: '升级方案', special: true },
];
```

---

### KANBAN BOARD

```tsx
// src/components/designer/KanbanBoard.tsx
//
// Layout: 3 equal columns with gap-6
// Column header: colored dot + title + count badge
//
// Project Card:
// - Background: white, rounded-xl, shadow-sm
// - Hover: shadow-md, translateY(-2px), transition 200ms
// - Top: status color bar (4px, full width, rounded top)
// - Body: project name (font-semibold) + address (text-3, text-sm)
// - Progress bar: colored, thin (4px), with percentage label
// - Footer: worker avatars stack + contract amount + last activity
// - Drag handle: appears on hover (6 dots icon)
//
// Column colors:
// Pending: blue (#3B82F6)
// Active: amber (#F59E0B) 
// Completed: green (#10B981)
//
// Empty state: dashed border, ghost illustration, "Add Project" CTA

const ProjectCard = ({ project }) => (
  <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-md 
                  transition-all duration-200 hover:-translate-y-0.5 cursor-pointer
                  border border-gray-100 overflow-hidden">
    {/* Status color bar */}
    <div className={`h-1 w-full ${statusColor}`} />
    
    {/* Card body */}
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{project.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin size={10} /> {project.address}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-gray-700">
          RM {project.contract_amount?.toLocaleString()}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-700">{project.progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-500"
               style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <WorkerAvatarStack workers={project.workers} />
        <span className="text-xs text-gray-400">{timeAgo(project.updated_at)}</span>
      </div>
    </div>
  </div>
);
```

---

### QUOTATION UPLOAD PAGE

```tsx
// Upload zone — premium feel:
// - Dashed border (#E4E7F0) with rounded-2xl
// - Center: upload icon (animated bounce on hover)
// - Supported formats: PDF / Excel / CSV badge row
// - Drag active state: gold border + gold bg tint + scale(1.02)
// - File accepted: green checkmark animation + filename

// Progress states (animated transitions):
// 1. "Extracting text from PDF..." — spinning loader
// 2. "Sending to Claude AI..." — pulsing AI icon
// 3. "Analyzing 47 line items..." — counting animation
// 4. "Complete!" — confetti/checkmark burst

// Results — Card grid layout:
// Client Info Card: blue tint (#EFF6FF), icon, editable fields inline
// Score Card: large circle (animated fill), 4 metric bars
// Items Table: sticky header, alternating rows, status badges
// Alerts: colored left border (critical=red, warning=amber, info=blue)
```

---

### GANTT CHART

```tsx
// src/components/gantt/GanttChart.tsx
//
// SVG-based, responsive
// Left panel: task list (200px, scrollable)
// Right panel: timeline bars (fluid)
//
// Timeline header: months + dates
// Today marker: vertical gold dashed line
// Weekend columns: very subtle gray tint
// Holiday markers: small flag icon on date
//
// Task bars:
// - Rounded (radius 4px)
// - Color by trade (see TRADE_COLORS below)
// - Gradient (slightly lighter on top)
// - Label inside bar if wide enough, else outside right
// - Hover: slightly raised shadow + tooltip
// - Drag handles: darker ends, appear on hover
//
// Dependency arrows: gray dashed bezier curves
// Critical path tasks: red outline ring
//
// Trade colors:
const TRADE_COLORS = {
  demolition:   { bg: '#DC2626', text: '#fff' }, // red
  construction: { bg: '#7C3AED', text: '#fff' }, // purple
  electrical:   { bg: '#2563EB', text: '#fff' }, // blue
  plumbing:     { bg: '#0891B2', text: '#fff' }, // cyan
  tiling:       { bg: '#D97706', text: '#fff' }, // amber
  ceiling:      { bg: '#059669', text: '#fff' }, // green
  carpentry:    { bg: '#B45309', text: '#fff' }, // brown
  painting:     { bg: '#7C3AED', text: '#fff' }, // violet
  cleaning:     { bg: '#6B7280', text: '#fff' }, // gray
  general:      { bg: '#F0B90B', text: '#000' }, // gold
};
//
// Legend: color dots + trade name, bottom of chart
// Export button: PDF / Image (top right)
```

---

### PROJECT DETAIL TABS

```tsx
// Tab bar: underline style (not boxed)
// Active tab: gold underline (3px) + gold text
// Tab transition: content fade-in (150ms)
//
// Payments tab cards:
// - Phase card: white, left colored border by status
//   未到期: gray | 待收款: amber | 已收款: green
// - Amount: large, mono font
// - Click to edit: inline input appears
// - Hover status badge: shows "click to update"
//
// VO section:
// - Separate card with blue tint
// - "+ Add VO" button with + icon
// - VO total badge (updated live)
//
// Photos tab:
// - Masonry grid layout
// - Pending: amber overlay "Awaiting Review"
// - Approved: green checkmark corner badge
// - Hover: overlay with approve/reject buttons
// - Lightbox: fullscreen view on click
```

---

### PRICE DATABASE PAGE

```tsx
// Split layout:
// Left: category sidebar (scrollable list)
// Right: data table + chart
//
// Category sidebar items:
// - Icon + label + item count
// - Active: gold left border + light gold bg
//
// Data table:
// - Sticky header
// - Confidence badge: pill shape
//   🔴 Low: red/10 text-red-600
//   🟡 Mid: amber/10 text-amber-600
//   🟢 High: green/10 text-green-600
// - Price range: min—avg—max with visual bar
// - Sample count: small gray number
//
// Pro gate (for free users):
// - Blurred rows with lock icon overlay
// - "Upgrade to Pro to unlock" banner
//
// Chart: small sparkline per category (last 6 months trend)
```

---

### OWNER DASHBOARD (Mobile-first)

```tsx
// Max width 430px centered, phone-like frame on desktop
//
// Header: project name + designer avatar
// Progress circle: large (120px), animated fill, percentage center
//
// Milestone timeline: vertical line with dots
// - Completed: filled gold dot
// - Current: pulsing gold dot  
// - Future: gray empty dot
//
// Payment cards: horizontal scroll
// - Pill shape, amount + status
// - Paid: green | Pending: amber | Not due: gray
//
// Photo grid: 2-column, rounded corners, tap to expand
//
// Notification banner: slide-in from top
```

---

### WORKER DASHBOARD (Mobile-first)

```tsx
// Dark header with site name + date
// Today's tasks: card list
//
// Task card:
// - Trade icon + colored background
// - Task name (bold) + sub-tasks count
// - Date range chip
// - Progress slider (interactive)
// - Check-in button: large, gold, full-width
//
// Check-in state: timer running + "Checked In" green badge
// Upload photo: camera icon FAB (floating action button)
//
// Receipt upload: bottom sheet slide-up
```

---

## MICRO-INTERACTIONS TO IMPLEMENT

```tsx
// 1. Button press: scale(0.97) on mousedown, spring back
// 2. Card hover: translateY(-2px) + shadow increase
// 3. Input focus: gold border glow (box-shadow)
// 4. Toast notifications: slide in from bottom-right
// 5. Loading states: skeleton screens (not spinners) for data
// 6. Number animations: count-up on first render
// 7. Progress bars: animated fill with easing
// 8. Navigation: active item has sliding indicator
// 9. Modal: backdrop blur + scale-in animation
// 10. Drag on Gantt: opacity 0.8 + scale(1.02) + shadow
```

---

## REUSABLE COMPONENT LIBRARY

Create these in src/components/ui/:

```tsx
// StatusBadge.tsx
// Props: status ('ok'|'warn'|'flag'|'nodata'|'pending'|'active'|'completed')
// Returns colored pill with icon
const statusConfig = {
  ok:        { color: 'green',  icon: '✓', label: 'Normal' },
  warn:      { color: 'amber',  icon: '⚠', label: 'Caution' },
  flag:      { color: 'red',    icon: '✗', label: 'Flagged' },
  nodata:    { color: 'gray',   icon: '–', label: 'Pending' },
  pending:   { color: 'blue',   icon: '○', label: 'Pending' },
  active:    { color: 'amber',  icon: '●', label: 'Active' },
  completed: { color: 'green',  icon: '✓', label: 'Done' },
};

// ScoreCircle.tsx
// Animated SVG circle that fills based on score (0-100)
// Color: red <50, amber 50-75, green >75

// PlanBadge.tsx
// FREE: gray pill | PRO ✦: gold pill | ELITE ⚡: blue pill

// EmptyState.tsx
// Icon + title + description + optional CTA
// Used for empty kanban columns, no projects, etc.

// SkeletonCard.tsx
// Animated loading placeholder matching ProjectCard shape

// WorkerAvatar.tsx
// Circular avatar with trade color ring
// Stack: overlap multiple avatars with "+N more" overflow

// ConfidenceBadge.tsx
// For price database: low/mid/high with color + icon

// TradeTag.tsx
// Colored chip for trade categories

// MoneyDisplay.tsx
// RM prefix + formatted number + optional change indicator
```

---

## ANIMATIONS (framer-motion)

Install: `npm install framer-motion`

```tsx
// Page transitions
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } }
};

// Stagger children (kanban cards, table rows)
export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } }
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 }
};

// Score circle animation
// useSpring for smooth number count-up

// Gantt bar entrance
// Each bar slides in from left with stagger
```

---

## IMPLEMENTATION ORDER

1. Install framer-motion: `npm install framer-motion`
2. Create src/styles/tokens.css with all design tokens
3. Update globals.css to import tokens
4. Create all reusable components in src/components/ui/
5. Upgrade Sidebar.tsx with new design
6. Upgrade KanbanBoard.tsx + ProjectCard
7. Upgrade QuotationUpload with animated states
8. Upgrade GanttChart with trade colors + dependency arrows
9. Upgrade all tabs in project detail
10. Add micro-interactions throughout
11. Run `npm run build` — fix all errors
12. Test at localhost:3000 — verify all animations work

## QUALITY CHECKLIST

After implementation verify:
- [ ] No default blue browser focus rings (use custom gold)
- [ ] All hover states implemented
- [ ] Loading states (skeleton) for all async data
- [ ] Empty states for all lists
- [ ] Mobile responsive (sidebar collapses on <768px)
- [ ] Fonts loaded (no FOUT — flash of unstyled text)
- [ ] All status badges have correct colors
- [ ] Gantt trade colors are distinct and accessible
- [ ] Score circle animates on load
- [ ] Toast notifications work (top-right, auto-dismiss 4s)
