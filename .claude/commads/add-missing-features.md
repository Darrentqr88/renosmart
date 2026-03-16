---
description: Implement all missing features from CLAUDE.md v2
---

Read the updated CLAUDE.md. Then implement these 16 missing features in order:

1. **Price Intelligence Database** (/designer/price-database)
   - Auto-learns from each quotation analysis
   - Min 10 samples rule before showing in database
   - Regional breakdown: MY_KL / MY_JB / MY_PG / SG
   - Supply type: supply_install vs labour_only

2. **Cost Database** (/designer/cost-database)  
   - Shows aggregated worker receipt costs
   - Project profit = Quotation Total - Cost Records

3. **Worker Receipt OCR** (/worker/receipts + /api/ocr)
   - Upload photo/PDF of receipt
   - Claude Vision extracts: supplier, items, amounts
   - Links to project cost_records

4. **Dependency-Driven Gantt**
   - Replace timeline with CONSTRUCTION_PHASES dependency engine
   - Project type multipliers (residential/commercial/condo)
   - Area-based duration (sqft ÷ daily_rate)
   - Skip MY/SG public holidays + weekends

5. **Gantt auto-recalculate**
   - Triggers: new quotation, quotation deleted, VO added

6. **3-Layer PDF Parsing**
   - Detect format: table/section/chinese/mixed
   - Column detection by X coordinates
   - Supply type per item detection

7. **Project Profit Tab** (7th tab)
   - Revenue / Cost / Gross Profit / Margin %

8. **Designer Calendar** (in dashboard)
   - Manual event entry (click date)
   - Shows project milestones

9. **Project Type Detection** in AI prompt
   - residential / commercial / condo / landed / mall

10. **Multi-version Quotation comparison** (Pro feature)

11. **Print Photos as PDF** (designer only)

12. **VO document upload with OCR**

After each feature: run `npm run build` to catch errors immediately.
