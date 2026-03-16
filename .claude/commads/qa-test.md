---
description: Run full QA test of all 120 acceptance criteria
---

Test every item in this checklist. For each item, actually check the code/files:

**System (1-10):**
- [ ] package.json exists, no broken dependencies
- [ ] `npm run build` passes with 0 errors
- [ ] No `console.error` calls with unhandled errors in production code
- [ ] All env vars referenced in code exist in .env.local

**Auth (11-20):**
- [ ] /login page exists with Google OAuth button
- [ ] /register page has 4-step flow
- [ ] Role selection: designer / owner / worker
- [ ] Supabase auth.signInWithOAuth configured for Google
- [ ] Middleware protects /designer, /owner, /worker routes
- [ ] Profile auto-created on signup (trigger exists in SQL)

**Quotation Upload (41-60):**
- [ ] PDF upload accepts .pdf files
- [ ] Excel upload accepts .xlsx .xls
- [ ] PDF extraction uses 20,000 char limit (NOT 4,000)
- [ ] pdfjs-dist loaded from unpkg.com (NOT cdnjs)
- [ ] New upload clears ALL previous state
- [ ] AI prompt copies item names VERBATIM
- [ ] Supply type detected per item
- [ ] Project type detected in AI response

**Gantt (71-80):**
- [ ] Auto-generates after quotation analysis
- [ ] Uses dependency-driven scheduling
- [ ] Skips weekends
- [ ] Skips MY public holidays
- [ ] Task duration based on area/quantity
- [ ] Drag-resize works
- [ ] Critical path shown

**Price DB:**
- [ ] /designer/price-database page exists
- [ ] Auto-updates after analysis (if ≥10 samples)
- [ ] Regional data separated

**Cost DB:**
- [ ] /designer/cost-database page exists  
- [ ] Profit calculation shown

**Worker OCR:**
- [ ] /worker/receipts page exists
- [ ] /api/ocr route exists
- [ ] Uses Claude Vision

**Pricing:**
- [ ] /designer/pricing always accessible (no auth gate)
- [ ] Billplz modal opens in demo mode

Report results as: ✅ PASS / ❌ FAIL / ⚠️ PARTIAL for each item.
Fix all failures before considering complete.
