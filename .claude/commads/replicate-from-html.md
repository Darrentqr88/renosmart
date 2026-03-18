I have a reference index.html file that contains the EXACT design and logic I want for RenoSmart. 
Copy it to the project as: reference/index.html

Then do the following:

=== PHASE 1: Extract & Port Design System ===

Read reference/index.html and extract:
1. All CSS variables from :root {} block
2. All CSS class definitions  
3. Google Fonts import (Cormorant Garamond + DM Sans + DM Mono)

Create src/app/globals.css with ALL extracted CSS variables and classes EXACTLY as-is.
Add Google Fonts to src/app/layout.tsx <head>.

=== PHASE 2: Port Core Data & Logic ===

From reference/index.html extract and convert to TypeScript:

1. GANTT_TASK_DB array → src/lib/gantt/taskDatabase.ts
   (Copy ALL task objects with id, names, workDays, color, subItems, materialPrep)

2. PRICE_DB object → src/lib/data/priceDatabase.ts
   (MY and SG price ranges for all categories)

3. PUBLIC_HOLIDAYS array → src/lib/utils/holidays.ts
   (All MY/SG holidays with dates)

4. TRANSLATIONS object → src/lib/i18n/translations.ts
   (Complete EN/BM/ZH translations — copy every key)

5. These functions → src/lib/gantt/scheduleEngine.ts:
   - buildRuleBasedSchedule(items, totalAmt)
   - computeSchedule()
   - isWorkingDay(date)
   - addWorkDays(date, n)
   - workDayOffset(start, n)
   - CRITICAL: Scale logic (totalAmt > 300000 → scale=3.5, etc.)
   - Parallel task detection (M&E + masonry together)

6. These functions → src/lib/ai/quotationAnalysis.ts:
   - processFile() logic (file type detection + extraction)
   - analyzeWithClaude() — PORT THE FULL BILINGUAL PROMPT exactly
     IMPORTANT FIX: Change textForAI limit from 4000 to 20000 chars
   - renderAnalysisResult() logic (client card + score + table + alerts)
   - renderQTable() — section headers with 📁, page tabs, status badges

7. These functions → src/lib/payments/paymentSystem.ts:
   - renderPayment() — 4 default payment phases
   - cycleStatus() — 未到期 → 待收款 → 已收款 cycling
   - addVORow() — VO adds to payment table + updates total
   - updatePaySummary() — total/collected/outstanding calculation

=== PHASE 3: Build Components Matching Reference HTML ===

For each component, make it look IDENTICAL to the reference HTML section.

1. src/components/nav/TopNav.tsx
   Match: .portal-bar with backdrop blur, brand logo, portal buttons, region/lang toggles

2. src/components/designer/Sidebar.tsx  
   Match: .sidebar with all nav-item groups (workspace/projects/team/settings)
   Gold active state, red badges, exact icon list

3. src/components/quotation/UploadZone.tsx
   Match: .upload-zone dashed border, drag-active gold state, file type icons

4. src/components/quotation/AIProgressBar.tsx
   Match: exact progress states from setAIProgress() calls in reference

5. src/components/quotation/QuotationTable.tsx
   Match: .q-table with section rows (📁 gold header), page tabs, status badges
   Colors: ok=green, warn=orange, flag=red

6. src/components/quotation/AIReviewReport.tsx
   Match: .ai-review-card with gradient header, .ai-badge
   .score-circle (80px, gold border), .score-breakdown bars

7. src/components/quotation/ClientInfoCard.tsx
   Match: blue tint card (rgba(96,165,250,0.07)), editable inputs, save button

8. src/components/quotation/AlertCards.tsx
   Match: .alert-critical/.alert-warning/.alert-info/.alert-ok with colored borders

9. src/components/gantt/GanttChart.tsx
   Match: .gantt-wrap, week column headers with workday count + holiday badge,
   .gantt-bar with exact colors, .gantt-today-line with gold + "今天" label,
   Weekend/holiday stripes, drag handles on bars

10. src/components/gantt/TaskDetailDrawer.tsx
    Match: sub-items checklist + material prep items (type: order/warn/info)

11. src/components/payment/PaymentTab.tsx
    Match: summary cards (total/collected/outstanding), editable payment rows,
    status badges cycling, VO section with blue tint

12. src/components/photos/PhotosTab.tsx
    Match: pending/approved states, ✓/✕ approve/reject buttons, trade filter

13. src/components/owner/OwnerDashboard.tsx
    Match: .mobile-frame (375px, 40px border-radius), notch, dark project card,
    .mobile-tab underline style, timeline with colored dots

14. src/components/worker/WorkerDashboard.tsx
    Match: .mobile-frame, worker avatar (click to change), month calendar with 
    site color dots, task cards with progress, .wkCheckin button

15. src/components/pricing/PricingPage.tsx
    Match: 3 cards (free/pro/elite), .pricing-card-pro gold glow,
    .pricing-popular-tag "🔥 最多人选择", usage bar in free card,
    feature lists (.feat-yes/.feat-gold/.feat-no), compare table, FAQ accordion

=== PHASE 4: Wire Pages ===

/designer → Sidebar + all panels (upload, schedule, review, export, workers, project, dashboard)
/owner → OwnerDashboard with mobile frame
/worker → WorkerDashboard with mobile frame  
/designer/pricing → PricingPage (no auth gate)

=== PHASE 5: Test & Fix ===

npm run build
Fix ALL TypeScript errors.
npm run dev
Open http://localhost:3001 and verify every component matches reference HTML.

Run: /qa-test to check all 120 acceptance criteria.
