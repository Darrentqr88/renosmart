# renosmart
Ai driven smart renovation schedule 

index.html(https://github.com/user-attachments/files/25894727/renovation-platform-demo.3.html)
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RenoSmart — 智能装修管理平台 MY/SG</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
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
}

* { margin:0; padding:0; box-sizing:border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', 'Corbel', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── PORTAL SWITCHER ────────────────── */
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
  font-family: 'Cormorant Garamond', 'Corbel', serif;
  font-size: 20px;
  color: var(--gold);
  margin-right: 20px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.brand span { color: var(--text3); font-size: 11px; font-family: 'DM Sans', sans-serif; display:block; margin-top:-4px; letter-spacing:2px; font-weight:500; }

.portal-btn {
  padding: 7px 18px; border-radius: 6px; border: 1px solid var(--border2);
  cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif;
  transition: all 0.2s; color: var(--text2); background: transparent;
  display: flex; align-items: center; gap: 7px;
}

.portal-btn.active {
  background: var(--gold); color: var(--slate, #1B2336); border-color: var(--gold);
  box-shadow: 0 3px 10px rgba(240,185,11,.3);
}

.portal-btn:not(.active):hover {
  border-color: var(--gold); color: var(--gold);
}

.portal-dot { width:7px; height:7px; border-radius:50%; background: currentColor; }

.region-toggle {
  margin-left: auto;
  display: flex;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.region-btn {
  font-size: 11px; font-weight: 600; letter-spacing: .5px;
  color: var(--text3);
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all .18s;
  white-space: nowrap;
}
.region-btn:hover { color: var(--text); background: var(--surface3); }
.lang-toggle {
  display: flex;
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}
.lang-btn {
  font-size: 11px; font-weight: 700; letter-spacing: .3px;
  color: var(--text3);
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 9px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all .18s;
  white-space: nowrap;
}
.lang-btn:hover { color: var(--text); background: var(--surface3); }
.lang-btn.active { background: rgba(46,107,230,0.12); color: var(--blue); }

/* ── PORTALS ────────────────────────── */
.portal { display:none; padding-top: 60px; min-height: 100vh; }
.portal.active { display:block; }

/* ── DESIGNER PORTAL ─────────────────── */
.designer-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: 1fr;
  height: calc(100vh - 60px);
}

.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border2);
  padding: 24px 0;
  overflow-y: auto;
}

.sidebar-section { padding: 0 16px; margin-bottom: 8px; }
.sidebar-label { font-size: 10px; letter-spacing:2px; color: var(--text3); font-weight:600; padding: 12px 12px 6px; text-transform:uppercase; }

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

/* ── PANELS ───────────────────────── */
.panel { display:none; padding: 28px 32px; }
.panel.active { display:block; }

.panel-title {
  font-family: 'Cormorant Garamond', 'Corbel', serif;
  font-size: 26px; color: var(--text);
  margin-bottom: 4px;
}

.panel-sub { font-size: 13px; color: var(--text2); margin-bottom: 28px; }

/* ── UPLOAD ZONE ───────────────────── */
.upload-zone {
  border: 2px dashed var(--border);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--surface);
  margin-bottom: 24px;
}

.upload-zone:hover { border-color: var(--gold); background: rgba(240,185,11,0.04); }
.upload-icon { font-size: 40px; margin-bottom: 12px; }
.upload-text { font-size: 15px; color: var(--text2); }
.upload-text strong { color: var(--gold); }
.upload-formats { font-size: 12px; color: var(--text3); margin-top: 6px; }

/* ── AI REVIEW ──────────────────────── */
.ai-review-card {
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border2);
  overflow: hidden;
  margin-bottom: 16px;
}

.ai-header {
  background: linear-gradient(135deg, rgba(240,185,11,0.08), rgba(0,201,167,0.05));
  padding: 16px 20px;
  border-bottom: 1px solid var(--border2);
  display: flex; align-items: center; gap: 12px;
}

.ai-badge {
  background: var(--gold);
  color: #1B2336;
  font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
  padding: 3px 8px; border-radius: 4px;
}

.ai-title { font-size: 15px; font-weight: 600; }
.ai-body { padding: 20px; }

.score-row { display:flex; align-items: center; gap: 16px; margin-bottom: 20px; }

.score-circle {
  width: 80px; height: 80px; border-radius: 50%;
  border: 3px solid var(--gold);
  display: flex; flex-direction:column;
  align-items:center; justify-content:center;
  background: rgba(240,185,11,0.08);
  flex-shrink: 0;
}

.score-num { font-size: 24px; font-weight: 700; color: var(--gold); line-height:1; }
.score-label { font-size: 9px; color: var(--text3); letter-spacing:1px; }

.score-breakdown { flex:1; }
.score-item { display:flex; align-items:center; gap: 10px; margin-bottom: 8px; }
.score-item-label { font-size: 12px; color: var(--text2); width: 100px; }
.score-bar-bg { flex:1; height:6px; background: var(--surface3); border-radius:3px; border:1px solid var(--border2); }
.score-bar { height:6px; border-radius:3px; transition: width 1s ease; }
.score-item-val { font-size: 12px; color: var(--text); width: 30px; text-align:right; font-weight:600; }

/* ── ALERTS ────────────────────────── */
.alert { display:flex; gap:12px; padding: 12px 16px; border-radius:8px; margin-bottom: 10px; align-items:flex-start; }
.alert-critical { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); }
.alert-warning { background: rgba(251,146,60,0.1); border: 1px solid rgba(251,146,60,0.25); }
.alert-info { background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.25); }
.alert-ok { background: rgba(22,163,74,0.1); border: 1px solid rgba(74,222,128,0.25); }

.alert-icon { font-size: 16px; margin-top: 1px; flex-shrink:0; }
.alert-content { flex:1; }
.alert-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.alert-critical .alert-title { color: var(--red); }
.alert-warning .alert-title { color: var(--orange); }
.alert-info .alert-title { color: var(--blue); }
.alert-ok .alert-title { color: var(--green); }
.alert-desc { font-size: 12px; color: var(--text2); line-height: 1.5; }

/* ── QUOTATION PAGE TABS ─────────────── */
.q-page-tab {
  padding: 5px 14px; border-radius: 20px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--border2); background: var(--surface2);
  color: var(--text2); cursor: pointer; transition: all .15s; white-space: nowrap;
}
.q-page-tab:hover { border-color: var(--gold); color: var(--gold); }
.q-page-tab.active { background: rgba(240,185,11,.15); border-color: var(--gold); color: var(--gold); }
.q-page-tab .tab-count { opacity:.6; margin-left:4px; font-weight:400; }
.q-table { width:100%; border-collapse: collapse; font-size: 13px; }
.q-table th { padding: 10px 12px; text-align:left; font-size:11px; letter-spacing:1.5px; color: var(--text3); font-weight:600; text-transform:uppercase; border-bottom: 1px solid var(--border2); }
.q-table td { padding: 11px 12px; border-bottom: 1px solid var(--surface3); color: var(--text2); }
.q-table tr:hover td { background: var(--surface2); }
.q-table .flag { color: var(--red); }
.q-table .ok { color: var(--green); }
.q-table .warn { color: var(--orange); }
.price-flag { background: rgba(248,113,113,0.15); color: var(--red); padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight:600; }

/* ── GANTT ──────────────────────────── */
.gantt-wrap { overflow-x: auto; min-width: 0; }
.gantt-outer { min-width: 700px; }

/* Calendar header */
.gantt-cal-header { display:flex; margin-left: 160px; margin-bottom: 0; }
.gantt-col-week {
  flex:1; min-width:0;
  border-left: 1px solid var(--border2);
  padding: 4px 3px 3px;
  text-align:center;
}
.gantt-col-week.weekend-col { background: rgba(255,255,255,0.025); }
.gantt-col-week.holiday-col { background: rgba(251,146,60,0.07); }
.gantt-week-date { font-size:9px; color:var(--text3); font-weight:600; letter-spacing:.3px; }
.gantt-week-label { font-size:10px; color:var(--text2); font-weight:700; margin-top:1px; }
.gantt-week-workdays { font-size:9px; margin-top:2px; }
.gantt-holiday-badge {
  display:inline-block; font-size:8px; background:rgba(251,146,60,.2);
  color:var(--orange); border-radius:3px; padding:1px 4px; margin-top:2px; line-height:1.4;
}

/* Gantt rows */
.gantt-row { display:flex; align-items:center; margin-bottom:5px; }
.gantt-label {
  width:160px; font-size:11px; color:var(--text2);
  padding-right:10px; flex-shrink:0; line-height:1.3; cursor:pointer;
}
.gantt-label:hover { color:var(--text); }
.gantt-track { flex:1; height:26px; position:relative; min-width:0; }

/* Weekend/holiday stripes on track */
.gantt-stripe {
  position:absolute; top:0; bottom:0; pointer-events:none;
}
.gantt-stripe.stripe-weekend { background: rgba(255,255,255,0.025); }
.gantt-stripe.stripe-holiday { background: rgba(251,146,60,0.07); border-left:1px solid rgba(251,146,60,0.2); }

.gantt-bar {
  position:absolute; height:100%; border-radius:4px;
  display:flex; align-items:center; padding:0 8px;
  font-size:10px; font-weight:600; color:#0d0f14;
  transition: filter .2s; cursor:pointer; overflow:hidden; white-space:nowrap;
}
.gantt-bar:hover { filter:brightness(1.2); }
.gantt-bar-label { overflow:hidden; text-overflow:ellipsis; }

/* Override indicator on bar */
.gantt-bar.has-override { box-shadow: inset 0 0 0 1.5px rgba(96,165,250,0.6); }

.gantt-today-line {
  position:absolute; top:-4px; bottom:-4px; width:2px;
  background:var(--gold); z-index:3; pointer-events:none;
}
.gantt-today-line::after {
  content:'今天'; position:absolute; top:-14px; left:50%;
  transform:translateX(-50%); font-size:9px; color:var(--gold);
  white-space:nowrap; font-weight:700;
}

/* Schedule controls */
.sched-controls {
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
  margin-bottom:16px; padding:12px 16px;
  background:var(--surface); border:1px solid var(--border2); border-radius:10px;
  box-shadow: 0 1px 4px rgba(27,35,54,.05);
}
.sched-ctrl-label { font-size:11px; color:var(--text3); font-weight:600; letter-spacing:.5px; }
.sched-date-input {
  background:var(--surface); border:1px solid var(--border2); border-radius:6px;
  padding:6px 10px; color:var(--text); font-size:12px; font-family:'DM Sans',sans-serif;
  cursor:pointer;
}
.sched-date-input:focus { outline:none; border-color:var(--gold); }

/* Holiday legend */
.holiday-legend {
  display:flex; flex-wrap:wrap; gap:6px; margin-top:12px;
}
.holiday-chip {
  font-size:10px; padding:3px 8px; border-radius:10px;
  background:rgba(251,146,60,.1); color:var(--orange);
  border:1px solid rgba(251,146,60,.25); line-height:1.4;
}
.holiday-chip.skipped { background:rgba(96,165,250,.08); color:var(--blue); border-color:rgba(96,165,250,.2); }
.holiday-chip.override { background:rgba(22,163,74,.08); color:var(--green); border-color:rgba(74,222,128,.2); }

/* Override modal */
.override-task-name { font-size:14px; font-weight:700; margin-bottom:14px; }
.override-day-list { display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto; }
.override-day-row {
  display:flex; align-items:center; gap:10px; padding:8px 12px;
  border-radius:8px; background:var(--surface2); border:1px solid var(--border2);
}
.override-day-row.is-weekend { border-left:3px solid var(--border2); }
.override-day-row.is-holiday { border-left:3px solid rgba(251,146,60,.5); }
.override-toggle {
  margin-left:auto; width:36px; height:20px; border-radius:10px;
  border:none; cursor:pointer; position:relative; transition:background .2s;
  background:var(--border2);
}
.override-toggle.on { background:var(--green); }
.override-toggle::after {
  content:''; position:absolute; top:3px; left:3px;
  width:14px; height:14px; border-radius:50%; background:#fff; transition:left .2s;
}
.override-toggle.on::after { left:19px; }

/* ── PROGRESS ───────────────────────── */
.progress-ring { position:relative; display:inline-block; }
.progress-center { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }

/* ── STATS ROW ──────────────────────── */
.stats-row { display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 18px 20px;
}
.stat-val { font-size: 28px; font-weight:700; line-height:1; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: var(--text2); }
.stat-change { font-size: 11px; margin-top: 6px; }
.stat-up { color: var(--green); }
.stat-down { color: var(--red); }

/* ── OWNER APP ──────────────────────── */
.mobile-frame {
  width: 375px; background: var(--surface); border-radius: 40px;
  border: 1.5px solid var(--border2);
  overflow: hidden; margin: 0 auto;
  box-shadow: 0 12px 40px rgba(27,35,54,0.10);
  position: relative;
}

.mobile-notch {
  background: #1B2336; height: 44px;
  display:flex; align-items:flex-end; justify-content:center; padding-bottom: 8px;
}

.mobile-notch-pill { width:120px; height:5px; background: rgba(255,255,255,.25); border-radius:3px; }

.mobile-header {
  padding: 16px 20px 12px;
  background: var(--surface);
}

.mobile-greeting { font-size: 12px; color: var(--text2); margin-bottom: 2px; }
.mobile-name { font-family: 'Cormorant Garamond', 'Corbel', serif; font-size: 22px; color: var(--text); }

.mobile-project-card {
  margin: 0 16px 16px;
  background: linear-gradient(135deg, #1B2336, #2A3350);
  border-radius: 16px; padding: 20px;
  border: 1px solid rgba(240,185,11,.2);
}
.mobile-project-card .project-name  { color: var(--gold) !important; }
.mobile-project-card .project-addr  { color: rgba(255,255,255,.9) !important; }
.mobile-project-card .big-pct       { color: var(--gold) !important; }
.mobile-project-card .big-pct-label { color: rgba(255,255,255,.65) !important; }
.mobile-project-card .progress-bar-full { background: rgba(255,255,255,.15) !important; }

.project-name { font-size: 12px; color: var(--gold); font-weight:600; letter-spacing:1px; text-transform:uppercase; margin-bottom: 6px; }
.project-addr { font-size: 14px; color: var(--text); font-weight:500; margin-bottom: 16px; }

.big-progress { text-align: center; margin-bottom: 12px; }
.big-pct { font-size: 42px; font-weight: 700; color: var(--gold); line-height:1; }
.big-pct-label { font-size: 11px; color: var(--text2); letter-spacing: 1px; }

.progress-bar-full { height: 6px; background: var(--surface3); border-radius:3px; overflow:hidden; }
.progress-bar-fill { height:100%; background: linear-gradient(90deg, var(--gold), var(--gold2));  border-radius:3px; transition: width 1.2s ease; }

.mobile-tabs {
  display:flex; border-bottom: 1.5px solid var(--border2);
  padding: 0 16px;
  background: var(--surface);
}

.mobile-tab {
  flex:1; text-align:center; padding: 12px 4px; font-size: 12px; font-weight: 500;
  color: var(--text2); cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.mobile-tab.active { color: var(--gold); border-bottom-color: var(--gold); }

.mobile-scroll { padding: 16px; overflow-y: auto; max-height: 380px; }
.mobile-scroll::-webkit-scrollbar { display:none; }

/* Timeline */
.timeline-item { display:flex; gap: 12px; margin-bottom: 16px; }
.timeline-dot-wrap { display:flex; flex-direction:column; align-items:center; gap:0; }
.tl-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.tl-line { width:2px; flex:1; background: var(--border2); margin: 4px 0; }
.tl-done { background: var(--green); }
.tl-active { background: var(--gold); box-shadow: 0 0 0 3px rgba(240,185,11,0.2); }
.tl-pending { background: var(--surface3); border: 2px solid var(--border2); }

.tl-content { flex:1; }
.tl-title { font-size: 13px; font-weight: 600; margin-bottom: 2px; color: var(--text); }
.tl-date { font-size: 11px; color: var(--text3); }
.tl-status { font-size: 10px; font-weight:600; padding: 2px 7px; border-radius:3px; display:inline-block; margin-top:4px; }
.tl-s-done { background: rgba(22,163,74,0.1); color: var(--green); }
.tl-s-active { background: rgba(240,185,11,0.1); color: var(--gold); }
.tl-s-pending { background: var(--surface2); color: var(--text3); border: 1px solid var(--border2); }

/* ── WORKER APP ──────────────────────── */
.worker-header {
  padding: 16px 20px;
  background: var(--surface);
  border-bottom: 1px solid var(--border2);
}

.worker-day { font-size: 11px; color: var(--text3); letter-spacing: 1px; margin-bottom: 3px; font-weight: 600; text-transform: uppercase; }
.worker-title { font-size: 20px; font-weight: 700; color: var(--text); }
.worker-sub { font-size: 12px; color: var(--text2); margin-top: 2px; }

.task-card {
  background: var(--surface2);
  border-radius: 12px; margin-bottom: 10px;
  border: 1px solid var(--border2);
  overflow: hidden;
}

.task-priority-strip { height: 3px; }
.task-p-high { background: var(--red); }
.task-p-mid { background: var(--orange); }
.task-p-low { background: var(--teal); }

.task-body { padding: 14px; }
.task-top { display:flex; align-items:flex-start; justify-content:space-between; gap: 8px; margin-bottom: 8px; }
.task-name { font-size: 14px; font-weight: 600; color: var(--text); }
.task-room { font-size: 11px; color: var(--text3); margin-top: 2px; }
.task-check {
  width: 28px; height:28px; border-radius:50%; border: 2px solid var(--border);
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition: all 0.2s; flex-shrink:0; font-size: 14px;
}
.task-check.done { background: var(--teal); border-color: var(--teal); color: white; }

.task-meta { display:flex; gap: 10px; flex-wrap:wrap; }
.task-chip { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius:4px; }
.chip-time { background: rgba(240,185,11,0.1); color: var(--gold); }
.chip-area { background: rgba(96,165,250,0.1); color: var(--blue); }

.worker-photo-btn {
  width: 100%; margin-top: 8px; padding: 8px;
  background: rgba(45,212,191,0.08); border: 1px dashed rgba(45,212,191,0.3);
  border-radius: 8px; color: var(--teal); font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  display: flex; align-items: center; justify-content:center; gap: 6px;
}
.worker-photo-btn:hover { background: rgba(45,212,191,0.15); }

/* ── CHECKIN BTN ─────────────────────── */
.checkin-strip {
  padding: 12px 16px;
  background: var(--surface);
  border-top: 1.5px solid var(--border2);
  display:flex; gap: 10px;
  box-shadow: 0 -2px 8px rgba(27,35,54,.04);
}

.btn-checkin {
  flex:1; padding: 12px; border-radius: 10px; border: none;
  font-family: 'DM Sans'; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; letter-spacing: 0.5px;
}

.btn-in { background: var(--teal); color: #FFFFFF; font-weight: 700; }
.btn-issue { background: var(--surface3); color: var(--orange); border: 1px solid rgba(251,146,60,0.3); }

/* ── PORTAL LAYOUT (OWNER/WORKER) ─────── */
.app-portal {
  display: flex; align-items: flex-start; justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 40px 24px;
  gap: 60px;
}

.app-info { max-width: 340px; padding-top: 40px; }
.app-info-title { font-family: 'Cormorant Garamond', 'Corbel', serif; font-size: 32px; color: var(--text); line-height:1.2; margin-bottom: 16px; }
.app-info-desc { font-size: 14px; color: var(--text2); line-height: 1.7; margin-bottom: 24px; }

.feature-list { list-style: none; }
.feature-list li { display:flex; gap: 10px; margin-bottom: 10px; font-size: 13px; color: var(--text2); align-items: flex-start; }
.feature-list li::before { content: '✦'; color: var(--gold); font-size: 10px; margin-top: 3px; flex-shrink:0; }

/* ── BUTTONS ──────────────────────────── */
.btn {
  padding: 10px 20px; border-radius: 8px; border: none;
  font-family: 'DM Sans'; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-gold { background: var(--gold); color: #1B2336; }
.btn-gold:hover { background: var(--gold2); transform: translateY(-1px); }
.btn-ghost { background: transparent; border: 1.5px solid var(--border2); color: var(--text2); }
.btn-ghost:hover { border-color: var(--gold); color: var(--gold-dk, #C89B09); }

/* ── GRIDS ───────────────────────────── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }

.info-card {
  background: var(--surface); border-radius: 10px;
  padding: 20px; border: 1px solid var(--border2);
}
.info-card-title { font-size: 11px; letter-spacing: 1.5px; color: var(--text3); font-weight:600; text-transform:uppercase; margin-bottom: 12px; }

/* ── TOAST ──────────────────────────── */
.toast {
  position: fixed; bottom: 24px; right: 24px; z-index:999;
  background: #1B2336; border: 1px solid rgba(240,185,11,.25);
  border-radius: 10px; padding: 14px 18px;
  display:flex; align-items:center; gap: 10px;
  box-shadow: 0 12px 40px rgba(27,35,54,.2);
  transform: translateY(80px); opacity:0;
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
  max-width: 320px;
}
.toast.show { transform: translateY(0); opacity:1; }
.toast-icon { font-size: 20px; }
.toast-text { font-size: 13px; color: #E8EAED; }

/* ── AI LOADING ──────────────────────── */
.ai-loading {
  display: flex; align-items: center; gap: 12px;
  padding: 20px; color: var(--text2); font-size: 13px;
}

.ai-spinner { display:flex; gap: 4px; }
.ai-dot {
  width: 6px; height: 6px; background: var(--gold); border-radius:50%;
  animation: bounce 0.8s ease-in-out infinite;
}
.ai-dot:nth-child(2) { animation-delay: 0.15s; }
.ai-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-6px); opacity: 1; }
}

/* ── MISC ─────────────────────────────── */
.divider { height: 1px; background: var(--border2); margin: 20px 0; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text2); letter-spacing: 0.5px; margin-bottom: 12px; display:flex; align-items:center; gap: 8px; }
.section-title::after { content:''; flex:1; height:1px; background: var(--surface3); }

code {
  font-family: 'DM Mono', monospace; font-size: 12px;
  background: var(--surface2); padding: 2px 6px; border-radius: 4px;
  color: var(--teal);
}

/* AI Chat box */
.ai-chat-box {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
}

.ai-chat-input-row { display:flex; gap:10px; margin-top: 16px; }
.ai-chat-input {
  flex:1; background: var(--surface); border: 1.5px solid var(--border2);
  border-radius: 8px; padding: 10px 14px; color: var(--text);
  font-family: 'DM Sans'; font-size: 13px; outline:none;
  transition: border-color 0.2s;
}
.ai-chat-input:focus { border-color: var(--gold); }
.ai-chat-input::placeholder { color: var(--text3); }

.chat-msg {
  padding: 12px 14px; border-radius: 8px; margin-bottom: 10px;
  font-size: 13px; line-height: 1.6;
}
.chat-user { background: rgba(240,185,11,0.1); color: var(--text); text-align:right; margin-left: 20%; }
.chat-ai { background: var(--surface2); color: var(--text2); margin-right: 20%; }
.chat-ai strong { color: var(--gold); }

/* ── SCROLLBAR ──────────────────────── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--border); }

/* ── RESPONSIVE ──────────────────────── */
@media (max-width: 900px) {
  .designer-layout { grid-template-columns: 1fr; }
  .sidebar { display:none; }
  .stats-row { grid-template-columns: repeat(2,1fr); }
}

@media (max-width: 600px) {
  .app-portal { flex-direction: column; align-items:center; }
  .mobile-frame { width: 100%; max-width: 375px; }
}

/* Pulse animation for active indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.live-dot { width: 8px; height:8px; background: var(--green); border-radius:50%; animation: pulse 2s infinite; display:inline-block; margin-right: 6px; }

/* Fade in */
@keyframes fadeUp {
  from { opacity:0; transform: translateY(16px); }
  to { opacity:1; transform: translateY(0); }
}
.fade-up { animation: fadeUp 0.4s ease forwards; }

/* ── CLIENT FIELDS ──────────────────── */
.client-field-label {
  font-size:11px; letter-spacing:1px; color:var(--text3);
  font-weight:600; text-transform:uppercase; margin-bottom:6px;
}
.client-field-input {
  width:100%; background:var(--surface); border:1.5px solid var(--border2);
  border-radius:8px; padding:9px 12px; color:var(--text);
  font-family:'DM Sans',sans-serif; font-size:13px; outline:none;
  transition:border-color .2s; resize:vertical;
}
.client-field-input:focus { border-color:var(--gold); }
.client-field-input::placeholder { color:var(--text3); }

/* ── PROJECT PANEL TABS ─────────────── */
.proj-tabs { display:flex; gap:2px; margin-bottom:24px; background:var(--surface); padding:4px; border-radius:10px; width:fit-content; }
.proj-tab { padding:7px 20px; border-radius:7px; font-size:13px; font-weight:500; cursor:pointer; color:var(--text2); transition:all .15s; border:none; background:transparent; font-family:'DM Sans',sans-serif; }
.proj-tab:hover { color:var(--text); }
.proj-tab.on { background:var(--surface3); color:var(--text); font-weight:600; }

/* ── PAYMENT SCHEDULE ───────────────── */
.payment-summary {
  display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:24px;
}
.pay-sum-card { background:var(--surface); border:1px solid var(--border2); border-radius:10px; padding:16px 18px; }
.pay-sum-val { font-size:22px; font-weight:700; line-height:1; margin-bottom:4px; }
.pay-sum-label { font-size:11px; color:var(--text2); }

.payment-list { margin-bottom:16px; }
.pay-row {
  display:grid; grid-template-columns:28px 1fr 130px 110px 90px 36px;
  align-items:center; gap:10px;
  padding:12px 14px; border-radius:9px; margin-bottom:6px;
  background:var(--surface); border:1px solid var(--border2);
  transition:border-color .15s;
}
.pay-row:hover { border-color:var(--border); box-shadow:0 2px 8px rgba(27,35,54,.06); }
.pay-row.vo-row { border-left:3px solid var(--blue); background:rgba(96,165,250,0.04); }
.pay-row.paid   { border-left:3px solid var(--green); }
.pay-row.pending { border-left:3px solid var(--gold); }

.pay-num { font-size:11px; font-weight:700; color:var(--text3); text-align:center; }
.pay-name-wrap { }
.pay-name { font-size:13px; font-weight:600; color:var(--text); }
.pay-trigger { font-size:11px; color:var(--text2); margin-top:2px; }
.pay-pct { font-size:12px; color:var(--text2); font-family:'DM Mono',monospace; }

.pay-amount { font-family:'DM Mono',monospace; font-size:13px; font-weight:600; color:var(--text); }
.pay-amount input {
  width:100%; background:var(--surface); border:1.5px solid var(--border2);
  border-radius:6px; padding:5px 8px; color:var(--text);
  font-family:'DM Mono',monospace; font-size:13px; outline:none;
  transition:border-color .2s;
}
.pay-amount input:focus { border-color:var(--gold); }

.pay-status { }
.pay-badge { font-size:10px; font-weight:600; padding:3px 9px; border-radius:10px; white-space:nowrap; cursor:pointer; border:none; font-family:'DM Sans',sans-serif; }
.badge-paid    { background:rgba(22,163,74,.1);  color:var(--green); }
.badge-pending { background:rgba(240,185,11,.1);  color:var(--gold);  }
.badge-future  { background:var(--surface2); color:var(--text3); border:1px solid var(--border2); }
.badge-vo      { background:rgba(96,165,250,.1);   color:var(--blue);  }

.pay-del { width:28px; height:28px; border-radius:6px; background:transparent; border:none; color:var(--text3); cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.pay-del:hover { background:rgba(248,113,113,.12); color:var(--red); }

.add-pay-row {
  width:100%; padding:10px; border:1.5px dashed var(--border2);
  border-radius:9px; background:transparent; cursor:pointer;
  color:var(--text3); font-size:12px; font-weight:600;
  font-family:'DM Sans',sans-serif; transition:all .2s;
  display:flex; align-items:center; justify-content:center; gap:8px;
  margin-bottom:6px;
}
.add-pay-row:hover { border-color:var(--gold); color:var(--gold); }

/* ── VO SECTION ─────────────────────── */
.vo-header {
  display:flex; align-items:center; justify-content:space-between;
  margin:20px 0 10px; padding-top:16px; border-top:1px solid var(--border2);
}
.vo-title { font-size:11px; letter-spacing:1.5px; color:var(--text3); font-weight:600; text-transform:uppercase; }

/* ── PHOTO GRID ─────────────────────── */
.photo-filter { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:16px; }
.photo-filter-btn {
  padding:5px 14px; border-radius:20px; font-size:12px; font-weight:500;
  cursor:pointer; border:1px solid var(--border2); background:transparent;
  color:var(--text2); transition:all .15s; font-family:'DM Sans',sans-serif;
}
.photo-filter-btn:hover { border-color:var(--gold); color:var(--gold); }
.photo-filter-btn.on { background:var(--gold); color:#0d0f14; border-color:var(--gold); font-weight:600; }

.photo-section-label {
  font-size:11px; letter-spacing:1.5px; color:var(--text3);
  font-weight:600; text-transform:uppercase; margin:16px 0 8px;
}

.photo-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:10px; margin-bottom:16px; }

.photo-card {
  border-radius:10px; overflow:hidden; background:var(--surface);
  border:1px solid var(--border2); cursor:pointer; transition:all .2s;
  position:relative;
}
.photo-card:hover { border-color:var(--border); transform:translateY(-2px); box-shadow:0 4px 12px rgba(27,35,54,.08); }
.photo-card.pending-review { border-color:rgba(251,146,60,.4); }
.photo-card.approved { border-color:rgba(74,222,128,.3); }

.photo-thumb {
  width:100%; aspect-ratio:4/3; background:var(--surface2);
  display:flex; align-items:center; justify-content:center;
  font-size:28px; position:relative; overflow:hidden;
}
.photo-thumb-img { width:100%; height:100%; object-fit:cover; }

.photo-review-overlay {
  position:absolute; inset:0; background:rgba(0,0,0,.65);
  display:flex; align-items:center; justify-content:center; gap:8px;
  opacity:0; transition:opacity .2s;
}
.photo-card.pending-review .photo-review-overlay { opacity:1; }
.photo-card.approved:hover .photo-review-overlay { opacity:1; }

.photo-approve-btn, .photo-reject-btn {
  width:32px; height:32px; border-radius:50%; border:none; cursor:pointer;
  font-size:14px; display:flex; align-items:center; justify-content:center;
  font-family:'DM Sans',sans-serif; transition:all .15s;
}
.photo-approve-btn { background:var(--green); color:#0d0f14; }
.photo-reject-btn  { background:var(--red);   color:#fff; }
.photo-approve-btn:hover { transform:scale(1.1); }
.photo-reject-btn:hover  { transform:scale(1.1); }

.photo-meta { padding:8px 10px; }
.photo-worker { font-size:11px; font-weight:600; color:var(--text); }
.photo-info { font-size:10px; color:var(--text3); margin-top:2px; display:flex; gap:6px; flex-wrap:wrap; }

.photo-status-tag {
  position:absolute; top:6px; left:6px;
  font-size:9px; font-weight:700; padding:2px 7px; border-radius:3px;
  letter-spacing:.5px;
}
.pst-pending  { background:rgba(249,115,22,.9); color:#fff; }
.pst-approved { background:rgba(22,163,74,.9); color:#fff; }

.upload-photo-zone {
  border:2px dashed var(--border); border-radius:10px; padding:24px;
  text-align:center; cursor:pointer; transition:all .2s;
  background:var(--surface); margin-bottom:16px;
  font-size:13px; color:var(--text2);
}
.upload-photo-zone:hover { border-color:var(--gold); background:rgba(240,185,11,.04); }

.roster-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; margin-bottom: 24px; }

.worker-roster-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 12px; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
  transition: border-color 0.2s;
  position: relative;
}
.worker-roster-card:hover { border-color: rgba(240,185,11,0.3); }

.wrc-top { display: flex; align-items: center; gap: 12px; }
.wrc-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  object-fit: cover; flex-shrink: 0;
  border: 2px solid var(--border2);
  background: var(--surface3);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 700; color: var(--text2);
  overflow: hidden;
}
.wrc-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.wrc-name { font-size: 14px; font-weight: 600; color: var(--text); }
.wrc-trade { font-size: 11px; color: var(--text2); margin-top: 2px; }
.wrc-phone { font-size: 11px; color: var(--text3); font-family: 'DM Mono', monospace; }

.wrc-stats { display: flex; gap: 12px; }
.wrc-stat { flex: 1; background: var(--surface2); border-radius: 7px; padding: 8px 10px; text-align: center; }
.wrc-stat-val { font-size: 15px; font-weight: 700; line-height: 1; }
.wrc-stat-label { font-size: 10px; color: var(--text3); margin-top: 3px; letter-spacing: 0.5px; }

.wrc-status {
  position: absolute; top: 12px; right: 12px;
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: 10px;
}
.wrc-pending { background: rgba(251,146,60,0.12); color: var(--orange); border: 1px solid rgba(251,146,60,0.25); }
.wrc-active  { background: rgba(22,163,74,0.10); color: var(--green);  border: 1px solid rgba(74,222,128,0.20); }

.add-worker-btn {
  width: 100%; padding: 13px; border: 1.5px dashed var(--border);
  border-radius: 12px; background: transparent; cursor: pointer;
  color: var(--gold); font-size: 13px; font-weight: 600;
  font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-bottom: 24px;
}
.add-worker-btn:hover { background: rgba(240,185,11,0.06); border-color: var(--gold); }

/* ── MODAL OVERLAY ──────────────────── */
.modal-overlay {
  /* light theme modal */
  position: fixed; inset: 0; z-index: 500;
  background: rgba(5,7,12,0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  opacity: 0; pointer-events: none; transition: opacity 0.2s;
}
.modal-overlay.open { opacity: 1; pointer-events: all; }

.modal-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px; width: 100%; max-width: 420px;
  padding: 28px; position: relative;
  animation: fadeUp 0.25s ease;
}
.modal-title { font-family: 'DM Serif Display', serif; font-size: 22px; color: var(--text); margin-bottom: 4px; }
.modal-sub { font-size: 13px; color: var(--text2); margin-bottom: 24px; }
.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--surface3); border: none; cursor: pointer;
  color: var(--text2); font-size: 14px; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.modal-close:hover { background: var(--red); color: #fff; }

/* ── STEPS ──────────────────────────── */
.step-indicator { display: flex; align-items: center; gap: 0; margin-bottom: 24px; }
.step-dot {
  width: 28px; height: 28px; border-radius: 50%;
  border: 2px solid var(--border2); background: var(--surface2);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: var(--text3);
  flex-shrink: 0; transition: all 0.2s;
}
.step-dot.done  { background: var(--green);  border-color: var(--green);  color: #0d0f14; }
.step-dot.active{ background: var(--gold);   border-color: var(--gold);   color: #0d0f14; }
.step-line { flex: 1; height: 2px; background: var(--border2); transition: background 0.3s; }
.step-line.done { background: var(--green); }

/* ── FORM ELEMENTS ──────────────────── */
.form-group { margin-bottom: 16px; }
.form-label { font-size: 11px; font-weight: 600; color: var(--text2); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; }
.form-input {
  width: 100%; background: var(--surface2); border: 1px solid var(--border2);
  border-radius: 8px; padding: 11px 14px; color: var(--text);
  font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--gold); }
.form-input::placeholder { color: var(--text3); }

.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }

.phone-prefix {
  display: flex; align-items: center; background: var(--surface2);
  border: 1px solid var(--border2); border-radius: 8px; overflow: hidden;
}
.phone-prefix select {
  background: var(--surface3); border: none; border-right: 1px solid var(--border2);
  padding: 11px 10px; color: var(--text2); font-size: 13px;
  font-family: 'DM Sans', sans-serif; outline: none; cursor: pointer;
}
.phone-prefix input {
  flex: 1; background: transparent; border: none; padding: 11px 14px;
  color: var(--text); font-family: 'DM Sans', monospace; font-size: 14px; outline: none;
}
.phone-prefix input::placeholder { color: var(--text3); }

.otp-row { display: flex; gap: 8px; margin-bottom: 8px; }
.otp-box {
  flex: 1; background: var(--surface2); border: 1px solid var(--border2);
  border-radius: 8px; padding: 14px 8px; text-align: center;
  font-size: 20px; font-weight: 700; color: var(--text);
  font-family: 'DM Mono', monospace; outline: none;
  transition: border-color 0.2s;
}
.otp-box:focus { border-color: var(--gold); }

/* ── AVATAR UPLOAD ──────────────────── */
.avatar-upload-area {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  padding: 20px; background: var(--surface2); border-radius: 12px;
  border: 2px dashed var(--border); cursor: pointer; transition: all 0.2s;
  margin-bottom: 16px;
}
.avatar-upload-area:hover { border-color: var(--gold); background: rgba(240,185,11,0.04); }
.avatar-preview {
  width: 88px; height: 88px; border-radius: 50%;
  background: var(--surface3); border: 3px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; overflow: hidden; position: relative;
}
.avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
.avatar-upload-hint { font-size: 12px; color: var(--text2); text-align: center; line-height: 1.5; }
.avatar-upload-hint strong { color: var(--gold); }
.avatar-required { font-size: 11px; color: var(--red); font-weight: 600; }

/* ── WORKER PORTAL AVATAR ───────────── */
.worker-avatar-wrap {
  display: flex; align-items: center; gap: 12px;
}
.worker-app-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  border: 2px solid var(--gold); overflow: hidden;
  background: var(--gold-lt, #FFF8DC); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; cursor: pointer; position: relative;
}
.worker-app-avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-change-hint {
  position: absolute; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; opacity: 0; transition: opacity 0.2s; border-radius: 50%;
}
.worker-app-avatar:hover .avatar-change-hint { opacity: 1; }

/* ── INVITE RESULT ──────────────────── */
.invite-result { border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
.invite-found { background: rgba(22,163,74,0.08); border: 1px solid rgba(74,222,128,0.2); }
.invite-notfound { background: rgba(251,146,60,0.08); border: 1px solid rgba(251,146,60,0.2); }
.invite-result-top { display: flex; align-items: center; gap: 10px; }

/* ── TRADE SELECT ──────────────────── */
.trade-select-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
.trade-option {
  padding: 10px 8px; border-radius: 8px; border: 1px solid var(--border2);
  background: var(--surface2); cursor: pointer; text-align: center;
  font-size: 12px; font-weight: 500; color: var(--text2); transition: all 0.15s;
}
.trade-option:hover { border-color: var(--gold); color: var(--gold); }
.trade-option.selected { border-color: var(--gold); background: rgba(240,185,11,0.1); color: var(--gold); font-weight: 600; }
.trade-option-icon { font-size: 20px; display: block; margin-bottom: 4px; }

/* ── GANTT: DRAG, TASK DETAIL, DEADLINE, AI SCHED ─── */
.gantt-bar { user-select:none; }
.gantt-bar:hover { cursor:grab; filter:brightness(1.15); }
.gantt-bar.dragging { cursor:grabbing !important; opacity:.85; box-shadow:0 6px 24px rgba(0,0,0,.5); z-index:10; transition:none !important; }
.gantt-resize-handle { position:absolute; right:0; top:0; bottom:0; width:9px; cursor:ew-resize; opacity:0; transition:opacity .15s; background:rgba(255,255,255,.35); border-radius:0 4px 4px 0; }
.gantt-bar:hover .gantt-resize-handle { opacity:1; }
.gantt-parallel-badge { font-size:9px; background:rgba(96,165,250,.15); color:var(--blue); border:1px solid rgba(96,165,250,.2); border-radius:3px; padding:1px 4px; margin-left:3px; vertical-align:middle; }
/* Task Detail Drawer */
.task-detail-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:300; display:none; align-items:flex-end; justify-content:center; backdrop-filter:blur(3px); }
.task-detail-overlay.open { display:flex; }
.task-detail-panel { width:100%; max-width:720px; background:var(--surface); border-radius:20px 20px 0 0; border:1px solid var(--border2); border-bottom:none; padding:0; max-height:80vh; overflow-y:auto; animation:tdSlideUp .22s ease; }
@keyframes tdSlideUp { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
.tdp-header { display:flex; align-items:flex-start; gap:12px; padding:18px 22px 14px; border-bottom:1px solid var(--border2); position:sticky; top:0; background:var(--surface); z-index:2; }
.tdp-color-dot { width:12px; height:12px; border-radius:50%; flex-shrink:0; margin-top:4px; }
.tdp-name { flex:1; }
.tdp-title { font-size:16px; font-weight:700; color:var(--text); line-height:1.2; }
.tdp-subtitle { font-size:12px; color:var(--text2); margin-top:2px; }
.tdp-close { background:var(--surface2); border:none; color:var(--text2); width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.tdp-close:hover { background:var(--surface3); color:var(--text); }
.tdp-body { padding:14px 22px 26px; }
.tdp-chips { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:14px; }
.tdp-chip { background:var(--surface2); border:1px solid var(--border2); border-radius:20px; padding:4px 11px; font-size:11px; color:var(--text2); }
.tdp-chip.gold { border-color:rgba(240,185,11,.3); color:var(--gold); background:rgba(240,185,11,.07); }
.tdp-chip.blue { border-color:rgba(96,165,250,.3); color:var(--blue); background:rgba(96,165,250,.07); }
.tdp-chip.green { border-color:rgba(74,222,128,.3); color:var(--green); background:rgba(22,163,74,.07); }
.tdp-chip.red { border-color:rgba(248,113,113,.3); color:var(--red); background:rgba(248,113,113,.07); }
.tdp-section-title { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin:16px 0 8px; }
.tdp-edit-row { display:flex; align-items:center; gap:10px; padding:11px 14px; background:var(--surface2); border-radius:10px; margin-bottom:14px; }
.tdp-edit-row label { font-size:12px; color:var(--text2); flex:1; line-height:1.4; }
.tdp-edit-input { width:62px; background:var(--surface3); border:1px solid var(--border2); border-radius:6px; padding:5px 8px; color:var(--text); font-size:13px; font-family:'DM Mono',monospace; text-align:center; outline:none; }
.tdp-edit-input:focus { border-color:var(--gold); }
.tdp-subitem { display:flex; align-items:flex-start; gap:9px; padding:8px 0; border-bottom:1px solid var(--border2); }
.tdp-check { width:17px; height:17px; border-radius:4px; border:1.5px solid var(--border2); background:var(--surface2); flex-shrink:0; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:10px; transition:all .15s; margin-top:1px; }
.tdp-check.checked { background:var(--teal); border-color:var(--teal); color:#1B2336; }
.tdp-subitem-text { font-size:12px; color:var(--text2); line-height:1.5; }
.tdp-prep { display:flex; align-items:flex-start; gap:9px; padding:8px 12px; border-radius:8px; margin-bottom:6px; font-size:12px; color:var(--text2); line-height:1.5; }
.tdp-prep.warn  { background:rgba(248,113,113,.07); border:1px solid rgba(248,113,113,.15); }
.tdp-prep.order { background:rgba(96,165,250,.07);  border:1px solid rgba(96,165,250,.15); }
.tdp-prep.check { background:rgba(22,163,74,.07);  border:1px solid rgba(74,222,128,.15); }
.tdp-prep.info  { background:rgba(251,146,60,.07);  border:1px solid rgba(251,146,60,.15); }
.tdp-prep-icon  { flex-shrink:0; font-size:14px; margin-top:1px; }
.tdp-quot-item { padding:7px 11px; border-radius:8px; background:var(--surface2); border:1px solid var(--border2); margin-bottom:5px; font-size:12px; color:var(--text2); display:flex; align-items:center; justify-content:space-between; gap:8px; }
.tdp-quot-amt { font-family:'DM Mono',monospace; font-size:11px; color:var(--gold); white-space:nowrap; }
/* Deadline feasibility */
.deadline-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:20px; font-size:11px; font-weight:600; transition:all .2s; }
.deadline-ok   { background:rgba(22,163,74,.1);  color:var(--green);  border:1px solid rgba(74,222,128,.25); }
.deadline-warn { background:rgba(251,146,60,.1);  color:var(--orange); border:1px solid rgba(251,146,60,.25); }
.deadline-over { background:rgba(248,113,113,.1); color:var(--red);    border:1px solid rgba(248,113,113,.25); }
/* AI Schedule button */
.btn-ai-sched { display:flex; align-items:center; gap:6px; background:linear-gradient(135deg,rgba(96,165,250,.12),rgba(167,139,250,.12)); border:1px solid rgba(96,165,250,.3); color:var(--blue); padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap; }
.btn-ai-sched:hover { background:rgba(96,165,250,.2); border-color:var(--blue); }
.btn-ai-sched.loading { opacity:.6; pointer-events:none; }
.spin { display:inline-block; animation:spinAI .7s linear infinite; }
@keyframes spinAI { to { transform:rotate(360deg); } }

/* ── WORKER CALENDAR & TABS ─────────── */
.wk-tab {
  flex:1; padding:9px 4px; font-size:11px; font-weight:600;
  background:none; border:none; color:var(--text3); cursor:pointer;
  border-bottom:2px solid transparent; font-family:'DM Sans',sans-serif;
  transition:all .15s; white-space:nowrap;
}
.wk-tab.active { color:var(--teal); border-bottom-color:var(--teal); }
.wk-tab:hover:not(.active) { color:var(--text2); }
.wk-tab-content { }
.wk-cal-dow {
  text-align:center; font-size:9px; font-weight:700; letter-spacing:.5px;
  color:var(--text3); padding:3px 0; text-transform:uppercase;
}
.wk-cal-day {
  aspect-ratio:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; border-radius:6px; cursor:pointer;
  position:relative; transition:all .15s; font-size:12px; font-weight:500;
  color:var(--text2); gap:2px; padding:2px;
}
.wk-cal-day:hover { background:var(--surface2); color:var(--text); }
.wk-cal-day.today { background:rgba(0,201,167,.12); color:var(--teal); font-weight:700; }
.wk-cal-day.selected { background:var(--teal); color:#1B2336; font-weight:700; }
.wk-cal-day.selected .wk-dot-row { filter:brightness(0.3); }
.wk-cal-day.other-month { color:var(--text3); opacity:.4; }
.wk-cal-day.weekend { color:var(--text3); }
.wk-cal-day.has-work { color:var(--text); }
.wk-dot-row { display:flex; gap:2px; justify-content:center; min-height:5px; }
.wk-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }
/* Site progress card (reference image style) */
.wk-site-card {
  border-radius:12px; padding:11px 13px; margin-bottom:8px;
  cursor:pointer; transition:all .15s; position:relative; overflow:hidden;
  box-shadow: 0 1px 4px rgba(27,35,54,.06);
}
.wk-site-card:hover { filter:brightness(1.08); }
.wk-site-card-name { font-size:13px; font-weight:700; line-height:1.3; }
.wk-site-card-sub  { font-size:10px; opacity:.75; margin-top:1px; }
.wk-site-card-pct  { font-size:18px; font-weight:800; line-height:1; }
.wk-site-card-bar  { height:4px; border-radius:2px; margin-top:8px; background:var(--surface3); overflow:hidden; }
.wk-site-card-fill { height:100%; border-radius:2px; transition:width .5s; }
/* Legend row */
.wk-legend-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; font-size:10px; padding:3px 0; }
.wk-legend-dot { display:inline-block; width:8px; height:8px; border-radius:2px; margin-right:4px; vertical-align:middle; }
/* Today task list */
.wk-task-group-header {
  font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
  color:var(--text3); padding:8px 0 5px; border-top:1px solid var(--border2);
  display:flex; align-items:center; gap:6px; margin-top:6px;
}
.wk-task-item {
  display:flex; align-items:flex-start; gap:10px; padding:10px 12px;
  background:var(--surface2); border-radius:10px; margin-bottom:7px;
  border:1px solid var(--border2); cursor:pointer; transition:all .15s;
}
.wk-task-item:hover { border-color:var(--gold); box-shadow:0 2px 8px rgba(240,185,11,.1); }
.wk-task-item.done { opacity:.5; }
.wk-task-item.done .wk-task-name { text-decoration:line-through; }
.wk-task-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:3px; }
.wk-task-name { font-size:12px; font-weight:600; color:var(--text); line-height:1.4; }
.wk-task-loc  { font-size:10px; color:var(--text3); margin-top:2px; }
.wk-check-circle {
  width:22px; height:22px; border-radius:50%; border:1.5px solid var(--border2);
  background:var(--surface3); display:flex; align-items:center; justify-content:center;
  font-size:11px; flex-shrink:0; margin-top:1px; transition:all .15s; cursor:pointer;
}
.wk-check-circle.done { background:var(--teal); border-color:var(--teal); color:#1B2336; }
/* Sites detail tab */
.wk-site-detail-card {
  background:var(--surface2); border:1px solid var(--border2); border-radius:12px;
  margin-bottom:12px; overflow:hidden;
}
.wk-site-detail-header {
  padding:12px 14px; display:flex; align-items:center; gap:10px;
}
.wk-site-color-bar { width:4px; border-radius:2px; align-self:stretch; flex-shrink:0; }
.wk-site-detail-body { padding:0 14px 12px; }
/* ── PRICING PAGE ───────────────────────── */
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
.pricing-card {
  background:var(--surface); border:1.5px solid var(--border2);
  border-radius:20px; cursor:pointer; transition:all .2s; position:relative;
  overflow:visible;
}
.pricing-card:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(27,35,54,.08); border-color: var(--border2); }
.pricing-card-pro { border-color:rgba(240,185,11,.4); box-shadow:0 0 0 1px rgba(240,185,11,.15), 0 8px 32px rgba(240,185,11,.06); }
.pricing-card-pro:hover { border-color:rgba(240,185,11,.7); box-shadow:0 0 0 1px rgba(240,185,11,.3), 0 16px 48px rgba(240,185,11,.12); }
.pricing-card-inner { padding:28px; }
.pricing-popular-tag {
  position:absolute; top:-14px; left:50%; transform:translateX(-50%);
  background:linear-gradient(135deg,#c9a84c,#f0c060); color:#0d0f14;
  font-size:11px; font-weight:800; padding:4px 16px; border-radius:20px;
  white-space:nowrap; letter-spacing:.5px;
}
.pricing-plan-name { font-size:18px; font-weight:800; color:var(--text); }
.pricing-plan-sub { font-size:11px; color:var(--text3); margin-top:3px; }
.pricing-plan-badge {
  font-size:10px; font-weight:700; padding:3px 10px; border-radius:6px;
  letter-spacing:.5px; white-space:nowrap; flex-shrink:0;
}
.free-badge { background:var(--surface2); color:var(--text3); border:1px solid var(--border2); }
.pro-badge { background:rgba(240,185,11,.15); color:var(--gold); border:1px solid rgba(240,185,11,.3); }
.pricing-amount { display:flex; align-items:baseline; gap:4px; margin:20px 0 4px; }
.pricing-currency { font-size:18px; font-weight:700; color:var(--text2); }
.pricing-price { font-size:52px; font-weight:900; color:var(--text); line-height:1; }
.pricing-period { font-size:14px; color:var(--text3); }
.pricing-usage-block { margin:16px 0; }
.pricing-divider { border:none; border-top:1px solid var(--border2); margin:20px 0; }
.pricing-features { list-style:none; padding:0; margin:0 0 24px; display:flex; flex-direction:column; gap:9px; }
.pricing-features li { font-size:12px; display:flex; align-items:flex-start; gap:8px; line-height:1.5; }
.feat-yes { color:var(--text2); }
.feat-yes::before { content:''; }
.feat-gold { color:var(--gold) !important; font-weight:600; }
.feat-no { color:var(--text3); opacity:.5; }
.pricing-btn {
  width:100%; padding:13px 20px; border-radius:10px; font-size:13px; font-weight:700;
  cursor:pointer; border:none; font-family:'DM Sans',sans-serif; transition:all .2s;
}
.pricing-btn-gold {
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  color:#1B2336;
}
.pricing-btn-gold:hover { filter:brightness(1.1); transform:translateY(-1px); box-shadow:0 6px 20px rgba(240,185,11,.35); }
.pricing-btn-ghost {
  background:var(--surface2); color:var(--text2);
  border:1.5px solid var(--border2);
}
.pricing-btn-ghost:hover { border-color:var(--gold); color:var(--gold-dk, #C89B09); }
.pricing-btn[disabled] { opacity:.5; cursor:not-allowed; }
/* Compare table rows */
.compare-row {
  display:grid; grid-template-columns:1fr 90px 90px 90px;
  padding:12px 20px; border-bottom:1px solid var(--border2);
  align-items:center;
}
.compare-row:last-child { border-bottom:none; }
.compare-row:hover { background:rgba(255,255,255,.02); }
.compare-section-header {
  grid-column:1/-1; padding:10px 20px 4px; font-size:10px; font-weight:700;
  letter-spacing:1.5px; color:var(--text3); text-transform:uppercase;
  background:var(--bg); border-bottom:1px solid var(--border2);
}
.compare-feat { font-size:12px; color:var(--text2); }
.compare-val { text-align:center; font-size:13px; }
.compare-yes { color:var(--green); }
.compare-no { color:var(--border2); }
.compare-val-text { font-size:11px; font-weight:600; color:var(--text); }
/* FAQ */
.faq-item { border:1px solid var(--border2); border-radius:10px; margin-bottom:8px; overflow:hidden; }
.faq-q {
  padding:14px 16px; font-size:13px; font-weight:600; color:var(--text);
  cursor:pointer; display:flex; justify-content:space-between; align-items:center;
  transition:background .15s;
}
.faq-q:hover { background:var(--surface2); }
.faq-a { padding:0 16px; max-height:0; overflow:hidden; transition:max-height .3s, padding .3s; font-size:12px; color:var(--text2); line-height:1.7; }
.faq-a.open { padding:0 16px 14px; max-height:200px; }

.wk-site-task-row { padding:7px 0; border-top:1px solid var(--border2); display:flex; align-items:center; gap:8px; font-size:11px; color:var(--text2); }

/* ══════════════════════════════════════════════
   LIGHT THEME OVERRIDES — V2 (White + BN Yellow)
   Font: Cormorant Garamond / DM Sans / DM Mono
══════════════════════════════════════════════ */

/* ── Core surfaces ─────────────────────────── */
.sidebar {
  background: var(--surface);
  border-right: 1px solid var(--border2);
  box-shadow: 2px 0 8px rgba(27,35,54,.04);
}
.main-content { background: var(--bg); }
.modal-box {
  background: var(--surface) !important;
  border: 1.5px solid var(--border2) !important;
  box-shadow: 0 20px 60px rgba(27,35,54,.14) !important;
  color: var(--text) !important;
}
.modal-overlay { background: rgba(27,35,54,.45) !important; }

/* ── Stat cards ──────────────────────────────── */
.stat-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  box-shadow: 0 1px 4px rgba(27,35,54,.05);
}
.info-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  box-shadow: 0 1px 4px rgba(27,35,54,.05);
}

/* ── AI review card ──────────────────────────── */
.ai-review-card {
  background: var(--surface);
  border: 1px solid var(--border2);
  box-shadow: 0 2px 8px rgba(27,35,54,.05);
}

/* ── Score circle ────────────────────────────── */
.score-circle {
  border-color: var(--gold);
  background: rgba(240,185,11,.06);
}

/* ── Gantt ────────────────────────────────────── */
.gantt-col-week { border-left-color: var(--border2); }
.gantt-col-week.weekend-col { background: rgba(27,35,54,.025); }
.gantt-col-week.holiday-col { background: rgba(249,115,22,.06); }
.gantt-stripe.stripe-weekend { background: rgba(27,35,54,.025); }
.gantt-stripe.stripe-holiday { background: rgba(249,115,22,.06); border-left-color: rgba(249,115,22,.2); }
.gantt-track { background: var(--surface2); }
.gantt-bar { color: #1B2336 !important; }

/* ── Schedule controls ────────────────────────── */
.sched-controls { background: var(--surface); border-color: var(--border2); }
.sched-date-input { background: var(--surface); border-color: var(--border2); color: var(--text); }

/* ── Override modal ───────────────────────────── */
.override-day-row { background: var(--surface2); border: 1px solid var(--border2); }
.override-toggle { background: var(--surface3); }

/* ── Payment rows ────────────────────────────── */
.pay-row {
  background: var(--surface);
  border-color: var(--border2);
}
.pay-row:hover { border-color: var(--gold); }
.pay-row.vo-row { background: rgba(46,107,230,.03); }
.pay-row.paid   { border-left-color: var(--green); }
.pay-row.pending { border-left-color: var(--gold); }
.badge-future { background: var(--surface2); color: var(--text3); }

/* ── Task cards (worker) ─────────────────────── */
.task-card { background: var(--surface); border-color: var(--border2); }

/* ── Worker calendar ─────────────────────────── */
.wk-cal-day:hover { background: var(--surface2); }
.wk-task-item {
  background: var(--surface);
  border-color: var(--border2);
}
.wk-task-item:hover { border-color: var(--gold); }
.wk-site-detail-card { background: var(--surface); border-color: var(--border2); }

/* ── Task detail panel ────────────────────────── */
.task-detail-panel {
  background: var(--surface);
  border-color: var(--border2);
  box-shadow: 0 -8px 40px rgba(27,35,54,.12);
}
.tdp-header { background: var(--surface); border-bottom-color: var(--border2); }
.tdp-close { background: var(--surface2); color: var(--text2); }
.tdp-close:hover { background: var(--surface3); }
.tdp-chip { background: var(--surface2); border-color: var(--border2); }
.tdp-edit-row { background: var(--surface2); }
.tdp-edit-input {
  background: var(--surface);
  border-color: var(--border2);
  color: var(--text);
  font-family: 'DM Mono', monospace;
}
.tdp-quot-item { background: var(--surface2); border-color: var(--border2); }
.tdp-subitem { border-bottom-color: var(--border2); }
.tdp-check { background: var(--surface); border-color: var(--border2); }

/* ── AI chat ──────────────────────────────────── */
.ai-chat-box { background: var(--surface); border-color: var(--border2); }
.ai-chat-input { background: var(--surface); color: var(--text); }
.ai-chat-input::placeholder { color: var(--text3); }
.chat-user { background: rgba(240,185,11,.1); color: var(--text); }
.chat-ai { background: var(--surface2); color: var(--text2); }

/* ── Photo cards ──────────────────────────────── */
.photo-card { background: var(--surface); border-color: var(--border2); }
.photo-thumb { background: var(--surface2); }
.photo-review-overlay { background: rgba(27,35,54,.65); }

/* ── Upload zones ────────────────────────────── */
.upload-zone { background: var(--surface); border-color: rgba(240,185,11,.3); }
.upload-photo-zone { background: var(--surface); border-color: rgba(240,185,11,.25); }

/* ── Proj tabs ────────────────────────────────── */
.proj-tabs { background: var(--surface2); }
.proj-tab { color: var(--text2); }
.proj-tab:hover { color: var(--text); }
.proj-tab.on { background: var(--surface); color: var(--text); box-shadow: 0 1px 4px rgba(27,35,54,.08); }

/* ── Q-page tabs ──────────────────────────────── */
.q-page-tab { background: var(--surface); border-color: var(--border2); color: var(--text2); }
.q-page-tab:hover { border-color: var(--gold); color: var(--gold-dk, #C89B09); }
.q-page-tab.active { background: rgba(240,185,11,.1); border-color: var(--gold); color: var(--gold-dk, #C89B09); }

/* ── Q table ──────────────────────────────────── */
.q-table th { border-bottom-color: var(--border2); color: var(--text3); }
.q-table td { border-bottom-color: var(--surface3); color: var(--text2); }
.q-table tr:hover td { background: var(--bg); }

/* ── Alerts ────────────────────────────────────── */
.alert-critical { background: rgba(229,57,53,.06); border-color: rgba(229,57,53,.2); }
.alert-warning  { background: rgba(249,115,22,.06); border-color: rgba(249,115,22,.2); }
.alert-info     { background: rgba(46,107,230,.06); border-color: rgba(46,107,230,.2); }
.alert-ok       { background: rgba(22,163,74,.06);  border-color: rgba(22,163,74,.2); }

/* ── Progress bar bg ──────────────────────────── */
.progress-bar-full { background: var(--surface3); }
.score-bar-bg { background: var(--surface3); }

/* ── Worker site cards (colorful — keep contrast) ── */
.wk-site-card-bar { background: var(--surface3); border: 1px solid var(--border2); }
.wk-site-card-fill { /* color set per site inline */ }

/* ── Pricing page light overrides ──────────────── */
#portal-pricing { background: var(--bg) !important; }
.pricing-card { background: var(--surface); border-color: var(--border2); }
.pricing-card-inner { }
.pricing-usage-block .prog-track { background: var(--surface3); }
.compare-row:hover { background: var(--bg); }
.compare-section-header { background: var(--bg); color: var(--text3); border-color: var(--border2); grid-column: 1 / -1; }
.faq-item { border-color: var(--border2); }
.faq-q { color: var(--text); }
.faq-q:hover { background: var(--bg); }
.faq-a { color: var(--text2); }

/* ── Sidebar usage box ─────────────────────────── */
#sidebar-usage-box {
  background: rgba(240,185,11,.06) !important;
  border-color: rgba(240,185,11,.2) !important;
}

/* ── Modal close button ────────────────────────── */
.modal-close {
  background: var(--surface2);
  color: var(--text2);
  border: 1px solid var(--border2);
}
.modal-close:hover { background: var(--surface3); color: var(--red); }

/* ── Dividers ─────────────────────────────────── */
.divider { background: var(--border2); }

/* ── Worker register steps ─────────────────────── */
.reg-step-num {
  background: var(--gold) !important;
  color: #1B2336 !important;
}

/* ── App info panel ─────────────────────────────── */
.app-info-title { color: var(--text); }
.app-info-desc  { color: var(--text2); }
.feature-list li { color: var(--text2); }

/* ── Scrollbar light ───────────────────────────── */
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border2); }
::-webkit-scrollbar-thumb:hover { background: var(--gold); }

/* ── Worker registration modal ─────────────────── */
#modal-worker-reg .modal-box { min-height: 300px; }

/* ── Roster card ──────────────────────────────────── */
.worker-roster-card {
  background: var(--surface) !important;
  border: 1px solid var(--border2) !important;
  box-shadow: 0 1px 4px rgba(27,35,54,.05);
}

/* ── Region/lang active btn ──────────────────────── */
.region-btn.active { background: var(--gold); color: #1B2336; }

/* ── Sidebar upgrade hint ────────────────────────── */
#sidebar-upgrade-hint { color: var(--text3) !important; }

/* ── Upgrade modal ───────────────────────────────── */
#modal-upgrade .modal-box {
  background: var(--surface) !important;
  color: var(--text) !important;
}

/* ── Owner project card bottom dates (dark card → white text) ── */
.mobile-project-card .proj-foot-label {
  color: rgba(255,255,255,.6) !important;
}
.mobile-project-card .proj-foot-val {
  color: rgba(255,255,255,.9) !important;
}
/* ── Mobile scroll content bg ── */
.mobile-scroll { background: var(--surface); }
/* ── Worker mobile header bg ── */
#worker-mobile-frame .worker-header { background: var(--surface); }
/* ── Worker mobile tab bar ── */
#worker-mobile-frame .mobile-tabs { background: var(--surface); }
/* ── Worker avatar initials ── */
#worker-avatar-initials { color: var(--gold-dk, #C89B09); font-weight: 700; }
/* ── TL pending dot ── */
.tl-pending { background: var(--surface3); border: 2px solid var(--border2); }
/* ── Section title divider color ── */
.section-title { color: var(--text3) !important; }
/* ── Remove btn-ghost border glow issue ── */
.btn-ghost { border: 1.5px solid var(--border2); }

/* ══════════════════════════════════════
   AUTH GATE — Login / Register overlays
══════════════════════════════════════ */
.auth-overlay {
  position:fixed; inset:0; z-index:500;
  background:var(--bg);
  display:flex; align-items:center; justify-content:center;
  padding:20px;
  transition:opacity .3s, transform .3s;
}
.auth-overlay.hidden {
  opacity:0; pointer-events:none; transform:scale(.98);
}
.auth-card {
  background:var(--surface);
  border:1.5px solid var(--border2);
  border-radius:20px;
  padding:36px 32px;
  width:100%; max-width:420px;
  box-shadow:0 20px 60px rgba(27,35,54,.12);
  position:relative;
}
.auth-logo-mark {
  width:52px; height:52px; border-radius:14px;
  display:flex; align-items:center; justify-content:center;
  font-size:24px; margin-bottom:22px;
  box-shadow:0 4px 14px rgba(240,185,11,.25);
}
.auth-logo-mark.gold  { background:var(--gold); }
.auth-logo-mark.teal  { background:var(--teal); }
.auth-logo-mark.blue  { background:var(--blue); }
.auth-title {
  font-family:'Cormorant Garamond','Corbel',serif;
  font-size:26px; font-weight:700; color:var(--text);
  margin-bottom:4px; line-height:1.2;
}
.auth-sub { font-size:13px; color:var(--text3); margin-bottom:28px; line-height:1.6; }
.auth-tab-row {
  display:flex; gap:0; margin-bottom:24px;
  background:var(--surface2); border-radius:10px; padding:3px;
}
.auth-tab {
  flex:1; padding:8px; border-radius:8px; border:none;
  font-size:13px; font-weight:600; cursor:pointer;
  font-family:'DM Sans','Corbel',sans-serif;
  background:transparent; color:var(--text3); transition:all .15s;
}
.auth-tab.on {
  background:var(--surface); color:var(--text);
  box-shadow:0 1px 4px rgba(27,35,54,.1);
}
.auth-field-label {
  font-size:11px; font-weight:700; color:var(--text2);
  letter-spacing:.3px; margin-bottom:5px; margin-top:16px;
  display:block;
}
.auth-field-label:first-of-type { margin-top:0; }
.auth-input {
  width:100%; background:var(--surface2);
  border:1.5px solid var(--border2); border-radius:10px;
  padding:11px 14px; color:var(--text);
  font-family:'DM Sans','Corbel',sans-serif; font-size:13px;
  outline:none; transition:border-color .2s;
  box-sizing:border-box;
}
.auth-input:focus { border-color:var(--gold); background:var(--surface); }
.auth-input::placeholder { color:var(--text3); }
.auth-phone-row { display:flex; gap:8px; }
.auth-phone-prefix {
  background:var(--surface2); border:1.5px solid var(--border2);
  border-radius:10px; padding:11px 12px; font-size:13px; color:var(--text2);
  white-space:nowrap; font-family:'DM Sans',sans-serif; flex-shrink:0;
}
.auth-otp-row { display:flex; gap:8px; margin-top:4px; }
.auth-otp-box {
  flex:1; text-align:center; font-size:20px; font-weight:700;
  background:var(--surface2); border:1.5px solid var(--border2);
  border-radius:10px; padding:12px 0; color:var(--text);
  font-family:'DM Sans',sans-serif; outline:none; transition:all .18s;
}
.auth-otp-box:focus { border-color:var(--gold); background:var(--gold-lt,#FFF8DC); }
.auth-otp-box.filled { border-color:var(--gold); color:var(--gold-dk,#C89B09); background:var(--gold-lt,#FFF8DC); }
.auth-btn {
  width:100%; padding:13px; border-radius:10px; border:none;
  font-size:14px; font-weight:700; cursor:pointer;
  font-family:'DM Sans','Corbel',sans-serif;
  margin-top:20px; transition:all .18s; letter-spacing:.2px;
}
.auth-btn-gold {
  background:var(--gold); color:#1B2336;
  box-shadow:0 3px 12px rgba(240,185,11,.3);
}
.auth-btn-gold:hover { background:var(--gold-dk,#C89B09); transform:translateY(-1px); }
.auth-btn-teal { background:var(--teal); color:#1B2336; box-shadow:0 3px 12px rgba(0,201,167,.25); }
.auth-btn-teal:hover { background:#00a688; transform:translateY(-1px); }
.auth-btn-blue { background:var(--blue); color:#fff; box-shadow:0 3px 12px rgba(46,107,230,.25); }
.auth-btn-blue:hover { background:#2459cc; transform:translateY(-1px); }
.auth-divider {
  display:flex; align-items:center; gap:12px;
  margin:18px 0; color:var(--text3); font-size:11px;
}
.auth-divider::before, .auth-divider::after {
  content:''; flex:1; height:1px; background:var(--border2);
}
.auth-social-row { display:flex; gap:10px; }
.auth-social-btn {
  flex:1; padding:10px; border-radius:10px;
  border:1.5px solid var(--border2); background:var(--surface);
  font-size:12px; font-weight:600; cursor:pointer;
  font-family:'DM Sans',sans-serif; color:var(--text2);
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition:all .15s;
}
.auth-social-btn:hover { border-color:var(--gold); color:var(--text); }
.auth-footer { text-align:center; margin-top:20px; font-size:11px; color:var(--text3); }
.auth-footer a { color:var(--gold-dk,#C89B09); font-weight:600; cursor:pointer; text-decoration:none; }
.auth-step { display:none; }
.auth-step.on { display:block; }
.auth-send-btn {
  background:none; border:none; color:var(--gold-dk,#C89B09);
  font-size:11px; font-weight:700; cursor:pointer;
  font-family:'DM Sans',sans-serif; padding:0; margin-top:6px;
  float:right;
}
.auth-plan-chips { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:20px; }
.auth-plan-chip {
  padding:6px 14px; border-radius:20px; font-size:11px; font-weight:700;
  cursor:pointer; border:1.5px solid var(--border2);
  background:var(--surface2); color:var(--text3); transition:all .15s;
}
.auth-plan-chip.selected { background:var(--gold-lt,#FFF8DC); border-color:var(--gold); color:var(--gold-dk,#C89B09); }
.auth-tag {
  display:inline-flex; align-items:center; gap:5px; padding:3px 10px;
  border-radius:6px; font-size:10px; font-weight:700;
  margin-bottom:16px;
}
.auth-tag-designer { background:rgba(46,107,230,.1); color:var(--blue); }
.auth-tag-owner    { background:rgba(240,185,11,.12); color:var(--gold-dk,#C89B09); }
.auth-tag-worker   { background:rgba(0,201,167,.1);  color:var(--teal); }

.pricing-card-selected {
  border-color: var(--gold) !important;
  box-shadow: 0 0 0 2px rgba(240,185,11,.2), 0 8px 28px rgba(240,185,11,.1) !important;
  transform: translateY(-2px);
}
#plan-card-elite.pricing-card-selected {
  border-color: var(--blue) !important;
  box-shadow: 0 0 0 2px rgba(46,107,230,.2), 0 8px 28px rgba(46,107,230,.1) !important;
}
.pricing-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(27,35,54,.08); }

/* ── Project Management ──────────────────────────────────── */
.sidebar-proj-item {
  display:flex; align-items:center; gap:8px;
  padding:8px 14px; border-radius:8px; cursor:pointer;
  font-size:13px; color:var(--text2); font-weight:500;
  transition:all .15s; position:relative;
}
.sidebar-proj-item:hover { background:var(--surface2); color:var(--text); }
.sidebar-proj-item.active { background:rgba(240,185,11,.1); color:var(--text); font-weight:600; }
.sidebar-proj-item.active::before {
  content:''; position:absolute; left:0; top:20%; bottom:20%;
  width:3px; background:var(--gold); border-radius:0 2px 2px 0;
}
.sidebar-proj-badge {
  margin-left:auto; font-size:9px; font-weight:700; padding:2px 6px;
  border-radius:10px; letter-spacing:.3px;
}
.badge-active  { background:rgba(22,163,74,.12);  color:var(--green); }
.badge-draft   { background:rgba(240,185,11,.12); color:var(--gold-dk,#C89B09); }
.badge-done    { background:var(--surface3); color:var(--text3); }

/* ── Project panel gantt tab ─────────────────────────────── */
#proj-tab-gantt {
  overflow:hidden;
}
.proj-gantt-wrap {
  border:1px solid var(--border2); border-radius:12px; overflow:hidden;
  background:var(--surface);
}
.proj-gantt-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 14px; background:var(--surface2);
  border-bottom:1px solid var(--border2);
  font-size:11px; color:var(--text3);
}
.proj-gantt-outer {
  overflow-x:auto; position:relative;
}
.proj-gantt-cal-header {
  display:flex; min-width:100%;
  border-bottom:1px solid var(--border2);
}
.proj-gantt-col-week {
  flex:1; min-width:80px; padding:4px 6px; text-align:center;
  border-right:1px solid var(--border2); font-size:10px;
}
.proj-gantt-week-date { color:var(--text3); font-size:9px; }
.proj-gantt-week-label { font-weight:700; color:var(--text); font-size:11px; }
.proj-gantt-week-days  { color:var(--text3); font-size:9px; }
/* Row */
.proj-gantt-row {
  display:grid; grid-template-columns:180px 1fr 160px;
  min-width:100%; border-bottom:1px solid var(--border2);
  min-height:40px;
}
.proj-gantt-row:last-child { border-bottom:none; }
.proj-gantt-label {
  padding:8px 10px; font-size:12px; font-weight:600; color:var(--text2);
  border-right:1px solid var(--border2); display:flex; flex-direction:column;
  justify-content:center; cursor:pointer;
}
.proj-gantt-label:hover { background:var(--surface2); }
.proj-gantt-label .date-sub { font-size:9px; color:var(--text3); margin-top:2px; font-weight:400; }
.proj-gantt-track {
  position:relative; overflow:hidden;
  border-right:1px solid var(--border2);
}
.proj-gantt-bar {
  position:absolute; top:6px; bottom:6px; border-radius:4px; cursor:grab;
  display:flex; align-items:center; padding:0 4px; overflow:hidden;
  transition:box-shadow .15s;
}
.proj-gantt-bar:hover { box-shadow:0 2px 8px rgba(0,0,0,.2); }
.proj-gantt-bar.dragging { cursor:grabbing; box-shadow:0 4px 14px rgba(0,0,0,.25); z-index:10; }
.proj-gantt-bar-label { font-size:9px; font-weight:700; color:rgba(255,255,255,.9); white-space:nowrap; overflow:hidden; pointer-events:none; }
.proj-gantt-resize {
  position:absolute; right:0; top:0; bottom:0; width:8px;
  cursor:ew-resize; background:rgba(255,255,255,.2); border-radius:0 4px 4px 0;
  opacity:0; transition:opacity .15s;
}
.proj-gantt-bar:hover .proj-gantt-resize { opacity:1; }
.proj-gantt-today-line {
  position:absolute; top:0; bottom:0; width:1.5px;
  background:rgba(229,57,53,.5); pointer-events:none; z-index:5;
}
/* Workers assignment column */
.proj-gantt-workers {
  padding:6px 8px; display:flex; flex-wrap:wrap; gap:4px;
  align-items:center; align-content:center;
}
.worker-chip {
  display:inline-flex; align-items:center; gap:4px;
  padding:2px 7px; border-radius:20px; font-size:10px; font-weight:700;
  white-space:nowrap; cursor:default;
}
.assign-btn {
  padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700;
  border:1.5px dashed var(--border2); background:transparent; color:var(--text3);
  cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .15s;
  white-space:nowrap;
}
.assign-btn:hover { border-color:var(--gold); color:var(--gold-dk,#C89B09); }

/* Dirty/unpublished banner */
.proj-dirty-banner {
  display:flex; align-items:center; gap:10px;
  padding:10px 14px; margin-bottom:12px;
  background:rgba(240,185,11,.07); border:1px solid rgba(240,185,11,.3);
  border-radius:10px; font-size:12px; color:var(--text2);
}
.proj-dirty-banner .pulse-dot {
  width:8px; height:8px; border-radius:50%; background:var(--gold);
  animation:pulse 1.5s infinite; flex-shrink:0;
}

/* Worker assign modal */
.worker-select-grid {
  display:flex; flex-direction:column; gap:8px; max-height:320px; overflow-y:auto;
}
.worker-select-item {
  display:flex; align-items:center; gap:12px;
  padding:10px 12px; border-radius:10px; cursor:pointer;
  border:1.5px solid var(--border2); background:var(--surface);
  transition:all .15s;
}
.worker-select-item:hover  { border-color:var(--gold); background:var(--gold-lt,#FFF8DC); }
.worker-select-item.checked { border-color:var(--gold); background:rgba(240,185,11,.08); }
.worker-select-item .ws-check {
  width:20px; height:20px; border-radius:50%; border:2px solid var(--border2);
  display:flex; align-items:center; justify-content:center;
  font-size:11px; color:transparent; flex-shrink:0; transition:all .15s;
}
.worker-select-item.checked .ws-check {
  background:var(--gold); border-color:var(--gold); color:#1B2336;
}
.ws-avatar {
  width:36px; height:36px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; flex-shrink:0;
}
.ws-info { flex:1; }
.ws-name  { font-size:13px; font-weight:600; color:var(--text); }
.ws-trade { font-size:11px; color:var(--text3); margin-top:1px; }
.ws-rating { font-size:10px; color:var(--gold-dk,#C89B09); }

/* Publish modal */
.publish-assignment-row {
  display:flex; align-items:flex-start; gap:10px;
  padding:10px 0; border-bottom:1px solid var(--border2);
}
.publish-assignment-row:last-child { border-bottom:none; }
.pub-task-color { width:4px; border-radius:2px; align-self:stretch; flex-shrink:0; }
.pub-task-info  { flex:1; }
.pub-task-name  { font-size:12px; font-weight:600; color:var(--text); }
.pub-task-date  { font-size:10px; color:var(--text3); margin-top:2px; }
.pub-workers    { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }

/* Worker portal — assigned tasks */
.wk-assigned-banner {
  margin:10px 14px; padding:10px 12px;
  background:rgba(0,201,167,.07); border:1px solid rgba(0,201,167,.2);
  border-radius:10px;
}
.wk-assigned-banner .wk-ab-title { font-size:12px; font-weight:700; color:var(--teal); margin-bottom:3px; }
.wk-assigned-banner .wk-ab-sub   { font-size:11px; color:var(--text2); }

/* ── Settings panel tabs ─────────────────────────── */
.settings-tab-row { display:flex; gap:4px; border-bottom:1px solid var(--border2); margin-bottom:20px; }
.settings-tab {
  padding:8px 16px; font-size:12px; font-weight:600; cursor:pointer;
  border:none; background:transparent; color:var(--text3); border-radius:8px 8px 0 0;
  border-bottom:2px solid transparent; margin-bottom:-1px; font-family:'DM Sans',sans-serif;
  transition:all .15s;
}
.settings-tab.on { color:var(--gold-dk,#C89B09); border-bottom-color:var(--gold); background:rgba(240,185,11,.05); }
.settings-tab:hover:not(.on) { color:var(--text2); background:var(--surface2); }

/* Profile fields */
.profile-section { margin-bottom:24px; }
.profile-section-title {
  font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;
  color:var(--text3); margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid var(--border2);
}
.profile-field-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.profile-field-row.full { grid-template-columns:1fr; }
.profile-field { display:flex; flex-direction:column; gap:5px; }
.profile-label { font-size:11px; font-weight:600; color:var(--text3); text-transform:uppercase; letter-spacing:.5px; }
.profile-input {
  padding:9px 12px; border:1.5px solid var(--border2); border-radius:8px;
  font-size:13px; color:var(--text); background:var(--surface); font-family:'DM Sans',sans-serif;
  transition:border-color .15s;
}
.profile-input:focus { outline:none; border-color:var(--gold); }
.profile-avatar-row {
  display:flex; align-items:center; gap:16px; padding:16px;
  background:var(--surface2); border-radius:12px; margin-bottom:20px;
}
.profile-avatar-circle {
  width:56px; height:56px; border-radius:50%; background:var(--gold);
  display:flex; align-items:center; justify-content:center;
  font-size:20px; font-weight:700; color:#1B2336; flex-shrink:0;
}
.profile-save-bar {
  display:flex; align-items:center; gap:10px; margin-top:20px;
  padding-top:16px; border-top:1px solid var(--border2);
}

/* Plan display in settings */
.settings-plan-badge {
  display:inline-flex; align-items:center; gap:6px;
  padding:6px 14px; border-radius:20px; font-size:12px; font-weight:700;
  background:rgba(240,185,11,.1); color:var(--gold-dk,#C89B09);
  border:1px solid rgba(240,185,11,.25);
}
.plan-feature-list { list-style:none; padding:0; margin:12px 0; }
.plan-feature-list li {
  display:flex; align-items:center; gap:8px; padding:6px 0;
  font-size:12px; color:var(--text2); border-bottom:1px solid var(--border2);
}
.plan-feature-list li:last-child { border-bottom:none; }

/* Price library table */
.price-table { width:100%; border-collapse:collapse; font-size:12px; }
.price-table th {
  padding:8px 12px; text-align:left; font-size:10px; font-weight:700;
  letter-spacing:1px; text-transform:uppercase; color:var(--text3);
  border-bottom:2px solid var(--border2); background:var(--surface2);
}
.price-table td { padding:9px 12px; border-bottom:1px solid var(--border2); color:var(--text2); }
.price-table tr:last-child td { border-bottom:none; }
.price-table tr:hover td { background:var(--surface2); }
.price-cat-badge {
  display:inline-block; padding:2px 8px; border-radius:4px;
  font-size:10px; font-weight:700; letter-spacing:.3px;
}

/* Worker trade multi-select */
.trade-chip-grid { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 4px; }
.trade-chip {
  display:flex; align-items:center; gap:6px; padding:8px 12px;
  border:1.5px solid var(--border2); border-radius:8px; cursor:pointer;
  font-size:12px; font-weight:600; color:var(--text2); background:var(--surface);
  transition:all .15s; user-select:none;
}
.trade-chip:hover  { border-color:var(--teal); color:var(--teal); background:rgba(0,201,167,.05); }
.trade-chip.on     { border-color:var(--teal); background:rgba(0,201,167,.08); color:var(--teal); }
.trade-chip .tc-icon { font-size:16px; }
.trade-chip .tc-check {
  width:16px; height:16px; border-radius:50%; border:1.5px solid var(--border2);
  display:flex; align-items:center; justify-content:center; font-size:9px;
  color:transparent; flex-shrink:0; transition:all .15s;
}
.trade-chip.on .tc-check {
  background:var(--teal); border-color:var(--teal); color:white;
}
.trade-selected-preview {
  margin-top:8px; padding:8px 10px; background:rgba(0,201,167,.06);
  border:1px solid rgba(0,201,167,.2); border-radius:8px;
  font-size:11px; color:var(--teal); font-weight:600;
}

/* ── Role selection screen ───────────────────────── */
#role-select-overlay {
  position:fixed; inset:0; z-index:9000;
  background:var(--bg); display:flex; align-items:center; justify-content:center;
  flex-direction:column; padding:24px;
}
.role-select-inner { max-width:440px; width:100%; }
.role-select-logo  {
  text-align:center; margin-bottom:32px;
}
.role-select-logo .logo-word {
  font-family:'Cormorant Garamond','Corbel',serif;
  font-size:28px; font-weight:700; color:var(--text); letter-spacing:-.5px;
}
.role-select-logo .logo-sub {
  font-size:11px; color:var(--text3); margin-top:4px; letter-spacing:1.5px; text-transform:uppercase;
}
.role-select-title {
  font-size:15px; font-weight:700; color:var(--text); margin-bottom:6px;
}
.role-select-sub { font-size:12px; color:var(--text3); margin-bottom:20px; }
.role-cards { display:flex; flex-direction:column; gap:12px; }
.role-card {
  display:flex; align-items:center; gap:16px;
  padding:16px 18px; border-radius:14px; cursor:pointer;
  border:2px solid var(--border2); background:var(--surface);
  transition:all .18s; position:relative; overflow:hidden;
}
.role-card::before {
  content:''; position:absolute; inset:0;
  background:linear-gradient(135deg, var(--rc-color1,transparent), var(--rc-color2,transparent));
  opacity:0; transition:opacity .18s;
}
.role-card:hover { border-color:var(--rc-border,var(--gold)); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,.08); }
.role-card:hover::before { opacity:1; }
.role-card-icon {
  width:48px; height:48px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  font-size:22px; flex-shrink:0; position:relative; z-index:1;
}
.role-card-body { flex:1; position:relative; z-index:1; }
.role-card-name { font-size:14px; font-weight:700; color:var(--text); margin-bottom:2px; }
.role-card-desc { font-size:11px; color:var(--text3); line-height:1.5; }
.role-card-arrow { font-size:18px; color:var(--text3); position:relative; z-index:1; transition:transform .18s; }
.role-card:hover .role-card-arrow { transform:translateX(4px); color:var(--text); }
.role-card.designer { --rc-color1:rgba(59,130,246,.05); --rc-color2:rgba(59,130,246,.02); --rc-border:#3b82f6; }
.role-card.owner    { --rc-color1:rgba(240,185,11,.06);  --rc-color2:rgba(240,185,11,.02); --rc-border:var(--gold); }
.role-card.worker   { --rc-color1:rgba(0,201,167,.05);  --rc-color2:rgba(0,201,167,.02);  --rc-border:var(--teal); }
.role-select-footer { text-align:center; margin-top:16px; font-size:11px; color:var(--text3); }
.role-select-footer a { color:var(--gold-dk,#C89B09); cursor:pointer; font-weight:600; }

/* ── Editable client extract card fields ─────────── */
.client-edit-field {
  display:flex; flex-direction:column; gap:3px;
}
.client-edit-label {
  font-size:9px; font-weight:700; text-transform:uppercase;
  letter-spacing:1px; color:var(--text3);
}
.client-edit-input {
  padding:6px 10px; border:1.5px solid transparent;
  border-radius:7px; font-size:13px; font-weight:600;
  color:var(--text); background:rgba(96,165,250,.06);
  font-family:'DM Sans',sans-serif; transition:border-color .15s;
  width:100%;
}
.client-edit-input:focus {
  outline:none; border-color:rgba(96,165,250,.5);
  background:rgba(96,165,250,.08);
}

/* ── Worker assign modal: search + trade filter ───── */
.assign-search-row {
  display:flex; gap:8px; margin-bottom:10px; align-items:center;
}
.assign-search-input {
  flex:1; padding:8px 12px; border:1.5px solid var(--border2);
  border-radius:8px; font-size:12px; color:var(--text);
  background:var(--surface); font-family:'DM Sans',sans-serif;
}
.assign-search-input:focus { outline:none; border-color:var(--gold); }
.assign-trade-filter {
  display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;
}
.assign-trade-chip {
  padding:4px 10px; border-radius:20px; font-size:10px; font-weight:700;
  border:1.5px solid var(--border2); background:transparent;
  color:var(--text3); cursor:pointer; font-family:'DM Sans',sans-serif;
  transition:all .12s; white-space:nowrap;
}
.assign-trade-chip.on, .assign-trade-chip:hover {
  border-color:var(--gold); color:var(--gold-dk,#C89B09);
  background:rgba(240,185,11,.08);
}
.assign-recommended { margin-bottom:6px; }
.assign-rec-label {
  font-size:10px; font-weight:700; color:var(--teal);
  letter-spacing:1px; text-transform:uppercase; margin-bottom:6px;
  display:flex; align-items:center; gap:6px;
}
.assign-rec-label::after {
  content:''; flex:1; height:1px; background:rgba(0,201,167,.2);
}

/* ── Pro gate badge ──────────────────────────────── */
.pro-gate-banner {
  display:flex; flex-direction:column; align-items:center;
  padding:32px 24px; text-align:center; gap:12px;
}
.pro-gate-icon { font-size:40px; }
.pro-gate-title { font-size:16px; font-weight:700; color:var(--text); }
.pro-gate-sub { font-size:12px; color:var(--text3); line-height:1.6; max-width:300px; }

</style>

</head>
<body>

<!-- ═══════════════════════════════════════════
     ROLE SELECTION SCREEN (shown on first visit)
═══════════════════════════════════════════ -->
<div id="role-select-overlay">
  <div class="role-select-inner">
    <div class="role-select-logo">
      <div class="logo-word">RenoSmart</div>
      <div class="logo-sub">智能装修管理平台 · MY / SG</div>
    </div>
    <div class="role-select-title">欢迎！请选择你的身份</div>
    <div class="role-select-sub">选择后即可登入 · 同一账号可绑定多个身份</div>
    <div class="role-cards">

      <div class="role-card designer" onclick="selectRoleAndEnter('designer')">
        <div class="role-card-icon" style="background:rgba(59,130,246,.1);">🖥️</div>
        <div class="role-card-body">
          <div class="role-card-name">室内设计师</div>
          <div class="role-card-desc">上传报价单 · AI 分析 · 管理项目进度 · 分配工人</div>
        </div>
        <div class="role-card-arrow">›</div>
      </div>

      <div class="role-card owner" onclick="selectRoleAndEnter('owner')">
        <div class="role-card-icon" style="background:rgba(240,185,11,.1);">🏠</div>
        <div class="role-card-body">
          <div class="role-card-name">业主 / 甲方</div>
          <div class="role-card-desc">查看施工进度 · 审核付款 · 检阅工地照片</div>
        </div>
        <div class="role-card-arrow">›</div>
      </div>

      <div class="role-card worker" onclick="selectRoleAndEnter('worker')">
        <div class="role-card-icon" style="background:rgba(0,201,167,.1);">👷</div>
        <div class="role-card-body">
          <div class="role-card-name">工人 / 承包商</div>
          <div class="role-card-desc">接收任务 · 查看工地日历 · 上传完工照片</div>
        </div>
        <div class="role-card-arrow">›</div>
      </div>

    </div>
    <div class="role-select-footer">
      已有账户？直接选择身份登入 ·
      <a onclick="selectRoleAndEnter('designer')">演示模式直接进入 →</a>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════
     PORTAL NAVIGATION BAR
═══════════════════════════════════════ -->
<div class="portal-bar">
  <div class="brand">RenoSmart <span>PLATFORM</span></div>
  <button class="portal-btn active" onclick="switchPortal('designer')" id="btn-designer">
    <span class="portal-dot"></span> <span data-i18n="nav_designer">Designer</span>
  </button>
  <button class="portal-btn" onclick="switchPortal('owner')" id="btn-owner">
    <span class="portal-dot"></span> <span data-i18n="nav_owner">Owner</span>
  </button>
  <button class="portal-btn" onclick="switchPortal('worker')" id="btn-worker">
    <span class="portal-dot"></span> <span data-i18n="nav_worker">Worker</span>
  </button>
  <button class="portal-btn" onclick="switchPortal('pricing')" id="btn-pricing" style="background:linear-gradient(135deg,rgba(240,185,11,.18),rgba(240,185,11,.06));border-color:rgba(240,185,11,.35);color:var(--gold);">
    ✦ <span>Pricing</span>
  </button>

  <div class="region-toggle" id="region-toggle">
    <button class="region-btn active" id="btn-region-my" onclick="setRegion('MY')">🇲🇾 Malaysia</button>
    <button class="region-btn" id="btn-region-sg" onclick="setRegion('SG')">🇸🇬 Singapore</button>
  </div>

  <div class="lang-toggle" id="lang-toggle">
    <button class="lang-btn active" id="btn-lang-en" onclick="setLang('en')">EN</button>
    <button class="lang-btn" id="btn-lang-ms" onclick="setLang('ms')">BM</button>
    <button class="lang-btn" id="btn-lang-zh" onclick="setLang('zh')">中文</button>
  </div>
</div>

<!-- ═══════════════════════════════════════
     PORTAL 1: DESIGNER WEB
═══════════════════════════════════════ -->
<div class="portal active" id="portal-designer">
  <div class="designer-layout">

    <!-- Sidebar -->
    <div class="sidebar">
      <div style="padding: 0 16px 20px; border-bottom: 1px solid var(--border2); margin-bottom: 12px;">
        <div style="font-size:12px; color:var(--text3);" data-i18n="sidebar_logged_as">Logged in as</div>
        <div style="font-size:14px; font-weight:600; margin-top:4px;">Ahmad Faris Design</div>
        <div style="font-size:11px; color:var(--text3);" id="sidebar-location">Kuala Lumpur, MY</div>
      </div>

      <div class="sidebar-label" data-i18n="sidebar_workspace">WORKSPACE</div>
      <div class="sidebar-section">
        <div class="nav-item active" onclick="showPanel('upload')">
          <span class="nav-icon">📋</span> <span data-i18n="nav_quotation">Quotation Import</span>
        </div>
        <div class="nav-item" onclick="showPanel('review')">
          <span class="nav-icon">🤖</span> <span data-i18n="nav_ai_review">AI Review</span>
          <span class="nav-badge">3</span>
        </div>
        <div class="nav-item" onclick="showPanel('schedule')">
          <span class="nav-icon">📅</span> <span data-i18n="nav_schedule">Schedule</span>
        </div>
        <div class="nav-item" onclick="showPanel('export')">
          <span class="nav-icon">📤</span> <span data-i18n="nav_export">Export Report</span>
        </div>
      </div>

      <div class="sidebar-label" data-i18n="sidebar_projects">PROJECTS</div>
      <div class="sidebar-section" id="projects-sidebar-list">
        <!-- Rendered by renderProjectsSidebar() -->
        <div style="padding:8px 14px;font-size:11px;color:var(--text3);font-style:italic;">
          尚无已保存项目 · 排完进度后点击「保存为项目」
        </div>
      </div>

      <div class="sidebar-label" data-i18n="sidebar_team">TEAM</div>
      <div class="sidebar-section">
        <div class="nav-item" onclick="showPanel('workers')">
          <span class="nav-icon">👷</span> <span data-i18n="nav_workers">Worker Roster</span>
          <span class="nav-badge" style="background:var(--orange)">1</span>
        </div>
      </div>

      <div class="sidebar-label" data-i18n="sidebar_settings">SETTINGS</div>
      <div class="sidebar-section">
        <div class="nav-item" onclick="showPanel('dashboard');setTimeout(renderDashboard,80)">
          <span class="nav-icon">📊</span> 我的后台
        </div>
        <div class="nav-item" onclick="showPanel('pricelibrary');setTimeout(checkPriceLibAccess,80)">
          <span class="nav-icon">💰</span> <span data-i18n="nav_pricelist">Price Library</span>
        </div>
        <div class="nav-item" onclick="showPanel('mysettings')">
          <span class="nav-icon">⚙️</span> 我的设定
        </div>
      </div>

      <!-- Switch role footer -->
      <div style="margin:10px 12px 0;padding:10px 12px;border:1px solid var(--border2);border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:8px;" onclick="showRoleSelect()">
        <span style="font-size:14px;">🔄</span>
        <div style="flex:1;">
          <div style="font-size:11px;font-weight:700;color:var(--text2);">切换身份</div>
          <div style="font-size:10px;color:var(--text3);">业主端 / 工人端</div>
        </div>
        <span style="font-size:14px;color:var(--text3);">›</span>
      </div>

      <!-- AI Usage Meter -->
      <div id="sidebar-usage-box" style="margin:16px 12px 0;padding:12px 13px;background:rgba(240,185,11,.06);border:1px solid rgba(240,185,11,.2);border-radius:10px;cursor:pointer;" onclick="switchPortal('pricing')">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:11px;font-weight:700;color:var(--gold);">✦ AI 额度</div>
          <div style="font-size:10px;color:var(--text3);" id="sidebar-plan-label">免费版</div>
        </div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
          <span id="sidebar-usage-used" style="font-size:22px;font-weight:800;color:var(--text);line-height:1;">1</span>
          <span style="font-size:12px;color:var(--text3);">/ <span id="sidebar-usage-total">3</span> 次已用</span>
        </div>
        <div style="background:var(--surface3);border-radius:3px;height:4px;overflow:hidden;">
          <div id="sidebar-usage-bar" style="height:100%;border-radius:3px;background:var(--gold);transition:width .4s;width:33%;"></div>
        </div>
        <div id="sidebar-upgrade-hint" style="font-size:10px;color:var(--text3);margin-top:7px;">还剩 2 次免费 · 点击升级 Pro</div>
      </div>
    </div><!-- /sidebar -->

    <!-- Main Content -->
    <div class="main-content">

      <!-- Panel: Upload -->
      <div class="panel active" id="panel-upload">
        <div class="panel-title" data-i18n="upload_title">Upload Quotation</div>
        <div class="panel-sub" data-i18n="upload_sub">Supports Excel (.xlsx/.xls), CSV, PDF · AI reads and auto-reviews content</div>

        <!-- Upload Zone -->
        <div class="upload-zone" id="upload-zone"
             onclick="document.getElementById('file-input').click()"
             ondragover="event.preventDefault();this.style.borderColor='var(--gold)'"
             ondragleave="this.style.borderColor=''"
             ondrop="handleFileDrop(event)">
          <div class="upload-icon" id="upload-icon">📂</div>
          <div class="upload-text"><strong data-i18n="upload_click">Click to upload</strong> <span data-i18n="upload_or">or drag & drop file here</span></div>
          <div class="upload-formats" data-i18n="upload_formats">Supports .xlsx · .xls · .csv · .pdf · Max 10MB</div>
          <input type="file" id="file-input" accept=".xlsx,.xls,.csv,.pdf,.txt"
                 style="display:none" onchange="handleFileSelect(this)">
        </div>

        <!-- AI Loading State -->
        <div id="ai-loading-state" style="display:none; text-align:center; padding:40px 20px;">
          <div style="font-size:36px; margin-bottom:16px;">🤖</div>
          <div style="font-size:16px; font-weight:600; color:var(--gold); margin-bottom:8px;" id="ai-status-text" data-i18n="ai_reading">Reading file...</div>
          <div style="font-size:13px; color:var(--text2);" data-i18n="ai_analyzing">AI is analysing quotation against market price database...</div>
          <div style="margin-top:20px; height:4px; background:var(--surface3); border-radius:2px; overflow:hidden; max-width:300px; margin-left:auto; margin-right:auto;">
            <div id="ai-progress-bar" style="height:100%; width:0%; background:linear-gradient(90deg,var(--gold),var(--gold2)); border-radius:2px; transition:width 0.4s ease;"></div>
          </div>
        </div>

        <!-- Results -->
        <div id="upload-preview" style="display:none">

          <!-- File info strip -->
          <div id="file-info-strip" style="display:flex;align-items:center;gap:12px;background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:12px 16px;margin-bottom:20px;">
            <span style="font-size:24px" id="file-type-icon">📊</span>
            <div style="flex:1">
              <div style="font-size:13px;font-weight:600;" id="file-name-display">quotation.xlsx</div>
              <div style="font-size:11px;color:var(--text2);" id="file-meta-display">0 items recognised</div>
            </div>
            <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px;" onclick="resetUpload()" data-i18n="btn_reupload">Re-upload</button>
          </div>

          <!-- AI Score Summary (dynamic) -->
          <div class="ai-review-card" id="ai-score-card">
            <div class="ai-header">
              <span class="ai-badge">AI REVIEW</span>
              <div class="ai-title" id="ai-score-title" data-i18n="ai_score_title">Overall Score & Risk Assessment</div>
              <div style="margin-left:auto;font-size:12px;color:var(--text2);" data-i18n="ai_market_data">Based on MY/SG 2025 market data</div>
            </div>
            <div class="ai-body" id="ai-score-body"></div>
          </div>

          <!-- Quotation Table -->
          <div style="margin:20px 0 0; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div class="section-title" data-i18n="tbl_items_title">Identified Work Items</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
              <span id="q-item-count"></span>
            </div>
          </div>
          <!-- Page / Section Tabs -->
          <div id="q-page-tabs" style="display:none; flex-wrap:wrap; gap:6px; margin:10px 0 12px;"></div>

          <div class="ai-review-card">
            <div style="overflow-x:auto;">
              <table class="q-table" style="width:100%" id="q-table-body">
                <thead>
                  <tr>
                    <th>#</th>
                    <th data-i18n="tbl_desc">Description</th>
                    <th data-i18n="tbl_unit">Unit</th>
                    <th data-i18n="tbl_qty">Qty</th>
                    <th data-i18n="tbl_unitprice">Unit Price</th>
                    <th data-i18n="tbl_total">Subtotal</th>
                    <th data-i18n="tbl_status">AI Status</th>
                  </tr>
                </thead>
                <tbody id="q-table-rows"></tbody>
              </table>
            </div>
          </div>

          <!-- Missing Items -->
          <div id="missing-items-section" style="margin-top:16px;"></div>

          <!-- Quotation Diff (shown on re-upload) -->
          <div id="quotation-diff-card" style="display:none;margin-top:16px;"></div>

          <!-- AI Alerts -->
          <div id="ai-alerts-section" style="margin-top:16px;"></div>

          <!-- Action buttons -->
          <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <button class="btn btn-gold" onclick="showPanel('review')" data-i18n="btn_full_report">View Full AI Report →</button>
            <button class="btn btn-ghost" onclick="showPanel('schedule');setTimeout(generateAISchedule,300)" data-i18n="btn_gen_schedule">Generate Schedule</button>
            <button class="btn btn-ghost" onclick="exportReport()" data-i18n="btn_export_pdf">Export PDF Report</button>
            <div style="margin-left:auto;">
              <button class="btn btn-ghost" style="border-color:rgba(251,146,60,0.4);color:var(--orange);" onclick="triggerReupload()" data-i18n="btn_reupload_new">🔄 Re-upload Quotation</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel: AI Review -->
      <div class="panel" id="panel-review">
        <div class="panel-title">AI 智能审核报告</div>
        <div class="panel-sub"><span class="live-dot"></span>由 Claude AI 分析 · Taman Desa #A22 · 2025年3月</div>

        <div class="ai-review-card">
          <div class="ai-header">
            <span class="ai-badge">AI REVIEW</span>
            <div class="ai-title">综合评分 & 风险评估</div>
            <div style="margin-left:auto; font-size:12px; color:var(--text2);">基于 MY/SG 2025 市场数据</div>
          </div>
          <div class="ai-body">
            <div class="score-row">
              <div class="score-circle">
                <div class="score-num">74</div>
                <div class="score-label">/ 100</div>
              </div>
              <div class="score-breakdown">
                <div class="score-item">
                  <div class="score-item-label">项目完整性</div>
                  <div class="score-bar-bg"><div class="score-bar" style="width:62%;background:var(--orange)"></div></div>
                  <div class="score-item-val">62</div>
                </div>
                <div class="score-item">
                  <div class="score-item-label">单价合理性</div>
                  <div class="score-bar-bg"><div class="score-bar" style="width:85%;background:var(--green)"></div></div>
                  <div class="score-item-val">85</div>
                </div>
                <div class="score-item">
                  <div class="score-item-label">工序逻辑性</div>
                  <div class="score-bar-bg"><div class="score-bar" style="width:90%;background:var(--green)"></div></div>
                  <div class="score-item-val">90</div>
                </div>
                <div class="score-item">
                  <div class="score-item-label">漏项风险</div>
                  <div class="score-bar-bg"><div class="score-bar" style="width:58%;background:var(--red)"></div></div>
                  <div class="score-item-val">58</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="section-title">严重问题 (需立即处理)</div>

        <div class="alert alert-critical">
          <div class="alert-icon">🚨</div>
          <div class="alert-content">
            <div class="alert-title">水电暗槽工程完全缺失</div>
            <div class="alert-desc">报价单中未见任何水电布线项目。按此房型 (1,200 sqft) 估算，水电工程通常需 RM 8,000–14,000。若不列入报价，装修途中将产生严重超支纠纷。</div>
          </div>
        </div>

        <div class="alert alert-critical">
          <div class="alert-icon">🚨</div>
          <div class="alert-content">
            <div class="alert-title">厨房/浴室防水层未包含</div>
            <div class="alert-desc">湿区防水工程 (Kitchen, Bath x2, Utility) 为马来西亚装修法规强制要求项目，估算 RM 2,500–4,500。遗漏将导致日后渗水责任纠纷。</div>
          </div>
        </div>

        <div class="section-title">警告 (建议确认)</div>

        <div class="alert alert-warning">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <div class="alert-title">油漆单价高于市场 22%</div>
            <div class="alert-desc">报价 RM 2.20/sqft，KL 市场均价 RM 1.80/sqft (Nippon 同系列)。建议与供应商确认是否含2层底漆+2层面漆标准工艺。</div>
          </div>
        </div>

        <div class="alert alert-warning">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <div class="alert-title">主卧室地板数量疑似漏算</div>
            <div class="alert-desc">报价 180 sqft，但依据户型图主卧约 220–240 sqft。建议重新实地量度，差异约 RM 720–1,080。</div>
          </div>
        </div>

        <div class="section-title">提示 (可选考虑)</div>

        <div class="alert alert-info">
          <div class="alert-icon">💡</div>
          <div class="alert-content">
            <div class="alert-title">建议增列清洁及垃圾处理费</div>
            <div class="alert-desc">2.5个月装修周期预估废料清运费 RM 800–1,500。建议在合同中明确责任方，避免双方日后争议。</div>
          </div>
        </div>

        <div class="alert alert-ok">
          <div class="alert-icon">✅</div>
          <div class="alert-content">
            <div class="alert-title">吊顶施工价格合理</div>
            <div class="alert-desc">RM 12.50/sqft 石膏板吊顶属市场正常范围 (RM 10–18)，含轻钢龙骨及批土工序。</div>
          </div>
        </div>

        <div style="margin-top: 24px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="showPanel('schedule');setTimeout(generateAISchedule,300)">生成工程进度 →</button>
          <button class="btn btn-ghost" onclick="exportReport()">导出 PDF 报告</button>
          <button class="btn btn-ghost" data-i18n="btn_send_owner">Send to Owner for Review</button>
        </div>

        <!-- AI Chat -->
        <div class="ai-chat-box">
          <div class="section-title" style="margin-bottom:16px;">💬 <span data-i18n="chat_title">Ask AI Follow-up</span></div>
          <div id="chat-messages"></div>
          <div class="ai-chat-input-row">
            <input class="ai-chat-input" id="chat-input" data-i18n-placeholder="chat_placeholder"
              placeholder="e.g. Does the bathroom waterproofing meet JKR standards?"
              onkeydown="if(event.key==='Enter') sendChat()">
            <button class="btn btn-gold" onclick="sendChat()" data-i18n="btn_send">Send</button>
          </div>
        </div>
      </div>

      <!-- Panel: Schedule -->
      <div class="panel" id="panel-schedule">
        <div class="panel-title" data-i18n="sched_title">Schedule Planning</div>
        <div class="panel-sub" data-i18n="sched_sub">Calendar sync · Auto-skips weekends & public holidays · Designer can manually override special work days</div>

        <!-- Schedule controls -->
        <div class="sched-controls">
          <div>
            <div class="sched-ctrl-label" data-i18n="sched_start">Start Date</div>
            <input type="date" class="sched-date-input" id="sched-start-date"
              onchange="onStartDateChange(this.value)">
          </div>
          <div style="width:1px;height:32px;background:var(--border2)"></div>
          <div>
            <div class="sched-ctrl-label">🎯 <span data-i18n="sched_deadline">Target Deadline</span></div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <input type="date" class="sched-date-input" id="sched-deadline-date"
                onchange="onDeadlineChange(this.value)">
              <span id="deadline-badge-el" style="display:none"></span>
            </div>
            <div id="deadline-action-row" style="display:none;margin-top:8px;display:none;">
              <button id="btn-compress-deadline"
                style="display:none;padding:5px 12px;font-size:11px;font-weight:700;
                       background:rgba(229,57,53,.08);border:1.5px solid rgba(229,57,53,.3);
                       color:var(--red);border-radius:8px;cursor:pointer;font-family:'DM Sans',sans-serif;
                       transition:all .15s;white-space:nowrap;"
                onmouseenter="this.style.background='rgba(229,57,53,.15)'"
                onmouseleave="this.style.background='rgba(229,57,53,.08)'"
                onclick="compressScheduleToDeadline()">
                📐 自动压缩至截止日期
              </button>
              <button id="btn-deadline-ok-hint"
                style="display:none;padding:5px 12px;font-size:11px;font-weight:700;
                       background:rgba(22,163,74,.08);border:1.5px solid rgba(22,163,74,.2);
                       color:var(--green);border-radius:8px;cursor:default;font-family:'DM Sans',sans-serif;
                       white-space:nowrap;">
                ✓ 进度已在截止日期内
              </button>
            </div>
          </div>
          <div style="width:1px;height:32px;background:var(--border2)"></div>
          <div>
            <div class="sched-ctrl-label" data-i18n="sched_workdays">Work Days</div>
            <div style="display:flex;gap:6px;margin-top:4px;">
              <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text2);cursor:pointer;">
                <input type="checkbox" id="chk-sat" onchange="onWorkdayChange()" style="accent-color:var(--gold)"> <span data-i18n="sched_sat">Sat</span>
              </label>
              <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text2);cursor:pointer;">
                <input type="checkbox" id="chk-sun" onchange="onWorkdayChange()" style="accent-color:var(--gold)"> <span data-i18n="sched_sun">Sun</span>
              </label>
            </div>
            <div style="font-size:10px;color:var(--text3);margin-top:3px;" data-i18n="sched_no_weekend">Weekends excluded by default</div>
          </div>
          <div style="width:1px;height:32px;background:var(--border2)"></div>
          <div id="sched-summary" style="font-size:12px;color:var(--text2);"></div>
          <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn-ai-sched" id="btn-ai-sched" onclick="generateAISchedule()">
              <span id="ai-sched-icon">✨</span> <span id="ai-sched-label" data-i18n="btn_ai_schedule">AI 智能编排</span>
            </button>
            <button class="btn btn-ghost" style="font-size:11px;padding:6px 12px;" onclick="openOverrideModal()" data-i18n="btn_override">
              ✏️ Override Special Work Days
            </button>
          </div>
        </div>

        <div class="ai-review-card">
          <div class="ai-header">
            <span class="ai-badge">GANTT</span>
            <div class="ai-title" data-i18n="gantt_title">Construction Gantt Chart (Calendar Sync)</div>
            <div id="gantt-daterange" style="margin-left:auto;font-size:11px;color:var(--text2);"></div>
          </div>
          <div style="padding:8px 16px 4px;background:rgba(96,165,250,0.04);border-bottom:1px solid var(--border2);font-size:11px;color:var(--text3);">
            💡 点击任意施工行查看细分内容和备料清单 · 拖拽条形图右边缘可调整工期 · 拖拽条形图主体可移动开始时间
          </div>
          <div class="ai-body">
            <div class="gantt-wrap">
              <div class="gantt-outer">
                <div id="gantt-cal-header" class="gantt-cal-header"></div>
                <div id="gantt-chart"></div>
              </div>
            </div>
            <div id="holiday-legend" class="holiday-legend" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border2);"></div>
          </div>
        </div>

        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button class="btn btn-gold" style="background:var(--gold);color:#1B2336;" onclick="openSaveProjectModal()">
            💾 保存为项目
          </button>
          <button class="btn btn-ghost" onclick="exportReport()" data-i18n="btn_export_excel">Export Excel Schedule</button>
          <div style="margin-left:auto;font-size:11px;color:var(--text3);" id="sched-save-hint">排好进度后保存，即可在项目列表中分配工人</div>
        </div>
      </div>

      <!-- Task Detail Overlay -->
      <div class="task-detail-overlay" id="task-detail-overlay" onclick="if(event.target===this)closeTaskDetail()">
        <div class="task-detail-panel" id="task-detail-panel">
          <div class="tdp-header">
            <div class="tdp-color-dot" id="tdp-dot"></div>
            <div class="tdp-name">
              <div class="tdp-title" id="tdp-title"></div>
              <div class="tdp-subtitle" id="tdp-subtitle"></div>
            </div>
            <button class="tdp-close" onclick="closeTaskDetail()">✕</button>
          </div>
          <div class="tdp-body" id="tdp-body"></div>
        </div>
      </div>

      <!-- Override Modal -->
      <div class="modal-overlay" id="modal-override">
        <div class="modal-box" style="max-width:480px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div style="font-size:15px;font-weight:700;">✏️ 手动调整施工日</div>
            <button onclick="closeModal('modal-override')" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;">✕</button>
          </div>
          <div style="font-size:12px;color:var(--text2);margin-bottom:14px;">
            设定特殊日期是否施工（覆盖系统默认）。橙色 = 公共假期，灰色 = 周末。
          </div>
          <div style="margin-bottom:10px;">
            <select id="override-task-select" onchange="renderOverrideDays()"
              style="width:100%;background:var(--surface2);border:1px solid var(--border2);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;font-family:'DM Sans',sans-serif;">
            </select>
          </div>
          <div id="override-day-list" class="override-day-list"></div>
          <div style="display:flex;gap:10px;margin-top:18px;">
            <button class="btn btn-gold" onclick="saveOverrides()">保存调整</button>
            <button class="btn btn-ghost" onclick="closeModal('modal-override')">取消</button>
          </div>
        </div>
      </div>

      <!-- Panel: Export -->
      <div class="panel" id="panel-export">
        <div class="panel-title">导出 & 分享</div>
        <div class="panel-sub">将审核报告和工程进度以专业格式发送给业主</div>

        <div class="two-col">
          <div class="info-card" style="cursor:pointer" onclick="showToast('📄','PDF报告生成中...')">
            <div style="font-size: 36px; margin-bottom: 12px;">📄</div>
            <div style="font-size: 15px; font-weight:600; margin-bottom: 8px;">AI 审核报告 (PDF)</div>
            <div style="font-size: 12px; color:var(--text2);">含评分、漏项警告、价格分析，专业格式可直接给业主签署。</div>
          </div>
          <div class="info-card" style="cursor:pointer" onclick="showToast('📊','Excel进度表生成中...')">
            <div style="font-size: 36px; margin-bottom: 12px;">📊</div>
            <div style="font-size: 15px; font-weight:600; margin-bottom: 8px;">工程进度表 (Excel)</div>
            <div style="font-size: 12px; color:var(--text2);">含甘特图、工序分组、负责人分配，可在工地使用。</div>
          </div>
          <div class="info-card" style="cursor:pointer" onclick="showToast('📱','WhatsApp链接已复制！')">
            <div style="font-size: 36px; margin-bottom: 12px;">💬</div>
            <div style="font-size: 15px; font-weight:600; margin-bottom: 8px;">WhatsApp 分享链接</div>
            <div style="font-size: 12px; color:var(--text2);">生成业主专属链接，通过 WhatsApp 直接分享进度，适合 MY/SG 使用习惯。</div>
          </div>
          <div class="info-card" style="cursor:pointer" onclick="showToast('👷','工人任务包已发送！')">
            <div style="font-size: 36px; margin-bottom: 12px;">👷</div>
            <div style="font-size: 15px; font-weight:600; margin-bottom: 8px;">工人任务包</div>
            <div style="font-size: 12px; color:var(--text2);">将每位工人的任务单独推送，含完工拍照要求和时间节点。</div>
          </div>
        </div>
      </div>

      <!-- Panel: Project Detail -->
      <div class="panel" id="panel-project">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;gap:12px;">
          <div>
            <div class="panel-title">Taman Desa #A22</div>
            <div class="panel-sub">No.22, Jln Desa Utama, Taman Desa, KL · PRJ-2025-041 · 合约 RM 65,000</div>
          </div>
          <div style="display:flex;gap:8px;flex-shrink:0;">
            <button class="btn btn-ghost" onclick="showToast('📤','项目报告已生成')">导出</button>
            <button class="btn btn-gold" onclick="showToast('📱','已发送给业主 Mei Ling')">发送业主</button>
          </div>
        </div>

        <div class="proj-tabs">
          <button class="proj-tab on" id="proj-tab-btn-gantt"   onclick="switchProjTab('gantt',this)">📅 进度表</button>
          <button class="proj-tab"    id="proj-tab-btn-payment" onclick="switchProjTab('payment',this)">💰 分阶段付款</button>
          <button class="proj-tab"    id="proj-tab-btn-client"  onclick="switchProjTab('client',this)">👤 客户资料</button>
          <button class="proj-tab"    id="proj-tab-btn-photos"  onclick="switchProjTab('photos',this)">📸 工地照片</button>
        </div>

        <!-- ── TAB: CLIENT ──────────────────── -->
        <div id="proj-tab-client" style="display:none;">
          <div style="font-size:11px;color:var(--text2);margin-bottom:16px;">客户资料会在上传报价单时自动填入，也可手动编辑</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;" id="client-fields">

            <div style="grid-column:1/-1">
              <div class="client-field-label">公司 / 业主名称</div>
              <input class="client-field-input" id="cf-company" placeholder="例：Ahmad Faris Interior Design Sdn Bhd" value="">
            </div>
            <div>
              <div class="client-field-label">联系人</div>
              <input class="client-field-input" id="cf-attention" placeholder="例：Dato Catherine" value="">
            </div>
            <div>
              <div class="client-field-label">电话</div>
              <input class="client-field-input" id="cf-tel" placeholder="例：+6019-710 2676" value="">
            </div>
            <div>
              <div class="client-field-label">邮箱</div>
              <input class="client-field-input" id="cf-email" placeholder="例：client@email.com" value="">
            </div>
            <div>
              <div class="client-field-label">报价单编号</div>
              <input class="client-field-input" id="cf-ref" placeholder="例：Q-2025-041" value="">
            </div>
            <div style="grid-column:1/-1">
              <div class="client-field-label">施工地址</div>
              <input class="client-field-input" id="cf-address" placeholder="例：No.22, Jln Desa Utama, Taman Desa, KL" value="">
            </div>
            <div style="grid-column:1/-1">
              <div class="client-field-label">项目备注</div>
              <textarea class="client-field-input" id="cf-notes" rows="3" placeholder="例：3房2厅翻新，业主要求现代简约风格..."></textarea>
            </div>
          </div>

          <div style="display:flex;gap:10px;margin-top:20px;align-items:center;">
            <button class="btn btn-gold" onclick="saveClientFields()">💾 保存资料</button>
            <button class="btn btn-ghost" onclick="showToast('📱','已发送资料确认给业主 via WhatsApp')">发送确认给业主</button>
            <div id="client-save-status" style="font-size:12px;color:var(--green);display:none;">✓ 已保存</div>
          </div>
        </div>

        <!-- ── TAB: GANTT ─────────────────── -->
        <div id="proj-tab-gantt" style="display:none;">

          <!-- Dirty banner (shown when schedule modified but not published) -->
          <div id="proj-dirty-banner" class="proj-dirty-banner" style="display:none;">
            <div class="pulse-dot"></div>
            <div style="flex:1;">
              <strong style="color:var(--gold-dk,#C89B09);">进度已修改，尚未同步给工人</strong>
              <div style="font-size:11px;margin-top:2px;">拖拽调整后请点击「确认并发布」，工人端将即时更新</div>
            </div>
            <button class="btn btn-gold" style="padding:6px 14px;font-size:12px;flex-shrink:0;" onclick="openPublishModal()">确认并发布</button>
          </div>

          <!-- Gantt container -->
          <div class="proj-gantt-wrap">
            <div class="proj-gantt-hdr">
              <div>
                <span style="font-weight:700;color:var(--text);" id="proj-gantt-title">施工进度表</span>
                <span style="margin-left:8px;" id="proj-gantt-daterange"></span>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <span style="font-size:10px;color:var(--text3);">点击任务查看详情 · 拖拽调整工期</span>
                <button class="btn btn-gold" style="padding:5px 12px;font-size:11px;" onclick="openPublishModal()">
                  📤 确认并发布
                </button>
              </div>
            </div>
            <!-- Table header row: label | gantt track | workers -->
            <div style="display:grid;grid-template-columns:180px 1fr 160px;background:var(--surface2);border-bottom:1px solid var(--border2);">
              <div style="padding:6px 10px;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;border-right:1px solid var(--border2);">工序</div>
              <div id="proj-gantt-cal-header" style="display:flex;border-right:1px solid var(--border2);min-width:0;overflow:hidden;"></div>
              <div style="padding:6px 10px;font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;">分配工人</div>
            </div>
            <div id="proj-gantt-chart" style="min-width:0;"></div>
          </div>

          <!-- Assignment status summary -->
          <div id="proj-assignment-summary" style="margin-top:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border2);border-radius:10px;font-size:12px;color:var(--text3);">
            尚未分配工人 · 点击各工序旁的「+ 分配」选择工人
          </div>
        </div>

        <!-- ── TAB: PAYMENT ─────────────────── -->
        <div id="proj-tab-payment" style="display:none;">
          <div class="payment-summary">
            <div class="pay-sum-card">
              <div class="pay-sum-val" style="color:var(--gold)" id="total-contract">RM 65,000</div>
              <div class="pay-sum-label">合约总额（含VO）</div>
            </div>
            <div class="pay-sum-card">
              <div class="pay-sum-val" style="color:var(--green)" id="total-received">RM 39,000</div>
              <div class="pay-sum-label">已收款</div>
            </div>
            <div class="pay-sum-card">
              <div class="pay-sum-val" style="color:var(--text2)" id="total-pending">RM 26,000</div>
              <div class="pay-sum-label">待收款</div>
            </div>
          </div>

          <div style="font-size:11px;letter-spacing:1.5px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:10px;">付款期数</div>
          <div class="payment-list" id="payment-list"><!-- rendered by JS --></div>
          <button class="add-pay-row" onclick="addPayRow()">＋ 新增付款期</button>

          <div class="vo-header">
            <span class="vo-title">VO 变更指令 · Variation Orders</span>
            <button class="btn btn-ghost" style="padding:5px 14px;font-size:12px;" onclick="addVORow()">＋ 新增 VO</button>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:10px;">VO 项目自动追加至付款进度，并更新合约总额</div>
          <div class="payment-list" id="vo-list"><!-- rendered by JS --></div>
        </div>

        <!-- ── TAB: PHOTOS ──────────────────── -->
        <div id="proj-tab-photos" style="display:none;">

          <!-- Worker upload zone (simulates worker APP upload) -->
          <div class="upload-photo-zone" onclick="simulateWorkerUpload()">
            📷 <strong style="color:var(--gold)">模拟工人上传照片</strong>（点击体验审核流程）
          </div>

          <div class="photo-filter" id="photo-filter">
            <button class="photo-filter-btn on" onclick="filterPhotos('all',this)">全部</button>
            <button class="photo-filter-btn" onclick="filterPhotos('pending',this)">⏳ 待审核 <span id="pending-count" style="background:var(--orange);color:#0d0f14;border-radius:8px;padding:1px 6px;font-size:10px;margin-left:4px;">2</span></button>
            <button class="photo-filter-btn" onclick="filterPhotos('approved',this)">✓ 已通过</button>
            <button class="photo-filter-btn" onclick="filterPhotos('masonry',this)">🧱 泥水</button>
            <button class="photo-filter-btn" onclick="filterPhotos('ceiling',this)">🏛️ 吊顶</button>
            <button class="photo-filter-btn" onclick="filterPhotos('mande',this)">⚡ 水电</button>
          </div>

          <div id="photo-gallery"><!-- rendered by JS --></div>
        </div>

      </div>

      <!-- Panel: Workers -->
      <div class="panel" id="panel-workers">
        <div class="panel-title">工人名册</div>
        <div class="panel-sub">通过电话号码添加工人 · 工人需在 APP 接受邀请后才加入名册</div>

        <button class="add-worker-btn" onclick="openAddWorker()">
          ＋ 添加工人（输入电话号码）
        </button>

        <!-- Pending invite banner -->
        <div id="pending-banner" style="background:rgba(251,146,60,0.08);border:1px solid rgba(251,146,60,0.25);border-radius:10px;padding:12px 16px;margin-bottom:20px;display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px">⏳</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:var(--orange)">1 份邀请待回复</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">Siti Aminah (+6011-2345-6789) · 已发送 WhatsApp 邀请 · 2小时前</div>
          </div>
          <button onclick="this.parentElement.style.display='none'; showToast('🔔','已取消对 Siti Aminah 的邀请')" style="background:transparent;border:none;color:var(--text3);cursor:pointer;font-size:18px;padding:4px;">×</button>
        </div>

        <div style="font-size:11px;letter-spacing:1.5px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:12px;">已加入名册 · 5人</div>
        <div class="roster-grid" id="roster-grid">
          <!-- Rendered by JS -->
        </div>
      </div>


      <!-- ═══════════════════════════════════════════
           Panel: Price Library
      ═══════════════════════════════════════════ -->
      <div class="panel" id="panel-pricelibrary">
        <div class="panel-title">💰 价格数据库</div>
        <div class="panel-sub">基于马来西亚 2025 年市场数据 · 通过上传报价单持续学习更新 · AI 审核时自动对比</div>

        <!-- Pro gate (shown to free users) -->
        <div id="price-lib-gate" style="display:none;">
          <div class="pro-gate-banner">
            <div class="pro-gate-icon">💰</div>
            <div class="pro-gate-title">价格数据库 — Pro 专属功能</div>
            <div class="pro-gate-sub">
              升级至 Pro 即可解锁马来西亚 2025 年装修市场参考价格库，AI 审核报价单时自动对比市场行情，
              并通过你上传的报价单数据持续自我学习更新。
            </div>
            <div style="padding:12px 16px;background:rgba(240,185,11,.06);border:1px solid rgba(240,185,11,.2);border-radius:10px;font-size:12px;color:var(--text2);text-align:left;max-width:320px;">
              <div style="font-weight:700;color:var(--gold-dk,#C89B09);margin-bottom:6px;">✦ Pro 价格库包含：</div>
              <div style="line-height:2;">· 22+ 工程类别市场低/均/高价<br>· 按你的历史报价单自动校准<br>· 每次 AI 分析后自动比较偏差<br>· 识别报价单中的异常高价项目</div>
            </div>
            <button class="btn btn-gold" style="padding:12px 28px;font-size:14px;" onclick="switchPortal('pricing')">升级 Pro · RM 99/月 →</button>
          </div>
        </div>

        <!-- Actual content (shown to Pro/Elite) -->
        <div id="price-lib-content">
          <!-- AI Learning notice -->
          <div id="price-ai-learning-bar" style="display:none;margin-bottom:14px;padding:10px 14px;background:rgba(0,201,167,.06);border:1px solid rgba(0,201,167,.2);border-radius:10px;display:flex;align-items:center;gap:10px;">
            <span style="font-size:16px;">🤖</span>
            <div style="flex:1;">
              <div style="font-size:11px;font-weight:700;color:var(--teal);">价格库已从你的报价单中学习更新</div>
              <div style="font-size:10px;color:var(--text3);" id="price-learning-count">已分析 1 份报价单 · 涵盖 3 个工程类别</div>
            </div>
          </div>

          <!-- Search + filter bar -->
          <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;align-items:center;">
            <input class="profile-input" style="flex:1;min-width:200px;" id="price-search" placeholder="🔍 搜索工程项目…" oninput="filterPriceTable()">
            <div style="display:flex;gap:6px;flex-wrap:wrap;" id="price-cat-filter">
              <button class="photo-filter-btn on" onclick="setPriceCat('all',this)">全部</button>
              <button class="photo-filter-btn" onclick="setPriceCat('masonry',this)">🧱 泥水</button>
              <button class="photo-filter-btn" onclick="setPriceCat('carpentry',this)">🪵 木工</button>
              <button class="photo-filter-btn" onclick="setPriceCat('mne',this)">⚡ 水电</button>
              <button class="photo-filter-btn" onclick="setPriceCat('painting',this)">🎨 油漆</button>
              <button class="photo-filter-btn" onclick="setPriceCat('tiling',this)">🔲 地砖</button>
            </div>
          </div>

          <div class="ai-review-card" style="padding:0;overflow:hidden;">
            <div style="overflow-x:auto;">
              <table class="price-table" id="price-library-table">
                <thead>
                  <tr>
                    <th>工程项目</th>
                    <th>单位</th>
                    <th>市场低价</th>
                    <th>市场均价</th>
                    <th>市场高价</th>
                    <th>分类</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody id="price-table-body">
                </tbody>
              </table>
            </div>
          </div>
          <div style="margin-top:12px;font-size:11px;color:var(--text3);">
            📊 基础数据：马来西亚装修行业参考价 2025 · 每次上传报价单后 AI 自动校正更新
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           Panel: My Settings (我的设定)
      ═══════════════════════════════════════════ -->
      <div class="panel" id="panel-mysettings">
        <div class="panel-title">⚙️ 我的设定</div>
        <div class="panel-sub">管理个人资料 · 公司信息 · 订阅方案 · 通知偏好</div>

        <!-- Tab row -->
        <div class="settings-tab-row">
          <button class="settings-tab on" id="stab-profile"  onclick="switchSettingsTab('profile',this)">👤 个人资料</button>
          <button class="settings-tab"    id="stab-company"  onclick="switchSettingsTab('company',this)">🏢 公司资料</button>
          <button class="settings-tab"    id="stab-plan"     onclick="switchSettingsTab('plan',this)">✦ 我的方案</button>
          <button class="settings-tab"    id="stab-prefs"    onclick="switchSettingsTab('prefs',this)">🔔 偏好设置</button>
        </div>

        <!-- ── TAB: Profile ────────────────────── -->
        <div id="stab-content-profile">
          <div class="profile-avatar-row">
            <div class="profile-avatar-circle" id="settings-avatar-circle">AF</div>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text);" id="settings-display-name">Ahmad Faris</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px;" id="settings-display-role">设计师 · 免费版</div>
              <button onclick="showToast('📷','头像上传功能开发中')" style="margin-top:8px;padding:4px 12px;font-size:11px;background:var(--surface3);border:1px solid var(--border2);border-radius:6px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text2);">更换头像</button>
            </div>
          </div>

          <div class="profile-section">
            <div class="profile-section-title">基本信息</div>
            <div class="profile-field-row">
              <div class="profile-field">
                <label class="profile-label">姓名</label>
                <input class="profile-input" id="pf-name" value="Ahmad Faris">
              </div>
              <div class="profile-field">
                <label class="profile-label">手机号码</label>
                <div style="display:flex;gap:6px;">
                  <div style="padding:9px 10px;background:var(--surface2);border:1.5px solid var(--border2);border-radius:8px;font-size:12px;color:var(--text3);white-space:nowrap;">🇲🇾 +60</div>
                  <input class="profile-input" id="pf-phone" value="11-2345 6789" style="flex:1;">
                </div>
              </div>
            </div>
            <div class="profile-field-row">
              <div class="profile-field">
                <label class="profile-label">电子邮件</label>
                <input class="profile-input" id="pf-email" placeholder="ahmad@example.com">
              </div>
              <div class="profile-field">
                <label class="profile-label">IC / 护照号</label>
                <input class="profile-input" id="pf-ic" placeholder="850101-14-1234">
              </div>
            </div>
          </div>

          <div class="profile-save-bar">
            <button class="btn btn-gold" onclick="saveProfileSettings()">💾 保存更改</button>
            <span id="profile-save-status" style="display:none;font-size:12px;color:var(--green);">✓ 已保存</span>
          </div>
        </div>

        <!-- ── TAB: Company ────────────────────── -->
        <div id="stab-content-company" style="display:none;">
          <div class="profile-section">
            <div class="profile-section-title">公司 / 工作室信息</div>
            <div class="profile-field-row full">
              <div class="profile-field">
                <label class="profile-label">公司 / 工作室名称</label>
                <input class="profile-input" id="co-name" placeholder="Ahmad Faris Interior Design Sdn Bhd">
              </div>
            </div>
            <div class="profile-field-row">
              <div class="profile-field">
                <label class="profile-label">营业执照编号 (SSM)</label>
                <input class="profile-input" id="co-ssm" placeholder="202301234567 (123456-A)">
              </div>
              <div class="profile-field">
                <label class="profile-label">公司电话</label>
                <input class="profile-input" id="co-tel" placeholder="03-1234 5678">
              </div>
            </div>
            <div class="profile-field-row full">
              <div class="profile-field">
                <label class="profile-label">公司地址</label>
                <input class="profile-input" id="co-address" placeholder="No.1, Jalan Example, 50000 Kuala Lumpur">
              </div>
            </div>
            <div class="profile-field-row">
              <div class="profile-field">
                <label class="profile-label">公司网站</label>
                <input class="profile-input" id="co-web" placeholder="https://ahmadfarisdesign.com">
              </div>
              <div class="profile-field">
                <label class="profile-label">营业税编号 (SST / GST)</label>
                <input class="profile-input" id="co-sst" placeholder="W10-1234-32000123">
              </div>
            </div>
            <div class="profile-field-row full">
              <div class="profile-field">
                <label class="profile-label">报价单页脚 (出现在所有导出报告底部)</label>
                <input class="profile-input" id="co-footer" placeholder="Payment term: 50% deposit upon confirmation. All prices inclusive of GST." style="font-size:11px;">
              </div>
            </div>
          </div>
          <div class="profile-save-bar">
            <button class="btn btn-gold" onclick="saveCompanySettings()">💾 保存更改</button>
            <span id="company-save-status" style="display:none;font-size:12px;color:var(--green);">✓ 已保存</span>
          </div>
        </div>

        <!-- ── TAB: Plan ───────────────────────── -->
        <div id="stab-content-plan" style="display:none;">
          <div style="padding:16px;background:rgba(240,185,11,.05);border:1px solid rgba(240,185,11,.2);border-radius:12px;margin-bottom:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
              <div>
                <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">当前方案</div>
                <div class="settings-plan-badge" id="settings-plan-badge">✦ 免费版</div>
              </div>
              <button class="btn btn-gold" onclick="switchPortal('pricing')">查看所有方案 →</button>
            </div>
          </div>
          <div class="profile-section-title">当前方案包含</div>
          <ul class="plan-feature-list" id="settings-plan-features">
            <li>✅ 3 次 AI 报价单分析（终身有效）</li>
            <li>✅ AI 施工进度编排</li>
            <li>✅ 甘特图 + 拖拽调整</li>
            <li>✅ 工人端 + 业主端（预览）</li>
            <li style="color:var(--text3);">— 报价单上传（订阅功能）</li>
            <li style="color:var(--text3);">— AI 市场价格对比</li>
            <li style="color:var(--text3);">— 导出 Excel/PDF</li>
          </ul>
          <div style="padding:12px;background:var(--surface2);border-radius:10px;font-size:12px;color:var(--text3);">
            AI 额度已用：<strong id="settings-ai-used" style="color:var(--text);">1 / 3 次</strong>
          </div>
        </div>

        <!-- ── TAB: Preferences ────────────────── -->
        <div id="stab-content-prefs" style="display:none;">
          <div class="profile-section">
            <div class="profile-section-title">语言 / Language</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="setLang('zh');showToast('🌐','已切换至中文')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--gold);background:rgba(240,185,11,.08);color:var(--gold-dk,#C89B09);font-weight:700;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;">中文</button>
              <button onclick="setLang('en');showToast('🌐','Language set to English')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border2);background:var(--surface);color:var(--text2);font-weight:600;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;">English</button>
              <button onclick="setLang('ms');showToast('🌐','Bahasa Malaysia dipilih')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border2);background:var(--surface);color:var(--text2);font-weight:600;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;">Bahasa Malaysia</button>
            </div>
          </div>
          <div class="profile-section">
            <div class="profile-section-title">地区 / Region</div>
            <div style="display:flex;gap:8px;">
              <button onclick="currentRegion='MY';rebuildGantt();showToast('📍','切换至马来西亚假期')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--gold);background:rgba(240,185,11,.08);color:var(--gold-dk,#C89B09);font-weight:700;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;">🇲🇾 马来西亚</button>
              <button onclick="currentRegion='SG';rebuildGantt();showToast('📍','切换至新加坡假期')" style="padding:8px 16px;border-radius:8px;border:1.5px solid var(--border2);background:var(--surface);color:var(--text2);font-weight:600;cursor:pointer;font-size:12px;font-family:'DM Sans',sans-serif;">🇸🇬 新加坡</button>
            </div>
          </div>
          <div class="profile-section">
            <div class="profile-section-title">通知设置</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;cursor:pointer;">
                <span style="font-size:13px;color:var(--text2);">工人完工上传照片</span>
                <input type="checkbox" checked style="accent-color:var(--gold);width:16px;height:16px;">
              </label>
              <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;cursor:pointer;">
                <span style="font-size:13px;color:var(--text2);">业主付款确认</span>
                <input type="checkbox" checked style="accent-color:var(--gold);width:16px;height:16px;">
              </label>
              <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;cursor:pointer;">
                <span style="font-size:13px;color:var(--text2);">工期预警（超期前 3 天）</span>
                <input type="checkbox" checked style="accent-color:var(--gold);width:16px;height:16px;">
              </label>
              <label style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface2);border-radius:8px;cursor:pointer;">
                <span style="font-size:13px;color:var(--text2);">AI 分析完成提醒</span>
                <input type="checkbox" style="accent-color:var(--gold);width:16px;height:16px;">
              </label>
            </div>
          </div>
        </div>

      </div>


      <!-- ═══════════════════════════════════════════
           Panel: Dashboard — 我的后台
      ═══════════════════════════════════════════ -->
      <div class="panel" id="panel-dashboard">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div class="panel-title" style="margin:0;">📊 我的后台</div>
          <button onclick="renderDashboard()" style="padding:6px 12px;font-size:11px;border:1px solid var(--border2);border-radius:8px;background:var(--surface2);cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--text2);">🔄 刷新</button>
        </div>
        <div class="panel-sub" style="margin-bottom:16px;">项目总览 · 付款数据 · 工人绩效 · AI 用量可视化</div>
        <div id="dashboard-content">
          <div style="padding:40px;text-align:center;color:var(--text3);">
            <div style="font-size:32px;margin-bottom:12px;">📊</div>
            <div style="font-size:13px;font-weight:600;">点击刷新加载后台数据</div>
          </div>
        </div>
      </div>

    </div><!-- /main-content -->
  </div><!-- /designer-layout -->
</div><!-- /portal-designer -->

<!-- ═══════════════════════════════════════
     PORTAL 2: OWNER APP
═══════════════════════════════════════ -->
<div class="portal" id="portal-owner">
  <div class="app-portal">

    <div class="app-info fade-up">
      <div style="font-size:11px; color:var(--gold); letter-spacing:2px; font-weight:600; margin-bottom:12px;">业主端 · OWNER APP</div>
      <div class="app-info-title">掌握装修<br>每一个细节</div>
      <div class="app-info-desc">实时查看工程进度，随时随地审批决策。不再需要频繁到工地，所有信息一目了然。</div>
      <ul class="feature-list">
        <li>实时工程进度百分比 + 阶段时间线</li>
        <li>收到设计师审核报告，一键确认签字</li>
        <li>工人完工照片同步查阅</li>
        <li>收到付款节点提醒（分期）</li>
        <li>工程问题即时通知</li>
        <li>支持 Bahasa / English / 中文</li>
      </ul>
      <div style="margin-top: 24px; display:flex; gap: 10px;">
        <button class="btn btn-gold">📱 下载 APP</button>
        <button class="btn btn-ghost">了解更多</button>
      </div>
    </div>

    <!-- Mobile Frame -->
    <div class="mobile-frame fade-up">
      <div class="mobile-notch"><div class="mobile-notch-pill"></div></div>

      <div class="mobile-header">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div class="mobile-greeting">你好，Mei Ling 👋</div>
            <div class="mobile-name">装修进度</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:var(--text3);">预计完工</div>
            <div style="font-size:13px; font-weight:600; color:var(--gold);">2 Jul 2025</div>
          </div>
        </div>
      </div>

      <div class="mobile-project-card">
        <div class="project-name">当前项目</div>
        <div class="project-addr">🏠 No. 22, Jln Desa Utama, Taman Desa, KL</div>
        <div class="big-progress">
          <div class="big-pct">47%</div>
          <div class="big-pct-label">工程完成</div>
        </div>
        <div class="progress-bar-full">
          <div class="progress-bar-fill" style="width:47%"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:11px; color:rgba(255,255,255,.65);">
          <span>开工 15 Apr</span>
          <span>第6周 / 共11周</span>
          <span>完工 2 Jul</span>
        </div>
      </div>

      <!-- Notification banner -->
      <div onclick="showToast('🔔','审核报告已确认！设计师将收到通知。')" style="margin: 0 16px 12px; background: rgba(240,185,11,0.1); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; cursor:pointer; display:flex; align-items:center; gap: 10px;">
        <span style="font-size: 20px;">📋</span>
        <div style="flex:1;">
          <div style="font-size: 12px; font-weight: 600; color: var(--gold);">待确认：AI 审核报告</div>
          <div style="font-size: 11px; color: var(--text2); margin-top:2px;">点击查看 3 项漏算警告</div>
        </div>
        <div style="font-size: 18px; color: var(--text3);">›</div>
      </div>

      <div class="mobile-tabs">
        <div class="mobile-tab active" onclick="ownerTab(this,'tl')">进度时间线</div>
        <div class="mobile-tab" onclick="ownerTab(this,'photos')">完工照片</div>
        <div class="mobile-tab" onclick="ownerTab(this,'payments')">付款节点</div>
      </div>

      <div class="mobile-scroll">
        <!-- Timeline Tab -->
        <div id="owner-tab-tl">
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-done"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">拆除工程</div>
              <div class="tl-date">15 Apr – 19 Apr</div>
              <div class="tl-status tl-s-done">✓ 已完成</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-done"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">水电布线暗槽</div>
              <div class="tl-date">22 Apr – 3 May</div>
              <div class="tl-status tl-s-done">✓ 已完成</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-done"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">泥水 / 防水工程</div>
              <div class="tl-date">6 May – 24 May</div>
              <div class="tl-status tl-s-done">✓ 已完成</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-active"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">🔨 石膏板吊顶施工</div>
              <div class="tl-date">27 May – 7 Jun</div>
              <div class="tl-status tl-s-active">● 进行中 (第3天)</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-pending"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">铺砖 & 木地板</div>
              <div class="tl-date">10 Jun – 21 Jun</div>
              <div class="tl-status tl-s-pending">○ 待开始</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-pending"></div>
              <div class="tl-line"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">木工柜体安装</div>
              <div class="tl-date">10 Jun – 21 Jun</div>
              <div class="tl-status tl-s-pending">○ 待开始</div>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot-wrap">
              <div class="tl-dot tl-pending"></div>
            </div>
            <div class="tl-content">
              <div class="tl-title">油漆 & 收尾</div>
              <div class="tl-date">24 Jun – 1 Jul</div>
              <div class="tl-status tl-s-pending">○ 待开始</div>
            </div>
          </div>
        </div>

        <!-- Photos Tab (hidden) -->
        <div id="owner-tab-photos" style="display:none;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div style="background:var(--surface3); border-radius:8px; height:100px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; cursor:pointer;" onclick="showToast('📸','查看客厅吊顶完工照')">
              <span style="font-size:24px;">🏠</span>
              <span style="font-size:10px; color:var(--text3)">客厅吊顶 · 今天</span>
            </div>
            <div style="background:var(--surface3); border-radius:8px; height:100px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; cursor:pointer;" onclick="showToast('📸','查看水电布线完工照')">
              <span style="font-size:24px;">🔌</span>
              <span style="font-size:10px; color:var(--text3)">水电布线 · 3 May</span>
            </div>
            <div style="background:var(--surface3); border-radius:8px; height:100px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; cursor:pointer;" onclick="showToast('📸','查看防水工程完工照')">
              <span style="font-size:24px;">🚿</span>
              <span style="font-size:10px; color:var(--text3)">防水层 · 24 May</span>
            </div>
            <div style="background:var(--surface3); border-radius:8px; height:100px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:4px; cursor:pointer; border: 1px dashed var(--border2);">
              <span style="font-size:20px; color:var(--text3)">+</span>
              <span style="font-size:10px; color:var(--text3)">更多照片</span>
            </div>
          </div>
        </div>

        <!-- Payments Tab (hidden) -->
        <div id="owner-tab-payments" style="display:none;">
          <div style="font-size:12px; color:var(--text2); margin-bottom:12px;">付款总额：RM 65,000（分4期）</div>
          <div style="space-y:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface3); border-radius:8px; margin-bottom:8px;">
              <div>
                <div style="font-size:13px; font-weight:600">第一期 · 签约</div>
                <div style="font-size:11px; color:var(--green); margin-top:2px;">✓ 已付 15 Apr</div>
              </div>
              <div style="font-weight:700; color:var(--green)">RM 19,500</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface3); border-radius:8px; margin-bottom:8px;">
              <div>
                <div style="font-size:13px; font-weight:600">第二期 · 泥水完成</div>
                <div style="font-size:11px; color:var(--green); margin-top:2px;">✓ 已付 25 May</div>
              </div>
              <div style="font-weight:700; color:var(--green)">RM 19,500</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background: rgba(240,185,11,0.08); border: 1px solid var(--border); border-radius:8px; margin-bottom:8px;">
              <div>
                <div style="font-size:13px; font-weight:600">第三期 · 木工完成</div>
                <div style="font-size:11px; color:var(--gold); margin-top:2px;">⏳ 预计 22 Jun</div>
              </div>
              <div style="font-weight:700; color:var(--gold)">RM 16,250</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface3); border-radius:8px;">
              <div>
                <div style="font-size:13px; font-weight:600">尾款 · 竣工移交</div>
                <div style="font-size:11px; color:var(--text3); margin-top:2px;">○ 预计 2 Jul</div>
              </div>
              <div style="font-weight:700; color:var(--text3)">RM 9,750</div>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /mobile-frame -->
  </div><!-- /app-portal -->
</div><!-- /portal-owner -->

<!-- ═══════════════════════════════════════
     PORTAL 3: WORKER APP — CALENDAR + MULTI-SITE
═══════════════════════════════════════ -->
<div class="portal" id="portal-worker">
  <div class="app-portal">

    <div class="app-info fade-up">
      <div style="font-size:11px; color:var(--teal); letter-spacing:2px; font-weight:600; margin-bottom:12px;">工人端 · WORKER APP</div>
      <div class="app-info-title" style="color:var(--text)">多工地，<br>一目了然</div>
      <div class="app-info-desc">日历视图查看整月施工安排，多个工地进度清晰分色显示。点击任意日期查看当天任务，完成后拍照打卡。</div>
      <ul class="feature-list">
        <li>月历视图：整月工地分配一眼看清</li>
        <li>多工地彩色进度条，施工状态一目了然</li>
        <li>点击日期查看当天详细任务</li>
        <li>完工拍照上传，业主设计师同步看到</li>
        <li>问题上报（附照片），设计师立即收到</li>
        <li>打卡上下班 · 支持离线使用</li>
      </ul>
      <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div style="padding:14px; background:var(--teal-lt,#E0FAF5); border:1px solid rgba(0,201,167,0.2); border-radius:10px;">
          <div style="font-size:20px; font-weight:700; color:var(--teal); line-height:1;">4</div>
          <div style="font-size:11px; color:var(--text2); margin-top:3px;">进行中工地</div>
        </div>
        <div style="padding:14px; background:rgba(240,185,11,0.06); border:1px solid rgba(240,185,11,0.2); border-radius:10px;">
          <div style="font-size:20px; font-weight:700; color:var(--gold); line-height:1;">RM 1,240</div>
          <div style="font-size:11px; color:var(--text2); margin-top:3px;">本周薪酬</div>
        </div>
      </div>
    </div>

    <!-- Worker Mobile Frame -->
    <div class="mobile-frame fade-up" id="worker-mobile-frame">
      <div class="mobile-notch"><div class="mobile-notch-pill"></div></div>

      <!-- Worker Header -->
      <div class="worker-header" style="padding:14px 16px 10px;">
        <div class="worker-avatar-wrap">
          <div class="worker-app-avatar" id="worker-app-avatar" onclick="openAvatarChange()" title="点击更换头像">
            <img id="worker-avatar-img" src="" alt="" style="display:none">
            <span id="worker-avatar-initials">KS</span>
            <div class="avatar-change-hint">📷</div>
          </div>
          <div style="flex:1">
            <div class="worker-day" id="wk-today-label">MONDAY · 9 MAR 2026</div>
            <div class="worker-title" style="font-size:17px;">Kumar Selvam</div>
            <div class="worker-sub">木工 · 4 工地进行中</div>
          </div>
          <div onclick="showToast('🔔','3条新消息')" style="cursor:pointer;position:relative;">
            <div style="font-size:20px;">🔔</div>
            <div style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;border-radius:50%;background:var(--red);"></div>
          </div>
        </div>
      </div>

      <!-- Worker Nav Tabs -->
      <div style="display:flex;border-bottom:1px solid var(--border2);background:var(--surface);">
        <button class="wk-tab active" id="wtab-calendar" onclick="switchWorkerTab('calendar')">📅 日历</button>
        <button class="wk-tab" id="wtab-tasks" onclick="switchWorkerTab('tasks')">✅ 今日任务</button>
        <button class="wk-tab" id="wtab-sites" onclick="switchWorkerTab('sites')">🏗 工地</button>
      </div>

      <!-- ── TAB: CALENDAR ─────────────────── -->
      <div id="wk-tab-calendar" class="wk-tab-content mobile-scroll" style="max-height:520px;padding:0;">

        <!-- Calendar Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px 8px;">
          <button onclick="wkCalPrev()" style="background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);cursor:pointer;font-size:14px;">‹</button>
          <div style="text-align:center;">
            <div style="font-size:15px;font-weight:700;color:var(--text)" id="wk-cal-month-label">June 2025</div>
            <div style="font-size:10px;color:var(--text3);margin-top:1px;">点击日期查看任务</div>
          </div>
          <button onclick="wkCalNext()" style="background:var(--surface2);border:1px solid var(--border2);border-radius:6px;padding:4px 10px;color:var(--text2);cursor:pointer;font-size:14px;">›</button>
        </div>

        <!-- Site/Role/Status legend header -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;padding:4px 16px 6px;gap:4px;">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;">工地</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;">工种</div>
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;">状态</div>
        </div>
        <div id="wk-site-legend" style="padding:0 16px 10px;display:flex;flex-direction:column;gap:4px;"></div>

        <!-- Day-of-week headers -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);padding:0 10px;margin-bottom:2px;">
          <div class="wk-cal-dow">日</div><div class="wk-cal-dow">一</div><div class="wk-cal-dow">二</div>
          <div class="wk-cal-dow">三</div><div class="wk-cal-dow">四</div><div class="wk-cal-dow">五</div><div class="wk-cal-dow">六</div>
        </div>

        <!-- Calendar Grid -->
        <div id="wk-cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);padding:0 10px;gap:2px 1px;"></div>

        <!-- Selected Day Tasks -->
        <div id="wk-day-tasks" style="margin:10px 14px 4px;display:none;"></div>

        <!-- Site Progress Cards -->
        <div style="padding:12px 14px 6px;border-top:1px solid var(--border2);margin-top:8px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">工地进度</div>
          <div id="wk-site-cards"></div>
        </div>

      </div><!-- /calendar tab -->

      <!-- ── TAB: TODAY TASKS ───────────────── -->
      <div id="wk-tab-tasks" class="wk-tab-content mobile-scroll" style="display:none;max-height:520px;padding:12px 14px;">

        <!-- Date & summary -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:12px;color:var(--text3);" id="wk-tasks-date">今日任务 · Mon 9 Mar 2026</div>
            <div style="font-size:16px;font-weight:700;color:var(--text)" id="wk-tasks-summary">3个工地 · 5项任务</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:700;color:var(--teal)" id="wk-tasks-done-ratio">2/5</div>
            <div style="font-size:10px;color:var(--text3);">已完成</div>
          </div>
        </div>

        <!-- Overall progress bar -->
        <div style="background:var(--surface3);border:1px solid var(--border2);border-radius:4px;height:5px;margin-bottom:16px;overflow:hidden;">
          <div id="wk-overall-bar" style="width:40%;height:100%;background:linear-gradient(90deg,var(--teal),#22d3ee);border-radius:4px;transition:width .4s;"></div>
        </div>

        <div id="wk-today-task-list"></div>

        <!-- Issue report -->
        <div style="margin-top:10px;padding:12px;background:rgba(229,57,53,0.05);border:1px solid rgba(229,57,53,0.18);border-radius:10px;cursor:pointer;" onclick="showToast('🚨','问题已上报！设计师将在5分钟内查看。')">
          <div style="font-size:12px;font-weight:600;color:var(--red);margin-bottom:3px;">⚠️ 发现问题？</div>
          <div style="font-size:11px;color:var(--text2);">点击上报异常（漏水/结构/材料不足）</div>
        </div>

      </div><!-- /tasks tab -->

      <!-- ── TAB: SITES ─────────────────────── -->
      <div id="wk-tab-sites" class="wk-tab-content mobile-scroll" style="display:none;max-height:520px;padding:12px 14px;">
        <div id="wk-sites-detail"></div>
      </div>

      <!-- Bottom action bar -->
      <div class="checkin-strip">
        <button class="btn-checkin btn-in" style="width:100%;" onclick="wkCheckin()">⏱ 打卡上班</button>
      </div>

    </div><!-- /mobile-frame -->
  </div><!-- /app-portal -->
</div><!-- /portal-worker -->

<!-- ═══════════════════════════════════════
     PORTAL 4: PRICING PAGE
═══════════════════════════════════════ -->
<div class="portal" id="portal-pricing" style="background:var(--bg);min-height:100vh;padding:0;">

  <!-- Pricing Hero -->
  <div style="text-align:center;padding:60px 24px 36px;max-width:900px;margin:0 auto;">
    <div style="display:inline-block;padding:5px 14px;background:rgba(240,185,11,.1);border:1px solid rgba(240,185,11,.25);border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--gold-dk,#C89B09);text-transform:uppercase;margin-bottom:20px;">Simple Pricing · 简单透明定价</div>
    <h1 style="font-family:'Cormorant Garamond','Corbel',serif;font-size:clamp(28px,5vw,44px);font-weight:700;color:var(--text);line-height:1.15;margin:0 0 16px;">
      让 AI 帮你赚更多，<br>不是让你花更多
    </h1>
    <p style="font-size:15px;color:var(--text2);line-height:1.75;max-width:560px;margin:0 auto;">
      每位新注册设计师免费获得 <strong style="color:var(--text)">3 次 AI 分析额度</strong>（终身有效）。<br>
      每个月订阅即可上传报价单 + 解锁全部功能。
    </p>
    <div id="pricing-demo-banner" style="margin-top:24px;display:inline-flex;align-items:center;gap:10px;padding:10px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;font-size:12px;color:var(--text2);">
      <div style="width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite;flex-shrink:0;"></div>
      <span>你的账户：<strong id="pricing-account-status" style="color:var(--text);">免费版 · 已用 1/3 次</strong></span>
      <span style="color:var(--border2);">|</span>
      <span style="color:var(--gold-dk,#C89B09);font-weight:600;cursor:pointer;" onclick="pricingSelectPlan('pro')">升级 →</span>
    </div>
  </div>

  <!-- 3 Plan Cards -->
  <div style="display:flex;gap:16px;max-width:1080px;margin:0 auto;padding:0 20px 60px;flex-wrap:wrap;justify-content:center;">

    <!-- FREE CARD -->
    <div id="plan-card-free" class="pricing-card" onclick="pricingSelectPlan('free')" style="flex:1;min-width:280px;max-width:320px;">
      <div class="pricing-card-inner">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;">
          <div>
            <div class="pricing-plan-name">免费版</div>
            <div class="pricing-plan-sub">先试试，不满意不收费</div>
          </div>
          <div class="pricing-plan-badge free-badge">当前方案</div>
        </div>
        <div class="pricing-amount">
          <span class="pricing-currency">RM</span>
          <span class="pricing-price">0</span>
          <span class="pricing-period">/永久</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px;">注册即获，无需信用卡</div>
        <div class="pricing-usage-block" style="margin-top:16px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:11px;color:var(--text2);">AI 分析额度</span>
            <span style="font-size:11px;font-weight:700;color:var(--text);" id="free-usage-text">1 / 3 次已用</span>
          </div>
          <div style="background:var(--surface3);border-radius:4px;height:6px;overflow:hidden;">
            <div id="free-usage-bar" style="height:100%;border-radius:4px;background:var(--gold);width:33%;transition:width .5s;"></div>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:5px;" id="free-usage-hint">还剩 2 次 · 用完后订阅继续使用</div>
        </div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li class="feat-yes">✓ 3 次 AI 报价单分析（终身）</li>
          <li class="feat-yes">✓ AI 施工进度编排</li>
          <li class="feat-yes">✓ 甘特图 + 拖拽调整</li>
          <li class="feat-yes">✓ 工人端 + 业主端（预览）</li>
          <li class="feat-no">— 不含报价单上传（订阅功能）</li>
          <li class="feat-no">— 无 AI 市场价格对比</li>
          <li class="feat-no">— 无导出 Excel/PDF</li>
          <li class="feat-no">— 限 1 个项目</li>
        </ul>
        <button class="pricing-btn pricing-btn-ghost" disabled>当前方案</button>
      </div>
    </div>

    <!-- PRO CARD -->
    <div id="plan-card-pro" class="pricing-card pricing-card-pro" onclick="pricingSelectPlan('pro')" style="flex:1;min-width:280px;max-width:320px;">
      <div class="pricing-popular-tag">🔥 最多人选择</div>
      <div class="pricing-card-inner">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;">
          <div>
            <div class="pricing-plan-name" style="color:var(--gold-dk,#C89B09);">Pro 专业版</div>
            <div class="pricing-plan-sub">全功能解锁，让 AI 做你的助理</div>
          </div>
          <div class="pricing-plan-badge pro-badge">推荐</div>
        </div>
        <div class="pricing-amount">
          <span class="pricing-currency">RM</span>
          <span class="pricing-price">99</span>
          <span class="pricing-period">/月</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px;">≈ RM 3.30/天 · 按月付，随时取消</div>
        <div style="margin:14px 0 10px;padding:10px 12px;background:rgba(240,185,11,.07);border:1px solid rgba(240,185,11,.2);border-radius:8px;">
          <div style="font-size:11px;color:var(--gold-dk,#C89B09);font-weight:700;margin-bottom:3px;">💡 ROI 测算</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.6;">每次分析省 2–4小时 = <strong style="color:var(--green);">RM 160–600</strong><br>50次额度回报率 <strong style="color:var(--green);">160–600倍</strong></div>
        </div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li class="feat-yes feat-gold">✦ 每月上传报价单 × 50次</li>
          <li class="feat-yes feat-gold">✦ 每月 50 次 AI 分析额度</li>
          <li class="feat-yes feat-gold">✦ AI 市场价格对比</li>
          <li class="feat-yes">✓ 无限项目管理</li>
          <li class="feat-yes">✓ Excel + PDF 进度表导出</li>
          <li class="feat-yes">✓ 工人端多工地日历</li>
          <li class="feat-yes">✓ 业主端付款追踪</li>
          <li class="feat-yes">✓ WhatsApp 进度推送</li>
          <li class="feat-yes">✓ 优先客服支持</li>
        </ul>
        <button class="pricing-btn pricing-btn-gold" onclick="handleUpgradeClick(event,'pro')">
          <span id="upgrade-btn-label">✦ 升级 Pro · RM 99/月</span>
        </button>
        <div style="text-align:center;font-size:10px;color:var(--text3);margin-top:8px;">无合约 · 随时取消 · FPX / 信用卡 / TNG</div>
      </div>
    </div>

    <!-- ELITE CARD -->
    <div id="plan-card-elite" class="pricing-card" onclick="pricingSelectPlan('elite')"
      style="flex:1;min-width:280px;max-width:320px;border-color:rgba(46,107,230,.3);box-shadow:0 0 0 1px rgba(46,107,230,.12),0 8px 32px rgba(46,107,230,.06);">
      <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--blue);color:#fff;font-size:10px;font-weight:700;letter-spacing:1px;padding:4px 14px;border-radius:20px;white-space:nowrap;">⚡ 无限版</div>
      <div class="pricing-card-inner">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;">
          <div>
            <div class="pricing-plan-name" style="color:var(--blue);">Elite 无限版</div>
            <div class="pricing-plan-sub">大量项目 · 事务所级别使用</div>
          </div>
          <div class="pricing-plan-badge" style="background:rgba(46,107,230,.1);color:var(--blue);border:1px solid rgba(46,107,230,.25);">无限额度</div>
        </div>
        <div class="pricing-amount">
          <span class="pricing-currency">RM</span>
          <span class="pricing-price">499</span>
          <span class="pricing-period">/月</span>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:3px;">≈ RM 16.60/天 · 最高可覆盖 5 名设计师</div>
        <div style="margin:14px 0 10px;padding:10px 12px;background:rgba(46,107,230,.06);border:1px solid rgba(46,107,230,.18);border-radius:8px;">
          <div style="font-size:11px;color:var(--blue);font-weight:700;margin-bottom:3px;">🏢 适合场景</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.6;">每月 20+ 报价单 · 多设计师团队<br>年费可再省 <strong style="color:var(--blue);">RM 1,190</strong></div>
        </div>
        <div class="pricing-divider"></div>
        <ul class="pricing-features">
          <li class="feat-yes" style="color:var(--blue);font-weight:700;">⚡ 无限次 AI 分析额度</li>
          <li class="feat-yes" style="color:var(--blue);font-weight:700;">⚡ 每月无限上传报价单</li>
          <li class="feat-yes feat-gold">✦ AI 市场价格对比</li>
          <li class="feat-yes">✓ 最多 5 名团队成员</li>
          <li class="feat-yes">✓ 无限项目管理</li>
          <li class="feat-yes">✓ 全部导出功能</li>
          <li class="feat-yes">✓ 专属客户经理</li>
          <li class="feat-yes">✓ 自定义品牌报告</li>
          <li class="feat-yes">✓ API 访问权限</li>
        </ul>
        <button class="pricing-btn" style="width:100%;background:var(--blue);color:#fff;box-shadow:0 3px 12px rgba(46,107,230,.25);" onclick="handleUpgradeClick(event,'elite')">
          <span id="upgrade-elite-label">⚡ 升级 Elite · RM 499/月</span>
        </button>
        <div style="text-align:center;font-size:10px;color:var(--text3);margin-top:8px;">年付优惠 RM 4,790 · 省 RM 1,198</div>
      </div>
    </div>

  </div><!-- /plan cards -->

  <!-- Feature comparison table — 3 cols -->
  <div style="max-width:800px;margin:0 auto;padding:0 20px 60px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-family:'Cormorant Garamond','Corbel',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:6px;">详细功能对比</div>
      <div style="font-size:13px;color:var(--text3);">看清楚每个方案包含什么</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;overflow:hidden;">
      <div style="display:grid;grid-template-columns:1fr 90px 90px 90px;background:var(--surface2);padding:12px 20px;border-bottom:1px solid var(--border2);">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;">功能</div>
        <div style="font-size:12px;font-weight:700;color:var(--text2);text-align:center;">免费</div>
        <div style="font-size:12px;font-weight:700;color:var(--gold-dk,#C89B09);text-align:center;">Pro ✦</div>
        <div style="font-size:12px;font-weight:700;color:var(--blue);text-align:center;">Elite ⚡</div>
      </div>
      <div id="pricing-compare-table"></div>
    </div>
  </div>

  <!-- FAQ -->
  <div style="max-width:640px;margin:0 auto;padding:0 20px 80px;">
    <div style="text-align:center;font-family:'Cormorant Garamond','Corbel',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:28px;">常见问题</div>
    <div id="pricing-faq"></div>
  </div>

  <!-- Bottom CTA -->
  <div style="text-align:center;padding:52px 24px;background:linear-gradient(180deg,var(--surface) 0%,var(--bg) 100%);border-top:1px solid var(--border2);">
    <div style="font-family:'Cormorant Garamond','Corbel',serif;font-size:26px;font-weight:700;color:var(--text);margin-bottom:8px;">还在犹豫？先免费试用</div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:24px;">注册即获 3 次免费 AI 分析额度，无需信用卡</div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <button class="pricing-btn pricing-btn-gold" style="padding:13px 28px;font-size:13px;" onclick="handleUpgradeClick(event,'pro')">✦ 升级 Pro · RM 99/月</button>
      <button class="pricing-btn" style="padding:13px 28px;font-size:13px;background:var(--blue);color:#fff;" onclick="handleUpgradeClick(event,'elite')">⚡ Elite · RM 499/月</button>
      <button class="pricing-btn pricing-btn-ghost" style="padding:13px 28px;font-size:13px;" onclick="switchPortal('designer')">← 返回工作台</button>
    </div>
  </div>

</div><!-- /portal-pricing -->

<!-- UPGRADE SUCCESS MODAL -->
<div class="modal-overlay" id="modal-upgrade" onclick="if(event.target===this)closeModal('modal-upgrade')">
  <div class="modal-box" style="text-align:center;max-width:420px;padding:32px 28px;">
    <div style="font-size:44px;margin-bottom:10px;">🎉</div>
    <div style="font-size:22px;font-weight:700;font-family:'Cormorant Garamond','Corbel',serif;color:var(--text);margin-bottom:4px;">订阅成功！</div>
    <div id="upgrade-plan-name" style="display:inline-block;padding:3px 12px;background:rgba(240,185,11,.12);border:1px solid rgba(240,185,11,.3);border-radius:20px;font-size:12px;font-weight:700;color:var(--gold-dk,#C89B09);margin-bottom:16px;">Pro 专业版 ✦</div>
    <div style="font-size:13px;color:var(--text2);line-height:1.75;margin-bottom:20px;">
      本月重置日：<strong id="upgrade-reset-date" style="color:var(--text);">2026年4月9日</strong>
    </div>
    <div style="background:rgba(240,185,11,.06);border:1px solid rgba(240,185,11,.18);border-radius:12px;padding:16px;margin-bottom:20px;text-align:left;">
      <div style="font-size:10px;font-weight:700;color:var(--gold-dk,#C89B09);letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">✦ 已解锁功能</div>
      <div style="font-size:12px;color:var(--text2);line-height:2.1;">
        ✓ 每月无限上传报价单<br>
        ✓ <span id="upgrade-credits-line">50 次 AI 分析额度/月</span><br>
        ✓ AI 市场价格对比<br>
        ✓ Excel + PDF 导出<br>
        ✓ 无限项目管理
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;justify-content:center;margin-bottom:16px;font-size:12px;color:var(--text3);">
      <span id="upgrade-quota-line">每月无限上传报价单</span>
      <span>·</span>
      <span id="upgrade-price-line">RM 99/月</span>
    </div>
    <button class="pricing-btn pricing-btn-gold" style="width:100%;padding:13px;" onclick="closeModal('modal-upgrade');switchPortal('designer');syncUsageUI()">开始使用 →</button>
  </div>
</div>
═══════════════════════════════════════ -->
<div class="modal-overlay" id="modal-add-worker">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('modal-add-worker')">×</button>
    <div class="modal-title">添加工人</div>
    <div class="modal-sub">输入工人电话号码，系统将搜索是否已注册</div>

    <div id="add-step-search">
      <div class="form-group">
        <label class="form-label">工人电话号码</label>
        <div class="phone-prefix">
          <select id="add-country-code">
            <option value="+60">🇲🇾 +60</option>
            <option value="+65">🇸🇬 +65</option>
          </select>
          <input type="tel" id="add-phone" placeholder="11-2345-6789" maxlength="12">
        </div>
      </div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="searchWorker()">搜索工人</button>
    </div>

    <!-- Result: Found -->
    <div id="add-result-found" style="display:none">
      <div class="invite-result invite-found">
        <div class="invite-result-top">
          <div class="wrc-avatar" style="width:44px;height:44px;font-size:16px;background:rgba(22,163,74,0.1);color:var(--green);border-color:rgba(74,222,128,0.3);">AH</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600;color:var(--text)">Ali bin Hamid</div>
            <div style="font-size:11px;color:var(--text2);margin-top:2px">泥水工 · ⭐ 4.8 · 完成率 96%</div>
          </div>
          <div style="font-size:18px;">✅</div>
        </div>
        <div style="font-size:11px;color:var(--text2);margin-top:8px;padding-top:8px;border-top:1px solid rgba(74,222,128,0.15);">已在平台注册 · 发送邀请后工人需在 APP 手动接受</div>
      </div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="sendInvite()">📱 发送 WhatsApp 邀请</button>
    </div>

    <!-- Result: Not Found -->
    <div id="add-result-notfound" style="display:none">
      <div class="invite-result invite-notfound">
        <div style="font-size:13px;font-weight:600;color:var(--orange);margin-bottom:4px;">⚠ 此号码尚未注册</div>
        <div style="font-size:11px;color:var(--text2);">将发送 WhatsApp 注册邀请链接给此号码</div>
      </div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="sendRegisterInvite()">📱 发送注册邀请链接</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════
     MODAL: WORKER REGISTRATION (4 STEPS)
═══════════════════════════════════════ -->
<div class="modal-overlay" id="modal-register">
  <div class="modal-box">
    <button class="modal-close" onclick="closeModal('modal-register')">×</button>

    <!-- Step indicator -->
    <div class="step-indicator" id="reg-steps">
      <div class="step-dot active" id="sdot-1">1</div>
      <div class="step-line" id="sline-1"></div>
      <div class="step-dot" id="sdot-2">2</div>
      <div class="step-line" id="sline-2"></div>
      <div class="step-dot" id="sdot-3">3</div>
      <div class="step-line" id="sline-3"></div>
      <div class="step-dot" id="sdot-4">4</div>
    </div>

    <!-- Step 1: Phone -->
    <div id="reg-step-1">
      <div class="modal-title">工人注册</div>
      <div class="modal-sub">输入手机号码 · 将通过 WhatsApp 发送验证码</div>
      <div class="form-group">
        <label class="form-label">手机号码</label>
        <div class="phone-prefix">
          <select>
            <option>🇲🇾 +60</option>
            <option>🇸🇬 +65</option>
          </select>
          <input type="tel" id="reg-phone" placeholder="11-2345-6789" maxlength="12">
        </div>
      </div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="regNextStep(1)">📱 发送 WhatsApp 验证码</button>
    </div>

    <!-- Step 2: OTP -->
    <div id="reg-step-2" style="display:none">
      <div class="modal-title">输入验证码</div>
      <div class="modal-sub" id="otp-hint">已发送 6 位验证码至你的 WhatsApp</div>
      <div class="otp-row">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,0)">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,1)">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,2)">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,3)">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,4)">
        <input class="otp-box" maxlength="1" oninput="otpNext(this,5)">
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:16px;">Demo 验证码：<strong style="color:var(--gold);font-family:'DM Mono'">8 8 8 8 8 8</strong></div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="regNextStep(2)">验证</button>
    </div>

    <!-- Step 3: Profile -->
    <div id="reg-step-3" style="display:none">
      <div class="modal-title">填写资料</div>
      <div class="modal-sub">完成后即可接收工地任务</div>
      <div class="form-group">
        <label class="form-label">姓名</label>
        <input class="form-input" type="text" placeholder="Full Name / 全名" id="reg-name">
      </div>
      <div class="form-group">
        <label class="form-label">工种 <span style="color:var(--text3);font-weight:400;letter-spacing:0">(可多选)</span></label>
        <div class="trade-select-grid" id="trade-grid">
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🧱</span>泥水工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">💧</span>防水工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">⚡</span>电工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🔧</span>水管工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">❄️</span>冷气工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🪵</span>木工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🔲</span>地砖工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🟫</span>地板工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🪨</span>石工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🎨</span>油漆工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🔨</span>拆除工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🪟</span>铝窗工</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">⚙️</span>铁工/铁闸</div>
          <div class="trade-option" onclick="selectTrade(this)"><span class="trade-option-icon">🧹</span>清洁员</div>
        </div>
      </div>
      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;" onclick="regNextStep(3)">下一步 →</button>
    </div>

    <!-- Step 4: Avatar (mandatory) -->
    <div id="reg-step-4" style="display:none">
      <div class="modal-title">上传头像</div>
      <div class="modal-sub">用于工地身份识别，必须上传本人照片</div>

      <div class="avatar-upload-area" onclick="document.getElementById('reg-avatar-input').click()">
        <div class="avatar-preview" id="reg-avatar-preview">📷</div>
        <div class="avatar-upload-hint">
          <strong>点击拍照或选取相册图片</strong><br>
          请上传清晰的正面照，用于工地打卡识别
        </div>
        <div class="avatar-required">⚠ 必须上传，不可跳过</div>
        <input type="file" id="reg-avatar-input" accept="image/*" capture="user" style="display:none" onchange="previewAvatar(this,'reg-avatar-preview','reg-avatar-done')">
      </div>

      <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;opacity:0.4;cursor:not-allowed;" id="reg-avatar-done" onclick="completeRegistration()" disabled>
        完成注册 ✓
      </button>
    </div>

  </div>
</div>

<!-- ═══════════════════════════════════════
     MODAL: CHANGE AVATAR (Worker App)
═══════════════════════════════════════ -->
<div class="modal-overlay" id="modal-avatar-change">
  <div class="modal-box" style="max-width:360px">
    <button class="modal-close" onclick="closeModal('modal-avatar-change')">×</button>
    <div class="modal-title">更换头像</div>
    <div class="modal-sub">请上传本人清晰照片</div>

    <div class="avatar-upload-area" onclick="document.getElementById('change-avatar-input').click()">
      <div class="avatar-preview" id="change-avatar-preview">
        <img id="change-avatar-current" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;">
        <span id="change-avatar-icon">KS</span>
      </div>
      <div class="avatar-upload-hint"><strong>点击选择新照片</strong></div>
      <input type="file" id="change-avatar-input" accept="image/*" capture="user" style="display:none" onchange="previewAvatar(this,'change-avatar-preview','change-avatar-save')">
    </div>

    <button class="btn btn-gold" style="width:100%;padding:12px;justify-content:center;opacity:0.4;" id="change-avatar-save" onclick="saveAvatar()" disabled>
      保存头像
    </button>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast">
  <div class="toast-icon" id="toast-icon">✅</div>
  <div class="toast-text" id="toast-text">操作成功</div>
</div>

<script>
// ══════════════════════════════════════════
//  PORTAL & PANEL SWITCHING
// ══════════════════════════════════════════

function switchPortal(name) {
  document.querySelectorAll('.portal').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.portal-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('portal-' + name)?.classList.add('active');
  document.getElementById('btn-' + name)?.classList.add('active');
  if (name === 'pricing') initPricingPage();
  if (name === 'worker')  renderWorkerCalendar();
  // Auth gate: show overlay if not logged in
  if ((name === 'designer' || name === 'owner' || name === 'worker') && typeof AUTH_STATE !== 'undefined') {
    if (!AUTH_STATE[name]) {
      const ov = document.getElementById('auth-' + name);
      if (ov) {
        ov.classList.remove('hidden');
        authSwitchTab(name, 'login');
      }
    }
  }
}

function showPanel(name, navEl) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const panel = document.getElementById('panel-' + name);
  if (panel) panel.classList.add('active');
  if (navEl) navEl.classList.add('active');
  else {
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.getAttribute('onclick') && n.getAttribute('onclick').includes("'"+name+"'")) n.classList.add('active');
    });
  }
  // trigger renders when panel opens
  if (name === 'project')     { renderPayment(); }
  if (name === 'pricelibrary') { setTimeout(() => checkPriceLibAccess(), 50); }
  if (name === 'dashboard')    { setTimeout(() => renderDashboard(), 50); }
  if (name === 'mysettings')   {
    setTimeout(() => {
      const d = document.getElementById('settings-display-name');
      if (d) d.textContent = AUTH_STATE?.currentUser?.designer?.name || 'Ahmad Faris';
      const r = document.getElementById('settings-display-role');
      const planName = PRICING_STATE?.plan === 'free' ? '免费版' : PRICING_STATE?.plan === 'pro' ? 'Pro' : 'Elite';
      if (r) r.textContent = '设计师 · ' + planName;
    }, 50);
  }
}

// ── Owner Tabs ───────────────────────────
function ownerTab(el, name) {
  document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('[id^="owner-tab-"]').forEach(t => t.style.display = 'none');
  document.getElementById('owner-tab-' + name).style.display = 'block';
}

// ── Toast ─────────────────────────────────
function showToast(icon, text) {
  const t = document.getElementById('toast');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-text').textContent = text;
  t.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Export ────────────────────────────────
function exportReport() {
  showToast('📄', '正在生成报告文件...');
  setTimeout(() => showToast('✅', '报告已准备好，请检查下载文件夹'), 2000);
}

// ── Complete Task ─────────────────────────
function completeTask3() {
  const check = document.getElementById('task3-check');
  check.classList.add('done');
  check.textContent = '✓';
  showToast('✅', '任务已完成！请拍照上传存档。');
}

// ══════════════════════════════════════════
//  QUOTATION UPLOAD & AI ANALYSIS
// ══════════════════════════════════════════

let lastQuotationText = '';

function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
}

function handleFileSelect(input) {
  const file = input.files[0];
  if (file) processFile(file);
}

function resetUpload() {
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-zone').style.display = 'block';
  document.getElementById('ai-loading-state').style.display = 'none';
  document.getElementById('file-input').value = '';
  document.getElementById('q-table-rows').innerHTML = '';
  document.getElementById('missing-items-section').innerHTML = '';
  document.getElementById('ai-alerts-section').innerHTML = '';
  document.getElementById('ai-score-body').innerHTML = '';
  const old = document.getElementById('client-extract-card');
  if (old) old.remove();
  lastQuotationText = '';
  lastAnalysisResult = null;
}

async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  document.getElementById('upload-zone').style.display = 'none';
  document.getElementById('ai-loading-state').style.display = 'block';
  setAIProgress(10, '正在读取文件...');

  try {
    let text = '';

    if (ext === 'csv' || ext === 'txt') {
      text = await file.text();
    } else if (ext === 'xlsx' || ext === 'xls') {
      text = await readExcel(file);
    } else if (ext === 'pdf') {
      setAIProgress(15, 'PDF 解析中 (PDF.js)...');
      text = await readPDF(file);
    } else {
      text = await file.text();
    }

    lastQuotationText = text;
    setAIProgress(35, 'AI 正在解析报价项目...');

    // Update file info
    document.getElementById('file-type-icon').textContent = ext === 'pdf' ? '📄' : ext === 'csv' ? '📋' : '📊';
    document.getElementById('file-name-display').textContent = file.name;

    setAIProgress(55, 'AI 对比 MY/SG 市场价格库...');
    await analyzeWithClaude(text, file.name);

  } catch (err) {
    console.error(err);
    document.getElementById('ai-loading-state').style.display = 'none';
    document.getElementById('upload-zone').style.display = 'block';
    showToast('❌', '文件读取失败，请检查文件格式');
  }
}

function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        let output = '';
        wb.SheetNames.forEach(sheetName => {
          const sheet = wb.Sheets[sheetName];
          output += `[工作表: ${sheetName}]\n`;
          output += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
        });
        resolve(output);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function readPDF(file) {
  try {
    // Configure PDF.js worker
    if (typeof pdfjsLib === 'undefined') {
      return `[PDF 文件: ${file.name}]\nPDF.js 尚未加载，请刷新页面后重试。`;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = pdf.numPages;
    let fullText = `[PDF 文件: ${file.name} · ${numPages} 页]\n\n`;
    let extractedChars = 0;

    for (let pageNum = 1; pageNum <= Math.min(numPages, 20); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group items by approximate Y position (same line = same row)
      const lines = {};
      textContent.items.forEach(item => {
        if (!item.str || !item.str.trim()) return;
        const y = Math.round(item.transform[5]); // Y position
        if (!lines[y]) lines[y] = [];
        lines[y].push({ x: item.transform[4], text: item.str });
      });

      // Sort lines top-to-bottom (PDF Y is bottom-up, so descending)
      const sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a);
      const pageLines = sortedYs.map(y => {
        // Sort items left-to-right within each line
        const items = lines[y].sort((a, b) => a.x - b.x);
        // Join with tab if gap > 20px (suggests columns), else space
        let line = '';
        let prevX = null;
        items.forEach(item => {
          if (prevX !== null) {
            const gap = item.x - prevX;
            line += gap > 20 ? '\t' : ' ';
          }
          line += item.text;
          prevX = item.x + (item.text.length * 5); // approx char width
        });
        return line.trim();
      }).filter(l => l.length > 0);

      if (pageLines.length > 0) {
        fullText += pageLines.join('\n') + '\n\n';
        extractedChars += pageLines.join('').length;
      }

      // Update progress
      setAIProgress(15 + Math.round((pageNum / numPages) * 20), `PDF 解析中 (${pageNum}/${numPages} 页)...`);
    }

    // Check if we actually got useful text
    if (extractedChars < 30) {
      return `[PDF 文件: ${file.name}]\n\n⚠️ 此 PDF 为扫描图片格式（无文字层），无法直接提取文字。\n\n建议操作：\n1. 使用 Adobe Acrobat / Microsoft Lens OCR 扫描后转为可复制文本\n2. 直接将内容复制粘贴到 .txt 文件后上传\n3. 请承包商提供 Excel (.xlsx) 版本的报价单`;
    }

    return fullText;

  } catch (err) {
    console.error('PDF.js error:', err);
    // Friendly error based on error type
    const msg = err.message || '';
    if (msg.includes('password') || msg.includes('encrypt')) {
      return `[PDF 文件: ${file.name}]\n\n🔒 此 PDF 已加密/受密码保护，无法读取。\n请请承包商提供无密码版本的 PDF 或 Excel 格式。`;
    }
    return `[PDF 文件: ${file.name}]\n\n❌ PDF 解析失败：${msg}\n\n请尝试：\n1. 确保 PDF 包含可选取的文字（非扫描图片）\n2. 转为 .xlsx 或 .csv 格式后重新上传\n3. 将报价内容复制粘贴到 .txt 文件`;
  }
}

function setAIProgress(pct, text) {
  document.getElementById('ai-progress-bar').style.width = pct + '%';
  document.getElementById('ai-status-text').textContent = text;
}

async function analyzeWithClaude(quotationText, fileName) {
  // Use up to 14000 chars to cover multi-page PDFs (7 pages ≈ 12,000–18,000 chars)
  const textForAI = quotationText.length > 14000
    ? quotationText.substring(0, 14000) + '\n\n[...内容已截断，以上为前 14000 字符...]'
    : quotationText;

  const prompt = `你是马来西亚和新加坡装修行业的专业报价审核 AI（RenoSmart）。

请仔细分析以下报价单，严格按 JSON 格式输出。只返回 JSON，不要任何其他文字或 markdown。

报价单原始内容：
\`\`\`
${textForAI}
\`\`\`

═══ 极重要规则 ═══

【规则0 — 区分"出单方"与"收单方"★★★最重要★★★】
报价单结构通常是：
  - 页眉/信头 = 出单的【承包商/设计公司】（如 NEUF DESIGN SDN BHD、ABC RENOVATION SDN BHD）
  - 页面主体左上角 = 【客户】，即收到报价的公司/个人（通常有 ATTENTION: 某人）
  - 关键识别：客户是报价单**寄送给/地址给**的那一方，通常在 "TO:" 或直接列出公司名+地址+ATTENTION+TEL

正确识别示例（来自本报价单格式）：
  - 承包商（出单方）= 信头公司，忽略，不放入 client
  - 客户（收单方）= 报价单正文开头列出的公司+地址+ATTENTION 那一行组合
    如："ITS ASSET MANAGEMENT SDN BHD / 21 JALAN BUKIT IMPIAN 18/2 / JOHOR BAHRU / ATTENTION: DATO CATHERINE / TEL: +6019-710 2676"
    则 company="ITS ASSET MANAGEMENT SDN BHD", attention="Dato Catherine", tel="+6019-710 2676", address="21 Jalan Bukit Impian 18/2, Taman Bukit Impian, Johor Bahru"

【规则1 — 客户资料识别】
报价单正文上方通常有客户资料区，包含：公司名、地址、收件人（ATTENTION/ATT/DATO/TAN/MS/MR）、电话（TEL/HP/+60）、邮箱。
这些行【绝对不是工程项目】，必须抽取到 "client" 字段，不得出现在 "items" 中。
"DESCRIPTION"、"NO"、"ITEM"、空白行、分节标题（如 GROUND FLOOR、FIRST FLOOR、CEILING WORK 等）均不是工程项目。

【规则2 — 分节小计处理】
报价单中有形如 "GROUND FLOOR RM 27,510.00"、"FLOORING WORK RM 36,666.00" 的分节合计行。
这些是小计标题，放入 "subtotals" 数组，不放入 "items"。

【规则3 — 数字黄金定律】
- ★★ 每一行里最大的数字 = 小计(total)
- 若原文某列为空，对应字段填 null
- 若只有 qty 和 total，无 unitPrice → 计算 unitPrice = total ÷ qty，unitPriceDerived=true
- 总价必须与原文完全一致，不得用 qty × unitPrice 替换
- 单位照抄原文（sqft/sqm/nos/lot/set/ft/sq/L/sum 等）

【规则4 — 工程项目判断标准】
只有描述施工动作的行才是工程项目：Hack / Supply / Install / Lay / Paint / Plaster / Replace / Remove / Construct / Demolish 等动词开头，或中文施工动词（铺设/安装/批土/粉刷/拆除/防水等）。

【规则5 — 提取所有项目，不遗漏】
报价单可能跨多页、多楼层。必须提取每一个工程项目，不得因数量多而省略。

返回格式：
{
  "client": {
    "company": "客户公司名（非承包商）",
    "address": "完整地址",
    "attention": "联系人姓名",
    "tel": "电话",
    "email": "邮箱或 null",
    "projectRef": "报价单编号",
    "projectName": "项目名称/地点"
  },
  "score": {
    "total": 整体评分0-100,
    "completeness": 项目完整性0-100,
    "price": 单价合理性0-100,
    "logic": 工序逻辑性0-100,
    "risk": 漏项风险0-100
  },
  "summary": "一句话总结（中文，提及项目地点和类型）",
  "items": [
    {
      "no": "原文序号",
      "section": "所属分节（如 Ground Floor Construction / Flooring Work / Ceiling Work 等）",
      "name": "完整工程描述",
      "unit": "单位或 null",
      "qty": 数量或 null,
      "unitPrice": 单价或 null,
      "unitPriceDerived": true或false,
      "total": 小计（必须与原文完全一致）或 null,
      "status": "ok|warn|flag|nodata",
      "note": "AI备注（中文）"
    }
  ],
  "subtotals": [
    { "label": "分节标题", "amount": 金额 }
  ],
  "totalAmount": 报价总额或 null,
  "missing": ["缺失项目1", "缺失项目2"],
  "alerts": [
    { "level": "critical|warning|info", "title": "标题", "desc": "详细说明（中文）" }
  ]
}

MY/SG 2025 价格参考：
${getRegionPriceNote()}
若无单价数据 status 填 "nodata"，不要乱填 ok/warn。
必查漏项：防水工程(湿区)、水电暗槽布线、清洁及废料处理。`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    setAIProgress(85, '正在生成审核报告...');
    const data = await resp.json();
    const rawText = data.content?.[0]?.text || '';

    let result;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      result = buildMockResult(quotationText);
    }

    setAIProgress(100, '分析完成！');
    setTimeout(() => renderAnalysisResult(result, fileName, quotationText), 500);

  } catch (err) {
    setAIProgress(100, '分析完成（演示模式）');
    setTimeout(() => renderAnalysisResult(buildMockResult(quotationText), fileName, quotationText), 500);
  }
}

function buildMockResult(text) {
  // ─────────────────────────────────────────────────────────────
  //  STEP 1: split all lines into column arrays
  // ─────────────────────────────────────────────────────────────
  const toNum = s => {
    if (s == null) return null;
    const n = parseFloat(String(s).replace(/[,\s RM$]/g, ''));
    return isNaN(n) ? null : n;
  };
  const fmtNum = (n, decimals) => {
    if (n == null) return null;
    // preserve meaningful decimals
    const rounded = Math.round(n * 1000) / 1000;
    if (decimals != null) return rounded.toFixed(decimals);
    // auto: if integer display as integer, else 2dp
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  };

  const rawLines = text.split('\n');
  // detect delimiter: tab-separated or comma-separated
  const sampleLine = rawLines.find(l => l.includes('\t') || l.split(',').length > 3) || rawLines[0] || '';
  const delim = sampleLine.includes('\t') ? '\t' : ',';

  const splitLine = line => line.split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''));

  const allRows = rawLines.map(splitLine);

  // ─────────────────────────────────────────────────────────────
  //  STEP 2: find header row → detect column positions
  // ─────────────────────────────────────────────────────────────
  const COL_PATTERNS = {
    no:        /^(no\.?|#|s\.?n\.?|item)$/i,
    desc:      /^(desc|description|item|work|particulars|detail|scope|kerja)/i,
    unit:      /^(unit|uom|ukuran)$/i,
    qty:       /^(qty|quantity|jumlah|kawasan|area|size|sqft|measurement|dimension)/i,
    unitPrice: /^(unit\s*price|unit\s*rate|rate|harga|price|u\.?p\.?|r\.?m\.?\s*\/|up)$/i,
    total:     /^(total|amount|sub.?total|jumlah|harga\s*total|rm|value)$/i,
  };

  let colIdx = { no:-1, desc:-1, unit:-1, qty:-1, unitPrice:-1, total:-1 };
  let headerRowIdx = -1;

  for (let i = 0; i < Math.min(allRows.length, 15); i++) {
    const row = allRows[i];
    let matchCount = 0;
    const tempIdx = { no:-1, desc:-1, unit:-1, qty:-1, unitPrice:-1, total:-1 };
    row.forEach((cell, j) => {
      for (const [key, re] of Object.entries(COL_PATTERNS)) {
        if (re.test(cell.trim()) && tempIdx[key] === -1) {
          tempIdx[key] = j;
          matchCount++;
        }
      }
    });
    if (matchCount >= 3) { // found header row
      colIdx = tempIdx;
      headerRowIdx = i;
      break;
    }
  }

  // ─────────────────────────────────────────────────────────────
  //  STEP 3: client info extraction
  // ─────────────────────────────────────────────────────────────
  const clientInfo = { company:null, address:null, attention:null, tel:null, email:null, projectRef:null };
  const addressKW = /\b(JOHOR BAHRU|JOHOR|KUALA LUMPUR|KL|SELANGOR|PENANG|KLANG|PETALING JAYA|SUBANG|CHERAS|AMPANG|KEPONG|JB|SINGAPORE|SG)\b/i;
  const personKW  = /^(DATO|DATIN|TAN SRI|DATUK|DR|MR|MRS|MS|ENCIK|PUAN|CIK)\b/i;
  const workKW    = /\b(hack|supply|install|lay|paint|plaster|replace|remove|demolish|construct|build|apply|coat|waterproof|fix|fabricate|provide|erect|grind|chip|tile|timber|ceiling|wall|floor|door|window|glass|electrical|plumbing|air|wiring)\b/i;
  const workCN    = /[拆铺安装批粉防刷架设供贴做喷刮]/;

  const preHeaderLines = rawLines.slice(0, Math.max(headerRowIdx, 10));
  preHeaderLines.forEach(line => {
    const raw = line.trim();
    if (!raw) return;
    if (/^(TEL|HP|H\/P|FAX|PHONE)\s*[:：]/i.test(raw)) {
      clientInfo.tel = raw.replace(/^[^:：]+[:：]\s*/, '').trim();
    } else if (/^(ATTENTION|ATT|ATTN)\s*[:：]/i.test(raw)) {
      clientInfo.attention = raw.replace(/^[^:：]+[:：]\s*/, '').trim();
    } else if (/\b[\w.+-]+@[\w-]+\.\w+/.test(raw)) {
      clientInfo.email = raw.match(/[\w.+-]+@[\w-]+\.\w+/)[0];
    } else if (/^(REF|QUOT?A?TION\s*NO|Q\s*NO)\s*[:：]/i.test(raw)) {
      clientInfo.projectRef = raw.replace(/^[^:：]+[:：]\s*/, '').trim();
    } else if (addressKW.test(raw) && !workKW.test(raw)) {
      clientInfo.address = (clientInfo.address ? clientInfo.address + ', ' : '') + raw;
    } else if (personKW.test(raw) && !workKW.test(raw)) {
      clientInfo.attention = raw;
    }
  });

  // ─────────────────────────────────────────────────────────────
  //  STEP 4: extract work items
  // ─────────────────────────────────────────────────────────────
  const skipKW  = /^(description|item|no\.?|qty|unit|rate|amount|total|sub[\s-]?total|remark|note|sn|s\/n|#|rm)$/i;
  const sectionHdr = /^(section|part|phase|area|zone|category|room|a\.|b\.|c\.)\s/i;
  const unitWords   = /^(sqft|sqm|sf|sm|nos?|lot|set|ft|m|pc|pcs|ls|lump\s*sum|unit|roll|length|pair|point|plug|light|ceiling|fan|run|run\s*m|rm)$/i;

  const items = [];
  let grandTotal = 0;
  const subtotals = [];

  const dataRows = allRows.slice(headerRowIdx >= 0 ? headerRowIdx + 1 : 0);

  dataRows.forEach(cols => {
    const raw = cols.join(' ').trim();
    if (!raw || raw.length < 3) return;

    // Skip header/section rows
    const col0 = (cols[0]||'').trim();
    if (skipKW.test(col0) && cols.filter(c=>c.trim()).length <= 3) return;
    if (sectionHdr.test(raw)) return;

    // Check for subtotal rows
    if (/sub.?total|section\s*total|jumlah\s*kecil/i.test(raw)) {
      const nums = cols.map(toNum).filter(n => n !== null && n > 0);
      if (nums.length > 0) subtotals.push({ label: raw.replace(/[,\d. ]+/g,'').trim(), amount: nums[nums.length-1] });
      return;
    }

    // ── Extract description ──────────────────────────────────
    let name = '';
    if (colIdx.desc >= 0 && cols[colIdx.desc]) {
      name = cols[colIdx.desc].trim();
    } else {
      // find the longest non-numeric cell
      name = cols.reduce((best, c) => {
        const t = c.trim();
        return (t.length > best.length && isNaN(toNum(t)) && t.length > 3) ? t : best;
      }, '');
    }
    if (!name) return;
    // must look like a work item
    if (!workKW.test(name) && !workCN.test(name)) return;

    // ── Extract no ───────────────────────────────────────────
    let no = null;
    if (colIdx.no >= 0 && cols[colIdx.no]) no = cols[colIdx.no].trim();
    else if (/^\d+$/.test(col0)) no = col0;

    // ── Extract unit ─────────────────────────────────────────
    let unit = null;
    if (colIdx.unit >= 0 && cols[colIdx.unit]) {
      const u = cols[colIdx.unit].trim();
      if (unitWords.test(u)) unit = u;
    }
    // Also scan other cols for unit words
    if (!unit) {
      const uCol = cols.find(c => unitWords.test(c.trim()));
      if (uCol) unit = uCol.trim();
    }
    // Normalise unit casing
    if (unit) unit = unit.replace(/^sf$/i,'sqft').replace(/^sm$/i,'sqm').replace(/^nos$/i,'nos').replace(/\.$/, '');

    // ── Extract numbers ──────────────────────────────────────
    // Collect all numeric cells, skipping no. col and unit-word cells
    const numericCells = [];
    cols.forEach((c, j) => {
      if (colIdx.no >= 0 && j === colIdx.no) return;
      const ct = c.trim();
      if (!ct || ct === '-' || ct === '–' || ct === '—') return;
      if (unitWords.test(ct)) return;
      const n = toNum(ct);
      if (n !== null && n > 0) numericCells.push({ j, val: n });
    });

    let qty = null, unitPrice = null, itemTotal = null;
    let unitPriceDerived = false;

    if (numericCells.length === 0) {
      // no numbers at all — skip
    } else if (numericCells.length === 1) {
      // Only one number in row → it's the total (lump sum)
      itemTotal = numericCells[0].val;

    } else if (numericCells.length === 2) {
      // Two numbers: [a, b]
      // Golden rule: larger = total
      const a = numericCells[0].val, b = numericCells[1].val;
      itemTotal  = Math.max(a, b);
      const other = Math.min(a, b);
      // Is 'other' a qty (small integer) or unitPrice?
      if (Number.isInteger(other) && other <= 500 && itemTotal / other >= 2) {
        qty = other; // looks like quantity
      } else {
        unitPrice = other; // looks like unit rate
      }

    } else {
      // 3+ numbers
      // GOLDEN RULE: largest = total
      const sorted = [...numericCells].sort((a, b) => b.val - a.val);
      itemTotal = sorted[0].val;

      // Remaining numbers (in original column order, excluding total)
      const rest = numericCells.filter(c => c.val !== sorted[0].val || c.j !== sorted[0].j);

      // Among remaining: look for qty (small positive integer ≤ 10000)
      // and unitPrice (any decimal)
      const qtyCandidate = rest.find(c =>
        Number.isInteger(c.val) && c.val >= 1 && c.val <= 10000 &&
        c.val < itemTotal
      );
      const upCandidate = rest.find(c =>
        c !== qtyCandidate && c.val < itemTotal
      );

      if (qtyCandidate) qty = qtyCandidate.val;
      if (upCandidate)  unitPrice = upCandidate.val;

      // Prefer header-guided positions if available and sensible
      if (colIdx.qty >= 0) {
        const hq = toNum(cols[colIdx.qty]);
        if (hq != null && hq < itemTotal) qty = hq;
      }
      if (colIdx.unitPrice >= 0) {
        const hu = toNum(cols[colIdx.unitPrice]);
        if (hu != null && hu < itemTotal) unitPrice = hu;
      }
      if (colIdx.total >= 0) {
        const ht = toNum(cols[colIdx.total]);
        // Only trust header total if it's the MAX in the row
        if (ht != null && ht >= itemTotal) itemTotal = ht;
      }
    }

    // ── Cross-validate qty × unitPrice ≈ total ───────────────
    if (qty != null && unitPrice != null && itemTotal != null) {
      const calc = Math.round(qty * unitPrice * 100) / 100;
      const diff = Math.abs(calc - itemTotal);
      if (diff / Math.max(itemTotal, 0.01) > 0.03) {
        // Numbers don't multiply out → recalculate unitPrice from total ÷ qty
        if (qty > 0) { unitPrice = itemTotal / qty; unitPriceDerived = true; }
      }
    }

    // ── Derive missing field ──────────────────────────────────
    if (qty != null && qty > 0 && itemTotal != null && unitPrice == null) {
      unitPrice = itemTotal / qty;
      unitPriceDerived = true;
    }
    if (unitPrice != null && unitPrice > 0 && itemTotal != null && qty == null) {
      const dq = itemTotal / unitPrice;
      if (dq >= 0.1 && dq <= 100000) qty = Math.round(dq * 100) / 100;
    }

    if (itemTotal != null && itemTotal > 0) grandTotal += itemTotal;

    // ── Price status ─────────────────────────────────────────
    let status = 'nodata', note = '';
    if (itemTotal != null || unitPrice != null) {
      status = 'ok';
      const nm  = name.toLowerCase();
      const up  = unitPrice;
      const u   = (unit||'').toLowerCase();
      const R   = PRICE_DB[currentRegion];
      const cur = R.currency;
      if (up != null) {
        if ((nm.includes('paint')||nm.includes('漆')||nm.includes('coat')) && u.includes('sqft')) {
          const r = R.ranges['室内油漆 Paint'];
          if (up > r.max) { status='warn'; note=`单价 ${cur}${up.toFixed(2)}/sqft 偏高，${R.priceRef}约 ${cur}${r.min}–${r.max}`; }
        } else if ((nm.includes('waterproof')||nm.includes('防水')) && u.includes('sqft')) {
          const r = R.ranges['防水 Waterproofing'];
          if (up < r.min) { status='warn'; note=`单价 ${cur}${up.toFixed(2)}/sqft 偏低，建议 ${cur}${r.min}–${r.max}`; }
        } else if ((nm.includes('tile')||nm.includes('tiling')||nm.includes('地砖')) && u.includes('sqft')) {
          const r = R.ranges['地砖 Floor Tiling'];
          if (up > r.max) { status='warn'; note=`单价 ${cur}${up.toFixed(2)}/sqft 偏高，${R.priceRef}约 ${cur}${r.min}–${r.max}`; }
        } else if ((nm.includes('skim')||nm.includes('批土')) && u.includes('sqft')) {
          const r = R.ranges['批土 Skim Coat'];
          if (up > r.max) { status='warn'; note=`单价 ${cur}${up.toFixed(2)}/sqft 偏高，${R.priceRef}约 ${cur}${r.min}–${r.max}`; }
        } else if ((nm.includes('ceiling')||nm.includes('吊顶')) && u.includes('sqft')) {
          const r = R.ranges['石膏板吊顶 Ceiling'];
          if (up > r.max) { status='warn'; note=`单价 ${cur}${up.toFixed(2)}/sqft 偏高，${R.priceRef}约 ${cur}${r.min}–${r.max}`; }
        }
      }
      if (unitPriceDerived && !note) note = `单价由总价÷数量计算得出（${cur}）`;
    } else {
      note = '原始报价未提供价格，请向承包商索取';
    }

    items.push({
      no:         no || String(items.length + 1),
      name,
      unit:       unit || null,
      qty:        qty  != null ? qty       : null,
      unitPrice:  unitPrice != null ? unitPrice : null,
      total:      itemTotal != null ? itemTotal : null,
      unitPriceDerived,
      status,
      note,
    });
  });

  // Detect grand total line (last row with a large number after all items)
  if (!grandTotal) {
    const lastRows = dataRows.slice(-5);
    lastRows.forEach(cols => {
      if (/grand\s*total|jumlah\s*besar|total\s*keseluruhan/i.test(cols.join(' '))) {
        const nums = cols.map(toNum).filter(n=>n!==null&&n>0);
        if (nums.length) grandTotal = nums[nums.length-1];
      }
    });
  }

  if (!clientInfo.company) {
    const cLine = preHeaderLines.find(l => {
      const t = l.trim();
      return t.length > 5 && !workKW.test(t) && !addressKW.test(t) && !personKW.test(t)
        && !/^(TEL|ATT|REF|QUOT|DATE|DESCRIPTION|NO\.?|ITEM|\d)/.test(t);
    });
    if (cLine) clientInfo.company = cLine.trim();
  }

  if (items.length === 0) return getDemoResult();

  const hasPriceIssues = items.some(i => i.status === 'warn');
  const noPriceCount   = items.filter(i => i.status === 'nodata').length;

  const alerts = [];
  if (noPriceCount > 0) alerts.push({ level:'warning', title:`${noPriceCount} 项未提供价格`, desc:'建议向承包商索取完整单价明细，以便进行价格合理性审核。' });
  if (!/防水|waterproof/i.test(items.map(i=>i.name).join(' '))) alerts.push({ level:'critical', title:'防水工程缺失', desc:'湿区防水为 UBBL 1984 强制要求，建议补回 RM 3,500–6,000。' });
  if (!/water|plumbing|水电|electrical|wiring/i.test(items.map(i=>i.name).join(' '))) alerts.push({ level:'warning', title:'水电工程未见', desc:'请确认水电报价是否已单独列出。' });

  const completeness = Math.max(30, 100 - noPriceCount * 10 - (alerts.filter(a=>a.level==='critical').length * 15));
  const priceScore   = hasPriceIssues ? 65 : (noPriceCount > items.length / 2 ? 50 : 85);

  return {
    client: clientInfo,
    score: { total: Math.round((completeness + priceScore + 82) / 3), completeness, price: priceScore, logic: 82, risk: 100 - completeness },
    summary: `已解析 ${items.length} 项工程，报价总额 ${grandTotal ? 'RM '+grandTotal.toLocaleString() : '未能计算'}。${noPriceCount > 0 ? `其中 ${noPriceCount} 项缺少价格数据。` : ''}`,
    items,
    subtotals,
    totalAmount: grandTotal || null,
    missing: [
      ...(/防水|waterproof/i.test(items.map(i=>i.name).join(' ')) ? [] : ['防水工程 (湿区)']),
      ...(/water|plumbing|水电/i.test(items.map(i=>i.name).join(' ')) ? [] : ['水电暗槽布线']),
      '清洁及废料处理费',
    ],
    alerts,
  };
}

function getDemoResult() {
  return {
    client: { company:'ITS ASSET MANAGEMENT SDN BHD', address:'21 Jalan Bukit Impian 18/2, Taman Bukit Impian, Johor Bahru', attention:'Dato Catherine', tel:'+6019-710 2676', email:'darrentqr@hotmail.com', projectRef:'QUO-2024/05/08', projectName:'Impian Office Renovation — Ground, 1st, 2nd & 3rd Floor' },
    score: { total:72, completeness:75, price:78, logic:85, risk:45 },
    summary: 'Johor Bahru 4层办公楼翻新报价（NEUF DESIGN SDN BHD 出单），含建筑、地板、天花、木工及玻璃工程，报价总额 RM 539,377。',
    items: [
      // ── PAGE 1: Ground Floor ─────────────────────────────
      { no:'1', page:'P1 — Ground & 1st Floor', section:'Ground Floor — Construction (RM 27,510)', name:'Hack Existing Door Grilles Entrance c/w Plastering Work', unit:'L/sum', qty:1, unitPrice:900, unitPriceDerived:false, total:900, status:'ok', note:'价格合理' },
      { no:'2', page:'P1 — Ground & 1st Floor', section:'Ground Floor — Construction (RM 27,510)', name:'Supply To Hack Existing Brick Wall For New Lift Entrance & Door (Redimension Size, Hack RC Slab For Lift)', unit:'L/sum', qty:1, unitPrice:7500, unitPriceDerived:false, total:7500, status:'ok', note:'价格合理' },
      { no:'3', page:'P1 — Ground & 1st Floor', section:'Ground Floor — Construction (RM 27,510)', name:'Supply To Construct New Concrete Wall For Lift Area (2200mm L × 3 × 3900mm H, 273sq)', unit:'sq', qty:1, unitPrice:19110, unitPriceDerived:false, total:19110, status:'ok', note:'价格合理' },
      // First Floor Construction
      { no:'1', page:'P1 — Ground & 1st Floor', section:'First Floor — Construction (RM 79,320)', name:'Supply To Extension New Brick Wall & Reinforce Concrete For Back Area (3000mm W × 12000mm L, 400sq)', unit:'sq', qty:1, unitPrice:54000, unitPriceDerived:false, total:54000, status:'warn', note:'大型结构工程，建议查验结构工程师证书及 MBJB 装修许可证' },
      { no:'2', page:'P1 — Ground & 1st Floor', section:'First Floor — Construction (RM 79,320)', name:'Supply To Hack Existing Brick Wall For New Extension Area (480sq)', unit:'sq', qty:1, unitPrice:4320, unitPriceDerived:false, total:4320, status:'ok', note:'价格合理' },
      { no:'3', page:'P1 — Ground & 1st Floor', section:'First Floor — Construction (RM 79,320)', name:'Supply To Conceal Existing Window 4500mm × 1500mm (200sq)', unit:'sq', qty:1, unitPrice:5600, unitPriceDerived:false, total:5600, status:'ok', note:'价格合理' },
      { no:'4', page:'P1 — Ground & 1st Floor', section:'First Floor — Construction (RM 79,320)', name:'Supply To Conceal Existing Toilet Window', unit:'L/sum', qty:1, unitPrice:700, unitPriceDerived:false, total:700, status:'ok', note:'价格合理' },
      { no:'5', page:'P1 — Ground & 1st Floor', section:'First Floor — Construction (RM 79,320)', name:'Supply To Construct New Concrete Wall For Lift Area (2200mm L × 3 × 3000mm H, 210sq)', unit:'sq', qty:1, unitPrice:14700, unitPriceDerived:false, total:14700, status:'ok', note:'价格合理' },
      // Flooring Work First Floor
      { no:'1', page:'P1 — Ground & 1st Floor', section:'Flooring Work — First Floor (RM 36,666)', name:'Supply To Lay Floor Tiles For Staircase Entrance Area + 9 Steps (1200mm L × 4000mm W + 3000mm W × 1200mm L)', unit:'L/sum', qty:1, unitPrice:5550, unitPriceDerived:false, total:5550, status:'ok', note:'价格合理' },
      { no:'2', page:'P1 — Ground & 1st Floor', section:'Flooring Work — First Floor (RM 36,666)', name:'Supply To Lay Vinyl PVC Sheet For Stage Area TBC Material (10200mm L × 2250mm H, 272sq)', unit:'sq', qty:1, unitPrice:4896, unitPriceDerived:false, total:4896, status:'ok', note:'价格合理' },
      { no:'3', page:'P1 — Ground & 1st Floor', section:'Flooring Work — First Floor (RM 36,666)', name:'Supply To Lay Vinyl PVC Sheet Flooring For Meeting Hall Room (Front Hall + Back Hall + Pantry & Basin + Store Room, 2480sq)', unit:'sq', qty:1, unitPrice:26220, unitPriceDerived:false, total:26220, status:'ok', note:'价格合理' },
      // ── PAGE 2: Ceiling & Carpentry ──────────────────────
      { no:'1', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Ceiling Work (RM 4,675)', name:'Supply To Install False Ceiling For Staircase Area Entrance (1600mm L × 2400mm W, 44sq)', unit:'sq', qty:44, unitPrice:null, unitPriceDerived:true, total:300, status:'ok', note:'单价约 RM 6.82/sq，合理' },
      { no:'2', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Ceiling Work (RM 4,675)', name:'Supply To Install False Ceiling For 1st Floor Lift Entrance Area (3000mm L × 2400mm W, 80sq)', unit:'sq', qty:80, unitPrice:null, unitPriceDerived:true, total:400, status:'ok', note:'单价约 RM 5/sq，合理' },
      { no:'3', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Ceiling Work (RM 4,675)', name:'Supply To Install False Ceiling For 1st Floor Meeting Room Area (5400mm L × 12000mm W, 750sq)', unit:'sq', qty:750, unitPrice:null, unitPriceDerived:true, total:3375, status:'ok', note:'单价约 RM 4.5/sq，合理' },
      { no:'4', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Ceiling Work (RM 4,675)', name:'Supply To Install Cove Lighting Box For 1st Floor Meeting Room Area (30ft)', unit:'ft', qty:30, unitPrice:20, unitPriceDerived:false, total:600, status:'ok', note:'价格合理' },
      // Carpentry Work
      { no:'1', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Carpentry Work — Lift Entrance (RM 26,860)', name:'Supply To Install Main Entrance Door Arc Frame Using Laminated Finished (1400mm L × 3900mm H, 31ft)', unit:'ft', qty:31, unitPrice:100, unitPriceDerived:false, total:3100, status:'ok', note:'价格合理' },
      { no:'2', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Carpentry Work — Lift Entrance (RM 26,860)', name:'Supply To Install Feature Wall Cum Hidden Door Using Laminated Finished (3600mm L × 3000mm H, 120sq)', unit:'sq', qty:120, unitPrice:78, unitPriceDerived:false, total:9360, status:'ok', note:'价格合理' },
      { no:'3', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Carpentry Work — Lift Entrance (RM 26,860)', name:'Supply To Install Lift Entrance Door Arc Frame Using Laminated Finished For Ground Floor (2900mm L × 3000mm H, 30ft)', unit:'ft', qty:30, unitPrice:180, unitPriceDerived:false, total:5400, status:'ok', note:'价格合理' },
      { no:'4', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Carpentry Work — Lift Entrance (RM 26,860)', name:'Supply To Install Lift Entrance Door Arc Frame Using Laminated Finished For 1st Floor (2900mm L × 3000mm H, 30ft)', unit:'ft', qty:30, unitPrice:180, unitPriceDerived:false, total:5400, status:'ok', note:'价格合理' },
      { no:'9', page:'P2 — Ceiling & Carpentry (G+1F)', section:'Carpentry Work — Lift Entrance (RM 26,860)', name:'Supply To Install Pantry Cabinet c/w Solid Surface Table Top (1300mm L × 850mm H, 4.5ft)', unit:'ft', qty:4.5, unitPrice:800, unitPriceDerived:false, total:3600, status:'ok', note:'价格合理' },
      // ── PAGE 3: 2nd Floor Construction ───────────────────
      { no:'1', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Extension New Brick Wall & Reinforce Concrete For Back Area (3000mm W × 12000mm L, 400sq)', unit:'sq', qty:1, unitPrice:54000, unitPriceDerived:false, total:54000, status:'warn', note:'大型结构工程，需结构工程师批准' },
      { no:'2', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Hack Existing Brick Wall For New Extension Area (480sq)', unit:'sq', qty:1, unitPrice:4320, unitPriceDerived:false, total:4320, status:'ok', note:'价格合理' },
      { no:'3', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Hack Existing Brick Wall For New Lift Entrance & Door (Redimension Size, Hack RC Slab For Lift)', unit:'L/sum', qty:1, unitPrice:7500, unitPriceDerived:false, total:7500, status:'ok', note:'价格合理' },
      { no:'4', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Conceal Existing Toilet Window', unit:'L/sum', qty:1, unitPrice:700, unitPriceDerived:false, total:700, status:'ok', note:'价格合理' },
      { no:'5', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Construct New Concrete Wall For Lift Area (2200mm L × 3 × 3000mm H, 210sq)', unit:'sq', qty:1, unitPrice:14700, unitPriceDerived:false, total:14700, status:'ok', note:'价格合理' },
      { no:'6', page:'P3 — 2nd Floor', section:'Second Floor — Construction (RM 84,020)', name:'Supply To Conceal Existing Window For New Meeting Room (75sq)', unit:'sq', qty:1, unitPrice:2800, unitPriceDerived:false, total:2800, status:'ok', note:'价格合理' },
      // Partition
      { no:'3', page:'P3 — 2nd Floor', section:'Partition Work (RM 4,160)', name:'Supply To Install 2nd Floor Interview Room Design Partition c/w L-shape Wall To Ceiling & Curve Design (180sq)', unit:'sq', qty:180, unitPrice:null, unitPriceDerived:true, total:4160, status:'ok', note:'单价约 RM 23.1/sq，合理' },
      // Flooring 2nd
      { no:'1', page:'P3 — 2nd Floor', section:'Flooring Work — Second Floor (RM 27,980)', name:'Supply To Lay Vinyl Locking Flooring For 2nd Floor Office (Entrance + Top Marketing + Marketing + Meeting + Pantry, 2945sq)', unit:'sq', qty:2945, unitPrice:null, unitPriceDerived:true, total:27980, status:'ok', note:'单价约 RM 9.5/sq，合理' },
      // Ceiling 2nd
      { no:'1', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install False Ceiling c/w Cove Light For 2nd Floor Lift Entrance Area (3000mm L × 2400mm W, 80sq)', unit:'sq', qty:80, unitPrice:null, unitPriceDerived:true, total:400, status:'ok', note:'单价约 RM 5/sq，合理' },
      { no:'2', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install False Ceiling For 2nd Floor Marketing Area (12000mm L × 18000mm W, 2560sq)', unit:'sq', qty:2560, unitPrice:null, unitPriceDerived:true, total:11520, status:'ok', note:'单价约 RM 4.5/sq，合理' },
      { no:'3', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install Light Box Design For 2nd Floor Marketing Area (3000mm L × 3, 30ft)', unit:'ft', qty:30, unitPrice:30, unitPriceDerived:false, total:900, status:'ok', note:'价格合理' },
      { no:'4', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install L-Box For 2nd Floor Marketing Area (8800mm L × 7100mm W, 105ft)', unit:'ft', qty:105, unitPrice:20, unitPriceDerived:false, total:2100, status:'ok', note:'价格合理' },
      { no:'5', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install Drop Ceiling L-Box For 2nd Floor Meeting Room (4500mm L × 3000mm W, 40ft)', unit:'ft', qty:40, unitPrice:25, unitPriceDerived:false, total:1000, status:'ok', note:'价格合理' },
      { no:'6', page:'P3 — 2nd Floor', section:'Ceiling Work — 2nd Floor (RM 17,440)', name:'Supply To Install Cove Lighting Box For 2nd Floor Meeting Room Area (5700mm L × 5700mm W, 76ft)', unit:'ft', qty:76, unitPrice:20, unitPriceDerived:false, total:1520, status:'ok', note:'价格合理' },
      // ── PAGE 4: 2nd Floor Carpentry ──────────────────────
      { no:'1', page:'P4 — 2nd Floor Carpentry', section:'Carpentry Work — 2nd Floor Office (RM 40,925)', name:'Supply To Install Lift Entrance Door Arc Frame Using Laminated Finished (2900mm L × 3000mm H, 30ft)', unit:'ft', qty:30, unitPrice:180, unitPriceDerived:false, total:5400, status:'ok', note:'价格合理' },
      { no:'3', page:'P4 — 2nd Floor Carpentry', section:'Carpentry Work — 2nd Floor Office (RM 40,925)', name:'Supply To Install Planter Wall Design Without Neon Light Design (3900mm L × 3000mm H, 130sq)', unit:'sq', qty:130, unitPrice:65, unitPriceDerived:false, total:8450, status:'ok', note:'价格合理' },
      { no:'4', page:'P4 — 2nd Floor Carpentry', section:'Carpentry Work — 2nd Floor Office (RM 40,925)', name:'Supply To Install Wall Paper For Interview Room Area (405sq)', unit:'sq', qty:405, unitPrice:15, unitPriceDerived:false, total:6075, status:'ok', note:'价格合理' },
      { no:'5', page:'P4 — 2nd Floor Carpentry', section:'Carpentry Work — 2nd Floor Office (RM 40,925)', name:'Supply Labour To Install Feature Wall Panel Divider For Marketing Area (4500mm L × 3000mm H, 150sq)', unit:'sq', qty:150, unitPrice:110, unitPriceDerived:false, total:16500, status:'warn', note:'单价 RM 110/sq 偏高，建议核实材料规格' },
      { no:'6', page:'P4 — 2nd Floor Carpentry', section:'Carpentry Work — 2nd Floor Office (RM 40,925)', name:'Supply To Install Wall Paper For Marketing & Meeting Room Outside Wall (6750mm L × 3000mm H, 225sq)', unit:'sq', qty:225, unitPrice:20, unitPriceDerived:false, total:4500, status:'ok', note:'价格合理' },
      // ── PAGE 5: 3rd Floor Construction ───────────────────
      { no:'1', page:'P5 — 3rd Floor', section:'Third Floor — Construction (RM 85,630)', name:'Supply To Extension New Brick Wall & Reinforce Concrete For Back Area (3000mm W × 12000mm L, 400sq)', unit:'sq', qty:1, unitPrice:54000, unitPriceDerived:false, total:54000, status:'warn', note:'大型结构工程，需结构工程师批准' },
      { no:'2', page:'P5 — 3rd Floor', section:'Third Floor — Construction (RM 85,630)', name:'Supply To Hack Existing Brick Wall For New Extension Area (480sq)', unit:'sq', qty:1, unitPrice:4320, unitPriceDerived:false, total:4320, status:'ok', note:'价格合理' },
      { no:'3', page:'P5 — 3rd Floor', section:'Third Floor — Construction (RM 85,630)', name:'Supply To Hack Existing Brick Wall For New Lift Entrance & Door (Redimension Size, Hack RC Slab For Lift)', unit:'L/sum', qty:1, unitPrice:7500, unitPriceDerived:false, total:7500, status:'ok', note:'价格合理' },
      { no:'4', page:'P5 — 3rd Floor', section:'Third Floor — Construction (RM 85,630)', name:'Supply To Conceal Existing Toilet Window', unit:'L/sum', qty:1, unitPrice:700, unitPriceDerived:false, total:700, status:'ok', note:'价格合理' },
      { no:'5', page:'P5 — 3rd Floor', section:'Third Floor — Construction (RM 85,630)', name:'Supply To Construct New Concrete Wall For Lift Area (2200mm L × 3 × 3900mm H, 273sq)', unit:'sq', qty:1, unitPrice:19110, unitPriceDerived:false, total:19110, status:'ok', note:'价格合理' },
      // Flooring 3rd
      { no:'1', page:'P5 — 3rd Floor', section:'Flooring Work — Third Floor (RM 27,861)', name:'Supply To Lay Vinyl Locking Flooring For 3rd Floor Office (Entrance + Acct Room + Director + Paul + Reception + Meeting + PIC + Pantry, 2945sq)', unit:'sq', qty:2945, unitPrice:null, unitPriceDerived:true, total:27861, status:'ok', note:'单价约 RM 9.5/sq，合理' },
      // Ceiling 3rd
      { no:'1', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install False Ceiling c/w Cove Light For 3rd Floor Lift Entrance Area (3000mm L × 2400mm W, 80sq)', unit:'sq', qty:80, unitPrice:null, unitPriceDerived:true, total:400, status:'ok', note:'单价约 RM 5/sq，合理' },
      { no:'2', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install False Ceiling For 3rd Floor Office Area (12000mm L × 18000mm W, 2560sq)', unit:'sq', qty:2560, unitPrice:null, unitPriceDerived:true, total:11520, status:'ok', note:'单价约 RM 4.5/sq，合理' },
      { no:'3', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install L-Box (Aluminium Box) For 3rd Floor Reception Area (6600mm L × 2100mm W, 58ft)', unit:'ft', qty:58, unitPrice:20, unitPriceDerived:false, total:1160, status:'ok', note:'价格合理' },
      { no:'4', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install L-Box Ceiling Design For 3rd Floor Director Room (58ft)', unit:'ft', qty:58, unitPrice:20, unitPriceDerived:false, total:1160, status:'ok', note:'价格合理' },
      { no:'5', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install Paul Room Curve Ceiling Design (2100mm L × 3, 26ft)', unit:'ft', qty:26, unitPrice:20, unitPriceDerived:false, total:520, status:'ok', note:'价格合理' },
      { no:'6', page:'P5 — 3rd Floor', section:'Ceiling Work — 3rd Floor (RM 17,160)', name:'Supply To Install Drop Ceiling Design For 3rd Floor Meeting Room (6000mm + 3000mm L × 1500mm W, 150sq)', unit:'sq', qty:150, unitPrice:16, unitPriceDerived:false, total:2400, status:'ok', note:'价格合理' },
      // ── PAGE 6: 3rd Floor Carpentry ──────────────────────
      { no:'1', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Lift Entrance Door Arc Frame Using Laminated Finished (2900mm L × 3000mm H, 30ft)', unit:'ft', qty:30, unitPrice:180, unitPriceDerived:false, total:5400, status:'ok', note:'价格合理' },
      { no:'2', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Planter Feature Wall Panel For SG81 LOGO (1500mm L × 3000mm H, 50sq)', unit:'sq', qty:50, unitPrice:60, unitPriceDerived:false, total:3000, status:'ok', note:'价格合理' },
      { no:'3', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Wall Paper For Reception Wall & PIC Entrance Wall (1800+3750+3000mm L × 3000mm H, 290sq)', unit:'sq', qty:290, unitPrice:20, unitPriceDerived:false, total:5800, status:'ok', note:'价格合理' },
      { no:'9', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Wall Paper For LOGO Reception Area (3200mm L × 2100mm H, 77sq)', unit:'sq', qty:77, unitPrice:25, unitPriceDerived:false, total:1925, status:'ok', note:'价格合理' },
      { no:'10', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Wall Paper For Ceiling Design For Director Room (240sq)', unit:'sq', qty:240, unitPrice:20, unitPriceDerived:false, total:4800, status:'ok', note:'价格合理' },
      { no:'12', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply To Install Wall Paper For Meeting Room (6000mm L × 2100mm H × 2, 140sq)', unit:'sq', qty:140, unitPrice:null, unitPriceDerived:true, total:3800, status:'ok', note:'单价约 RM 27.1/sq，合理' },
      { no:'17', page:'P6 — 3rd Floor Carpentry', section:'Carpentry Work — 3rd Floor Office (RM 27,525)', name:'Supply & Install Custom Made Wall Paper For Reception Waiting Area (2400mm L × 3000mm H, 80sq)', unit:'sq', qty:80, unitPrice:35, unitPriceDerived:false, total:2800, status:'ok', note:'价格合理' },
      // ── PAGE 7: Other Work (Glass & Windows) ─────────────
      { no:'1', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install New Stainless-Steel Gate For Main Entrance Area (1000mm L × 2400mm H)', unit:'L/sum', qty:1, unitPrice:3800, unitPriceDerived:false, total:3800, status:'ok', note:'价格合理' },
      { no:'2', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install Window Using Existing Window c/w New Frame (3000mm L × 1500mm H, For 1st 2nd 3rd Floor, 50sq)', unit:'sq', qty:6, unitPrice:950, unitPriceDerived:false, total:5700, status:'ok', note:'价格合理' },
      { no:'6', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Dismantle 3\' Door & Install @ Back Door A/C Compressor (900mm L × 2100mm H, 21sq)', unit:'sq', qty:3, unitPrice:525, unitPriceDerived:false, total:1575, status:'ok', note:'价格合理' },
      { no:'7', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install Fix Glass Panel For 3rd Floor Meeting Room (1200mm W × 3000mm H + 600mm W × 3000mm H, 60sq)', unit:'sq', qty:1, unitPrice:3420, unitPriceDerived:false, total:3420, status:'ok', note:'价格合理' },
      { no:'8', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install Tempered Glass Door c/w Closer For 3rd Floor Meeting Room (900mm L × 2100mm H)', unit:'set', qty:1, unitPrice:2600, unitPriceDerived:false, total:2600, status:'ok', note:'价格合理' },
      { no:'9', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install Tempered Glass Wall Panel For Interview Room (5100mm L × 3000mm H, 170sq)', unit:'sq', qty:1, unitPrice:9350, unitPriceDerived:false, total:9350, status:'warn', note:'单价 RM 9,350 偏高，建议要求承包商详细报价' },
      { no:'10', page:'P7 — Glass & Window / Door', section:'Glass & Window / Door Work (RM 31,645)', name:'Supply To Install Tempered Glass Door c/w Closer For Interview Room (900mm L × 2100mm H)', unit:'set', qty:1, unitPrice:5200, unitPriceDerived:false, total:5200, status:'warn', note:'2 套钢化玻璃门，单套 RM 2,600，价格偏高' },
    ],
    subtotals: [
      { label:'Ground & 1st Storey Total', amount:175031 },
      { label:'2nd Storey Total', amount:174525 },
      { label:'Third Storey Total', amount:158176 },
      { label:'Glass & Window / Door Work', amount:31645 },
    ],
    totalAmount: 539377,
    missing: ['防水工程 (全楼卫生间湿区)', '水电暗槽重新布线 (全楼)', '清洁及建筑废料处理费', '验收收尾及杂费'],
    alerts: [
      { level:'critical', title:'防水工程缺失（全楼4层）', desc:'全楼 4 层厕所湿区均无防水工程，依据 UBBL 1984 强制要求，建议每层补回 RM 3,000–5,000，合计约 RM 12,000–20,000。' },
      { level:'critical', title:'水电工程未列明', desc:'4 层办公室翻新报价完全未见水电重新布线，请向承包商确认是否已包含在结构工程内或需另行报价。' },
      { level:'warning',  title:'多楼层大型结构工程需专业监督', desc:'多楼层砖墙拆除（480sq）及 RC Slab Hack 须获得注册结构工程师批准及地方政府装修许可证（MBJB）。' },
      { level:'warning',  title:'2nd Floor 木工单价偏高', desc:'Feature Wall Panel Divider RM 110/sq，市场参考约 RM 60–90/sq，建议要求材料规格说明。' },
      { level:'info',     title:'报价单日期 2024 年', desc:'此报价单日期为 2024 年 5 月，如工程尚未开始，建议要求承包商按 2025 年最新材料价格重新确认。' },
    ]
  };
}

// ── TAB SWITCH ────────────────────────────────────────────────
function switchQTab(btn, page) {
  document.querySelectorAll('.q-page-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderQTable(page);
}

// ── RENDER TABLE FOR GIVEN PAGE (or 'ALL') ────────────────────
function renderQTable(page) {
  const allItems   = window._qAllItems    || [];
  const subtotals  = window._qSubtotals   || [];
  const totalAmt   = window._qTotalAmount;
  const cur        = window._qCur         || 'RM';
  const fmtAmt     = window._qFmtAmt      || (n => n == null ? '–' : n.toLocaleString());
  const fmtQty     = window._qFmtQty      || (n => n == null ? '–' : String(n));
  const statusCfg  = window._qStatusCfg   || {};

  const filtered = page === 'ALL' ? allItems : allItems.filter(i => i.page === page);
  const isAll    = page === 'ALL';

  let lastSection = null;
  let html = filtered.map(item => {
    const sc = statusCfg[item.status] || { cls:'', icon:'–', label:'待确认' };
    const qtyDisplay  = fmtQty(item.qty);
    const unitDisplay = item.unit || '';
    const upDisplay   = item.unitPrice != null
      ? (item.unitPriceDerived
          ? `<span style="color:var(--text2)">${fmtAmt(item.unitPrice)}</span><span style="font-size:9px;color:var(--text3);margin-left:3px" title="由总价÷数量计算得出">*</span>`
          : fmtAmt(item.unitPrice))
      : '–';
    const totDisplay  = item.total != null ? cur + ' ' + fmtAmt(item.total) : '–';

    let sectionRow = '';
    if (item.section && item.section !== lastSection) {
      lastSection = item.section;
      sectionRow = `<tr>
        <td colspan="7" style="padding:12px 14px 5px;font-size:11px;font-weight:700;color:var(--gold);
          letter-spacing:.8px;text-transform:uppercase;border-top:1px solid var(--border2);
          background:rgba(240,185,11,0.04);">
          📁 ${item.section}
        </td>
      </tr>`;
    }

    // page badge shown only in ALL view
    const pageBadge = isAll && item.page
      ? `<div style="font-size:9px;color:var(--text3);margin-top:2px;letter-spacing:.3px;">${item.page.match(/^P\d+/)?.[0]||''}</div>`
      : '';

    return sectionRow + `<tr>
      <td style="color:var(--text3);font-size:11px;white-space:nowrap;vertical-align:top;padding-top:10px">
        ${item.no||'–'}${pageBadge}
      </td>
      <td style="font-weight:500;color:var(--text);line-height:1.5;min-width:220px">${item.name}</td>
      <td style="color:var(--text2);text-align:center">${unitDisplay}</td>
      <td style="font-family:'DM Mono',monospace;text-align:right">${qtyDisplay}</td>
      <td style="font-family:'DM Mono',monospace;text-align:right">${upDisplay}</td>
      <td style="font-family:'DM Mono',monospace;font-weight:600;text-align:right;white-space:nowrap">${totDisplay}</td>
      <td class="${sc.cls}" style="white-space:nowrap;vertical-align:top">
        ${sc.icon} ${sc.label}
        ${item.note ? `<div style="font-size:10px;color:var(--text2);margin-top:2px;white-space:normal;min-width:100px">${item.note}</div>` : ''}
      </td>
    </tr>`;
  }).join('');

  // Page subtotal (single-page view): sum of items shown
  if (!isAll) {
    const pgTotal = filtered.reduce((s, i) => s + (i.total || 0), 0);
    html += `<tr style="background:rgba(240,185,11,0.05);border-top:1px solid var(--border)">
      <td colspan="5" style="text-align:right;font-weight:700;color:var(--text);font-size:12px;">本页小计</td>
      <td style="font-weight:700;color:var(--gold);font-family:'DM Mono',monospace;text-align:right">${cur} ${fmtAmt(pgTotal)}</td>
      <td></td>
    </tr>`;
  }

  // Subtotals + grand total (ALL view only)
  if (isAll) {
    subtotals.forEach(st => {
      html += `<tr style="background:rgba(255,255,255,0.02)">
        <td colspan="5" style="text-align:right;font-weight:600;color:var(--text2);font-size:12px;">${st.label}</td>
        <td style="font-weight:700;color:var(--gold);font-family:'DM Mono',monospace;text-align:right">${cur} ${fmtAmt(st.amount)}</td>
        <td></td>
      </tr>`;
    });
    if (totalAmt) {
      html += `<tr style="background:rgba(240,185,11,0.07);border-top:2px solid var(--gold)">
        <td colspan="5" style="text-align:right;font-weight:700;color:var(--text);font-size:13px;padding:10px 0">报价总额</td>
        <td style="font-weight:800;color:var(--gold);font-family:'DM Mono',monospace;text-align:right;font-size:15px">${cur} ${fmtAmt(totalAmt)}</td>
        <td></td>
      </tr>`;
    }
  }

  // Legend
  html += `<tr><td colspan="7" style="padding:10px 0 4px;font-size:11px;color:var(--text3);line-height:2">
    ✓ 正常 &nbsp;│&nbsp; ⚠ 注意 &nbsp;│&nbsp; ✗ 异常 &nbsp;│&nbsp; – 待确认 = 原始报价未提供数据
    <br><span>* 单价标 * 表示由「总价 ÷ 数量」计算得出，非原始报价直接提供</span>
  </td></tr>`;

  document.getElementById('q-table-rows').innerHTML = html;
}

function renderAnalysisResult(r, fileName, rawText) {
  document.getElementById('ai-loading-state').style.display = 'none';
  document.getElementById('upload-preview').style.display = 'block';

  const rows = r.items || [];
  const workItems = rows.filter(i => i.name); // all are work items now
  const cur = getRegionCurrency();
  document.getElementById('file-meta-display').textContent =
    `已识别 ${workItems.length} 项工程 · ${r.totalAmount ? cur+' '+Number(r.totalAmount).toLocaleString() : '总额待确认'}`;

  // ── CLIENT INFO CARD ──────────────────────────────────────
  const c = r.client || {};
  const hasClient = c.company || c.attention || c.tel || c.address;
  const clientHTML = hasClient ? `
    <div id="client-extract-card" style="background:rgba(96,165,250,0.07);border:1px solid rgba(96,165,250,0.25);border-radius:12px;padding:16px 18px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">👤</span>
          <span style="font-size:12px;font-weight:700;color:var(--blue);letter-spacing:1px;text-transform:uppercase;">已自动识别客户资料</span>
          <span style="font-size:10px;color:var(--text3);font-weight:400;">· 可直接编辑修改</span>
        </div>
        <button onclick="saveClientToProject()" style="background:var(--blue);color:white;border:none;border-radius:6px;padding:5px 14px;font-size:12px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;">
          ✓ 保存至项目客户档案
        </button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;">
        ${c.company !== undefined ? `<div class="client-edit-field">
          <label class="client-edit-label">公司</label>
          <input class="client-edit-input" id="ce-company" value="${c.company||''}">
        </div>` : ''}
        ${c.attention !== undefined || c.company !== undefined ? `<div class="client-edit-field">
          <label class="client-edit-label">联系人</label>
          <input class="client-edit-input" id="ce-attention" value="${c.attention||''}">
        </div>` : ''}
        ${c.tel !== undefined ? `<div class="client-edit-field">
          <label class="client-edit-label">电话</label>
          <input class="client-edit-input" id="ce-tel" value="${c.tel||''}">
        </div>` : ''}
        ${c.email !== undefined ? `<div class="client-edit-field">
          <label class="client-edit-label">邮箱</label>
          <input class="client-edit-input" id="ce-email" value="${c.email||''}">
        </div>` : ''}
        ${c.address !== undefined ? `<div class="client-edit-field" style="grid-column:1/-1">
          <label class="client-edit-label">地址</label>
          <input class="client-edit-input" id="ce-address" value="${c.address||''}">
        </div>` : ''}
        ${c.projectRef !== undefined ? `<div class="client-edit-field">
          <label class="client-edit-label">报价单编号</label>
          <input class="client-edit-input" id="ce-ref" value="${c.projectRef||''}">
        </div>` : ''}
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(96,165,250,0.15);font-size:11px;color:var(--text3);">
        ✏️ 资料已从报价单自动抽取 · 可直接修改后保存 · 点击「保存至项目客户档案」即可更新
      </div>
    </div>` : '';

  // Inject client card before score card
  document.getElementById('ai-score-card').insertAdjacentHTML('beforebegin', clientHTML);

  // Save extracted client globally
  window.lastExtractedClient = c;

  // ── SCORE CARD ────────────────────────────────────────────
  const s = r.score || {};
  document.getElementById('ai-score-body').innerHTML = `
    <div class="score-row">
      <div class="score-circle">
        <div class="score-num" style="color:${s.total>=80?'var(--green)':s.total>=60?'var(--gold)':'var(--red)'}">${s.total||'–'}</div>
        <div class="score-label">/ 100</div>
      </div>
      <div class="score-breakdown">
        ${[['项目完整性',s.completeness,'var(--orange)'],['单价合理性',s.price,'var(--green)'],['工序逻辑性',s.logic,'var(--green)'],['漏项风险',s.risk,'var(--red)']].map(([label,val,color])=>`
        <div class="score-item">
          <div class="score-item-label">${label}</div>
          <div class="score-bar-bg"><div class="score-bar" style="width:${val||0}%;background:${color}"></div></div>
          <div class="score-item-val">${val||0}</div>
        </div>`).join('')}
      </div>
    </div>
    <div style="background:var(--surface2);border-radius:8px;padding:12px 14px;font-size:13px;color:var(--text2);line-height:1.6;">
      🤖 <strong style="color:var(--text)">AI 总结：</strong>${r.summary||''}
    </div>`;

  // ── ITEMS TABLE ───────────────────────────────────────────
  const statusConfig = {
    ok:     { cls:'ok',   icon:'✓', label:'正常' },
    warn:   { cls:'warn', icon:'⚠', label:'注意' },
    flag:   { cls:'flag', icon:'✗', label:'异常' },
    nodata: { cls:'',     icon:'–', label:'待确认' },
  };

  // Smart number formatter: show exact value from source
  const fmtAmt = (n) => {
    if (n == null) return '–';
    // round to max 4 significant decimals, trim trailing zeros
    const rounded = Math.round(n * 10000) / 10000;
    // if integer, no decimals
    if (Number.isInteger(rounded)) return rounded.toLocaleString();
    // else show up to 2 decimal places
    return rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtQty = (n) => {
    if (n == null) return '–';
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? rounded.toLocaleString() : rounded.toLocaleString(undefined, {minimumFractionDigits:1, maximumFractionDigits:2});
  };

  // ── STORE globally so tab switching can re-render ────────────
  window._qAllItems    = workItems;
  window._qSubtotals   = r.subtotals || [];
  window._qTotalAmount = r.totalAmount;
  window._qCur         = cur;
  window._qFmtAmt      = fmtAmt;
  window._qFmtQty      = fmtQty;
  window._qStatusCfg   = statusConfig;

  // ── BUILD PAGE TABS ───────────────────────────────────────────
  const pages = [];
  workItems.forEach(i => { if (i.page && !pages.includes(i.page)) pages.push(i.page); });

  const tabsEl = document.getElementById('q-page-tabs');
  const countEl = document.getElementById('q-item-count');

  if (pages.length > 1) {
    tabsEl.style.display = 'flex';
    const allCount = workItems.length;
    tabsEl.innerHTML = `<button class="q-page-tab active" data-page="ALL" onclick="switchQTab(this,'ALL')">全部 <span class="tab-count">${allCount}</span></button>`
      + pages.map(pg => {
          const n = workItems.filter(i => i.page === pg).length;
          // Short label: strip leading "P1 — " prefix for display
          const short = pg.replace(/^P\d+\s*[—–-]+\s*/,'');
          return `<button class="q-page-tab" data-page="${pg}" onclick="switchQTab(this,'${pg}')">${pg.match(/^P\d+/)?.[0]||''}　${short} <span class="tab-count">${n}</span></button>`;
        }).join('');
    countEl.textContent = `共 ${allCount} 项`;
  } else {
    countEl.textContent = `共 ${workItems.length} 项`;
  }

  // Initial render: all items
  renderQTable('ALL');

  // ── MISSING ITEMS ──────────────────────────────────────────
  const missing = r.missing || [];
  document.getElementById('missing-items-section').innerHTML = missing.length ? `
    <div style="background:rgba(248,113,113,0.07);border:1px solid rgba(248,113,113,0.25);border-radius:10px;padding:16px 18px;">
      <div style="font-size:13px;font-weight:600;color:var(--red);margin-bottom:10px;">⚠️ 发现 ${missing.length} 项可能漏算</div>
      ${missing.map(m=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;color:var(--text2);border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="color:var(--red);font-size:14px;">✗</span>${m}
      </div>`).join('')}
    </div>` : '';

  // ── ALERTS ────────────────────────────────────────────────
  const alerts = r.alerts || [];
  document.getElementById('ai-alerts-section').innerHTML = alerts.map(a => `
    <div class="alert ${a.level==='critical'?'alert-critical':a.level==='warning'?'alert-warning':'alert-info'}">
      <div class="alert-icon">${a.level==='critical'?'🚨':a.level==='warning'?'⚠️':'💡'}</div>
      <div class="alert-content">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
    </div>`).join('');

  lastAnalysisResult = r;

  // ── Run diff if re-upload ──────────────────────────────────
  if (window.previousQuotationItems && window.previousQuotationItems.length > 0) {
    const diff = buildQuotationDiff(workItems, window.previousQuotationItems);
    window.lastDiff = diff;
    renderDiffCard(diff);
    window.previousQuotationItems = null;
  }

  showToast('🤖', `分析完成：${workItems.length} 项工程 · ${alerts.length} 项问题 · ${missing.length} 项漏算`);
}

// ── Trigger re-upload ──────────────────────────────────────
function triggerReupload() {
  // keep current result as "previous" for diff
  if (lastAnalysisResult) {
    window.previousQuotationItems = (lastAnalysisResult.items || []).map(i => ({ ...i }));
  }
  // reset UI but keep previous data
  document.getElementById('upload-preview').style.display = 'none';
  document.getElementById('upload-zone').style.display = 'block';
  document.getElementById('ai-loading-state').style.display = 'none';
  document.getElementById('file-input').value = '';
  document.getElementById('q-table-rows').innerHTML = '';
  document.getElementById('missing-items-section').innerHTML = '';
  document.getElementById('ai-alerts-section').innerHTML = '';
  document.getElementById('ai-score-body').innerHTML = '';
  document.getElementById('quotation-diff-card').style.display = 'none';
  document.getElementById('quotation-diff-card').innerHTML = '';
  const old = document.getElementById('client-extract-card');
  if (old) old.remove();
  lastQuotationText = '';
  showToast('🔄', '请上传新版报价单，系统将自动对比变更内容');
}

// ── Quotation diff engine ──────────────────────────────────
function buildQuotationDiff(newItems, prevItems) {
  if (!prevItems || prevItems.length === 0) return null;

  // normalise name for fuzzy match
  const norm = s => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const added   = [];
  const removed = [];
  const changed = [];

  // find added / changed
  newItems.forEach(nItem => {
    const match = prevItems.find(p => norm(p.name) === norm(nItem.name));
    if (!match) {
      added.push(nItem);
    } else {
      const changes = [];
      if (nItem.total != null && match.total != null && Math.abs(nItem.total - match.total) > 0.01)
        changes.push({ field:'小计', from: match.total, to: nItem.total });
      if (nItem.qty != null && match.qty != null && Math.abs(nItem.qty - match.qty) > 0.001)
        changes.push({ field:'数量', from: match.qty, to: nItem.qty });
      if (nItem.unitPrice != null && match.unitPrice != null && Math.abs(nItem.unitPrice - match.unitPrice) > 0.001)
        changes.push({ field:'单价', from: match.unitPrice, to: nItem.unitPrice });
      if (changes.length > 0) changed.push({ item: nItem, changes });
    }
  });

  // find removed
  prevItems.forEach(pItem => {
    const match = newItems.find(n => norm(n.name) === norm(pItem.name));
    if (!match) removed.push(pItem);
  });

  return { added, removed, changed };
}

// ── Render diff card ───────────────────────────────────────
function renderDiffCard(diff) {
  if (!diff) return;
  const { added, removed, changed } = diff;
  if (!added.length && !removed.length && !changed.length) {
    document.getElementById('quotation-diff-card').style.display = 'block';
    document.getElementById('quotation-diff-card').innerHTML = `
      <div style="background:rgba(22,163,74,0.07);border:1px solid rgba(74,222,128,0.25);border-radius:12px;padding:16px 18px;">
        <div style="font-size:13px;font-weight:600;color:var(--green);">✓ 与上一版报价单完全一致，无任何变更</div>
      </div>`;
    return;
  }

  const fmtV = v => v != null ? 'RM ' + Number(v).toLocaleString(undefined, {minimumFractionDigits:2,maximumFractionDigits:2}) : '–';

  let html = `
  <div style="background:var(--surface);border:1px solid var(--border2);border-radius:12px;padding:16px 18px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">
      <span style="font-size:16px;">🔄</span>
      <span style="font-size:13px;font-weight:700;color:var(--orange);letter-spacing:.5px;">与上一版报价单对比</span>
      <div style="margin-left:auto;display:flex;gap:8px;font-size:11px;font-weight:600;">
        ${added.length   ? `<span style="background:rgba(22,163,74,.1);color:var(--green);padding:3px 8px;border-radius:10px;">+${added.length} 新增</span>` : ''}
        ${removed.length ? `<span style="background:rgba(248,113,113,.1);color:var(--red);padding:3px 8px;border-radius:10px;">-${removed.length} 移除</span>` : ''}
        ${changed.length ? `<span style="background:rgba(251,146,60,.1);color:var(--orange);padding:3px 8px;border-radius:10px;">≠ ${changed.length} 变更</span>` : ''}
      </div>
    </div>`;

  if (added.length) {
    html += `<div style="font-size:11px;letter-spacing:1px;color:var(--green);font-weight:700;margin-bottom:6px;text-transform:uppercase;">新增项目</div>`;
    added.forEach(item => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);font-size:12px;">
        <span style="color:var(--green);font-size:14px;font-weight:700;">+</span>
        <span style="flex:1;color:var(--text)">${item.name}</span>
        <span style="color:var(--text2)">${item.unit||''}</span>
        <span style="font-family:'DM Mono',monospace;color:var(--green);font-weight:600;">${item.total!=null?fmtV(item.total):'待确认'}</span>
        <button onclick="addItemToSchedule(${JSON.stringify(item).replace(/"/g,'&quot;')})" style="background:var(--green);color:#0d0f14;border:none;border-radius:5px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">加入进度</button>
      </div>`;
    });
  }

  if (removed.length) {
    html += `<div style="font-size:11px;letter-spacing:1px;color:var(--red);font-weight:700;margin:10px 0 6px;text-transform:uppercase;">移除项目</div>`;
    removed.forEach(item => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--border2);font-size:12px;">
        <span style="color:var(--red);font-size:14px;font-weight:700;">−</span>
        <span style="flex:1;color:var(--text2);text-decoration:line-through;">${item.name}</span>
        <span style="font-family:'DM Mono',monospace;color:var(--text3);">${item.total!=null?fmtV(item.total):'–'}</span>
        <button onclick="removeItemFromSchedule(${JSON.stringify(item.name).replace(/"/g,'&quot;')})" style="background:rgba(248,113,113,.15);color:var(--red);border:1px solid rgba(248,113,113,.3);border-radius:5px;padding:3px 10px;font-size:10px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">从进度移除</button>
      </div>`;
    });
  }

  if (changed.length) {
    html += `<div style="font-size:11px;letter-spacing:1px;color:var(--orange);font-weight:700;margin:10px 0 6px;text-transform:uppercase;">价格/数量变更</div>`;
    changed.forEach(({ item, changes }) => {
      html += `<div style="padding:8px 0;border-bottom:1px solid var(--border2);">
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:4px;">${item.name}</div>
        ${changes.map(c=>`<div style="display:flex;gap:8px;font-size:11px;color:var(--text2);padding:2px 0;padding-left:12px;">
          <span style="color:var(--text3);min-width:40px">${c.field}</span>
          <span style="color:var(--red);text-decoration:line-through">${typeof c.from==='number'&&c.field==='小计'?fmtV(c.from):c.from}</span>
          <span style="color:var(--text3)">→</span>
          <span style="color:var(--green);font-weight:600">${typeof c.to==='number'&&c.field==='小计'?fmtV(c.to):c.to}</span>
        </div>`).join('')}
      </div>`;
    });
  }

  html += `
    <div style="display:flex;gap:8px;margin-top:14px;">
      <button onclick="applyAllDiffToSchedule()" style="background:var(--gold);color:#0d0f14;border:none;border-radius:6px;padding:7px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;">
        ✓ 一键更新所有变更到进度表
      </button>
    </div>
  </div>`;

  document.getElementById('quotation-diff-card').style.display = 'block';
  document.getElementById('quotation-diff-card').innerHTML = html;
}

// ── Gantt schedule auto-update ─────────────────────────────
// Map quotation keywords → Gantt task names
const ITEM_TO_TASK_MAP = [
  { re:/hack|demolish|remove|breaking|拆除/i,     task:'拆除工程' },
  { re:/wiring|conduit|electrical|水电|wiring/i,  task:'水电暗槽布线' },
  { re:/plaster|cement|concrete|泥水/i,           task:'泥水工程' },
  { re:/waterproof|防水/i,                         task:'防水工程' },
  { re:/ceiling|gypsum|plasterboard|吊顶/i,       task:'石膏板吊顶' },
  { re:/tile|tiling|ceramic|地砖/i,               task:'铺砖工程' },
  { re:/floor|timber|wood|laminate|地板/i,        task:'木地板铺设' },
  { re:/cabinet|carpentry|wardrobe|木工/i,        task:'木工柜体' },
  { re:/paint|coat|nippon|dulux|油漆/i,           task:'油漆工程' },
  { re:/door|window|frame|门框|窗框/i,             task:'门框/窗框' },
  { re:/light|fan|sanitary|fixture|灯具|洁具/i,   task:'灯具/洁具' },
  { re:/clean|清洁/i,                             task:'清洁收尾' },
];

function itemToTaskName(itemName) {
  const match = ITEM_TO_TASK_MAP.find(m => m.re.test(itemName));
  return match ? match.task : null;
}

function addItemToSchedule(item) {
  const taskName = itemToTaskName(item.name);
  if (taskName && scheduleItems.find(t => t.name === taskName)) {
    showToast('✅', `「${taskName}」已在进度表中`);
    return;
  }
  const newTask = {
    name: item.name.length > 20 ? item.name.substring(0, 20) + '…' : item.name,
    workDays: 5, offsetDays: Math.max(...scheduleItems.map(t=>t.offsetDays+(t.workDays||5))) + 1,
    color: '#94a3b8', source: 'quotation_added'
  };
  scheduleItems.push(newTask);
  rebuildGantt();
  showToast('✅', `已加入进度表：${newTask.name}`);
}

function removeItemFromSchedule(itemName) {
  const taskName = itemToTaskName(itemName);
  if (taskName) {
    scheduleItems = scheduleItems.filter(t => t.name !== taskName);
    rebuildGantt();
    showToast('🗑️', `已从进度表移除：${taskName}`);
  } else {
    showToast('ℹ️', '未找到对应进度工序，请手动在进度表调整');
  }
}

function applyAllDiffToSchedule() {
  const diff = window.lastDiff;
  if (!diff) return;
  diff.added.forEach(item => addItemToSchedule(item));
  diff.removed.forEach(item => removeItemFromSchedule(item.name));
  showToast('✅', `进度表已更新：+${diff.added.length} 新增 · -${diff.removed.length} 移除`);
  // mark button as done
  const btns = document.querySelectorAll('#quotation-diff-card button');
  btns.forEach(b => { if (b.textContent.includes('一键')) { b.textContent = '✓ 已更新'; b.disabled = true; b.style.opacity = '.6'; }});
}

// rebuildGantt: see full implementation below
function saveClientToProject() {
  // Read from editable input fields (new) or fall back to lastExtractedClient
  const edited = {
    company:    document.getElementById('ce-company')?.value.trim()    || '',
    attention:  document.getElementById('ce-attention')?.value.trim()  || '',
    tel:        document.getElementById('ce-tel')?.value.trim()        || '',
    email:      document.getElementById('ce-email')?.value.trim()      || '',
    address:    document.getElementById('ce-address')?.value.trim()    || '',
    projectRef: document.getElementById('ce-ref')?.value.trim()        || '',
  };
  const c = Object.values(edited).some(v=>v) ? edited : (window.lastExtractedClient || {});

  // Merge edits back into lastExtractedClient
  window.lastExtractedClient = { ...(window.lastExtractedClient||{}), ...edited };
  window.projectClientData   = window.lastExtractedClient;

  const name = c.company || c.attention || '客户';
  showToast('✅', `客户资料已保存：${name}`);

  const card = document.getElementById('client-extract-card');
  if (card) {
    card.style.borderColor = 'rgba(74,222,128,0.4)';
    card.style.background  = 'rgba(74,222,128,0.04)';
    const saveBtn = card.querySelector('button');
    if (saveBtn) { saveBtn.textContent = '✓ 已保存'; saveBtn.style.background = 'var(--green)'; saveBtn.disabled = true; }
  }
}

let lastAnalysisResult = null;

// ══════════════════════════════════════════
//  AI CHAT (Connected to Claude API)
// ══════════════════════════════════════════

let chatHistory = [];

async function sendChat() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;

  const box = document.getElementById('chat-messages');
  chatHistory.push({ role: 'user', content: msg });

  box.innerHTML += `<div class="chat-msg chat-user">${msg}</div>`;
  box.innerHTML += `<div class="chat-msg chat-ai" id="chat-loading"><div class="ai-loading"><div class="ai-spinner"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div></div>AI 分析中...</div></div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;

  const systemPrompt = `你是 RenoSmart 的 AI 顾问，专门为马来西亚和新加坡装修行业提供报价审核、法规咨询和施工建议。
请用中文简洁地回答，可以适当引用 MY/SG 市场价格和相关法规（UBBL 1984、JKR 标准等）。
${lastQuotationText ? `\n当前已上传的报价单内容摘要：\n${lastQuotationText.substring(0,1500)}` : ''}
${lastAnalysisResult ? `\nAI 分析结果摘要：评分 ${lastAnalysisResult.score?.total}/100，漏项：${(lastAnalysisResult.missing||[]).join('、')}` : ''}`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: chatHistory
      })
    });

    const data = await resp.json();
    const reply = data.content?.[0]?.text || '';
    chatHistory.push({ role: 'assistant', content: reply });

    document.getElementById('chat-loading').outerHTML =
      `<div class="chat-msg chat-ai">🤖 <strong>RenoSmart AI：</strong><br><br>${reply.replace(/\n/g,'<br>')}</div>`;

  } catch (err) {
    // Fallback responses
    const fallbacks = {
      '防水': '防水工程属于 <strong>UBBL 1984</strong> 强制要求。湿区（厨房、浴室）需用 Sika 或 Mapei 涂膜防水，厚度 ≥1.5mm，墙面翻高 300mm。费用参考：RM 3.50–8.00/sqft。',
      '油漆': 'Nippon 5001 系列标准施工价：单色双层 RM 1.60–1.90/sqft，含底漆三层 RM 2.00–2.40/sqft。若单价超过 RM 2.80，建议要求说明含哪些工序。',
      '水电': '1,200 sqft 住宅全屋水电参考：基础布线 RM 6,000–9,000；含额外回路 RM 9,000–14,000；全屋管道更换另加。',
      '地砖': '地砖铺设市场价：普通瓷砖 RM 5–8/sqft；抛光砖 RM 7–12/sqft；大理石 RM 15–30/sqft。需包含切割损耗（约8%）。',
    };
    let reply = '根据 MY/SG 市场数据，' + (Object.entries(fallbacks).find(([k])=>msg.includes(k))?.[1] || '请提供更具体的问题，例如：某项工程的市场价格、法规要求、或报价单中的具体项目。');
    chatHistory.push({ role: 'assistant', content: reply });
    document.getElementById('chat-loading').outerHTML =
      `<div class="chat-msg chat-ai">🤖 <strong>RenoSmart AI：</strong><br><br>${reply}</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

// ══════════════════════════════════════════
//  GLOBAL STATE — declared first to avoid TDZ
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  GANTT TASK DATABASE — bilingual, sub-items, material prep
// ══════════════════════════════════════════
// parallelWith: tasks that CAN run simultaneously (share offsetDays)
// mustFollowId: this task starts only after the listed id is 50%+ done
// realismNote: explanation shown in task detail

const GANTT_TASK_DB = [
  {
    id: 'survey',
    names: { zh:'现场勘查 & 备料', en:'Site Survey & Material Order', ms:'Ukur Tapak & Pesanan' },
    workDays: 5, offsetDays: 0, color:'#94a3b8', source:'original',
    parallelGroup: null,
    realismNote: { zh:'施工前必须完成精确量度及所有长交货期材料下单（瓷砖/木地板/订制柜体通常需4-8周交货）', en:'All long-lead items (tiles/flooring/custom cabinets) must be ordered 4-8 weeks before installation' },
    subItems: {
      zh:['精确量度全部施工范围','核对设计平面图与现场尺寸','确认水电位置及预留开槽位置','会同承包商确认施工方案及工序','更新及签署最终合同及装修许可申请'],
      en:['Precise measurement of all work areas','Verify design drawings vs on-site dimensions','Confirm M&E positions and chase/conduit routes','Meet contractor to confirm work sequence','Update and sign final contract & permit application']
    },
    materialPrep: [
      { type:'order', zh:'🛒 下单：地砖/石材 — 确认尺寸、颜色、数量（交货期4-8周）', en:'🛒 Order: Floor tiles/stone — confirm size, color, qty (4-8 week lead time)' },
      { type:'order', zh:'🛒 下单：木地板 — 确认品牌、规格、含甲醛等级（交货期2-4周）', en:'🛒 Order: Timber flooring — confirm brand, spec, formaldehyde grade (2-4 weeks)' },
      { type:'order', zh:'🛒 下单：定制木工柜体 — 量度后下单，生产约4-6周', en:'🛒 Order: Custom cabinetry — order after measurement, 4-6 weeks production' },
      { type:'order', zh:'🛒 下单：卫浴洁具 — 确认尺寸符合平面图排水位', en:'🛒 Order: Sanitary ware — confirm dimensions match floor plan drain points' },
      { type:'order', zh:'🛒 下单：灯具 — 确认嵌灯尺寸与吊顶开孔一致', en:'🛒 Order: Light fittings — confirm recessed light cutout sizes match ceiling plan' },
      { type:'warn',  zh:'⚠️ 提交装修申请表给物业/大厦管理处（部分需1-4周审批）', en:'⚠️ Submit renovation form to building management (some require 1-4 week approval)' },
      { type:'warn',  zh:'⚠️ 确认承包商的工人准证/IC及PSV保险', en:'⚠️ Confirm contractor workers\' IC/permit and PSV insurance' },
    ]
  },
  {
    id: 'demolition',
    names: { zh:'拆除工程', en:'Demolition Works', ms:'Kerja Robuhan' },
    workDays: 7, offsetDays: 5, color:'#f87171', source:'original',
    parallelGroup: null,
    realismNote: { zh:'拆除是所有后续工序的前提，必须100%完成后才可进行水电暗槽', en:'Demolition must complete before M&E rough-in can begin' },
    subItems: {
      zh:['拆除旧门窗及门框','拆除旧地砖（电锤凿地）','拆除旧吊顶及轻钢龙骨','按设计砸墙/开门洞/开窗洞','拆除旧洁具及水管（湿区）','清运建筑废料（需多次）'],
      en:['Remove existing doors, windows, frames','Hack existing floor tiles (electric chisel)','Remove old false ceiling and steel framing','Hacking works per design (walls/openings)','Remove old sanitary ware and plumbing (wet areas)','Debris removal and disposal (multiple loads)']
    },
    materialPrep: [
      { type:'warn',  zh:'⚠️ 拆除前必须全程拍摄现场（地板、墙身、天花、水电位）存档', en:'⚠️ Photograph ALL existing conditions before any demolition (floors, walls, ceiling, M&E)' },
      { type:'warn',  zh:'⚠️ 关闭并贴封水表、电表、燃气总阀', en:'⚠️ Close and seal water main, electrical DB, gas valve' },
      { type:'warn',  zh:'⚠️ 保护非拆除区域（铺地板保护膜、遮盖家具）', en:'⚠️ Protect non-demolition areas (floor film, cover furniture)' },
      { type:'info',  zh:'📋 确认大厦废料搬运时间（多数物业限制工作日9am-5pm）', en:'📋 Confirm building debris removal hours (most restrict to weekdays 9am-5pm)' },
      { type:'info',  zh:'📋 安排废料货车及临时储存区', en:'📋 Arrange lorry and temporary debris staging area' },
    ]
  },
  {
    id: 'mne',
    names: { zh:'水电暗槽布线', en:'M&E Rough-In (Electrical & Plumbing)', ms:'Kerja M&E Kasar' },
    workDays: 12, offsetDays: 10, color:'#fb923c', source:'original',
    parallelGroup: 'rough',
    realismNote: { zh:'水电必须在泥水工程前完成开槽布线，泥水完成后无法修改（否则需凿开已批土墙身）', en:'M&E rough-in MUST complete before plastering — once plastered, changes require hacking finished walls' },
    subItems: {
      zh:['电气：画定所有插座/开关/灯位/空调位','电气：开凿墙身及天花电线槽','电气：穿电线管（冷气、照明、插座分线）','水喉：开凿地板及墙身水管槽','水喉：安装冷热水喉（PEX或不锈钢）','水喉：安装排水管及地漏','水电包管封槽（泥水前验收）'],
      en:['Electrical: Mark all socket/switch/light/AC positions','Electrical: Chase walls and ceiling for conduit','Electrical: Pull wiring (AC, lighting, socket circuits)','Plumbing: Chase floors/walls for water pipes','Plumbing: Install hot/cold supply pipes (PEX or SS)','Plumbing: Install drainage and floor drains','Conduit encasement before plastering inspection']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：总电箱MCB容量足够（通常需25-40A per circuit）', en:'✅ Confirm: DB/MCB capacity sufficient (typically 25-40A per circuit)' },
      { type:'check', zh:'✅ 确认：电气图已获 JKR/TNB 审批（如需新申请电容）', en:'✅ Confirm: Electrical drawings approved by JKR/TNB (if new capacity required)' },
      { type:'order', zh:'🛒 备料：PVC/PEX水管、铜配件、电线管、接线盒', en:'🛒 Materials: PVC/PEX pipes, fittings, conduits, junction boxes' },
      { type:'warn',  zh:'⚠️ 水电完成后拍照存档所有隐蔽管线位置（填补前必做）', en:'⚠️ Photograph ALL concealed pipe/conduit positions before plastering (critical reference)' },
      { type:'info',  zh:'📋 水电工程与泥水工程可同步进行（不同区域）', en:'📋 M&E can run parallel with masonry works in different zones' },
    ]
  },
  {
    id: 'masonry',
    names: { zh:'泥水工程', en:'Masonry & Plastering', ms:'Kerja Batu & Plaster' },
    workDays: 18, offsetDays: 10, color:'#f59e0b', source:'original',
    parallelGroup: 'rough',
    realismNote: { zh:'泥水工程周期最长，通常是整个工程的关键路径。批土需要1-2道，每道需2-3天干燥时间', en:'Masonry is typically the critical path. Skim coat needs 2 coats with 2-3 day drying between each coat' },
    subItems: {
      zh:['砌砖墙（按设计新增墙身）','水泥打底（地板找平）','墙身抹灰（第一道批灰）','填补水电槽及修补',  '墙身批灰第二道（精批）','批土（Skim Coat）2-3层','窗台及门缘修整'],
      en:['Brickwork for new walls (per design)','Floor screed/levelling','First coat plaster (rough coat)','Fill M&E chases and patches','Second coat plaster (smooth)','Skim coat (2-3 layers)','Window sill and door reveal finishing']
    },
    materialPrep: [
      { type:'order', zh:'🛒 备料：砖块、水泥、河沙（提前确认用量）', en:'🛒 Materials: Bricks, cement, river sand (confirm quantities in advance)' },
      { type:'order', zh:'🛒 备料：批土粉（Skim Coat powder）、防水漆底漆', en:'🛒 Materials: Skim coat powder, waterproof primer' },
      { type:'warn',  zh:'⚠️ 批土后至少72小时干燥才可油漆，切勿赶工', en:'⚠️ Skim coat needs at least 72 hours to dry before painting — never rush' },
      { type:'warn',  zh:'⚠️ 新砌砖墙需至少14天养护期才可大面积批土', en:'⚠️ New brickwork needs at least 14 days curing before large-area skimming' },
    ]
  },
  {
    id: 'waterproofing',
    names: { zh:'防水工程', en:'Waterproofing', ms:'Kerja Kalis Air' },
    workDays: 7, offsetDays: 22, color:'#fbbf24', source:'original',
    parallelGroup: null,
    realismNote: { zh:'防水层必须在地砖铺设前施工，并测试不渗水（积水测试48小时）。这是马来西亚UBBL法规强制要求', en:'Waterproofing MUST be done before tiling. Must pass 48-hour flood test. Required by Malaysian UBBL regulations' },
    subItems: {
      zh:['清洁及修补基层（打磨/去粉尘）','阴阳角加强（玻璃纤维布）','防水涂料第一层（底层）','防水涂料第二层（24小时后）','防水涂料第三层（延伸上墙至少150mm）','积水测试（48小时，装水观察）','验收确认无渗漏'],
      en:['Clean and prepare substrate (grinding/dust removal)','Reinforce corners with fibreglass mesh','First coat waterproof membrane','Second coat (after 24hr)','Third coat (extend 150mm up walls minimum)','Flood test (48 hours, observe for leaks)','Inspection and sign-off']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：防水涂料品牌及厚度标准（推荐Sika/Weber/Mapei）', en:'✅ Confirm: Waterproof membrane brand and thickness spec (Sika/Weber/Mapei recommended)' },
      { type:'warn',  zh:'⚠️ 防水完成后禁止大型重物碰触直至铺砖', en:'⚠️ No heavy impact on waterproofed surface before tiling' },
      { type:'warn',  zh:'⚠️ 积水测试必须由业主或设计师亲自见证签字', en:'⚠️ Flood test must be witnessed and signed off by owner or designer' },
      { type:'info',  zh:'📋 厕所/浴室/厨房/工人房均须做防水', en:'📋 All wet areas must be waterproofed: bathrooms, kitchen, utility room' },
    ]
  },
  {
    id: 'ceiling',
    names: { zh:'石膏板吊顶', en:'False Ceiling Works', ms:'Kerja Siling Palsu' },
    workDays: 10, offsetDays: 28, color:'#4ade80', source:'original',
    parallelGroup: 'finishes',
    realismNote: { zh:'吊顶可与地砖工程同步进行（不同区域），但必须在油漆前完成', en:'Ceiling works can run parallel to tiling (different zones), but must complete before painting' },
    subItems: {
      zh:['弹线定位（吊顶标高）','安装吊杆及主龙骨','安装副龙骨（横纵交叉）','封石膏板','接缝处理（玻璃纤维网布+批土）','造型天花/灯槽/窗帘盒（按设计）','嵌灯开孔及安装灯盒'],
      en:['Set out level lines (ceiling height reference)','Install hanger rods and main C-channels','Install cross furring channels (grid pattern)','Fix gypsum board panels','Joint treatment (fibreglass tape + compound)','Feature ceiling/cove lighting/curtain box per design','Recessed light cutouts and junction boxes']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：嵌灯型号及开孔尺寸（需与电气图核对）', en:'✅ Confirm: Recessed light model and cutout size (cross-check with electrical plan)' },
      { type:'check', zh:'✅ 确认：窗帘轨道类型（明装/暗装，影响窗帘盒深度）', en:'✅ Confirm: Curtain track type (surface/concealed — affects cove box depth)' },
      { type:'order', zh:'🛒 备料：轻钢龙骨、石膏板、嵌灯、灯带（提前订货）', en:'🛒 Materials: Steel furring channels, gypsum board, recessed lights, LED strips' },
      { type:'info',  zh:'📋 吊顶完成后才可安装窗帘轨道，避免需要二次拆卸', en:'📋 Install curtain tracks AFTER ceiling completes to avoid rework' },
    ]
  },
  {
    id: 'tiling',
    names: { zh:'铺砖工程', en:'Floor & Wall Tiling', ms:'Kerja Jubin' },
    workDays: 12, offsetDays: 30, color:'#34d399', source:'original',
    parallelGroup: 'finishes',
    realismNote: { zh:'铺砖后需至少48-72小时填缝和干燥。大尺寸砖（600×600以上）需特别注意找平和空鼓', en:'Tiling needs 48-72 hours for grouting and curing. Large format tiles (600×600+) require extra attention to levelling' },
    subItems: {
      zh:['地面精细找平（地板砖专用）','湿区地砖铺设（1%泄水坡度）','湿区墙砖铺设','客厅/餐厅地砖铺设（通常大尺寸）','阳台/入户地砖','填缝（勾缝剂，颜色按设计）','门槛石及收口条安装'],
      en:['Fine floor levelling (tile-specific compound)','Wet area floor tiling (1% gradient to drain)','Wet area wall tiling','Living/dining floor tiling (typically large format)','Balcony/entrance tiling','Grouting (match design color spec)','Door threshold and edge trim installation']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：所有地砖/墙砖已到货（多订5-10%备损耗）', en:'✅ Confirm: All tiles delivered on site (order 5-10% extra for cuts/wastage)' },
      { type:'check', zh:'✅ 确认：门槛石/收口条颜色和材质（不锈钢/铝合金/大理石）', en:'✅ Confirm: Threshold stone and trim color/material (SS/aluminium/marble)' },
      { type:'warn',  zh:'⚠️ 铺砖前必须确认防水测试已通过', en:'⚠️ Waterproofing flood test must PASS before tiling begins' },
      { type:'warn',  zh:'⚠️ 检查到货砖块批次（同批次才能色号一致）', en:'⚠️ Check tile batch numbers on delivery (same batch = consistent color)' },
      { type:'info',  zh:'📋 大尺寸砖（600mm+）须用满铺法，避免空鼓', en:'📋 Large format tiles (600mm+) require full back-buttering to prevent hollow spots' },
    ]
  },
  {
    id: 'flooring',
    names: { zh:'木地板铺设', en:'Timber / Vinyl Flooring', ms:'Pemasangan Lantai Kayu' },
    workDays: 8, offsetDays: 30, color:'#2dd4bf', source:'original',
    parallelGroup: 'finishes',
    realismNote: { zh:'木地板和地砖可同步进行（不同区域）。实木地板需要在施工前在现场适应湿度3-7天', en:'Timber flooring can run parallel to tiling. Solid wood needs 3-7 day on-site acclimatisation' },
    subItems: {
      zh:['铺防潮垫/地垫（实木/复合木地板必须）','铺复合/实木地板（横向顺纹/斜铺按设计）','安装踢脚线','门缘收口处理','保护膜覆盖（后续工序保护）'],
      en:['Install moisture barrier/underlay (required for all timber types)','Install engineered/solid timber boards (direction/pattern per design)','Install skirting boards','Door threshold finishing','Apply protective film (protect during subsequent works)']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：地板已到货并在现场平放适应环境7天（实木必须）', en:'✅ Confirm: Flooring delivered and acclimated on-site 7 days (mandatory for solid wood)' },
      { type:'check', zh:'✅ 确认：地板铺设前地面湿度<75% RH', en:'✅ Confirm: Floor moisture <75% RH before installation' },
      { type:'warn',  zh:'⚠️ 地板铺完后油漆工序必须铺保护膜，否则油漆污染无法清除', en:'⚠️ After flooring, painters MUST lay protection film — paint stains are permanent' },
    ]
  },
  {
    id: 'carpentry',
    names: { zh:'木工柜体', en:'Custom Carpentry & Cabinets', ms:'Kerja Perabot' },
    workDays: 12, offsetDays: 35, color:'#60a5fa', source:'original',
    parallelGroup: 'finishes',
    realismNote: { zh:'定制柜体需提前4-6周工厂生产，到场安装约2-3天。安装时地板和墙面必须已完成', en:'Custom cabinets need 4-6 weeks factory production. On-site installation takes 2-3 days. Floors and walls must be completed first' },
    subItems: {
      zh:['工厂定制：厨柜/浴室镜柜/鞋柜/衣柜/书桌（工厂约4-6周）','现场安装：厨柜吊柜及地柜','安装台面（石英石/大理石/不锈钢）','安装卫浴镜柜及隔板','安装鞋柜/衣柜门片','安装铰链、拉篮、抽屉滑轨','修整及调整（门片对缝/水平）'],
      en:['Factory production: Kitchen/bathroom/shoe/wardrobe/desk cabinets (4-6 weeks)','Install kitchen wall and base cabinets on-site','Install countertops (quartz/marble/stainless steel)','Install bathroom mirror cabinets and shelves','Install shoe cabinet / wardrobe doors','Install hinges, pull-outs, drawer slides','Adjustment and touch-up (door alignment/level)']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：柜体尺寸图已签署确认（工厂生产后无法修改）', en:'✅ Confirm: Cabinet shop drawings signed and approved (cannot change after production starts)' },
      { type:'check', zh:'✅ 确认：台面石材已选定（石英石需2-3周交货，天然石需更长）', en:'✅ Confirm: Countertop material selected (quartz 2-3 weeks, natural stone longer)' },
      { type:'order', zh:'🛒 提前下单：台面、水槽、龙头（需在安装柜体时同步安装）', en:'🛒 Pre-order: Countertop, sink, faucet (need to install simultaneously with cabinet)' },
      { type:'order', zh:'🛒 提前下单：五金配件（铰链/滑轨/拉手品牌及规格）', en:'🛒 Pre-order: Hardware (hinges/slides/handles — confirm brand and spec)' },
    ]
  },
  {
    id: 'painting',
    names: { zh:'油漆工程', en:'Interior Painting', ms:'Kerja Cat' },
    workDays: 10, offsetDays: 47, color:'#a78bfa', source:'original',
    parallelGroup: null,
    realismNote: { zh:'油漆是最后的湿作业，必须在木工、地板完成后才进行。需要2-3层（底漆+两层面漆），每层干燥至少12-24小时', en:'Painting is the last wet trade. Must complete after carpentry and flooring. Needs 3 coats (primer + 2 topcoats) with 12-24hr drying between coats' },
    subItems: {
      zh:['批土修补（已完成墙面再度检查）','打磨（120目→240目砂纸）','遮盖保护（木工/地板/窗框贴保护膜）','刷底漆（防碱底漆）','面漆第一层','面漆第二层（干燥后）','特效/肌理漆/马来漆（如有）','收工清洁撕保护膜'],
      en:['Skim coat repair (re-inspect completed walls)','Sanding (120-grit then 240-grit)','Protection masking (carpentry/flooring/frames)','Apply sealer/primer coat (alkali resistant)','First topcoat','Second topcoat (after drying)','Special effect/texture/marmorino (if specified)','Final clean and remove masking']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：油漆品牌及颜色（务必索取色卡并在现场打样确认）', en:'✅ Confirm: Paint brand and colors (get color swatches, do site mockup for approval)' },
      { type:'check', zh:'✅ 确认：墙面批土已干透（新批土一般需7天）', en:'✅ Confirm: Skim coat fully cured (new skim coat typically needs 7 days)' },
      { type:'warn',  zh:'⚠️ 油漆期间保持通风，不要关闭窗户（气味+有机溶剂）', en:'⚠️ Ensure ventilation during painting (fumes and solvents)' },
      { type:'warn',  zh:'⚠️ 油漆工人必须铺地板保护膜，油漆滴落难以清除', en:'⚠️ Painters must lay floor protection film — paint drops are very difficult to remove' },
    ]
  },
  {
    id: 'doors_windows',
    names: { zh:'门框/窗框安装', en:'Door & Window Installation', ms:'Pemasangan Pintu & Tingkap' },
    workDays: 5, offsetDays: 50, color:'#f472b6', source:'original',
    parallelGroup: 'finishes2',
    realismNote: { zh:'门框通常在泥水完成后安装，但实际在油漆后才安装门扇（避免油漆时门扇受损）', en:'Door frames installed after plastering; door slabs installed after painting to avoid paint damage' },
    subItems: {
      zh:['安装室内房门门框','安装室内房门门扇','安装门锁及执手','安装或更换窗户（铝窗框/隔音玻璃）','安装浴室推拉门/弧形门','密封窗框玻璃胶'],
      en:['Install interior door frames','Install interior door slabs','Install door locks and handles','Install/replace windows (aluminium frame/soundproof glass)','Install bathroom sliding/curved doors','Seal window frames with silicone']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：门锁及执手品牌/型号（需在门框安装前确认开孔规格）', en:'✅ Confirm: Lock and handle brand/model (door bore spec needed before frame installation)' },
      { type:'order', zh:'🛒 订货：实木门/工程门/铁门 — 提前4-6周下单（定制门需更长）', en:'🛒 Order: Solid/hollow/security doors — 4-6 weeks lead time (custom doors longer)' },
    ]
  },
  {
    id: 'fixtures',
    names: { zh:'灯具 & 洁具安装', en:'Fixtures & Fittings', ms:'Pemasangan Kelengkapan' },
    workDays: 5, offsetDays: 53, color:'#c084fc', source:'original',
    parallelGroup: 'finishes2',
    realismNote: { zh:'所有电气和水喉设备在油漆和地砖完成后才安装，避免被后续工序污染或损坏', en:'All electrical and plumbing fixtures installed AFTER painting and tiling, to prevent damage from subsequent trades' },
    subItems: {
      zh:['安装灯具（吊灯/吸顶灯/射灯/灯带）','安装开关及插座面板','安装空调室内机','安装热水器（即热/储水）','安装洗手盆及龙头','安装马桶','安装淋浴房/花洒','安装抽油烟机及炉具'],
      en:['Install light fittings (pendant/ceiling/downlight/LED strips)','Install switch and socket faceplates','Install air conditioning indoor units','Install water heater (instant/storage)','Install wash basin and faucets','Install toilet bowl','Install shower enclosure and head','Install range hood and hob']
    },
    materialPrep: [
      { type:'check', zh:'✅ 确认：所有洁具已到货并检查完好（安装前开箱验货）', en:'✅ Confirm: All sanitary ware delivered and inspected (unbox and check before installation)' },
      { type:'check', zh:'✅ 确认：灯具已到货，数量及型号与设计图一致', en:'✅ Confirm: All light fittings delivered, qty and model match electrical plan' },
      { type:'check', zh:'✅ 确认：空调品牌及型号（BTU匹配房间面积）', en:'✅ Confirm: AC brand and model (BTU matched to room size)' },
      { type:'warn',  zh:'⚠️ 安装马桶前确认地漏位置和法兰规格一致', en:'⚠️ Confirm toilet flange position and size before installation' },
    ]
  },
  {
    id: 'cleaning',
    names: { zh:'清洁收尾', en:'Final Cleaning & Handover', ms:'Pembersihan & Serah Terima' },
    workDays: 3, offsetDays: 58, color:'#94a3b8', source:'original',
    parallelGroup: null,
    realismNote: { zh:'专业竣工清洁包括玻璃/砖缝/五金的深度清洗，建议聘请专业清洁公司（约RM 500-2000视面积）', en:'Professional post-construction cleaning covers glass/tile grout/hardware deep cleaning. Consider professional cleaners (approx RM 500-2000 depending on area)' },
    subItems: {
      zh:['移除所有保护膜和胶纸','玻璃深度清洗（去除水泥痕/油漆污迹）','地砖及砖缝清洗','五金配件抛光及清洁','厨柜内外擦拭','检查及修补油漆（瑕疵修补）','业主交屋检查（Defect List）','编写保固承诺及交接文件'],
      en:['Remove all protection film and masking tape','Deep clean glass (remove cement stains/paint marks)','Clean floor tiles and grout lines','Polish and clean all hardware fittings','Clean inside and outside of all cabinets','Touch-up painting (defects)','Owner handover inspection (defect list)','Prepare warranty and handover documents']
    },
    materialPrep: [
      { type:'info',  zh:'📋 准备：竣工检查清单（Defect List）让业主逐项确认', en:'📋 Prepare: Defect list checklist for owner to sign off item by item' },
      { type:'info',  zh:'📋 准备：保固证书（建议最少12个月防水保固，6个月木工保固）', en:'📋 Prepare: Warranty certificates (min 12 months waterproofing, 6 months carpentry)' },
      { type:'check', zh:'✅ 所有余款及尾款在交屋时结清', en:'✅ Confirm all progress payments settled before handover' },
    ]
  },
];

const ganttTasks = GANTT_TASK_DB.map(t => ({ ...t, name: t.names.zh }));
let scheduleItems = ganttTasks.map(t => ({ ...t }));

// ── Helper: get display name based on current language ──────────
function getTaskDisplayName(task) {
  if (task.names) {
    const lang = currentLang === 'zh' ? 'zh' : currentLang === 'ms' ? 'ms' : 'en';
    return task.names[lang] || task.names.en || task.name;
  }
  return task.name;
}

// ── Helper: count working days between two dates ────────────────
function countWorkDaysBetween(start, end) {
  let count = 0;
  let d = new Date(start);
  while (d < end) {
    if (isWorkingDay(d)) count++;
    d = addDays(d, 1);
  }
  return count;
}

let projectStartDate = (() => {
  const d = new Date(); d.setHours(0,0,0,0);
  const day = d.getDay();
  const skip = day===0?1:day===1?0:8-day;
  d.setDate(d.getDate()+skip); return d;
})();
let workOnSaturday = false;
let workOnSunday   = false;
let dayOverrides   = {};
const TODAY_DATE   = (() => { const d=new Date(); d.setHours(0,0,0,0); return d; })();

let currentRegion = 'MY';
let currentLang   = 'en';

const dateKey  = d => d.toISOString().slice(0,10);
const addDays  = (d,n)=>{ const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const diffDays = (a,b)=>Math.round((b-a)/86400000);
const fmtDate  = d=>d.toLocaleDateString('en-MY',{day:'numeric',month:'short'});

// ══════════════════════════════════════════
//  i18n — LANGUAGE SWITCHER
// ══════════════════════════════════════════

const TRANSLATIONS = {
  en: {
    // Nav bar
    nav_designer: 'Designer',
    nav_owner: 'Owner',
    nav_worker: 'Worker',
    // Sidebar
    sidebar_logged_as: 'Logged in as',
    sidebar_workspace: 'WORKSPACE',
    sidebar_projects: 'PROJECTS',
    sidebar_team: 'TEAM',
    sidebar_settings: 'SETTINGS',
    sidebar_new_project: 'New Project',
    nav_quotation: 'Quotation Import',
    nav_ai_review: 'AI Review',
    nav_schedule: 'Schedule',
    nav_export: 'Export Report',
    nav_workers: 'Worker Roster',
    nav_pricelist: 'Price Library',
    nav_preferences: 'Preferences',
    // Upload panel
    upload_title: 'Upload Quotation',
    upload_sub: 'Supports Excel (.xlsx/.xls), CSV, PDF · AI reads and auto-reviews content',
    upload_click: 'Click to upload',
    upload_or: 'or drag & drop file here',
    upload_formats: 'Supports .xlsx · .xls · .csv · .pdf · Max 10MB',
    ai_reading: 'Reading file...',
    ai_analyzing: 'AI is analysing quotation against market price database...',
    ai_score_title: 'Overall Score & Risk Assessment',
    ai_market_data: 'Based on MY/SG 2025 market data',
    tbl_items_title: 'Identified Work Items',
    tbl_desc: 'Description', tbl_unit: 'Unit', tbl_qty: 'Qty',
    tbl_unitprice: 'Unit Price', tbl_total: 'Subtotal', tbl_status: 'AI Status',
    btn_reupload: 'Re-upload',
    btn_full_report: 'View Full AI Report →',
    btn_gen_schedule: 'Generate Schedule',
    btn_export_pdf: 'Export PDF Report',
    btn_reupload_new: '🔄 Re-upload Quotation',
    btn_send_owner: 'Send to Owner for Review',
    // Chat
    chat_title: 'Ask AI Follow-up',
    chat_placeholder: 'e.g. Does the bathroom waterproofing meet JKR standards?',
    btn_send: 'Send',
    // Schedule
    sched_title: 'Schedule Planning',
    sched_sub: 'Calendar sync · Auto-skips weekends & public holidays · Click any task to see subtasks & material checklist',
    sched_start: 'Start Date',
    sched_deadline: 'Target Deadline',
    sched_workdays: 'Work Days',
    sched_sat: 'Sat', sched_sun: 'Sun',
    sched_no_weekend: 'Weekends excluded by default',
    btn_override: '✏️ Override Special Work Days',
    btn_ai_schedule: '✨ AI Smart Schedule',
    gantt_title: 'Construction Gantt Chart (Calendar Sync)',
    btn_publish_schedule: 'Publish to Owner & Workers',
    btn_export_excel: 'Export Excel Schedule',
    toast_schedule_sent: 'Schedule sent to owner and workers!',
    // Override modal
    override_title: '✏️ Override Work Days',
    override_sub: 'Set whether specific dates are work days (overrides system default). Orange = public holiday, grey = weekend.',
    override_save: 'Save Changes',
    override_cancel: 'Cancel',
  },

  ms: {
    nav_designer: 'Pereka',
    nav_owner: 'Pemilik',
    nav_worker: 'Pekerja',
    sidebar_logged_as: 'Log masuk sebagai',
    sidebar_workspace: 'RUANG KERJA',
    sidebar_projects: 'PROJEK',
    sidebar_team: 'PASUKAN',
    sidebar_settings: 'TETAPAN',
    sidebar_new_project: 'Projek Baru',
    nav_quotation: 'Import Sebut Harga',
    nav_ai_review: 'Semakan AI',
    nav_schedule: 'Jadual',
    nav_export: 'Eksport Laporan',
    nav_workers: 'Senarai Pekerja',
    nav_pricelist: 'Pangkalan Harga',
    nav_preferences: 'Keutamaan',
    upload_title: 'Muat Naik Sebut Harga',
    upload_sub: 'Sokong Excel (.xlsx/.xls), CSV, PDF · AI akan baca dan semak secara automatik',
    upload_click: 'Klik untuk muat naik',
    upload_or: 'atau seret & lepas fail di sini',
    upload_formats: 'Sokong .xlsx · .xls · .csv · .pdf · Maks 10MB',
    ai_reading: 'Membaca fail...',
    ai_analyzing: 'AI sedang menganalisis sebut harga berbanding pangkalan harga pasaran...',
    ai_score_title: 'Skor Keseluruhan & Penilaian Risiko',
    ai_market_data: 'Berdasarkan data pasaran MY/SG 2025',
    tbl_items_title: 'Item Kerja Yang Dikenal Pasti',
    tbl_desc: 'Penerangan', tbl_unit: 'Unit', tbl_qty: 'Kuantiti',
    tbl_unitprice: 'Harga Seunit', tbl_total: 'Jumlah Kecil', tbl_status: 'Status AI',
    btn_reupload: 'Muat Naik Semula',
    btn_full_report: 'Lihat Laporan AI Penuh →',
    btn_gen_schedule: 'Jana Jadual',
    btn_export_pdf: 'Eksport Laporan PDF',
    btn_reupload_new: '🔄 Muat Naik Sebut Harga Baru',
    btn_send_owner: 'Hantar kepada Pemilik untuk Semakan',
    chat_title: 'Tanya AI Lanjutan',
    chat_placeholder: 'Cth: Adakah kalis air bilik mandi memenuhi piawaian JKR?',
    btn_send: 'Hantar',
    sched_title: 'Perancangan Jadual',
    sched_sub: 'Segerak kalendar · Langkau hujung minggu & cuti umum · Klik mana-mana tugas untuk lihat senarai semak',
    sched_start: 'Tarikh Mula',
    sched_deadline: 'Tarikh Akhir Sasaran',
    sched_workdays: 'Hari Kerja',
    sched_sat: 'Sab', sched_sun: 'Ahd',
    sched_no_weekend: 'Hujung minggu dikecualikan secara lalai',
    btn_override: '✏️ Laraskan Hari Kerja Khas',
    btn_ai_schedule: '✨ Jadual AI Pintar',
    gantt_title: 'Carta Gantt Pembinaan (Segerak Kalendar)',
    btn_publish_schedule: 'Terbitkan kepada Pemilik & Pekerja',
    btn_export_excel: 'Eksport Jadual Excel',
    toast_schedule_sent: 'Jadual telah dihantar kepada pemilik dan pekerja!',
    override_title: '✏️ Laraskan Hari Kerja',
    override_sub: 'Tetapkan sama ada tarikh tertentu adalah hari kerja. Oren = cuti umum, kelabu = hujung minggu.',
    override_save: 'Simpan Perubahan',
    override_cancel: 'Batal',
  },

  zh: {
    nav_designer: '设计师端',
    nav_owner: '业主端',
    nav_worker: '工人端',
    sidebar_logged_as: '登录身份',
    sidebar_workspace: '工作台',
    sidebar_projects: '项目',
    sidebar_team: '团队',
    sidebar_settings: '设置',
    sidebar_new_project: '新建项目',
    nav_quotation: '报价单导入',
    nav_ai_review: 'AI 审核结果',
    nav_schedule: '工程进度编排',
    nav_export: '导出报告',
    nav_workers: '工人名册',
    nav_pricelist: '价格数据库',
    nav_preferences: '偏好设置',
    upload_title: '上传报价单',
    upload_sub: '支持 Excel (.xlsx/.xls)、CSV、PDF 文字版 · AI 自动读取并审核',
    upload_click: '点击上传',
    upload_or: '或将文件拖放至此处',
    upload_formats: '支持 .xlsx · .xls · .csv · .pdf · 最大 10MB',
    ai_reading: '正在读取文件...',
    ai_analyzing: 'AI 正在分析报价单，对比市场价格库...',
    ai_score_title: '综合评分 & 风险评估',
    ai_market_data: '基于 MY/SG 2025 市场数据',
    tbl_items_title: '已识别工程项目',
    tbl_desc: '工程项目', tbl_unit: '单位', tbl_qty: '数量',
    tbl_unitprice: '单价', tbl_total: '小计', tbl_status: 'AI 状态',
    btn_reupload: '重新上传',
    btn_full_report: '查看完整 AI 报告 →',
    btn_gen_schedule: '生成工程进度',
    btn_export_pdf: '导出 PDF 报告',
    btn_reupload_new: '🔄 重新上传报价单',
    btn_send_owner: '发送给业主审阅',
    chat_title: '向 AI 追问',
    chat_placeholder: '例：这份报价的浴室防水标准符合 JKR 要求吗？',
    btn_send: '发送',
    sched_title: '工程进度编排',
    sched_sub: '日历同步 · 自动跳过周末及公共假期 · 点击任务查看细分内容和备料清单',
    sched_start: '开工日期',
    sched_deadline: '目标完工日期',
    sched_workdays: '施工日',
    sched_sat: '周六', sched_sun: '周日',
    sched_no_weekend: '默认不含周末',
    btn_override: '✏️ 手动调整特殊施工日',
    btn_ai_schedule: '✨ AI 智能编排',
    gantt_title: '施工甘特图（日历同步）',
    btn_publish_schedule: '发布给业主 & 工人',
    btn_export_excel: '导出 Excel 进度表',
    toast_schedule_sent: '进度表已发送给业主及工人团队！',
    override_title: '✏️ 手动调整施工日',
    override_sub: '设定特殊日期是否施工（覆盖系统默认）。橙色 = 公共假期，灰色 = 周末。',
    override_save: '保存调整',
    override_cancel: '取消',
  },
};

// currentLang declared in GLOBAL STATE above

function t(key) {
  return (TRANSLATIONS[currentLang] || TRANSLATIONS.en)[key] || TRANSLATIONS.en[key] || key;
}

function setLang(code) {
  currentLang = code;
  // Update toggle buttons
  ['en','ms','zh'].forEach(l => {
    document.getElementById('btn-lang-'+l)?.classList.toggle('active', l === code);
  });
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) el.textContent = text;
  });
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const text = t(key);
    if (text) el.placeholder = text;
  });
  // Update override modal static text
  const ovTitle = document.querySelector('#modal-override .modal-box > div:first-child div');
  if (ovTitle) ovTitle.textContent = t('override_title');
  const ovSave  = document.querySelector('#modal-override .btn-gold');
  if (ovSave)  ovSave.textContent = t('override_save');
  const ovCancel = document.querySelector('#modal-override .btn-ghost');
  if (ovCancel) ovCancel.textContent = t('override_cancel');
  showToast(code === 'zh' ? '🀄' : code === 'ms' ? '🇲🇾' : '🇬🇧',
    code === 'zh' ? '已切换至中文' : code === 'ms' ? 'Bahasa ditukar ke Melayu' : 'Language set to English');
  // Rebuild Gantt so task names and labels use the new language
  rebuildGantt();
}

const PRICE_DB = {
  MY: {
    currency: 'RM',
    label: 'Malaysia (RM)',
    locationLabel: 'Kuala Lumpur, MY',
    priceRef: 'MY 2025 市场价格',
    ranges: {
      '批土 Skim Coat':       { min:0.80, max:1.50, avg:1.10, unit:'sqft' },
      '防水 Waterproofing':   { min:3.50, max:8.00, avg:5.20, unit:'sqft' },
      '地砖 Floor Tiling':    { min:5.00, max:12.00,avg:7.50, unit:'sqft' },
      '石膏板吊顶 Ceiling':   { min:8.00, max:18.00,avg:12.50,unit:'sqft' },
      '全屋水电 Rewiring':    { min:5500, max:16000,avg:9200, unit:'unit' },
      '室内油漆 Paint':       { min:1.20, max:2.80, avg:1.80, unit:'sqft' },
      '木工柜体 Cabinet':     { min:800,  max:2000, avg:1200, unit:'ft'   },
    },
    priceNote: '批土 RM0.80–1.50/sqft | 防水 RM3.50–8.00/sqft | 地砖 RM5–12/sqft | 吊顶 RM8–18/sqft | 油漆 RM1.20–2.80/sqft | 木工柜 RM800–2,000/ft | 水电全屋 RM5,500–16,000',
  },
  SG: {
    currency: 'SGD',
    label: 'Singapore (SGD)',
    locationLabel: 'Singapore, SG',
    priceRef: 'SG 2025 市场价格',
    ranges: {
      '批土 Skim Coat':       { min:1.80, max:3.50, avg:2.50, unit:'sqft' },
      '防水 Waterproofing':   { min:8.00, max:18.00,avg:12.00,unit:'sqft' },
      '地砖 Floor Tiling':    { min:10.0, max:25.00,avg:16.00,unit:'sqft' },
      '石膏板吊顶 Ceiling':   { min:18.0, max:40.00,avg:28.00,unit:'sqft' },
      '全屋水电 Rewiring':    { min:8000, max:25000,avg:14000,unit:'unit' },
      '室内油漆 Paint':       { min:2.50, max:5.50, avg:3.80, unit:'sqft' },
      '木工柜体 Cabinet':     { min:1500, max:4500, avg:2800, unit:'ft'   },
    },
    priceNote: '批土 SGD1.80–3.50/sqft | 防水 SGD8–18/sqft | 地砖 SGD10–25/sqft | 吊顶 SGD18–40/sqft | 油漆 SGD2.50–5.50/sqft | 木工柜 SGD1,500–4,500/ft | 水电全屋 SGD8,000–25,000',
  }
};

// currentRegion declared in GLOBAL STATE above

function setRegion(code) {
  currentRegion = code;

  // Toggle button states
  document.getElementById('btn-region-my').classList.toggle('active', code === 'MY');
  document.getElementById('btn-region-sg').classList.toggle('active', code === 'SG');

  const db = PRICE_DB[code];

  // Update location label in sidebar
  const locEl = document.querySelector('.sidebar [style*="color:var(--text3)"]');
  if (locEl && locEl.textContent.includes(',')) locEl.textContent = db.locationLabel;

  // Update all "基于 MY/SG 2025" labels
  document.querySelectorAll('[id$="-meta-display"], [data-region-label]').forEach(el => {
    el.textContent = el.textContent.replace(/MY\/SG|MY|SG/, code);
  });
  document.querySelectorAll('.panel-sub, [class*="ai-header"] div').forEach(el => {
    if (el.textContent.includes('MY/SG') || el.textContent.includes('MY') || el.textContent.includes('SG')) {
      el.textContent = el.textContent
        .replace('MY/SG', code)
        .replace(/基于 (MY|SG) 2025/, `基于 ${db.priceRef}`);
    }
  });

  // Update price library panel header if visible
  const priceHeader = document.querySelector('#panel-price .panel-sub');
  if (priceHeader) {
    priceHeader.textContent = `${db.priceRef} · 持续学习更新中`;
  }

  // Rebuild gantt with new region's holidays
  rebuildGantt();

  showToast(code === 'MY' ? '🇲🇾' : '🇸🇬',
    `已切换至 ${db.label} · 价格库及假期日历已更新`);
}

function getRegionCurrency() { return PRICE_DB[currentRegion].currency; }
function getRegionPriceNote() { return PRICE_DB[currentRegion].priceNote; }
function getRegionRanges()    { return PRICE_DB[currentRegion].ranges; }

// ══════════════════════════════════════════
//  CALENDAR-AWARE GANTT ENGINE
// ══════════════════════════════════════════

// ── Public Holidays DB (2025–2027) ───────
// Real-time: TODAY_DATE uses browser clock, holidays are pre-loaded
const PUBLIC_HOLIDAYS = {
  MY: [
    // ── 2025 ──
    '2025-01-01', // New Year
    '2025-01-29','2025-01-30', // CNY
    '2025-02-01', // Federal Territory Day
    '2025-03-31', // Nuzul Al-Quran
    '2025-04-01','2025-04-02','2025-04-03', // Hari Raya Aidilfitri
    '2025-05-01', // Labour Day
    '2025-05-12', // Wesak Day
    '2025-06-02', // Agong Birthday (replacement)
    '2025-06-07', // Agong Birthday / Hari Raya Haji
    '2025-07-07', // Hari Raya Aidiladha
    '2025-07-27', // Awal Muharram
    '2025-08-31', // National Day
    '2025-09-16', // Malaysia Day
    '2025-10-06', // Maulidur Rasul
    '2025-10-20', // Deepavali
    '2025-12-25', // Christmas
    // ── 2026 ──
    '2026-01-01', // New Year
    '2026-01-17','2026-01-18','2026-01-19', // CNY (蛇年 Jan 17–18, +補假 19)
    '2026-02-02', // Federal Territory Day
    '2026-03-18', // Nuzul Al-Quran (est.)
    '2026-03-20','2026-03-21','2026-03-22', // Hari Raya Aidilfitri (est.)
    '2026-05-01', // Labour Day
    '2026-05-31', // Wesak Day (est.)
    '2026-05-27', // Hari Raya Aidiladha (est.)
    '2026-06-01', // Agong Birthday (est.)
    '2026-07-16', // Awal Muharram (est.)
    '2026-08-31', // National Day
    '2026-09-16', // Malaysia Day
    '2026-09-24', // Maulidur Rasul (est.)
    '2026-11-08', // Deepavali (est.)
    '2026-12-25', // Christmas
    // ── 2027 (est.) ──
    '2027-01-01',
    '2027-02-06','2027-02-07', // CNY (蛇年 → 马年)
    '2027-02-08', // Federal Territory Day
    '2027-03-09','2027-03-10', // Hari Raya Aidilfitri (est.)
    '2027-05-01',
    '2027-05-16', // Hari Raya Aidiladha (est.)
    '2027-08-31','2027-09-16',
    '2027-12-25',
  ],
  SG: [
    // ── 2025 ──
    '2025-01-01',
    '2025-01-29','2025-01-30','2025-01-31', // CNY + replacement
    '2025-04-18', // Good Friday
    '2025-05-01', // Labour Day
    '2025-05-12', // Vesak Day
    '2025-06-07', // Hari Raya Haji
    '2025-08-09', // National Day
    '2025-10-20', // Deepavali
    '2025-12-25', // Christmas
    // ── 2026 ──
    '2026-01-01',
    '2026-01-17','2026-01-18','2026-01-19', // CNY + replacement
    '2026-04-03', // Good Friday (est.)
    '2026-05-01', // Labour Day
    '2026-05-20', // Vesak Day (est.)
    '2026-05-27', // Hari Raya Haji (est.)
    '2026-08-10', // National Day (replacement for Sun Aug 9)
    '2026-11-08', // Deepavali (est.)
    '2026-12-25', // Christmas
    // ── 2027 (est.) ──
    '2027-01-01',
    '2027-02-06','2027-02-07',
    '2027-03-26', // Good Friday (est.)
    '2027-05-01',
    '2027-05-05', // Vesak (est.)
    '2027-05-16', // Hari Raya Haji (est.)
    '2027-08-09',
    '2027-10-29', // Deepavali (est.)
    '2027-12-25',
  ],
};

const HOLIDAY_NAMES = {
  // 2025 MY
  '2025-01-01':'元旦 New Year\'s Day',
  '2025-01-29':'农历新年 CNY Day 1','2025-01-30':'农历新年 CNY Day 2',
  '2025-02-01':'联邦直辖区日 FT Day',
  '2025-03-31':'Nuzul Al-Quran',
  '2025-04-01':'Hari Raya Aidilfitri (1)','2025-04-02':'Hari Raya Aidilfitri (2)','2025-04-03':'Hari Raya (补假)',
  '2025-05-01':'劳动节 Labour Day',
  '2025-05-12':'卫塞节 Wesak/Vesak Day',
  '2025-06-02':'最高元首生日 (补假)','2025-06-07':'最高元首生日 / Hari Raya Haji',
  '2025-07-07':'哈芝节 Hari Raya Aidiladha','2025-07-27':'Awal Muharram',
  '2025-08-09':'新加坡国庆日 SG National Day',
  '2025-08-31':'马来西亚国庆日 Merdeka Day',
  '2025-09-16':'马来西亚日 Malaysia Day',
  '2025-10-06':'先知诞辰 Maulidur Rasul',
  '2025-10-20':'屠妖节 Deepavali',
  '2025-12-25':'圣诞节 Christmas',
  // 2025 SG extra
  '2025-01-31':'CNY 补假',
  '2025-04-18':'Good Friday',
  // 2026 MY
  '2026-01-01':'元旦 New Year\'s Day',
  '2026-01-17':'农历新年 CNY Day 1 (蛇年)','2026-01-18':'农历新年 CNY Day 2','2026-01-19':'CNY 补假',
  '2026-02-02':'联邦直辖区日 FT Day',
  '2026-03-18':'Nuzul Al-Quran (est.)',
  '2026-03-20':'Hari Raya Aidilfitri (1)','2026-03-21':'Hari Raya Aidilfitri (2)','2026-03-22':'Hari Raya (补假)',
  '2026-05-01':'劳动节 Labour Day',
  '2026-05-27':'哈芝节 Hari Raya Aidiladha (est.)','2026-05-31':'卫塞节 Wesak Day (est.)',
  '2026-06-01':'最高元首生日 Agong Birthday (est.)',
  '2026-07-16':'Awal Muharram (est.)',
  '2026-08-10':'SG National Day (补假)','2026-08-31':'马来西亚国庆日 Merdeka Day',
  '2026-09-16':'马来西亚日 Malaysia Day',
  '2026-09-24':'先知诞辰 Maulidur Rasul (est.)',
  '2026-11-08':'屠妖节 Deepavali (est.)',
  '2026-12-25':'圣诞节 Christmas',
  // 2026 SG extra
  '2026-04-03':'Good Friday (est.)',
  '2026-05-20':'卫塞节 Vesak Day (est.)',
  // 2027
  '2027-01-01':'元旦 New Year\'s Day',
  '2027-02-06':'农历新年 CNY Day 1','2027-02-07':'农历新年 CNY Day 2','2027-02-08':'联邦直辖区日 FT Day',
  '2027-03-09':'Hari Raya Aidilfitri (1)','2027-03-10':'Hari Raya Aidilfitri (2)',
  '2027-05-01':'劳动节 Labour Day','2027-05-16':'哈芝节 Hari Raya Haji (est.)',
  '2027-08-31':'马来西亚国庆日','2027-09-16':'马来西亚日','2027-12-25':'圣诞节 Christmas',
};

// ── Task definitions already declared in GLOBAL STATE above ──

// ── Calendar Engine functions ─────────────

function isHoliday(d){
  return (PUBLIC_HOLIDAYS[currentRegion]||[]).includes(dateKey(d));
}
function isWorkingDay(d){
  const k=dateKey(d), wd=d.getDay();
  if(k in dayOverrides) return dayOverrides[k];
  if(wd===6&&!workOnSaturday) return false;
  if(wd===0&&!workOnSunday)   return false;
  if(isHoliday(d)) return false;
  return true;
}
function workDayOffset(start,n){
  let d=new Date(start),c=0;
  while(c<n){ d=addDays(d,1); if(isWorkingDay(d))c++; } return d;
}
function addWorkDays(start,n){
  let d=new Date(start),c=0;
  while(c<n){ if(isWorkingDay(d))c++; if(c<n)d=addDays(d,1); } return d;
}
function computeSchedule(){
  return scheduleItems.map(t=>{
    const calStart=t.offsetDays===0?new Date(projectStartDate):workDayOffset(projectStartDate,t.offsetDays);
    const calEnd=addWorkDays(calStart,t.workDays);
    return{...t,calStart,calEnd};
  });
}

// ── Main Gantt Render ─────────────────────
// ══════════════════════════════════════════
//  AI INTELLIGENT SCHEDULING
// ══════════════════════════════════════════

async function generateAISchedule() {
  const btn = document.getElementById('btn-ai-sched');
  const icon = document.getElementById('ai-sched-icon');
  const label = document.getElementById('ai-sched-label');
  btn.classList.add('loading');
  icon.innerHTML = '<span class="spin">⟳</span>';
  label.textContent = 'AI 分析中...';

  const quotItems = window._qAllItems || [];
  const totalAmt = window._qTotalAmount || 0;
  const targetDate = document.getElementById('sched-deadline-date')?.value || '';
  const startDate = dateKey(projectStartDate);

  // Build rule-based schedule first (immediate), then try AI enhancement
  const ruleSchedule = buildRuleBasedSchedule(quotItems, totalAmt);
  applyGeneratedSchedule(ruleSchedule);
  showToast('📅', `已根据报价单重新编排施工进度 (${ruleSchedule.length} 道工序)`);

  // Try Claude API for enhanced schedule
  if (quotItems.length > 0) {
    try {
      const itemsSummary = quotItems.slice(0, 30).map(i =>
        `${i.section || ''}: ${i.name} | ${i.unit || ''} ${i.qty || ''} | 小计 ${i.total ? 'RM '+i.total : '待定'}`
      ).join('\n');

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `你是马来西亚装修工程进度编排专家。请分析以下报价单内容，生成合理的施工进度计划。

报价单摘要（共 ${quotItems.length} 项，总额 RM ${totalAmt.toLocaleString()}）：
${itemsSummary}

开工日期：${startDate}
${targetDate ? `业主期望完工日期：${targetDate}` : ''}

马来西亚装修实际经验规则：
1. 大型商业/办公室翻新（RM 200,000以上）通常需要4-9个月
2. 结构工程（砌砖/拆除/RC）是关键路径，必须最先完成
3. 水电必须在泥水批土前完成暗槽，无法回头
4. 防水测试48小时后才可铺砖
5. 批土需7-14天干燥才可油漆
6. 定制木工需提前4-6周工厂生产（计入备料期）
7. 同层不同区域的工序可以并行（如泥水工扩建同时水电工做另一区）
8. 多层楼：每层可错开2-3周启动（节约关键资源但保持整体进度）

请返回 JSON，不要其他文字：
{
  "tasks": [
    {
      "id": "唯一ID",
      "nameZH": "工序中文名称",
      "nameEN": "Task name in English",
      "nameMS": "Nama dalam Bahasa Melayu",
      "workDays": 整数施工工作天数,
      "offsetDays": 从开工日算的工作天数偏移,
      "color": "#十六进制颜色",
      "parallelNote": "可同步施工的说明（如有）或null",
      "realismNote": "为什么这个工期合理的说明"
    }
  ],
  "totalCalendarWeeks": 总日历周数,
  "feasibilityNote": "对业主期望工期的评估（如提供了目标日期）",
  "criticalPath": ["关键路径工序ID列表"]
}`
          }]
        })
      });

      const data = await resp.json();
      const rawText = data.content?.[0]?.text || '';
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        const aiResult = JSON.parse(match[0]);
        if (aiResult.tasks && aiResult.tasks.length >= 5) {
          const aiSchedule = aiResult.tasks.map(t => ({
            id: t.id,
            names: { zh: t.nameZH, en: t.nameEN, ms: t.nameMS || t.nameEN },
            name: t.nameZH,
            workDays: Math.max(1, parseInt(t.workDays) || 5),
            offsetDays: Math.max(0, parseInt(t.offsetDays) || 0),
            color: t.color || '#60a5fa',
            source: 'ai_generated',
            parallelGroup: t.parallelNote ? 'ai' : null,
            realismNote: { zh: t.realismNote || '', en: t.realismNote || '' },
            subItems: { zh: [], en: [] },
            materialPrep: [],
          }));
          // Merge: try to match existing DB entries for rich sub-items
          const enriched = aiSchedule.map(aiTask => {
            const dbMatch = GANTT_TASK_DB.find(db =>
              aiTask.name.includes(db.names.zh.slice(0,4)) ||
              aiTask.names.en.toLowerCase().includes(db.names.en.split(' ')[0].toLowerCase())
            );
            return dbMatch ? { ...dbMatch, ...aiTask, subItems: dbMatch.subItems, materialPrep: dbMatch.materialPrep, names: aiTask.names } : aiTask;
          });
          applyGeneratedSchedule(enriched);
          showToast('🤖', `AI 重新编排完成！${aiResult.totalCalendarWeeks ? aiResult.totalCalendarWeeks + ' 周' : ''} ${aiResult.feasibilityNote || ''}`);
          if (aiResult.feasibilityNote) {
            setTimeout(() => showToast('💡', aiResult.feasibilityNote.slice(0, 80)), 2000);
          }
        }
      }
    } catch(e) {
      // Silently fall back to rule-based (already applied)
    }
  }

  btn.classList.remove('loading');
  icon.textContent = '✨';
  label.textContent = t('btn_ai_schedule') || 'AI 智能编排';
  checkDeadlineFeasibility();
}

// ── Rule-based schedule from quotation items ────────────────────
function buildRuleBasedSchedule(items, totalAmt) {
  // Detect what types of work are in the quotation
  const allText = items.map(i => (i.name||'')+(i.section||'')).join(' ').toLowerCase();
  const hasStructural = /construct|brick wall|hack.*wall|extension|masonry|structure/.test(allText);
  const hasME = /electrical|plumbing|wiring|conduit|pipe|water|m&e/.test(allText);
  const hasWaterproof = /waterproof|kalis air/.test(allText);
  const hasCeiling = /ceiling|false ceiling|plaster ceiling|siling/.test(allText);
  const hasTiling = /tile|tiling|jubin|floor tile|wall tile/.test(allText);
  const hasFlooring = /vinyl|timber|laminate|flooring|lantai/.test(allText);
  const hasCarpentry = /cabinet|carpentry|wardrobe|kitchen cabinet|cupboard|kayu/.test(allText);
  const hasPainting = /paint|nippon|dulux|cat|painting/.test(allText);
  const hasGlass = /glass|window|door|pintu|tingkap|tempered/.test(allText);

  // Scale durations by project size
  const scale = totalAmt > 300000 ? 3.5 : totalAmt > 150000 ? 2.5 : totalAmt > 80000 ? 1.8 : totalAmt > 30000 ? 1.2 : 1;
  const numFloors = totalAmt > 300000 ? 4 : totalAmt > 150000 ? 3 : totalAmt > 80000 ? 2 : 1;

  const tasks = [];
  let offset = 0;

  // Always start with survey
  tasks.push({ ...GANTT_TASK_DB[0], name: GANTT_TASK_DB[0].names.zh, workDays: 5, offsetDays: 0, source: 'quotation_added' });
  offset = 5;

  // Demolition (if structural work exists, increase)
  const demolition = { ...GANTT_TASK_DB[1], name: GANTT_TASK_DB[1].names.zh };
  demolition.workDays = hasStructural ? Math.round(8 * scale) : 5;
  demolition.offsetDays = offset;
  tasks.push({ ...demolition, source: 'quotation_added' });
  offset += Math.ceil(demolition.workDays * 0.6);

  // M&E and Masonry run in parallel
  if (hasME) {
    const mne = { ...GANTT_TASK_DB[2], name: GANTT_TASK_DB[2].names.zh };
    mne.workDays = Math.round(12 * scale);
    mne.offsetDays = offset;
    tasks.push({ ...mne, source: 'quotation_added' });
  }
  if (hasStructural) {
    const masonry = { ...GANTT_TASK_DB[3], name: GANTT_TASK_DB[3].names.zh };
    masonry.workDays = Math.round(18 * scale);
    masonry.offsetDays = offset;
    tasks.push({ ...masonry, source: 'quotation_added' });
    offset += Math.round(masonry.workDays * 0.7);
  } else {
    offset += Math.round(12 * scale * 0.8);
  }

  // Waterproofing
  if (hasWaterproof || hasTiling) {
    const wp = { ...GANTT_TASK_DB[4], name: GANTT_TASK_DB[4].names.zh };
    wp.workDays = Math.round(6 * (numFloors > 1 ? Math.min(numFloors, 3) : 1));
    wp.offsetDays = offset;
    tasks.push({ ...wp, source: 'quotation_added' });
    offset += wp.workDays;
  }

  // Ceiling, tiling, flooring, carpentry run in parallel (finishes phase)
  const finishesOffset = offset;
  let maxFinishWork = 0;

  if (hasCeiling) {
    const c = { ...GANTT_TASK_DB[5], name: GANTT_TASK_DB[5].names.zh };
    c.workDays = Math.round(10 * scale);
    c.offsetDays = finishesOffset;
    tasks.push({ ...c, source: 'quotation_added' });
    maxFinishWork = Math.max(maxFinishWork, c.workDays);
  }
  if (hasTiling) {
    const t2 = { ...GANTT_TASK_DB[6], name: GANTT_TASK_DB[6].names.zh };
    t2.workDays = Math.round(12 * scale);
    t2.offsetDays = finishesOffset;
    tasks.push({ ...t2, source: 'quotation_added' });
    maxFinishWork = Math.max(maxFinishWork, t2.workDays);
  }
  if (hasFlooring) {
    const f = { ...GANTT_TASK_DB[7], name: GANTT_TASK_DB[7].names.zh };
    f.workDays = Math.round(8 * scale);
    f.offsetDays = finishesOffset;
    tasks.push({ ...f, source: 'quotation_added' });
    maxFinishWork = Math.max(maxFinishWork, f.workDays);
  }
  if (hasCarpentry) {
    const cp = { ...GANTT_TASK_DB[8], name: GANTT_TASK_DB[8].names.zh };
    cp.workDays = Math.round(12 * scale);
    cp.offsetDays = finishesOffset + Math.round(maxFinishWork * 0.3);
    tasks.push({ ...cp, source: 'quotation_added' });
    maxFinishWork = Math.max(maxFinishWork, cp.offsetDays - finishesOffset + cp.workDays);
  }

  offset = finishesOffset + maxFinishWork;

  // Painting
  if (hasPainting) {
    const p = { ...GANTT_TASK_DB[9], name: GANTT_TASK_DB[9].names.zh };
    p.workDays = Math.round(10 * scale);
    p.offsetDays = offset;
    tasks.push({ ...p, source: 'quotation_added' });
    offset += p.workDays;
  }

  // Doors/windows
  if (hasGlass) {
    const d = { ...GANTT_TASK_DB[10], name: GANTT_TASK_DB[10].names.zh };
    d.workDays = Math.round(6 * (numFloors > 1 ? 2 : 1));
    d.offsetDays = offset - 3;
    tasks.push({ ...d, source: 'quotation_added' });
  }

  // Fixtures
  const fix = { ...GANTT_TASK_DB[11], name: GANTT_TASK_DB[11].names.zh };
  fix.workDays = Math.round(5 * (numFloors > 1 ? 2 : 1));
  fix.offsetDays = offset;
  tasks.push({ ...fix, source: 'quotation_added' });
  offset += fix.workDays;

  // Final cleaning
  const clean = { ...GANTT_TASK_DB[12], name: GANTT_TASK_DB[12].names.zh };
  clean.workDays = Math.round(3 * (numFloors > 1 ? 1.5 : 1));
  clean.offsetDays = offset;
  tasks.push({ ...clean, source: 'quotation_added' });

  return tasks;
}

function applyGeneratedSchedule(tasks) {
  scheduleItems = tasks;
  dayOverrides = {};
  rebuildGantt();
}

// ── Deadline change handler ──────────────────────────────────────
function onDeadlineChange(val) {
  checkDeadlineFeasibility();
}

// ── Deadline feasibility check ──────────────────────────────────
function checkDeadlineFeasibility() {
  const deadlineInput = document.getElementById('sched-deadline-date');
  const badge = document.getElementById('deadline-badge-el');
  if (!deadlineInput || !badge) return;

  const val = deadlineInput.value;
  const compressBtn  = document.getElementById('btn-compress-deadline');
  const okHint       = document.getElementById('btn-deadline-ok-hint');
  const actionRow    = document.getElementById('deadline-action-row');

  if (!val) {
    badge.style.display = 'none';
    if (compressBtn) compressBtn.style.display = 'none';
    if (okHint)      okHint.style.display      = 'none';
    return;
  }

  const deadline = new Date(val + 'T00:00:00');
  const scheduled = computeSchedule();
  if (!scheduled.length) return;

  const lastEnd    = scheduled.reduce((m, t) => t.calEnd > m ? t.calEnd : m, scheduled[0].calEnd);
  const bufferDays = diffDays(lastEnd, deadline);
  badge.style.display = 'inline-flex';

  if (bufferDays >= 14) {
    badge.className  = 'deadline-badge deadline-ok';
    badge.textContent = `✅ 可行 (提前 ${Math.round(bufferDays/7)} 周)`;
    if (compressBtn) compressBtn.style.display = 'none';
    if (okHint)      { okHint.style.display = 'inline-flex'; if (actionRow) actionRow.style.display = ''; }
  } else if (bufferDays >= 0) {
    badge.className  = 'deadline-badge deadline-warn';
    badge.textContent = `⚠️ 紧张 (仅余 ${bufferDays} 天缓冲)`;
    if (compressBtn) compressBtn.style.display = 'none';
    if (okHint)      { okHint.style.display = 'inline-flex'; if (actionRow) actionRow.style.display = ''; }
  } else {
    badge.className  = 'deadline-badge deadline-over';
    badge.textContent = `🚨 超期 ${Math.abs(bufferDays)} 天`;
    if (compressBtn) { compressBtn.style.display = 'inline-flex'; if (actionRow) actionRow.style.display = ''; }
    if (okHint)      okHint.style.display = 'none';
  }
}

// ── Auto-compress schedule to fit deadline ───────────────────────
function compressScheduleToDeadline() {
  const val = document.getElementById('sched-deadline-date')?.value;
  if (!val) return;
  const deadline = new Date(val + 'T00:00:00');

  const scheduled = computeSchedule();
  if (!scheduled.length) return;

  const lastEnd    = scheduled.reduce((m, t) => t.calEnd > m ? t.calEnd : m, scheduled[0].calEnd);
  const bufferDays = diffDays(lastEnd, deadline); // negative = overdue
  if (bufferDays >= 0) return; // already fits

  // How many working days available from project start to deadline
  const availableWorkDays = countWorkDaysBetween(projectStartDate, deadline);
  // How many working days currently used (span from project start to actual last end)
  const currentWorkDays   = countWorkDaysBetween(projectStartDate, lastEnd);

  if (currentWorkDays <= 0 || availableWorkDays <= 0) {
    showToast('⚠️', '截止日期早于开始日期，请检查日期设置');
    return;
  }

  // Scale ratio: how much to compress all tasks
  const ratio = availableWorkDays / currentWorkDays;

  // Apply proportional compression to each task's workDays and offsetDays
  scheduleItems.forEach(task => {
    task.workDays   = Math.max(1, Math.round(task.workDays   * ratio));
    task.offsetDays = Math.max(0, Math.round(task.offsetDays * ratio));
  });

  // Rebuild and recheck
  rebuildGantt();
  checkDeadlineFeasibility();

  const compressBtn = document.getElementById('btn-compress-deadline');
  if (compressBtn) compressBtn.style.display = 'none';
  const okHint = document.getElementById('btn-deadline-ok-hint');
  if (okHint)   { okHint.style.display = 'inline-flex'; }

  showToast('📐', `进度已压缩，所有工序按比例缩短以在 ${val} 前完工`);
}

// ══════════════════════════════════════════
//  TASK DETAIL PANEL
// ══════════════════════════════════════════
let _taskChecks = {}; // taskId → { subIndex: checked }
let _prepChecks = {}; // taskId → { prepIndex: checked }

function showTaskDetail(taskId) {
  const task = scheduleItems.find(t => (t.id || t.name) === taskId);
  if (!task) return;

  const scheduled = computeSchedule();
  const schTask = scheduled.find(s => (s.id || s.name) === taskId);

  const overlay = document.getElementById('task-detail-overlay');
  const dot = document.getElementById('tdp-dot');
  const titleEl = document.getElementById('tdp-title');
  const subtitleEl = document.getElementById('tdp-subtitle');
  const body = document.getElementById('tdp-body');

  dot.style.background = task.color;
  titleEl.textContent = getTaskDisplayName(task);
  subtitleEl.textContent = schTask
    ? `${fmtDate(schTask.calStart)} → ${fmtDate(schTask.calEnd)} · ${task.workDays} 工作日`
    : `${task.workDays} 工作日`;

  const lang = currentLang === 'zh' ? 'zh' : 'en';
  const subItems = (task.subItems && task.subItems[lang]) || [];
  const materialPrep = task.materialPrep || [];
  const realismNote = task.realismNote ? (task.realismNote[lang] || task.realismNote.zh) : '';

  // Get linked quotation items
  const qItems = (window._qAllItems || []).filter(qi => {
    if (!task.names) return false;
    const nameZH = task.names.zh || '';
    const nameEN = task.names.en || '';
    const qi_text = (qi.name || '') + (qi.section || '');
    // Fuzzy match by keywords
    const keywords = nameZH.slice(0,4).split('').concat(nameEN.split(' ').slice(0,2));
    return keywords.some(kw => kw.length >= 2 && qi_text.toLowerCase().includes(kw.toLowerCase()));
  }).slice(0, 5);

  const key = task.id || task.name;
  if (!_taskChecks[key]) _taskChecks[key] = {};
  if (!_prepChecks[key]) _prepChecks[key] = {};

  const parallelPeers = scheduleItems.filter(s =>
    s !== task && s.offsetDays === task.offsetDays && s.id !== task.id
  );

  let html = '';

  // Chips row
  html += '<div class="tdp-chips">';
  html += `<span class="tdp-chip gold">⏱ ${task.workDays} 工作日</span>`;
  if (schTask) {
    html += `<span class="tdp-chip">${fmtDate(schTask.calStart)}</span>`;
    html += `<span class="tdp-chip">→ ${fmtDate(schTask.calEnd)}</span>`;
  }
  if (task.source === 'ai_generated') html += `<span class="tdp-chip blue">🤖 AI编排</span>`;
  if (task.source === 'quotation_added') html += `<span class="tdp-chip blue">📋 从报价单生成</span>`;
  if (parallelPeers.length) {
    html += `<span class="tdp-chip green">⚡ 可同步: ${parallelPeers.map(p => getTaskDisplayName(p)).join('/')}</span>`;
  }
  html += '</div>';

  // Realism note
  if (realismNote) {
    html += `<div class="tdp-prep info"><span class="tdp-prep-icon">💡</span><span>${realismNote}</span></div>`;
  }

  // Edit duration
  html += `
  <div class="tdp-section-title">调整工期</div>
  <div class="tdp-edit-row">
    <label>施工工作天数（当前：<b style="color:var(--gold)">${task.workDays}</b> 天）<br><span style="font-size:11px;color:var(--text3)">修改后自动更新甘特图</span></label>
    <input class="tdp-edit-input" id="tdp-workdays-input" type="number" min="1" max="200" value="${task.workDays}">
    <button class="btn btn-ghost" style="padding:5px 12px;font-size:12px" onclick="applyTaskDuration('${key}')">应用</button>
  </div>`;

  // Material prep
  if (materialPrep.length) {
    html += `<div class="tdp-section-title">🛠 备料 & 预备事项</div>`;
    materialPrep.forEach((prep, idx) => {
      const prepText = typeof prep === 'string' ? prep : (prep[lang] || prep.zh || prep.en);
      const prepType = typeof prep === 'string' ? 'info' : (prep.type || 'info');
      const checked = _prepChecks[key][idx] || false;
      html += `
      <div class="tdp-prep ${prepType}" style="cursor:pointer" onclick="togglePrepCheck('${key}',${idx})">
        <span class="tdp-prep-icon">${checked ? '✅' : (prepType==='warn'?'⚠️':prepType==='order'?'🛒':prepType==='check'?'🔲':'📋')}</span>
        <span style="${checked ? 'text-decoration:line-through;opacity:.6' : ''}">${prepText}</span>
      </div>`;
    });
  }

  // Sub-items checklist
  if (subItems.length) {
    html += `<div class="tdp-section-title">📋 施工细分清单</div>`;
    subItems.forEach((item, idx) => {
      const checked = _taskChecks[key][idx] || false;
      html += `
      <div class="tdp-subitem">
        <div class="tdp-check ${checked ? 'checked' : ''}" onclick="toggleTaskCheck('${key}',${idx})">
          ${checked ? '✓' : ''}
        </div>
        <div class="tdp-subitem-text" style="${checked ? 'text-decoration:line-through;opacity:.5' : ''}">${item}</div>
      </div>`;
    });
  }

  // Linked quotation items
  if (qItems.length) {
    html += `<div class="tdp-section-title">📄 关联报价项目</div>`;
    qItems.forEach(qi => {
      const amt = qi.total ? `RM ${Number(qi.total).toLocaleString()}` : '';
      html += `<div class="tdp-quot-item"><span>${qi.name}</span>${amt ? `<span class="tdp-quot-amt">${amt}</span>` : ''}</div>`;
    });
  }

  body.innerHTML = html;
  overlay.classList.add('open');
}

function closeTaskDetail() {
  document.getElementById('task-detail-overlay')?.classList.remove('open');
}

function toggleTaskCheck(key, idx) {
  if (!_taskChecks[key]) _taskChecks[key] = {};
  _taskChecks[key][idx] = !_taskChecks[key][idx];
  const items = document.querySelectorAll('#tdp-body .tdp-subitem');
  if (items[idx]) {
    const check = items[idx].querySelector('.tdp-check');
    const text = items[idx].querySelector('.tdp-subitem-text');
    const checked = _taskChecks[key][idx];
    check?.classList.toggle('checked', checked);
    if (check) check.innerHTML = checked ? '✓' : '';
    if (text) text.style.textDecoration = checked ? 'line-through' : '';
    if (text) text.style.opacity = checked ? '.5' : '';
  }
}

function togglePrepCheck(key, idx) {
  if (!_prepChecks[key]) _prepChecks[key] = {};
  _prepChecks[key][idx] = !_prepChecks[key][idx];
  // Re-render the detail
  const task = scheduleItems.find(t => (t.id || t.name) === key);
  if (task) showTaskDetail(key);
}

function applyTaskDuration(key) {
  const input = document.getElementById('tdp-workdays-input');
  if (!input) return;
  const newDays = Math.max(1, Math.min(200, parseInt(input.value) || 1));
  const task = scheduleItems.find(t => (t.id || t.name) === key);
  if (task) {
    task.workDays = newDays;
    rebuildGantt();
    checkDeadlineFeasibility();
    showTaskDetail(key); // refresh panel
    showToast('✅', `已更新工期为 ${newDays} 工作日`);
  }
}

// ══════════════════════════════════════════
//  GANTT DRAG & RESIZE
// ══════════════════════════════════════════
let _ganttDrag = null;
let _ganttTotalW = 84; // updated by rebuildGantt

function initGanttDrag() {
  const ganttEl = document.getElementById('gantt-chart');
  if (!ganttEl || ganttEl.dataset.dragInited) return;
  ganttEl.dataset.dragInited = '1';

  ganttEl.addEventListener('mousedown', function(e) {
    const bar = e.target.closest('.gantt-bar');
    if (!bar) return;
    const isResize = e.target.classList.contains('gantt-resize-handle');
    const taskId = bar.dataset.taskId;
    if (!taskId) return;
    const task = scheduleItems.find(t => (t.id || t.name) === taskId);
    if (!task) return;

    e.preventDefault();
    const track = bar.closest('.gantt-track');
    const trackRect = track.getBoundingClientRect();

    const scheduled = computeSchedule();
    const schTask = scheduled.find(s => (s.id || s.name) === taskId);

    _ganttDrag = {
      bar, taskId, isResize,
      startX: e.clientX,
      trackWidth: trackRect.width,
      origWorkDays: task.workDays,
      origOffsetDays: task.offsetDays,
      origCalStart: schTask ? new Date(schTask.calStart) : null,
      totalW: _ganttTotalW,
    };
    bar.classList.add('dragging');
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!_ganttDrag) return;
    const { bar, startX, trackWidth, origWorkDays, origOffsetDays, isResize, totalW } = _ganttDrag;
    const deltaX = e.clientX - startX;
    const daysPerPx = totalW / trackWidth;
    const dayDelta = Math.round(deltaX * daysPerPx);

    if (isResize) {
      // Visual width change only
      const origWidthPct = parseFloat(bar.style.width) || 5;
      const origWidthPx = origWidthPct / 100 * trackWidth;
      bar.style.width = Math.max(10, origWidthPx + deltaX) + 'px';
      bar.style.transition = 'none';
    } else {
      // Visual position change only
      bar.style.transform = `translateX(${deltaX}px)`;
      bar.style.transition = 'none';
    }
  });

  document.addEventListener('mouseup', function(e) {
    if (!_ganttDrag) return;
    const { bar, taskId, isResize, startX, trackWidth, origWorkDays, origOffsetDays, origCalStart, totalW } = _ganttDrag;
    const task = scheduleItems.find(t => (t.id || t.name) === taskId);

    if (task) {
      const deltaX = e.clientX - startX;
      const daysPerPx = totalW / trackWidth;
      const calDayDelta = Math.round(deltaX * daysPerPx);

      if (isResize) {
        // Convert pixel delta to work days
        const addCalDays = Math.round(deltaX * daysPerPx);
        const newEndCal = origCalStart ? addDays(addWorkDays(origCalStart, origWorkDays), addCalDays) : null;
        if (newEndCal && origCalStart) {
          const newWorkDays = Math.max(1, countWorkDaysBetween(origCalStart, newEndCal));
          task.workDays = newWorkDays;
        } else {
          task.workDays = Math.max(1, origWorkDays + Math.round(addCalDays * 5/7));
        }
      } else {
        // Move: change offsetDays
        if (origCalStart && calDayDelta !== 0) {
          const newCalStart = addDays(origCalStart, calDayDelta);
          const newOffsetDays = Math.max(0, countWorkDaysBetween(projectStartDate, newCalStart));
          task.offsetDays = newOffsetDays;
        }
      }
    }

    bar.style.transform = '';
    bar.style.width = '';
    bar.style.transition = '';
    bar.classList.remove('dragging');
    document.body.style.userSelect = '';
    _ganttDrag = null;

    rebuildGantt();
    checkDeadlineFeasibility();
  });
}

function rebuildGantt() {
  const scheduled = computeSchedule();
  if (!scheduled.length) return;

  const lastEnd = scheduled.reduce((m, t) => t.calEnd > m ? t.calEnd : m, scheduled[0].calEnd);
  const totalCalDays = diffDays(projectStartDate, lastEnd) + 8;
  const numWeeks = Math.ceil(totalCalDays / 7) + 1;

  // Build week array
  const weeks = [];
  for (let w = 0; w < numWeeks; w++) {
    const mon = addDays(projectStartDate, w * 7);
    const days = [], hols = [];
    let workCount = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(mon, i), k = dateKey(day);
      const hol = isHoliday(day), work = isWorkingDay(day);
      days.push({ date: day, key: k, holiday: hol, weekend: day.getDay() === 0 || day.getDay() === 6, working: work });
      if (work) workCount++;
      if (hol) { const nm = HOLIDAY_NAMES[k] || '公共假期'; if (!hols.find(h => h.name === nm)) hols.push({ key: k, name: nm }); }
    }
    weeks.push({ mon, days, workCount, holidays: hols });
  }

  const totalW = numWeeks * 7;
  _ganttTotalW = totalW; // store for drag calculation
  const todayOff = diffDays(projectStartDate, TODAY_DATE);
  const todayPct = (todayOff >= 0 && todayOff < totalW) ? (todayOff / totalW * 100) : -1;

  // ── Calendar Header ─────────────────────
  const hdr = document.getElementById('gantt-cal-header');
  if (hdr) hdr.innerHTML = weeks.map((wk, i) => `
    <div class="gantt-col-week ${wk.holidays.length ? 'holiday-col' : ''}">
      <div class="gantt-week-date">${fmtDate(wk.mon)}</div>
      <div class="gantt-week-label">W${i + 1}</div>
      <div class="gantt-week-workdays" style="color:${wk.workCount < 3 ? 'var(--red)' : wk.workCount < 5 ? 'var(--orange)' : 'var(--text3)'}">
        ${wk.workCount}${currentLang === 'en' ? 'd' : '天'}${wk.workCount < 5 && wk.workCount > 0 ? '⚠' : ''}
      </div>
      ${wk.holidays.slice(0, 1).map(h => `<div class="gantt-holiday-badge" title="${h.name}">🎌</div>`).join('')}
    </div>`).join('');

  // ── Gantt Rows ──────────────────────────
  const ganttEl = document.getElementById('gantt-chart');
  if (!ganttEl) return;
  ganttEl.innerHTML = '';

  // Build parallel group map (tasks with same offsetDays)
  const offsetGroups = {};
  scheduled.forEach(t => {
    const k = String(t.offsetDays);
    if (!offsetGroups[k]) offsetGroups[k] = [];
    offsetGroups[k].push(t);
  });

  scheduled.forEach(task => {
    const taskKey = task.id || task.name;
    const displayName = getTaskDisplayName(task);
    const sOff = diffDays(projectStartDate, task.calStart);
    const span = diffDays(task.calStart, task.calEnd) + 1;
    const lPct = (sOff / totalW) * 100;
    const wPct = Math.max(0.8, (span / totalW) * 100);
    const isPast = task.calEnd < TODAY_DATE;
    const isActive = task.calStart <= TODAY_DATE && task.calEnd >= TODAY_DATE;
    const isAI = task.source === 'ai_generated';
    const isFromQuot = task.source === 'quotation_added';
    const hasOvr = Object.keys(dayOverrides).some(k => { const d = new Date(k); return d >= task.calStart && d <= task.calEnd; });

    // Check for parallel peers
    const peers = (offsetGroups[String(task.offsetDays)] || []).filter(p => (p.id || p.name) !== taskKey);
    const isParallel = peers.length > 0;

    // Stripes for non-working days
    const stripes = weeks.map((wk, wi) => wk.days.map((wd, di) => {
      if (!wd.holiday && !wd.weekend) return '';
      const off = wi * 7 + di;
      return `<div class="gantt-stripe ${wd.holiday ? 'stripe-holiday' : 'stripe-weekend'}" style="left:${(off / totalW) * 100}%;width:${(1 / totalW) * 100}%"></div>`;
    }).join('')).join('');

    const labelColor = isAI ? 'var(--blue)' : isFromQuot ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--text2)';
    const prefixIcon = isActive ? '▶ ' : isAI ? '🤖 ' : isFromQuot ? '✦ ' : '';
    const parallelBadge = isParallel ? `<span class="gantt-parallel-badge">⚡ 并行</span>` : '';

    const row = document.createElement('div');
    row.className = 'gantt-row' + (isParallel ? ' is-parallel' : '');
    row.innerHTML = `
      <div class="gantt-label" style="color:${labelColor}"
        title="${currentLang === 'en' ? 'Click for details & subtasks' : '点击查看细分内容和备料清单'}"
        onclick="showTaskDetail('${taskKey}')">
        ${prefixIcon}${displayName}${parallelBadge}
        <div style="font-size:9px;color:var(--text3);margin-top:1px;">${fmtDate(task.calStart)}–${fmtDate(task.calEnd)} · ${task.workDays}${currentLang === 'en' ? 'd' : '天'}</div>
      </div>
      <div class="gantt-track">
        ${stripes}
        <div class="gantt-bar ${hasOvr ? 'has-override' : ''}"
          data-task-id="${taskKey}"
          style="left:${lPct.toFixed(2)}%;width:${wPct.toFixed(2)}%;background:${task.color};opacity:${isPast ? 0.45 : isActive ? 1 : 0.7};"
          onclick="if(!_ganttDrag||Math.abs(event.clientX-(window._barDragStartX||event.clientX))<4)showTaskDetail('${taskKey}')"
          onmousedown="window._barDragStartX=event.clientX"
          title="${fmtDate(task.calStart)} – ${fmtDate(task.calEnd)} · ${task.workDays} ${currentLang === 'en' ? 'working days' : '工作日'}${hasOvr ? ' · override' : ''}">
          <span class="gantt-bar-label">${span >= totalW * 0.07 ? displayName.slice(0, 8) : ''}</span>
          <div class="gantt-resize-handle" title="${currentLang === 'en' ? 'Drag to resize' : '拖拽调整工期'}"></div>
        </div>
        ${todayPct >= 0 ? `<div class="gantt-today-line" style="left:${todayPct.toFixed(2)}%"></div>` : ''}
      </div>`;
    ganttEl.appendChild(row);
  });

  // Init drag after DOM is ready
  setTimeout(initGanttDrag, 0);

  // ── Summary ─────────────────────────────
  const first = scheduled[0].calStart;
  const last2 = scheduled[scheduled.length - 1].calEnd;
  const totalWks = (diffDays(first, last2) / 7).toFixed(1);
  const months = (diffDays(first, last2) / 30.4).toFixed(1);
  const sumEl = document.getElementById('sched-summary');
  if (sumEl) sumEl.innerHTML = `
    <b style="color:var(--text)">${totalWks} ${currentLang === 'en' ? 'cal. weeks' : '日历周'}</b>
    <span style="color:var(--text3);margin-left:6px;">(≈${months} ${currentLang === 'en' ? 'mths' : '个月'})</span>
    <br><span style="color:var(--text3);font-size:11px;">${fmtDate(first)} → ${fmtDate(last2)}</span>`;
  const drEl = document.getElementById('gantt-daterange');
  if (drEl) drEl.textContent = `${fmtDate(first)} – ${fmtDate(last2)}`;

  // ── Holiday legend ───────────────────────
  const hList = PUBLIC_HOLIDAYS[currentRegion] || [];
  const legHols = hList
    .filter(k => { const d = new Date(k); return d >= first && d <= addDays(last2, 7); })
    .map(k => ({ key: k, name: HOLIDAY_NAMES[k] || '公共假期', override: dayOverrides[k] === true }));
  const legEl = document.getElementById('holiday-legend');
  if (legEl) legEl.innerHTML = legHols.length
    ? legHols.map(h => `<div class="holiday-chip ${h.override ? 'override' : ''}" title="${h.key}">${h.override ? '✓ ' : '🎌 '}${h.name} <span style="opacity:.5">${h.key.slice(5)}</span></div>`).join('')
    : `<span style="font-size:11px;color:var(--text3)">${currentLang === 'en' ? 'No public holidays during construction period' : '施工期间无公共假期'}</span>`;

  // Re-check deadline feasibility
  checkDeadlineFeasibility();
}

// ── Controls init ─────────────────────────
function initScheduleControls(){
  const inp=document.getElementById('sched-start-date');
  if(inp){ inp.value=dateKey(projectStartDate);
    document.getElementById('chk-sat').checked=workOnSaturday;
    document.getElementById('chk-sun').checked=workOnSunday; }
}
function onStartDateChange(val){
  if(!val)return;
  projectStartDate=new Date(val+'T00:00:00');
  rebuildGantt();
}
function onWorkdayChange(){
  workOnSaturday=document.getElementById('chk-sat').checked;
  workOnSunday=document.getElementById('chk-sun').checked;
  rebuildGantt();
}

// ── Override modal ────────────────────────
let overrideTmp={};
function openOverrideModal(){
  overrideTmp={...dayOverrides};
  const sel=document.getElementById('override-task-select');
  sel.innerHTML=scheduleItems.map(t=>{
    const displayName = getTaskDisplayName(t);
    const taskKey = t.id || t.name;
    return `<option value="${taskKey}">${displayName}</option>`;
  }).join('');
  renderOverrideDays();
  openModal('modal-override');
}
function openOverrideForTask(name){
  overrideTmp={...dayOverrides};
  const sel=document.getElementById('override-task-select');
  if(!sel)return;
  sel.innerHTML=scheduleItems.map(t=>{
    const displayName=getTaskDisplayName(t);
    const taskKey=t.id||t.name;
    return `<option value="${taskKey}" ${(t.id||t.name)===name||t.name===name?'selected':''}>${displayName}</option>`;
  }).join('');
  renderOverrideDays();
  openModal('modal-override');
}
function renderOverrideDays(){
  const keyOrName=document.getElementById('override-task-select').value;
  const sched=computeSchedule();
  const task=sched.find(t=>(t.id||t.name)===keyOrName||t.name===keyOrName);
  if(!task)return;
  const listEl=document.getElementById('override-day-list');
  const rows=[];
  let d=new Date(task.calStart);
  const endD=addDays(task.calEnd,5);
  while(d<=endD){
    const k=dateKey(d),hol=isHoliday(d),wkd=d.getDay()===6||d.getDay()===0;
    if(hol||wkd){
      const on=k in overrideTmp?overrideTmp[k]:false;
      const dayLbl=d.toLocaleDateString('zh-CN',{weekday:'short',month:'short',day:'numeric'});
      const typeLbl=hol?`🎌 ${HOLIDAY_NAMES[k]||'公共假期'}`:(d.getDay()===6?'周六 Saturday':'周日 Sunday');
      rows.push(`<div class="override-day-row ${hol?'is-holiday':'is-weekend'}">
        <div>
          <div style="font-size:12px;font-weight:600;color:${on?'var(--green)':'var(--text2)'}">${dayLbl}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${typeLbl}</div>
        </div>
        <div style="font-size:11px;color:${on?'var(--green)':'var(--text3)'};">${on?'✓ 施工':'✗ 不施工'}</div>
        <button class="override-toggle ${on?'on':''}" onclick="toggleOvr(this,'${k}')"></button>
      </div>`);
    }
    d=addDays(d,1);
  }
  listEl.innerHTML=rows.length?rows.join(''):`<div style="font-size:12px;color:var(--text2);padding:12px 0;">此工序期间无周末或假期。</div>`;
}
function toggleOvr(btn,key){
  overrideTmp[key]=!(overrideTmp[key]??false);
  renderOverrideDays();
}
function saveOverrides(){
  dayOverrides={...overrideTmp};
  closeModal('modal-override');
  rebuildGantt();
  const n=Object.values(dayOverrides).filter(v=>v).length;
  showToast('✅',`已保存 ${Object.keys(dayOverrides).length} 个日期调整（${n} 个特殊施工日）`);
}

// ── Init ──────────────────────────────────
initScheduleControls();
rebuildGantt();

document.getElementById('chat-input').addEventListener('keypress', e => {
  if (e.key === 'Enter') sendChat();
});

// ══════════════════════════════════════════
//  WORKER ROSTER
// ══════════════════════════════════════════

const workerData = [
  { id:'w1', initials:'AH', name:'Ali bin Hamid',  trade:'泥水工', phone:'+60 12-345-6789', rating:4.8, completion:96, color:'#10b981', avatar:null },
  { id:'w2', initials:'AC', name:'Ah Chong',        trade:'电工',   phone:'+60 11-234-5678', rating:4.6, completion:92, color:'#3b82f6', avatar:null },
  { id:'w3', initials:'KS', name:'Kumar Selvam',    trade:'木工',   phone:'+60 16-789-0123', rating:4.9, completion:98, color:'#f59e0b', avatar:null },
  { id:'w4', initials:'TW', name:'Tan Wei Ming',    trade:'地砖工', phone:'+60 17-456-7890', rating:4.5, completion:89, color:'#2dd4bf', avatar:null },
  { id:'w5', initials:'RK', name:'Raju Krishnan',   trade:'油漆工', phone:'+60 14-567-8901', rating:4.7, completion:94, color:'#ec4899', avatar:null },
];

function renderRosterGrid() {
  const grid = document.getElementById('roster-grid');
  if (!grid) return;
  grid.innerHTML = workerData.map(w => `
    <div class="worker-roster-card">
      <span class="wrc-status wrc-active">● 在职</span>
      <div class="wrc-top">
        <div class="wrc-avatar" style="background:${w.color}18;color:${w.color};border-color:${w.color}33;">
          ${w.avatar ? `<img src="${w.avatar}" alt="${w.name}">` : w.initials}
        </div>
        <div>
          <div class="wrc-name">${w.name}</div>
          <div class="wrc-trade">${w.trade}</div>
          <div class="wrc-phone">${w.phone}</div>
        </div>
      </div>
      <div class="wrc-stats">
        <div class="wrc-stat">
          <div class="wrc-stat-val" style="color:var(--gold)">⭐ ${w.rating}</div>
          <div class="wrc-stat-label">评分</div>
        </div>
        <div class="wrc-stat">
          <div class="wrc-stat-val" style="color:var(--green)">${w.completion}%</div>
          <div class="wrc-stat-label">完成率</div>
        </div>
      </div>
    </div>`).join('');
}
renderRosterGrid();

// ══════════════════════════════════════════
//  MODAL HELPERS
// ══════════════════════════════════════════

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'modal-add-worker') {
    document.getElementById('add-phone').value = '';
    document.getElementById('add-result-found').style.display = 'none';
    document.getElementById('add-result-notfound').style.display = 'none';
    document.getElementById('add-step-search').style.display = 'block';
  }
}
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
});

// ── Add Worker ────────────────────────────
function openAddWorker() { openModal('modal-add-worker'); }

function searchWorker() {
  const phone = document.getElementById('add-phone').value.trim();
  if (!phone) { showToast('⚠️','请输入电话号码'); return; }
  showToast('🔍','正在搜索...');
  setTimeout(() => {
    document.getElementById('add-step-search').style.display = 'none';
    const last = parseInt(phone.slice(-1));
    if (isNaN(last) || last % 2 !== 0) {
      document.getElementById('add-result-found').style.display = 'block';
    } else {
      document.getElementById('add-result-notfound').style.display = 'block';
    }
  }, 900);
}

function sendInvite() {
  closeModal('modal-add-worker');
  showToast('📱','WhatsApp 邀请已发送！等待工人在 APP 接受');
  const b = document.getElementById('pending-banner');
  if (b) b.style.display = 'flex';
}

function sendRegisterInvite() {
  closeModal('modal-add-worker');
  showToast('🔗','已发送注册邀请链接 via WhatsApp！');
}

// ── Worker Registration Steps ─────────────
function regNextStep(from) {
  if (from === 1) {
    if (!document.getElementById('reg-phone').value.trim()) { showToast('⚠️','请输入手机号码'); return; }
    showToast('📱','验证码已发送至 WhatsApp！');
  }
  if (from === 2) {
    const val = Array.from(document.querySelectorAll('.otp-box')).map(b=>b.value).join('');
    if (val.length < 6) { showToast('⚠️','请输入完整验证码'); return; }
    if (val !== '888888') { showToast('❌','验证码错误，Demo 请输入 888888'); return; }
    showToast('✅','验证成功！');
  }
  if (from === 3) {
    if (!document.getElementById('reg-name').value.trim()) { showToast('⚠️','请输入姓名'); return; }
    if (!document.querySelector('#trade-grid .trade-option.selected')) { showToast('⚠️','请至少选择一个工种'); return; }
  }
  document.getElementById('reg-step-' + from).style.display = 'none';
  document.getElementById('reg-step-' + (from+1)).style.display = 'block';
  const d = document.getElementById('sdot-' + from);
  if (d) { d.classList.remove('active'); d.classList.add('done'); d.textContent = '✓'; }
  const l = document.getElementById('sline-' + from);
  if (l) l.classList.add('done');
  const nd = document.getElementById('sdot-' + (from+1));
  if (nd) nd.classList.add('active');
}

function otpNext(input, idx) {
  if (input.value.length === 1) {
    const next = document.querySelectorAll('.otp-box')[idx+1];
    if (next) next.focus();
  }
}

function selectTrade(el) { el.classList.toggle('selected'); }

function completeRegistration() {
  closeModal('modal-register');
  showToast('🎉','注册成功！等待设计师邀请你加入工地');
  for (let i=1;i<=4;i++) {
    const s = document.getElementById('reg-step-'+i);
    if (s) s.style.display = i===1?'block':'none';
    const d = document.getElementById('sdot-'+i);
    if (d) { d.className='step-dot'+(i===1?' active':''); d.textContent=i; }
    const l = document.getElementById('sline-'+i);
    if (l) l.classList.remove('done');
  }
}

// ── Avatar Upload ─────────────────────────
function previewAvatar(input, previewId, btnId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById(previewId);
    preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    const btn = document.getElementById(btnId);
    if (btn) { btn.disabled = false; btn.style.opacity='1'; btn.style.cursor='pointer'; }
  };
  reader.readAsDataURL(file);
}

function openAvatarChange() { openModal('modal-avatar-change'); }

function saveAvatar() {
  const src = document.querySelector('#change-avatar-preview img');
  if (src) {
    const img = document.getElementById('worker-avatar-img');
    img.src = src.src; img.style.display = 'block';
    document.getElementById('worker-avatar-initials').style.display = 'none';
  }
  closeModal('modal-avatar-change');
  showToast('✅','头像已更新！');
}

// ── Register demo button ──────────────────
(function() {
  const info = document.querySelector('#portal-worker .app-info');
  if (info && !document.getElementById('reg-demo-btn')) {
    const btn = document.createElement('button');
    btn.id = 'reg-demo-btn';
    btn.className = 'btn btn-ghost';
    btn.style.marginTop = '12px';
    btn.textContent = '📱 工人注册演示';
    btn.onclick = () => openModal('modal-register');
    info.appendChild(btn);
  }
})();

// ══════════════════════════════════════════
//  PROJECT PANEL: PAYMENT SCHEDULE + VO
// ══════════════════════════════════════════

const CONTRACT_BASE = 65000;

let payRows = [
  { id:'p1', label:'第1期', trigger:'签约后开工前', pct:30, amount:19500, status:'paid' },
  { id:'p2', label:'第2期', trigger:'泥水工程完成', pct:30, amount:19500, status:'paid' },
  { id:'p3', label:'第3期', trigger:'木工柜体完成', pct:25, amount:16250, status:'pending' },
  { id:'p4', label:'第4期', trigger:'竣工验收移交', pct:15, amount:9750,  status:'future' },
];
let voRows = [
  { id:'v1', label:'VO #1', trigger:'加建储物柜 (主卧)', amount:3200, status:'vo' },
];
let payCounter = 5, voCounter = 2;

function renderPayment() {
  const list = document.getElementById('payment-list');
  const voList = document.getElementById('vo-list');
  if (!list || !voList) return;
  list.innerHTML = payRows.map((r,i) => payRowHTML(r, i+1, false)).join('');
  voList.innerHTML = voRows.map((r,i) => payRowHTML(r, `VO${i+1}`, true)).join('');
  updatePaySummary();
}

function payRowHTML(r, idx, isVO) {
  const statusMap = { paid:'✓ 已收款', pending:'⏳ 待收款', future:'○ 未到期', vo:'📋 VO' };
  const classMap  = { paid:'badge-paid', pending:'badge-pending', future:'badge-future', vo:'badge-vo' };
  return `
  <div class="pay-row ${r.status==='paid'?'paid':''} ${r.status==='pending'?'pending':''} ${isVO?'vo-row':''}">
    <div class="pay-num">${idx}</div>
    <div class="pay-name-wrap">
      <div class="pay-name" contenteditable="true" onblur="updatePayField('${r.id}','label',this.textContent)">${r.label}</div>
      <div class="pay-trigger" contenteditable="true" onblur="updatePayField('${r.id}','trigger',this.textContent)">${r.trigger}</div>
    </div>
    <div class="pay-pct">${r.pct != null ? r.pct+'%' : '变更项'}</div>
    <div class="pay-amount">
      <input type="text" value="RM ${Number(r.amount).toLocaleString()}"
        onfocus="this.value=this.value.replace(/[^0-9]/g,'')"
        onblur="updatePayAmount('${r.id}',this.value);this.value='RM '+parseInt(this.value||0).toLocaleString()">
    </div>
    <div class="pay-status">
      <button class="pay-badge ${classMap[r.status]}" onclick="cycleStatus('${r.id}')">${statusMap[r.status]}</button>
    </div>
    <button class="pay-del" onclick="deletePayRow('${r.id}',${isVO})">×</button>
  </div>`;
}

function updatePaySummary() {
  const all = [...payRows, ...voRows];
  const total    = CONTRACT_BASE + voRows.reduce((s,r)=>s+r.amount,0);
  const received = all.filter(r=>r.status==='paid').reduce((s,r)=>s+r.amount,0);
  const pending  = all.filter(r=>r.status!=='paid').reduce((s,r)=>s+r.amount,0);
  document.getElementById('total-contract').textContent = 'RM '+total.toLocaleString();
  document.getElementById('total-received').textContent = 'RM '+received.toLocaleString();
  document.getElementById('total-pending').textContent  = 'RM '+pending.toLocaleString();
}

function updatePayField(id, field, val) {
  const r = [...payRows,...voRows].find(x=>x.id===id);
  if (r) r[field] = val.trim();
}

function updatePayAmount(id, val) {
  const r = [...payRows,...voRows].find(x=>x.id===id);
  if (r) { r.amount = parseInt(val)||0; updatePaySummary(); }
}

function cycleStatus(id) {
  const r = payRows.find(x=>x.id===id);
  if (!r) return;
  r.status = { future:'pending', pending:'paid', paid:'future' }[r.status] || 'future';
  renderPayment();
  showToast('💰',`付款状态已更新为：${{future:'未到期',pending:'待收款',paid:'已收款'}[r.status]}`);
}

function addPayRow() {
  payRows.push({ id:'p'+payCounter++, label:'第'+(payRows.length+1)+'期', trigger:'点击编辑触发条件', pct:0, amount:0, status:'future' });
  renderPayment();
  showToast('➕','已新增付款期');
}

function addVORow() {
  voRows.push({ id:'v'+voCounter++, label:'VO #'+voCounter, trigger:'点击编辑 VO 内容', amount:0, status:'vo' });
  renderPayment();
  showToast('📋','VO 已新增');
}

function deletePayRow(id, isVO) {
  if (isVO) voRows = voRows.filter(r=>r.id!==id);
  else      payRows = payRows.filter(r=>r.id!==id);
  renderPayment();
}

// ══════════════════════════════════════════
//  PROJECT PANEL: PHOTOS
// ══════════════════════════════════════════

let photos = [
  { id:'ph1', worker:'Kumar Selvam', trade:'ceiling', tradeLabel:'🏛️ 石膏板吊顶', date:'27 May 09:14', status:'pending',  emoji:'🏛️', desc:'客厅吊顶龙骨完成' },
  { id:'ph2', worker:'Ali bin Hamid',trade:'masonry', tradeLabel:'🧱 泥水工程',   date:'26 May 16:40', status:'pending',  emoji:'🧱', desc:'主浴防水层完成' },
  { id:'ph3', worker:'Ah Chong',     trade:'mande',   tradeLabel:'⚡ 水电工程',   date:'25 May 11:30', status:'approved', emoji:'⚡', desc:'冷气铜管预埋完成' },
  { id:'ph4', worker:'Ali bin Hamid',trade:'masonry', tradeLabel:'🧱 泥水工程',   date:'24 May 15:10', status:'approved', emoji:'🧱', desc:'地面水泥找平' },
  { id:'ph5', worker:'Ah Chong',     trade:'mande',   tradeLabel:'⚡ 水电工程',   date:'23 May 09:55', status:'approved', emoji:'⚡', desc:'全屋电气暗槽开凿' },
];
let photoFilter = 'all';

function renderPhotos() {
  const gallery = document.getElementById('photo-gallery');
  if (!gallery) return;
  const filtered = photoFilter==='all' ? photos
    : photoFilter==='pending'  ? photos.filter(p=>p.status==='pending')
    : photoFilter==='approved' ? photos.filter(p=>p.status==='approved')
    : photos.filter(p=>p.trade===photoFilter);

  if (!filtered.length) { gallery.innerHTML=`<div style="text-align:center;padding:40px;color:var(--text3);">暂无照片</div>`; return; }

  const groups = {};
  filtered.forEach(p => { if (!groups[p.tradeLabel]) groups[p.tradeLabel]=[]; groups[p.tradeLabel].push(p); });

  gallery.innerHTML = Object.entries(groups).map(([label,items])=>`
    <div class="photo-section-label">${label}</div>
    <div class="photo-grid">
      ${items.map(p=>`
        <div class="photo-card ${p.status}" id="pcard-${p.id}">
          <div class="photo-thumb">
            <span>${p.emoji}</span>
            <div class="photo-review-overlay">
              ${p.status==='pending'?`
                <button class="photo-approve-btn" onclick="approvePhoto('${p.id}',event)">✓</button>
                <button class="photo-reject-btn"  onclick="rejectPhoto('${p.id}',event)">✕</button>`
              :`<button class="photo-approve-btn" onclick="showToast('✅','已通过，业主端可见')">✓</button>`}
            </div>
          </div>
          <div class="photo-status-tag ${p.status==='pending'?'pst-pending':'pst-approved'}">${p.status==='pending'?'待审核':'已通过'}</div>
          <div class="photo-meta">
            <div class="photo-worker">${p.worker}</div>
            <div class="photo-info"><span>${p.date}</span><span>${p.desc}</span></div>
          </div>
        </div>`).join('')}
    </div>`).join('');

  const pendingN = photos.filter(p=>p.status==='pending').length;
  const badge = document.getElementById('pending-count');
  if (badge) badge.textContent = pendingN;
}

function filterPhotos(f, btn) {
  photoFilter = f;
  document.querySelectorAll('.photo-filter-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  renderPhotos();
}

function approvePhoto(id, e) {
  e.stopPropagation();
  const p = photos.find(x=>x.id===id); if (!p) return;
  p.status='approved'; renderPhotos();
  showToast('✅','照片已通过审核，业主端即时可见');
}

function rejectPhoto(id, e) {
  e.stopPropagation();
  photos = photos.filter(x=>x.id!==id); renderPhotos();
  showToast('🔄','已退回，工人收到重拍通知');
}

function simulateWorkerUpload() {
  photos.unshift({ id:'ph'+Date.now(), worker:'Kumar Selvam', trade:'ceiling',
    tradeLabel:'🏛️ 石膏板吊顶', date:'刚刚', status:'pending', emoji:'📸', desc:'新上传：餐厅吊顶石膏板' });
  photoFilter='pending';
  document.querySelectorAll('.photo-filter-btn').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.photo-filter-btn')[1]?.classList.add('on');
  renderPhotos();
  showToast('📸','工人上传了新照片，等待审核后才显示给业主');
}

// switchProjTab: see full implementation below

function saveClientFields() {
  window.projectClientData = {
    company:   document.getElementById('cf-company').value,
    attention: document.getElementById('cf-attention').value,
    tel:       document.getElementById('cf-tel').value,
    email:     document.getElementById('cf-email').value,
    address:   document.getElementById('cf-address').value,
    projectRef:document.getElementById('cf-ref').value,
    notes:     document.getElementById('cf-notes').value,
  };
  const s = document.getElementById('client-save-status');
  s.style.display = 'block';
  setTimeout(()=>s.style.display='none', 2500);
  showToast('💾','客户资料已保存至 Taman Desa #A22 项目');
}

// ══════════════════════════════════════════
//  WORKER CALENDAR & MULTI-SITE ENGINE
// ══════════════════════════════════════════

const WORKER_SITES = [
  {
    id: 'site_a22',
    name: 'Taman Desa #A22',
    shortName: 'Desa A22',
    address: 'No.22, Jln Desa Utama, KL',
    role: '木工',
    roleEN: 'Carpentry',
    color: '#4ade80',
    bgColor: 'rgba(74,222,128,0.13)',
    progress: 72,
    status: 'active',
    phase: '石膏板吊顶',
    designer: 'Ahmad Faris',
    workDays: [1,2,3,4,5], // Mon-Fri
    startOffset: 0, // starts from projectStartDate
    tasks: [
      { name:'安装轻钢龙骨框架', loc:'客厅 + 餐厅 · 350sqft', done:true,  time:'08:45', spec:'龙骨间距 ≤ 400mm' },
      { name:'封石膏板（第一层）', loc:'客厅 · 180sqft',         done:true,  time:'11:20', spec:'螺丝间距 ≤ 200mm' },
      { name:'餐厅吊顶石膏板',   loc:'餐厅 · 170sqft',          done:false, time:'5:00PM', spec:'边缘留5mm缝，接缝批土', priority:'high' },
    ]
  },
  {
    id: 'site_sp5',
    name: 'Sri Petaling #B5',
    shortName: 'Petaling B5',
    address: 'No.5, Jln SP 1/3, Sri Petaling',
    role: '木工',
    roleEN: 'Carpentry',
    color: '#fb923c',
    bgColor: 'rgba(251,146,60,0.13)',
    progress: 45,
    status: 'active',
    phase: '木工柜体安装',
    designer: 'Lim Wei Jie',
    workDays: [1,3,5], // Mon/Wed/Fri only
    startOffset: 3,
    tasks: [
      { name:'安装厨柜吊柜',   loc:'厨房 · 12呎',    done:true,  time:'09:00', spec:'水平误差 ≤ 2mm' },
      { name:'安装厨柜地柜',   loc:'厨房 · 14呎',    done:false, time:'2:00PM', spec:'脚调水平，确认排水位对正', priority:'mid' },
      { name:'安装台面收口',   loc:'厨房',           done:false, time:'4:30PM', spec:'硅胶密封，颜色匹配' },
    ]
  },
  {
    id: 'site_bg11',
    name: 'Bangsar South #C11',
    shortName: 'Bangsar C11',
    address: 'C-11, Jln Kerinchi, Bangsar',
    role: '泥水工',
    roleEN: 'Masonry',
    color: '#a78bfa',
    bgColor: 'rgba(167,139,250,0.13)',
    progress: 30,
    status: 'active',
    phase: '墙面批灰 & 找平',
    designer: 'Siti Norziah',
    workDays: [2,4], // Tue/Thu
    startOffset: 7,
    tasks: [
      { name:'主卧室墙面第一道批灰', loc:'主卧 · 80sqm',    done:false, time:'9:00AM', spec:'批灰厚度 8-12mm，养护24h', priority:'mid' },
      { name:'浴室地面水泥找平',     loc:'主浴 · 5sqm',     done:false, time:'11:00AM', spec:'泄水坡度1%朝地漏' },
    ]
  },
  {
    id: 'site_ch8',
    name: 'Cheras Indah #D8',
    shortName: 'Cheras D8',
    address: 'D-8, Jln Pandan Indah 4/3',
    role: '油漆工',
    roleEN: 'Painting',
    color: '#fbbf24',
    bgColor: 'rgba(251,191,36,0.13)',
    progress: 20,
    status: 'upcoming',
    phase: '墙面批土准备',
    designer: 'Kevin Tan',
    workDays: [1,2,3,4,5],
    startOffset: 14,
    tasks: [
      { name:'打磨墙面（120目砂纸）', loc:'全屋 · 1200sqft', done:false, time:'8:30AM', spec:'打磨后需吸尘清洁再批土', priority:'low' },
      { name:'批土第一遍',           loc:'客厅 + 走廊',      done:false, time:'10:30AM', spec:'批土厚度 ≤ 2mm，待干72h' },
    ]
  },
];

// Worker calendar state
let wkCalYear  = TODAY_DATE.getFullYear();
let wkCalMonth = TODAY_DATE.getMonth(); // 0-indexed
let wkSelectedDay = null;
let wkTaskDoneState = {}; // siteId → taskIndex → bool

// Init done state from tasks
WORKER_SITES.forEach(s => {
  wkTaskDoneState[s.id] = {};
  s.tasks.forEach((t, i) => { wkTaskDoneState[s.id][i] = t.done; });
});

// ── Build site dots for a given date ──────────────────────────
function wkGetSiteDotsForDate(year, month, day) {
  // Which sites have work on this calendar day?
  const date = new Date(year, month, day);
  const dow = date.getDay(); // 0=Sun
  const active = [];
  WORKER_SITES.forEach(s => {
    if (s.workDays.includes(dow)) {
      // Check if within project window (rough 4-month window from today-based offset)
      const siteStart = addDays(projectStartDate, s.startOffset * 7);
      const siteEnd = addDays(siteStart, 90); // approx 3 months
      if (date >= siteStart && date <= siteEnd) active.push(s);
    }
  });
  return active;
}

// ── Calendar renderer ──────────────────────────────────────────
function renderWorkerCalendar() {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const fullMonths = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const label = document.getElementById('wk-cal-month-label');
  if (label) label.textContent = `${fullMonths[wkCalMonth]} ${wkCalYear}`;

  const grid = document.getElementById('wk-cal-grid');
  if (!grid) return;

  const firstDay = new Date(wkCalYear, wkCalMonth, 1).getDay();
  const daysInMonth = new Date(wkCalYear, wkCalMonth + 1, 0).getDate();
  const prevDays = new Date(wkCalYear, wkCalMonth, 0).getDate();

  let html = '';
  const todayY = TODAY_DATE.getFullYear(), todayM = TODAY_DATE.getMonth(), todayD = TODAY_DATE.getDate();

  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="wk-cal-day other-month"><span>${prevDays - i}</span></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday   = d === todayD && wkCalMonth === todayM && wkCalYear === todayY;
    const isSelected = wkSelectedDay === d && wkCalMonth === todayM && wkCalYear === todayY;
    const date = new Date(wkCalYear, wkCalMonth, d);
    const dow  = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isHol = isHoliday(date);
    const dots = wkGetSiteDotsForDate(wkCalYear, wkCalMonth, d);
    const hasWork = dots.length > 0;

    const cls = [
      'wk-cal-day',
      isToday    ? 'today'    : '',
      isSelected ? 'selected' : '',
      isWeekend  ? 'weekend'  : '',
      hasWork    ? 'has-work' : '',
    ].filter(Boolean).join(' ');

    const dotHtml = dots.slice(0,3).map(s =>
      `<div class="wk-dot" style="background:${s.color}"></div>`
    ).join('');

    html += `<div class="${cls}" onclick="wkSelectDay(${d})" title="${isHol ? '公共假期 · ' : ''}${dots.map(s=>s.shortName).join(' | ')}">
      <span style="font-size:11px;line-height:1;">${d}</span>
      <div class="wk-dot-row">${dotHtml}</div>
    </div>`;
  }

  // Next month filler
  const totalCells = firstDay + daysInMonth;
  const remainder = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainder; i++) {
    html += `<div class="wk-cal-day other-month"><span>${i}</span></div>`;
  }
  grid.innerHTML = html;

  // Render site legend
  renderWorkerSiteLegend();
  // Render site progress cards
  renderWorkerSiteCards();
  // If a day is selected, render its tasks
  if (wkSelectedDay) wkSelectDay(wkSelectedDay, true);
}

function renderWorkerSiteLegend() {
  const el = document.getElementById('wk-site-legend');
  if (!el) return;
  el.innerHTML = WORKER_SITES.map(s => `
    <div class="wk-legend-row">
      <div><span class="wk-legend-dot" style="background:${s.color}"></span><span style="color:var(--text);font-size:10px;font-weight:600;">${s.shortName}</span></div>
      <div style="color:var(--text2);font-size:10px;">${s.role}</div>
      <div>
        <span style="font-size:9px;padding:2px 7px;border-radius:3px;font-weight:600;
          background:${s.status==='active'?'rgba(74,222,128,.12)':'rgba(251,146,60,.12)'};
          color:${s.status==='active'?'var(--green)':'var(--orange)'};">
          ${s.status==='active'?'施工中':'即将开始'}
        </span>
      </div>
    </div>`).join('');
}

function renderWorkerSiteCards() {
  const el = document.getElementById('wk-site-cards');
  if (!el) return;
  el.innerHTML = WORKER_SITES.map(s => `
    <div class="wk-site-card" style="background:${s.bgColor};border:1px solid ${s.color}22;"
      onclick="switchWorkerTab('sites');wkHighlightSite('${s.id}')">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div>
          <div class="wk-site-card-name" style="color:${s.color}">${s.name}</div>
          <div class="wk-site-card-sub" style="color:var(--text2)">${s.phase}${s.tasks.filter(t=>!wkTaskDoneState[s.id]||!wkTaskDoneState[s.id][s.tasks.indexOf(t)]).length ? ' · '+s.tasks.filter((t,i)=>!wkTaskDoneState[s.id]?.[i]).length+'项未完成' : ''}</div>
        </div>
        <div class="wk-site-card-pct" style="color:${s.color}">${s.progress}%</div>
      </div>
      <div class="wk-site-card-bar">
        <div class="wk-site-card-fill" style="width:${s.progress}%;background:${s.color};"></div>
      </div>
    </div>`).join('');
}

function wkSelectDay(d, silent) {
  wkSelectedDay = d;
  if (!silent) renderWorkerCalendar();

  const date = new Date(wkCalYear, wkCalMonth, d);
  const dots = wkGetSiteDotsForDate(wkCalYear, wkCalMonth, d);
  const panel = document.getElementById('wk-day-tasks');
  if (!panel) return;

  if (!dots.length) {
    panel.style.display = 'block';
    const isHol = isHoliday(date);
    panel.innerHTML = `<div style="background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:12px 14px;font-size:12px;color:var(--text2);text-align:center;">
      ${isHol ? '🎌 公共假期，休息日' : '😌 当天无工地安排'}</div>`;
    return;
  }

  panel.style.display = 'block';
  const fmt = date.toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'short' });
  panel.innerHTML = `
    <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;">${fmt} 工地安排</div>
    ${dots.map(s => `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:${s.bgColor};border-radius:8px;margin-bottom:6px;border:1px solid ${s.color}33;">
        <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
        <div>
          <div style="font-size:11px;font-weight:700;color:${s.color};">${s.name}</div>
          <div style="font-size:10px;color:var(--text2);">${s.role} · ${s.phase}</div>
        </div>
        <div style="margin-left:auto;font-size:11px;color:var(--text3);">${s.tasks.length}项</div>
      </div>`).join('')}`;
}

function wkCalPrev() {
  wkCalMonth--;
  if (wkCalMonth < 0) { wkCalMonth = 11; wkCalYear--; }
  wkSelectedDay = null;
  renderWorkerCalendar();
}
function wkCalNext() {
  wkCalMonth++;
  if (wkCalMonth > 11) { wkCalMonth = 0; wkCalYear++; }
  wkSelectedDay = null;
  renderWorkerCalendar();
}

// ── Today's task list ──────────────────────────────────────────
function renderWorkerTodayTasks() {
  const el = document.getElementById('wk-today-task-list');
  if (!el) return;

  // Get sites with work today
  const dow = TODAY_DATE.getDay();
  const todaySites = WORKER_SITES.filter(s => s.workDays.includes(dow));

  let html = '';
  let totalDone = 0, totalTasks = 0;

  todaySites.forEach(s => {
    html += `<div class="wk-task-group-header">
      <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0;"></div>
      <span style="color:${s.color}">${s.name}</span>
      <span style="color:var(--text3);font-weight:400;">· ${s.role}</span>
    </div>`;
    s.tasks.forEach((t, i) => {
      totalTasks++;
      const done = wkTaskDoneState[s.id]?.[i] ?? t.done;
      if (done) totalDone++;
      const priColor = t.priority === 'high' ? 'var(--red)' : t.priority === 'mid' ? 'var(--orange)' : s.color;
      html += `<div class="wk-task-item ${done ? 'done' : ''}" onclick="wkToggleTask('${s.id}',${i})">
        <div class="wk-task-dot" style="background:${s.color};margin-top:3px;"></div>
        <div style="flex:1;">
          <div class="wk-task-name">${t.name}</div>
          <div class="wk-task-loc">${t.loc}</div>
          ${t.spec && !done ? `<div style="font-size:10px;color:var(--text3);margin-top:3px;line-height:1.4;">📋 ${t.spec}</div>` : ''}
          ${t.time ? `<div style="font-size:10px;margin-top:3px;"><span style="background:var(--surface2);border:1px solid var(--border2);padding:2px 6px;border-radius:3px;color:${done?'var(--text3)':'var(--text2)'};">${done ? '✓ '+t.time+' 完成' : '🕐 '+t.time}</span>${t.priority==='high'&&!done?`<span style="background:rgba(248,113,113,.1);color:var(--red);padding:2px 6px;border-radius:3px;margin-left:4px;font-size:10px;">⚡ 优先</span>`:''}</div>` : ''}
        </div>
        <div class="wk-check-circle ${done?'done':''}">${done?'✓':'○'}</div>
      </div>`;
    });

    // Photo upload button for active tasks
    if (s.tasks.some((t,i) => !(wkTaskDoneState[s.id]?.[i] ?? t.done))) {
      html += `<button class="worker-photo-btn" style="margin-bottom:10px;background:${s.bgColor};border-color:${s.color}44;color:${s.color};" onclick="showToast('📸','相机已打开，请拍摄 ${s.shortName} 完工照片')">📷 上传 ${s.shortName} 完工照</button>`;
    }
  });

  if (!todaySites.length) {
    html = `<div style="text-align:center;padding:30px 0;color:var(--text3);">😌 今日无工地安排</div>`;
  }

  el.innerHTML = html;

  // Update summary
  const ratio = document.getElementById('wk-tasks-done-ratio');
  const bar = document.getElementById('wk-overall-bar');
  const summary = document.getElementById('wk-tasks-summary');
  if (ratio) ratio.textContent = `${totalDone}/${totalTasks}`;
  if (bar) bar.style.width = totalTasks ? `${Math.round(totalDone/totalTasks*100)}%` : '0%';
  if (summary) summary.textContent = `${todaySites.length} 个工地 · ${totalTasks} 项任务`;
}

function wkToggleTask(siteId, idx) {
  if (!wkTaskDoneState[siteId]) wkTaskDoneState[siteId] = {};
  wkTaskDoneState[siteId][idx] = !wkTaskDoneState[siteId][idx];
  const done = wkTaskDoneState[siteId][idx];
  if (done) showToast('✅', `任务已完成！`);
  renderWorkerTodayTasks();
  renderWorkerSiteCards();
}

// ── Sites detail tab ───────────────────────────────────────────
function renderWorkerSitesDetail(highlightId) {
  const el = document.getElementById('wk-sites-detail');
  if (!el) return;
  el.innerHTML = WORKER_SITES.map(s => {
    const doneTasks = s.tasks.filter((t,i) => wkTaskDoneState[s.id]?.[i] ?? t.done).length;
    const hl = highlightId === s.id;
    return `<div class="wk-site-detail-card" id="wksd-${s.id}" style="${hl?'border-color:'+s.color+';':''}" onclick="wkHighlightSite('${s.id}')">
      <div class="wk-site-detail-header">
        <div class="wk-site-color-bar" style="background:${s.color};min-height:44px;"></div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--text);">${s.name}</div>
          <div style="font-size:10px;color:var(--text3);margin-top:1px;">${s.address}</div>
          <div style="margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-size:10px;background:${s.bgColor};color:${s.color};padding:2px 8px;border-radius:3px;font-weight:600;">${s.role}</span>
            <span style="font-size:10px;color:var(--text3);">设计师: ${s.designer}</span>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:20px;font-weight:800;color:${s.color};line-height:1;">${s.progress}%</div>
          <div style="font-size:9px;color:var(--text3);margin-top:2px;">${doneTasks}/${s.tasks.length} 今日</div>
        </div>
      </div>
      <div style="padding:0 14px 4px;">
        <div style="background:var(--surface2);border-radius:4px;height:5px;overflow:hidden;margin-bottom:10px;">
          <div style="width:${s.progress}%;height:100%;background:${s.color};border-radius:4px;transition:width .5s;"></div>
        </div>
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px;">当前工序: ${s.phase}</div>
      </div>
      <div class="wk-site-detail-body">
        ${s.tasks.map((t,i) => {
          const done = wkTaskDoneState[s.id]?.[i] ?? t.done;
          return `<div class="wk-site-task-row">
            <div style="width:14px;height:14px;border-radius:50%;background:${done?s.color:'var(--surface3)'};border:1.5px solid ${done?s.color:'var(--border2)'};flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:8px;color:white;">${done?'✓':''}</div>
            <span style="${done?'text-decoration:line-through;opacity:.5':''};">${t.name}</span>
            <span style="margin-left:auto;opacity:.6;">${t.loc}</span>
          </div>`;
        }).join('')}
        <div style="padding:8px 0 2px;display:flex;gap:6px;">
          <button style="flex:1;padding:7px;background:${s.bgColor};border:1px solid ${s.color}44;border-radius:7px;color:${s.color};font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;" onclick="showToast('📍','已导航至 ${s.name}')">📍 导航到工地</button>
          <button style="flex:1;padding:7px;background:var(--surface2);border:1.5px solid var(--border2);border-radius:7px;color:var(--text2);font-size:11px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;" onclick="showToast('📞','呼叫 ${s.designer} 设计师...')">📞 联系设计师</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function wkHighlightSite(id) {
  renderWorkerSitesDetail(id);
  setTimeout(() => {
    const el = document.getElementById('wksd-' + id);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 50);
}

// ── Tab switcher ───────────────────────────────────────────────
function switchWorkerTab(tab) {
  ['calendar','tasks','sites'].forEach(t => {
    const btn = document.getElementById('wtab-'+t);
    const pnl = document.getElementById('wk-tab-'+t);
    if (btn) btn.classList.toggle('active', t === tab);
    if (pnl) pnl.style.display = t === tab ? 'block' : 'none';
  });
  if (tab === 'tasks')    renderWorkerTodayTasks();
  if (tab === 'calendar') renderWorkerCalendar();
  if (tab === 'sites')    renderWorkerSitesDetail(null);
}

// ── Checkin ────────────────────────────────────────────────────
let wkCheckedIn = false;
function wkCheckin() {
  wkCheckedIn = !wkCheckedIn;
  const btn = document.querySelector('.btn-in');
  if (btn) btn.textContent = wkCheckedIn ? '⏱ 打卡下班' : '⏱ 打卡上班';
  const now = new Date().toLocaleTimeString('en-MY', {hour:'2-digit', minute:'2-digit'});
  showToast(wkCheckedIn ? '✅' : '👋', wkCheckedIn ? `上班打卡成功！ ${now}` : `下班打卡成功！今日工时: 8h 20min`);
}

// ── Init worker portal ─────────────────────────────────────────
function initWorkerPortal() {
  const todayLabel = document.getElementById('wk-today-label');
  if (todayLabel) {
    todayLabel.textContent = TODAY_DATE.toLocaleDateString('en-MY', {
      weekday:'long', day:'numeric', month:'short', year:'numeric'
    }).toUpperCase();
  }
  wkCalYear  = TODAY_DATE.getFullYear();
  wkCalMonth = TODAY_DATE.getMonth();
  renderWorkerCalendar();
  renderWorkerTodayTasks();
}

// ══════════════════════════════════════════
//  PRICING & SUBSCRIPTION ENGINE
// ══════════════════════════════════════════

const PRICING_STATE = {
  plan: 'free',          // 'free' | 'pro' | 'elite'
  totalFree: 3,
  totalPro: 50,
  totalElite: Infinity,
  usedFree: 1,
  usedPro: 0,
  usedElite: 0,
  quotaUploadsThisMonth: 0,  // track monthly uploads
  quotaUploadsPro: 50,       // Pro: 50 uploads/month
  quotaUploadsElite: Infinity,
};

function getPricingUsed() {
  if (PRICING_STATE.plan === 'elite') return PRICING_STATE.usedElite;
  if (PRICING_STATE.plan === 'pro')   return PRICING_STATE.usedPro;
  return PRICING_STATE.usedFree;
}
function getPricingTotal() {
  if (PRICING_STATE.plan === 'elite') return PRICING_STATE.totalElite;
  if (PRICING_STATE.plan === 'pro')   return PRICING_STATE.totalPro;
  return PRICING_STATE.totalFree;
}
function getPricingLeft() {
  if (PRICING_STATE.plan === 'elite') return Infinity;
  return Math.max(0, getPricingTotal() - getPricingUsed());
}
function canUploadQuotation() {
  if (PRICING_STATE.plan === 'elite') return true;
  if (PRICING_STATE.plan === 'pro')   return PRICING_STATE.quotaUploadsThisMonth < PRICING_STATE.quotaUploadsPro;
  return false; // free: no monthly uploads
}
function getRemainingUploads() {
  if (PRICING_STATE.plan === 'elite') return Infinity;
  if (PRICING_STATE.plan === 'pro')   return Math.max(0, PRICING_STATE.quotaUploadsPro - PRICING_STATE.quotaUploadsThisMonth);
  return 0;
}

// ── Sync all usage UI everywhere ─────────
function syncUsageUI() {
  const plan = PRICING_STATE.plan;
  const used  = getPricingUsed();
  const total = getPricingTotal();
  const left  = getPricingLeft();
  const pct   = plan === 'elite' ? 30 : Math.round(used / total * 100);
  const planLabel = plan === 'elite' ? 'Elite ⚡' : plan === 'pro' ? 'Pro ✦' : '免费版';
  const barColor  = plan === 'elite' ? 'var(--blue)' : plan === 'pro' ? 'var(--teal)' : (pct > 80 ? 'var(--red)' : 'var(--gold)');

  // Sidebar meter
  const sUsed  = document.getElementById('sidebar-usage-used');
  const sTotal = document.getElementById('sidebar-usage-total');
  const sBar   = document.getElementById('sidebar-usage-bar');
  const sPlan  = document.getElementById('sidebar-plan-label');
  const sHint  = document.getElementById('sidebar-upgrade-hint');
  if (sUsed)  sUsed.textContent  = plan === 'elite' ? '∞' : used;
  if (sTotal) sTotal.textContent = plan === 'elite' ? '∞' : total;
  if (sBar)   { sBar.style.width = pct + '%'; sBar.style.background = barColor; }
  if (sPlan)  sPlan.textContent  = planLabel;
  if (sHint) {
    if (plan === 'elite') sHint.textContent = '无限次 · 每月可上传报价单';
    else if (plan === 'pro') sHint.textContent = left > 0 ? `还剩 ${left} 次 · 本月重置` : '本月额度已用完';
    else sHint.textContent = left > 0 ? `还剩 ${left} 次免费 · 订阅解锁无限` : '额度已用完 · 订阅继续使用';
    sHint.style.color = (left === 0 && plan === 'free') ? 'var(--red)' : 'var(--text3)';
  }

  // Pricing page account status
  const acctStatus = document.getElementById('pricing-account-status');
  if (acctStatus) {
    if (plan === 'elite') acctStatus.textContent = 'Elite 版 ⚡ · 无限额度';
    else if (plan === 'pro') acctStatus.textContent = `Pro 版 ✦ · 已用 ${used}/${total} 次`;
    else acctStatus.textContent = `免费版 · 已用 ${used}/${total} 次`;
  }

  // Free plan usage block
  const fu = document.getElementById('free-usage-text');
  const fb = document.getElementById('free-usage-bar');
  const fh = document.getElementById('free-usage-hint');
  if (fu) fu.textContent = `${PRICING_STATE.usedFree} / ${PRICING_STATE.totalFree} 次已用`;
  if (fb) fb.style.width = Math.round(PRICING_STATE.usedFree / PRICING_STATE.totalFree * 100) + '%';
  if (fh) fh.textContent = PRICING_STATE.usedFree >= PRICING_STATE.totalFree
    ? '额度已用完 · 订阅 Pro/Elite 继续使用'
    : `还剩 ${PRICING_STATE.totalFree - PRICING_STATE.usedFree} 次 · 订阅后每月可上传报价单`;

  // Plan card highlights
  ['free','pro','elite'].forEach(p => {
    document.getElementById('plan-card-'+p)?.classList.toggle('pricing-card-selected', plan === p);
  });

  // Upgrade button labels
  const ubtn = document.getElementById('upgrade-btn-label');
  if (ubtn) ubtn.textContent = plan === 'pro' ? '✦ 已订阅 Pro · 管理订阅' : '✦ 升级 Pro · RM 99/月';
  const uelite = document.getElementById('upgrade-elite-label');
  if (uelite) uelite.textContent = plan === 'elite' ? '⚡ 已订阅 Elite · 管理订阅' : '⚡ 升级 Elite · RM 499/月';
}

// ── Consume one AI credit ─────────────────
function consumeAICredit() {
  if (PRICING_STATE.plan === 'elite') {
    PRICING_STATE.usedElite++;
  } else if (PRICING_STATE.plan === 'pro') {
    PRICING_STATE.usedPro = Math.min(PRICING_STATE.totalPro, PRICING_STATE.usedPro + 1);
  } else {
    PRICING_STATE.usedFree = Math.min(PRICING_STATE.totalFree, PRICING_STATE.usedFree + 1);
  }
  syncUsageUI();
  if (getPricingLeft() === 0 && PRICING_STATE.plan === 'free') {
    setTimeout(() => showToast('⚠️', '免费额度已用完！订阅 Pro/Elite 继续使用'), 800);
  }
}

// ── Plan card selection ───────────────────
function pricingSelectPlan(plan) {
  if (plan === 'pro' || plan === 'elite') handleUpgradeClick(null, plan);
}

// ── Upgrade flow ──────────────────────────
function handleUpgradeClick(e, targetPlan) {
  if (e) e.stopPropagation();
  const plan = targetPlan || 'pro';

  if (PRICING_STATE.plan === plan) {
    showToast('⚙️', '订阅管理页面（演示模式）');
    return;
  }

  // Animate button
  const labelId = plan === 'elite' ? 'upgrade-elite-label' : 'upgrade-btn-label';
  const label = document.getElementById(labelId);
  if (label) label.textContent = '⏳ 处理中...';

  setTimeout(() => {
    PRICING_STATE.plan = plan;
    if (plan === 'pro')   PRICING_STATE.usedPro   = PRICING_STATE.usedFree;
    if (plan === 'elite') PRICING_STATE.usedElite  = 0;

    const resetDate = new Date(TODAY_DATE);
    resetDate.setMonth(resetDate.getMonth() + 1);
    const fmtDate = `${resetDate.getFullYear()}年${resetDate.getMonth()+1}月${resetDate.getDate()}日`;

    // Populate upgrade modal
    const resetEl = document.getElementById('upgrade-reset-date');
    if (resetEl) resetEl.textContent = fmtDate;
    const planNameEl = document.getElementById('upgrade-plan-name');
    if (planNameEl) planNameEl.textContent = plan === 'elite' ? 'Elite 无限版 ⚡' : 'Pro 专业版 ✦';
    const creditsEl = document.getElementById('upgrade-credits-line');
    if (creditsEl) creditsEl.textContent = plan === 'elite' ? '∞ 无限次 AI 分析额度' : '50 次 AI 分析额度/月';
    const quotaEl = document.getElementById('upgrade-quota-line');
    if (quotaEl) quotaEl.textContent = '每月无限上传报价单';
    const priceEl = document.getElementById('upgrade-price-line');
    if (priceEl) priceEl.textContent = plan === 'elite' ? 'RM 499/月' : 'RM 99/月';

    syncUsageUI();
    // Refresh price library gate if panel is open
    if (document.getElementById('panel-pricelibrary')?.classList.contains('active')) {
      checkPriceLibAccess();
    }
    openModal('modal-upgrade');
  }, 1000);
}

// ── Compare table data ────────────────────
const COMPARE_DATA = [
  { section: '📤 报价单上传' },
  { feat:'每月上传报价单', free:'✗', pro:'50次/月', elite:'无限次' },
  { feat:'报价单 AI 分析额度', free:'3次/终身', pro:'50次/月', elite:'∞ 无限次' },
  { section: '🤖 AI 核心功能' },
  { feat:'AI 施工进度编排', free:'✓', pro:'✓', elite:'✓' },
  { feat:'AI 市场价格对比', free:'✗', pro:'✓', elite:'✓' },
  { feat:'AI 追问 Follow-up', free:'3次', pro:'无限', elite:'无限' },
  { section: '📊 甘特图 & 进度管理' },
  { feat:'甘特图可视化', free:'✓', pro:'✓', elite:'✓' },
  { feat:'拖拽调整工期', free:'✓', pro:'✓', elite:'✓' },
  { feat:'并行工序标注', free:'✓', pro:'✓', elite:'✓' },
  { feat:'任务细分 + 备料清单', free:'✓', pro:'✓', elite:'✓' },
  { section: '📤 导出 & 共享' },
  { feat:'Excel 进度表导出', free:'✗', pro:'✓', elite:'✓' },
  { feat:'PDF 报告导出', free:'✗', pro:'✓', elite:'✓' },
  { feat:'WhatsApp 进度推送', free:'✗', pro:'✓', elite:'✓' },
  { feat:'自定义品牌报告', free:'✗', pro:'✗', elite:'✓' },
  { section: '👥 团队 & 项目管理' },
  { feat:'项目数量上限', free:'1个', pro:'无限', elite:'无限' },
  { feat:'团队成员数', free:'1人', pro:'1人', elite:'最多5人' },
  { feat:'工人端多工地日历', free:'✓', pro:'✓', elite:'✓' },
  { feat:'业主端付款追踪', free:'✓', pro:'✓', elite:'✓' },
  { feat:'优先客服支持', free:'✗', pro:'✓', elite:'✓' },
  { feat:'专属客户经理', free:'✗', pro:'✗', elite:'✓' },
  { feat:'API 访问权限', free:'✗', pro:'✗', elite:'✓' },
];

function renderPricingCompareTable() {
  const el = document.getElementById('pricing-compare-table');
  if (!el) return;
  function val(v, accent) {
    if (v === '✓') return `<span class="compare-yes" style="color:${accent||'var(--green)'}">✓</span>`;
    if (v === '✗') return `<span class="compare-no">—</span>`;
    return `<span class="compare-val-text" style="color:${accent||'var(--text2)'};font-weight:600;">${v}</span>`;
  }
  el.innerHTML = COMPARE_DATA.map(row => {
    if (row.section) return `<div class="compare-section-header" style="grid-column:1/-1">${row.section}</div>`;
    return `<div class="compare-row">
      <div class="compare-feat">${row.feat}</div>
      <div class="compare-val">${val(row.free)}</div>
      <div class="compare-val">${val(row.pro,'var(--gold-dk,#C89B09)')}</div>
      <div class="compare-val">${val(row.elite,'var(--blue)')}</div>
    </div>`;
  }).join('');
}

// ── FAQ data ──────────────────────────────
const FAQ_DATA = [
  { q:'订阅后可以上传报价单吗？',
    a:'可以。Pro（RM 99/月）和 Elite（RM 499/月）订阅用户每月可无限次上传报价单，并使用 AI 分析、进度编排、导出等所有功能。免费版每次上传消耗 1 次终身额度（共3次）。' },
  { q:'免费的 3 次额度会过期吗？',
    a:'不会。免费额度终身有效，不会因时间流逝而消失。用完3次后，订阅 Pro 或 Elite 即可继续每月无限上传和分析。' },
  { q:'Pro 和 Elite 有什么不同？',
    a:'Pro（RM 99/月）每月 50 次 AI 分析额度，适合单人设计师。Elite（RM 499/月）无限次额度，支持最多 5 名团队成员，适合设计事务所，含专属客户经理和自定义品牌报告。' },
  { q:'Pro 版的 50 次什么时候重置？',
    a:'每月按订阅日期重置。例如 3 月 9 日订阅，每月 9 日重置。未用完的额度不累积到下个月。' },
  { q:'如何付款？',
    a:'支持马来西亚 FPX（网银）、Visa/Mastercard 信用卡、TNG eWallet、银行转账。所有付款通过 Stripe 加密处理，不存储卡号。' },
  { q:'可以随时取消吗？',
    a:'可以，无合约绑定。取消后当月仍可使用功能，到期自动降回免费版，不会额外扣款。' },
  { q:'我的报价单数据安全吗？',
    a:'报价单数据仅用于生成分析结果，不用于训练 AI 模型。存储于 AWS 亚太区（新加坡），符合 PDPA 要求。' },
];

function renderPricingFAQ() {
  const el = document.getElementById('pricing-faq');
  if (!el) return;
  el.innerHTML = FAQ_DATA.map((item, i) => `
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFAQ(${i})">
        <span>${item.q}</span>
        <span id="faq-arrow-${i}" style="color:var(--text3);transition:transform .2s;">›</span>
      </div>
      <div class="faq-a" id="faq-a-${i}">${item.a}</div>
    </div>`).join('');
}

function toggleFAQ(i) {
  const ans = document.getElementById('faq-a-'+i);
  const arr = document.getElementById('faq-arrow-'+i);
  const isOpen = ans?.classList.toggle('open');
  if (arr) arr.style.transform = isOpen ? 'rotate(90deg)' : '';
}

// ── Init pricing page ─────────────────────
function initPricingPage() {
  renderPricingCompareTable();
  renderPricingFAQ();
  syncUsageUI();
}




// ══════════════════════════════════════════════════════════════════
//  AUTH ENGINE — Login / Register / OTP flow
// ══════════════════════════════════════════════════════════════════

const AUTH_STATE = {
  designer: false,
  owner:    false,
  worker:   false,
  currentUser: {
    designer: { name:'Ahmad Faris', plan:'free' },
    owner:    { name:'Dato Catherine', project:'Taman Desa KL' },
    worker:   { name:'Kumar Selvam', role:'木工' }
  }
};

// ── Show / hide auth overlay for a portal ────────────────────────
function showAuthOverlay(portal) {
  const ov = document.getElementById('auth-' + portal);
  if (ov) { ov.classList.remove('hidden'); }
}
function hideAuthOverlay(portal) {
  const ov = document.getElementById('auth-' + portal);
  if (ov) { ov.classList.add('hidden'); }
}

// ── Switch Login ↔ Register tabs ─────────────────────────────────
function authSwitchTab(portal, tab) {
  const p = portal === 'designer' ? 'd' : portal === 'owner' ? 'o' : 'w';
  const lt = document.getElementById('auth-' + p + '-tab-login');
  const rt = document.getElementById('auth-' + p + '-tab-register');
  if (lt) lt.classList.toggle('on', tab === 'login');
  if (rt) rt.classList.toggle('on', tab === 'register');

  const loginStep = document.getElementById('auth-' + p + '-login-phone');
  const otpStep   = document.getElementById('auth-' + p + '-login-otp');
  const regStep   = document.getElementById('auth-' + p + '-register');
  if (loginStep) loginStep.classList.toggle('on', tab === 'login');
  if (otpStep)   otpStep.classList.remove('on');
  if (regStep)   regStep.classList.toggle('on', tab === 'register');

  // Reset worker reg OTP step when switching tabs
  if (portal === 'worker') {
    document.getElementById('auth-w-reg-otp')?.classList.remove('on');
  }
}

// ── Send OTP (simulated) ──────────────────────────────────────────
function authSendOTP(portal) {
  const p = portal === 'designer' ? 'd' : portal === 'owner' ? 'o' : 'w';
  const phoneInput = document.getElementById('auth-' + p + '-phone') || document.getElementById('auth-' + portal + '-phone');
  const phoneVal = phoneInput ? phoneInput.value.trim() : '11-xxxx xxxx';

  // Transition: phone → OTP step
  const loginStep = document.getElementById('auth-' + p + '-login-phone');
  const otpStep   = document.getElementById('auth-' + p + '-login-otp');
  if (loginStep) loginStep.classList.remove('on');
  if (otpStep)   otpStep.classList.add('on');

  // Focus first OTP box
  setTimeout(() => {
    const firstBox = otpStep?.querySelector('.auth-otp-box');
    if (firstBox) firstBox.focus();
  }, 100);

  showToast('📱', '验证码已发送到你的 WhatsApp（演示：888888）');
}

// ── Auto-fill OTP for demo ────────────────────────────────────────
function authAutoFillOTP(prefix) {
  const containers = document.querySelectorAll('#auth-' + prefix.split('-')[0] + '-' + (prefix.includes('-l') ? 'login' : 'register') + '-otp .auth-otp-box')
    || document.querySelectorAll('.auth-otp-box');
  // Simpler: find all otp boxes in visible step
  const allOtp = document.querySelectorAll('.auth-step.on .auth-otp-box');
  const demo = ['8','8','8','8','8','8'];
  allOtp.forEach((box, i) => {
    if (i < 6) {
      box.value = demo[i];
      box.classList.add('filled');
    }
  });
}

// ── OTP input auto-advance ────────────────────────────────────────
function authOTPNext(input, prefix, idx) {
  input.classList.toggle('filled', input.value.length > 0);
  if (input.value.length === 1) {
    const siblings = input.closest('.auth-otp-row')?.querySelectorAll('.auth-otp-box');
    if (siblings && siblings[idx + 1]) siblings[idx + 1].focus();
    // Auto verify if all 6 filled
    if (idx === 5) {
      const allFilled = [...siblings].every(b => b.value.length === 1);
      const combined = [...siblings].map(b => b.value).join('');
      if (allFilled && combined === '888888') {
        // Flash green then proceed
        siblings.forEach(b => { b.style.borderColor = 'var(--green)'; b.style.background = 'rgba(22,163,74,.08)'; });
        setTimeout(() => {
          const portal = prefix.startsWith('d') ? 'designer' : prefix.startsWith('o') ? 'owner' : 'worker';
          authVerifyOTP(portal);
        }, 400);
      }
    }
  }
}

// ── Back to phone step ────────────────────────────────────────────
function authBackToPhone(portal) {
  const p = portal === 'designer' ? 'd' : portal === 'owner' ? 'o' : 'w';
  const loginStep = document.getElementById('auth-' + p + '-login-phone');
  const otpStep   = document.getElementById('auth-' + p + '-login-otp');
  if (loginStep) loginStep.classList.add('on');
  if (otpStep)   otpStep.classList.remove('on');
}

// ── Verify OTP → enter portal ─────────────────────────────────────
function authVerifyOTP(portal) {
  authDemoLogin(portal);
}

// ── Demo login: skip all verification ────────────────────────────
function authDemoLogin(portal) {
  AUTH_STATE[portal] = true;
  hideAuthOverlay(portal);

  // Apply plan from register selection if designer
  if (portal === 'designer') {
    const selectedChip = document.querySelector('#auth-d-register .auth-plan-chip.selected');
    if (selectedChip) {
      const plan = selectedChip.dataset.plan || 'free';
      if (plan !== 'free') {
        handleUpgradeClick(null, plan);
        return;
      }
    }
  }

  // Update user display
  if (portal === 'designer') {
    const nameEl = document.querySelector('.brand');
    // Update sidebar name if present
    showToast('👋', `欢迎回来，${AUTH_STATE.currentUser.designer.name}！`);
    syncUsageUI();
  } else if (portal === 'owner') {
    showToast('🏠', `欢迎，${AUTH_STATE.currentUser.owner.name}！进度已同步。`);
  } else if (portal === 'worker') {
    showToast('👷', `早上好，${AUTH_STATE.currentUser.worker.name}！今日有 2 个工地任务。`);
  }
}

// ── Plan chip selection in register form ─────────────────────────
function authSelectPlan(el, plan) {
  document.querySelectorAll('#auth-d-register .auth-plan-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

// ── Registered phone registry (simulates backend DB) ─────────────
const REGISTERED_PHONES = new Set(['11-2345 6789','0112345678']);

// ── Smart login: skip OTP if phone already registered ───────────
function authLoginWithPhone(portal) {
  const p = portal === 'designer' ? 'd' : portal === 'owner' ? 'o' : 'w';
  const phoneInput = document.getElementById('auth-' + p + '-phone');
  const phoneVal   = phoneInput ? phoneInput.value.trim() : '';
  const normalised = phoneVal.replace(/[\s\-()]/g,'');

  // Registered: direct login (no OTP needed)
  // Unregistered empty: demo direct login
  // In production: check REGISTERED_PHONES; here demo = always registered
  showToast('✅', phoneVal ? `欢迎回来！${phoneVal} 无需验证码` : '已跳过验证码（演示模式）');
  authDemoLogin(portal);
}

// ── Worker registration: send OTP before completing ─────────────
function workerRegisterSendOTP() {
  const name   = document.getElementById('auth-w-reg-name')?.value.trim();
  const phone  = document.getElementById('auth-w-reg-phone')?.value.trim();
  const trades = getSelectedTrades();

  if (!name)          { showToast('⚠️','请填写姓名'); return; }
  if (!trades.length) { showToast('⚠️','请至少选择一个工种'); return; }
  if (!phone)         { showToast('⚠️','请填写手机号码'); return; }

  const regStep  = document.getElementById('auth-w-register');
  const otpStep  = document.getElementById('auth-w-reg-otp');
  if (regStep) regStep.classList.remove('on');
  if (otpStep) otpStep.classList.add('on');
  showToast('📱','验证码已发送到你的 WhatsApp（演示：888888）');
  setTimeout(() => { otpStep?.querySelector('.auth-otp-box')?.focus(); }, 100);
}

function workerRegBackToForm() {
  document.getElementById('auth-w-reg-otp')?.classList.remove('on');
  document.getElementById('auth-w-register')?.classList.add('on');
}

function workerRegisterComplete() {
  const name   = document.getElementById('auth-w-reg-name')?.value.trim() || 'Kumar Selvam';
  const trades = getSelectedTrades();
  const phone  = document.getElementById('auth-w-reg-phone')?.value.trim();
  AUTH_STATE.currentUser.worker.name = name;
  AUTH_STATE.currentUser.worker.role = trades.length ? trades.join(' / ') : '工人';
  if (phone) REGISTERED_PHONES.add(phone);
  authDemoLogin('worker');
  showToast('👷', `注册申请已提交！工种：${trades.join('、') || '待填写'}`);
}

// ── Trade multi-select ──────────────────────────────────────────
function toggleTrade(el, tradeName) {
  el.classList.toggle('on');
  updateTradePreview();
}

function getSelectedTrades() {
  return [...document.querySelectorAll('#worker-trade-chips .trade-chip.on')]
    .map(el => el.querySelector('span:nth-child(2)').textContent);
}

function updateTradePreview() {
  const trades  = getSelectedTrades();
  const preview = document.getElementById('trade-selected-preview');
  if (!preview) return;
  if (trades.length) {
    preview.style.display = 'block';
    preview.textContent   = '已选：' + trades.join('、');
  } else {
    preview.style.display = 'none';
  }
}

// (authSwitchTab extended in original function above)

// ── Settings panel functions ────────────────────────────────────
function switchSettingsTab(name, btn) {
  document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  ['profile','company','plan','prefs'].forEach(t => {
    const el = document.getElementById('stab-content-' + t);
    if (el) el.style.display = t === name ? '' : 'none';
  });
  if (name === 'plan') {
    const badge = document.getElementById('settings-plan-badge');
    const used  = document.getElementById('settings-ai-used');
    const planName = PRICING_STATE.plan === 'free' ? '免费版' : PRICING_STATE.plan === 'pro' ? 'Pro 专业版' : 'Elite 无限版';
    if (badge) badge.textContent = '✦ ' + planName;
    if (used)  used.textContent  = getPricingUsed() + ' / ' + (getPricingTotal() === Infinity ? '∞' : getPricingTotal()) + ' 次';
  }
}

function saveProfileSettings() {
  const name = document.getElementById('pf-name')?.value.trim();
  if (name) {
    AUTH_STATE.currentUser.designer.name = name;
    const d = document.getElementById('settings-display-name');
    if (d) d.textContent = name;
    const circle = document.getElementById('settings-avatar-circle');
    if (circle) circle.textContent = name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  }
  const s = document.getElementById('profile-save-status');
  if (s) { s.style.display='inline'; setTimeout(()=>s.style.display='none',2500); }
  showToast('💾','个人资料已保存');
}

function saveCompanySettings() {
  const s = document.getElementById('company-save-status');
  if (s) { s.style.display='inline'; setTimeout(()=>s.style.display='none',2500); }
  showToast('💾','公司资料已保存');
}

// ── Price Library data + render ─────────────────────────────────
const PRICE_LIBRARY = [
  { name:'墙面批灰 Wall Plastering',       unit:'sqft', lo:2.50, mid:3.50, hi:5.50,   cat:'masonry',   note:'单层，含找平' },
  { name:'地面水泥找平 Floor Screed',       unit:'sqft', lo:2.00, mid:3.00, hi:4.50,   cat:'masonry',   note:'厚度 25–50mm' },
  { name:'湿区防水 Waterproofing',          unit:'sqft', lo:3.50, mid:5.50, hi:8.00,   cat:'masonry',   note:'墙脚翻高 300mm' },
  { name:'砌砖墙 Brickwork',               unit:'sqft', lo:15,   mid:22,   hi:32,     cat:'masonry',   note:'4" 砖，不含批灰' },
  { name:'拆墙 Demolition',                unit:'sqft', lo:5,    mid:8,    hi:14,     cat:'masonry',   note:'含碎料搬运' },
  { name:'木工柜体 Custom Cabinet',         unit:'rft',  lo:200,  mid:350,  hi:550,    cat:'carpentry', note:'18mm E1 板材' },
  { name:'石膏板吊顶 Plasterboard Ceiling', unit:'sqft', lo:10,   mid:13,   hi:18,     cat:'carpentry', note:'含轻钢龙骨、批土' },
  { name:'木地板 Timber Flooring',          unit:'sqft', lo:8,    mid:12,   hi:20,     cat:'carpentry', note:'12mm AC4 HDF' },
  { name:'实木门 Solid Timber Door',        unit:'unit', lo:450,  mid:750,  hi:1400,   cat:'carpentry', note:'不含门框' },
  { name:'铝框玻璃门 Aluminium Door',       unit:'unit', lo:600,  mid:950,  hi:1800,   cat:'carpentry', note:'含安装' },
  { name:'电线布线 Electrical Wiring',      unit:'pnt',  lo:60,   mid:90,   hi:140,    cat:'mne',       note:'每个灯/开关点' },
  { name:'水管更换 Plumbing Pipe',          unit:'ft',   lo:12,   mid:20,   hi:35,     cat:'mne',       note:'UPVC，不含泥水' },
  { name:'电箱升级 DB Box Upgrade',         unit:'set',  lo:800,  mid:1400, hi:2200,   cat:'mne',       note:'含断路器' },
  { name:'热水器安装 Water Heater Inst.',    unit:'unit', lo:200,  mid:350,  hi:600,    cat:'mne',       note:'不含器具' },
  { name:'内墙油漆 Interior Paint',         unit:'sqft', lo:1.60, mid:1.90, hi:2.80,   cat:'painting',  note:'双层面漆 Nippon 5001' },
  { name:'外墙油漆 Exterior Paint',         unit:'sqft', lo:2.20, mid:2.80, hi:4.00,   cat:'painting',  note:'防水漆，含底漆' },
  { name:'批土 Wall Putty',                 unit:'sqft', lo:0.80, mid:1.20, hi:1.80,   cat:'painting',  note:'2遍，打磨光滑' },
  { name:'喷漆 Spray Paint',                unit:'sqft', lo:2.50, mid:3.50, hi:5.00,   cat:'painting',  note:'柜体或门片' },
  { name:'地砖铺设 Floor Tiling',           unit:'sqft', lo:5.00, mid:7.50, hi:12,     cat:'tiling',    note:'不含砖价' },
  { name:'墙砖铺设 Wall Tiling',            unit:'sqft', lo:6.00, mid:8.50, hi:14,     cat:'tiling',    note:'卫浴墙面' },
  { name:'马赛克铺设 Mosaic Tiling',        unit:'sqft', lo:12,   mid:18,   hi:28,     cat:'tiling',    note:'含切割人工' },
  { name:'旧砖拆除 Tile Hacking',           unit:'sqft', lo:2.50, mid:4.00, hi:6.50,   cat:'tiling',    note:'含碎料清除' },
];

let _priceCatFilter = 'all';

function renderPriceLibrary(search) {
  search = search || '';
  const tbody = document.getElementById('price-table-body');
  if (!tbody) return;
  const CAT_LABELS = { masonry:'🧱 泥水', carpentry:'🪵 木工', mne:'⚡ 水电', painting:'🎨 油漆', tiling:'🔲 地砖' };
  const CAT_COLORS = { masonry:'#fb923c', carpentry:'#a78bfa', mne:'#fbbf24', painting:'#60a5fa', tiling:'#4ade80' };
  const items = PRICE_LIBRARY.filter(r =>
    (_priceCatFilter === 'all' || r.cat === _priceCatFilter) &&
    (!search || r.name.toLowerCase().includes(search.toLowerCase()))
  );
  tbody.innerHTML = items.map(r => {
    const color = CAT_COLORS[r.cat] || '#94a3b8';
    return `<tr>
      <td style="font-weight:600;color:var(--text);">${r.name}</td>
      <td style="color:var(--text3);">${r.unit}</td>
      <td style="color:var(--green);font-weight:700;">RM ${r.lo.toLocaleString()}</td>
      <td style="color:var(--gold-dk,#C89B09);font-weight:700;">RM ${r.mid.toLocaleString()}</td>
      <td style="color:var(--red);font-weight:700;">RM ${r.hi.toLocaleString()}</td>
      <td><span class="price-cat-badge" style="background:${color}18;color:${color};">${CAT_LABELS[r.cat]||r.cat}</span></td>
      <td style="color:var(--text3);font-size:11px;">${r.note}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text3);">无匹配项目</td></tr>';
}

function setPriceCat(cat, btn) {
  _priceCatFilter = cat;
  document.querySelectorAll('#price-cat-filter .photo-filter-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderPriceLibrary(document.getElementById('price-search')?.value||'');
}

function filterPriceTable() {
  renderPriceLibrary(document.getElementById('price-search')?.value||'');
}

// (showPanel extended in original function above)

// ══════════════════════════════════════════════════════
//  ROLE SELECTION + SINGLE APP ENTRY
// ══════════════════════════════════════════════════════
function selectRoleAndEnter(role) {
  const overlay = document.getElementById('role-select-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity .3s';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }
  switchPortal(role);
}

// Show role select overlay (from portal bar "切换身份" or logo click)
function showRoleSelect() {
  const overlay = document.getElementById('role-select-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.opacity = '1'; overlay.style.transition = 'opacity .25s'; }, 10);
  }
}

// ══════════════════════════════════════════════════════
//  PRICE LIBRARY — Pro gate + AI learning
// ══════════════════════════════════════════════════════
function checkPriceLibAccess() {
  const isPro = PRICING_STATE.plan === 'pro' || PRICING_STATE.plan === 'elite';
  const gate    = document.getElementById('price-lib-gate');
  const content = document.getElementById('price-lib-content');
  if (!gate || !content) return;
  gate.style.display    = isPro ? 'none'  : 'block';
  content.style.display = isPro ? 'block' : 'none';

  if (isPro) {
    // Show AI learning bar if quotations have been uploaded
    const learningBar = document.getElementById('price-ai-learning-bar');
    const learnCount  = document.getElementById('price-learning-count');
    const uploadCount = PRICING_STATE.quotaUploadsThisMonth || 0;
    if (learningBar && uploadCount > 0) {
      learningBar.style.display = 'flex';
      if (learnCount) learnCount.textContent =
        `已分析 ${uploadCount} 份报价单 · 价格库已根据本地市场数据更新`;
    }
    renderPriceLibrary();
  }
}

// Call checkPriceLibAccess when price library panel opens
// (handled inside showPanel)

// ══════════════════════════════════════════════════════
//  WORKER ASSIGN — task-to-trade map + search + filter
// ══════════════════════════════════════════════════════
const TASK_TRADE_MAP = {
  'survey':        ['泥水工','木工','电工'],   // 现场勘查 — any
  'demolition':    ['泥水工'],
  'mne':           ['电工','水电工'],
  'masonry':       ['泥水工'],
  'waterproofing': ['泥水工'],
  'ceiling':       ['木工'],
  'tiling':        ['地砖工'],
  'carpentry':     ['木工'],
  'painting':      ['油漆工'],
  'flooring':      ['木工','地砖工'],
  'sanitary':      ['泥水工','电工'],
  'touchup':       ['油漆工','木工'],
  'handover':      ['泥水工','木工','电工','地砖工','油漆工'],
};

let _assignTradeFilter = 'all';
let _assignSearchQuery = '';

function openAssignWorkerModal(taskKey) {
  const proj = PROJECTS_DB.find(p => p.id === activeProjectId);
  if (!proj) { showToast('⚠️','请先保存项目再分配工人'); return; }
  _assigningTaskKey    = taskKey;
  _assigningProjectId  = proj.id;
  _assignTradeFilter   = 'all';
  _assignSearchQuery   = '';

  // Reset search input and trade chips
  const searchEl = document.getElementById('assign-search-input');
  if (searchEl) searchEl.value = '';
  document.querySelectorAll('.assign-trade-chip').forEach(c => c.classList.remove('on'));
  const allChip = document.querySelector('.assign-trade-chip');
  if (allChip) allChip.classList.add('on');

  // Find task info
  const task     = projEditScheduleItems.find(t => (t.id||t.name) === taskKey);
  const taskName = task ? (task.name || (task.names && task.names.zh) || taskKey) : taskKey;
  const calStart = task ? fmtDate(addWorkDays(projEditStartDate, task.offsetDays)) : '';
  const calEnd   = task ? fmtDate(addWorkDays(addWorkDays(projEditStartDate, task.offsetDays), task.workDays)) : '';

  const infoEl = document.getElementById('assign-task-info');
  if (infoEl) infoEl.innerHTML = `<strong style="color:var(--text);">${taskName}</strong><br>
    <span>${calStart} → ${calEnd} · ${task ? task.workDays : '–'} 工作日</span>`;

  // Determine recommended trades for this task
  const cleanKey   = taskKey.toLowerCase();
  const matchKey   = Object.keys(TASK_TRADE_MAP).find(k => cleanKey.includes(k) || k.includes(cleanKey)) || 'handover';
  window._currentTaskRecommendedTrades = TASK_TRADE_MAP[matchKey] || [];

  renderAssignWorkerList(proj.taskAssignments[taskKey] || []);
  openModal('modal-assign-worker');
}

function renderAssignWorkerList(currentAssigned) {
  const grid     = document.getElementById('worker-select-grid');
  const recSection = document.getElementById('assign-recommended-section');
  if (!grid) return;

  const search = _assignSearchQuery.toLowerCase();
  const recTrades = window._currentTaskRecommendedTrades || [];

  // Filter workers
  const filtered = workerData.filter(w => {
    const matchSearch = !search ||
      w.name.toLowerCase().includes(search) ||
      w.phone.toLowerCase().includes(search);
    const matchTrade  = _assignTradeFilter === 'all' ||
      w.trade === _assignTradeFilter ||
      w.trade.includes(_assignTradeFilter);
    return matchSearch && matchTrade;
  });

  // Split into recommended vs others
  const recommended = filtered.filter(w => recTrades.some(t => w.trade.includes(t) || t.includes(w.trade)));
  const others      = filtered.filter(w => !recommended.find(r => r.id === w.id));

  function workerCard(w) {
    const isChecked = currentAssigned.includes(w.id);
    const ratingColor = w.rating >= 4.8 ? 'var(--green)' : w.rating >= 4.5 ? 'var(--gold-dk,#C89B09)' : 'var(--text3)';
    return `<div class="worker-select-item ${isChecked ? 'checked' : ''}" onclick="toggleWorkerSelect(this,'${w.id}')" data-worker-id="${w.id}">
      <div class="ws-check">${isChecked ? '✓' : ''}</div>
      <div class="ws-avatar" style="background:${w.color}18;color:${w.color};">${w.initials}</div>
      <div class="ws-info">
        <div class="ws-name">${w.name}</div>
        <div class="ws-trade">${w.trade} · <span style="color:${ratingColor}">⭐ ${w.rating}</span></div>
        <div style="font-size:10px;color:var(--text3);">${w.phone}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;font-weight:700;color:${w.completion>=95?'var(--green)':w.completion>=85?'var(--gold-dk,#C89B09)':'var(--orange)'};">${w.completion}%</div>
        <div style="font-size:9px;color:var(--text3);">完成率</div>
      </div>
    </div>`;
  }

  // Recommended section
  if (recSection) {
    if (recommended.length && _assignTradeFilter === 'all' && !search) {
      recSection.innerHTML = `<div class="assign-rec-label">⭐ 推荐工种</div>` +
        recommended.map(w => workerCard(w)).join('');
    } else {
      recSection.innerHTML = '';
    }
  }

  // Show "others" (or all if no rec section separation needed)
  const showInGrid = (recommended.length && _assignTradeFilter === 'all' && !search) ? others : filtered;

  if (showInGrid.length === 0 && (recommended.length === 0 || search || _assignTradeFilter !== 'all')) {
    grid.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;">没有符合条件的工人</div>';
  } else if (showInGrid.length) {
    grid.innerHTML = (recommended.length && _assignTradeFilter==='all' && !search ?
      `<div class="assign-rec-label" style="margin-top:8px;">其他工人</div>` : '') +
      showInGrid.map(w => workerCard(w)).join('');
  } else {
    grid.innerHTML = '';
  }
}

function filterAssignWorkers() {
  const input = document.getElementById('assign-search-input');
  _assignSearchQuery = input ? input.value.trim() : '';
  const proj = PROJECTS_DB.find(p => p.id === _assigningProjectId);
  renderAssignWorkerList(proj?.taskAssignments[_assigningTaskKey] || []);
}

function setAssignTrade(trade, btn) {
  _assignTradeFilter = trade;
  document.querySelectorAll('.assign-trade-chip').forEach(c => c.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const proj = PROJECTS_DB.find(p => p.id === _assigningProjectId);
  renderAssignWorkerList(proj?.taskAssignments[_assigningTaskKey] || []);
}

// ══════════════════════════════════════════════════════
//  WORKER RATING SYSTEM (Q3 answer implemented)
// ══════════════════════════════════════════════════════
// Ratings come from: 设计师评分 (weight 0.7) + 业主评分 (weight 0.3)
// Completion rate: auto-calculated (tasks marked done / total assigned)
const WORKER_RATINGS_DB = {}; // workerId → [{projectId, designerRating, ownerRating, date}]

function rateWorker(workerId, designerRating, ownerRating) {
  if (!WORKER_RATINGS_DB[workerId]) WORKER_RATINGS_DB[workerId] = [];
  WORKER_RATINGS_DB[workerId].push({ designerRating, ownerRating, date: new Date().toISOString() });
  // Recalculate weighted average
  const entries = WORKER_RATINGS_DB[workerId];
  const avgRating = entries.reduce((sum, e) => {
    const r = (e.designerRating || 0) * 0.7 + (e.ownerRating || e.designerRating || 0) * 0.3;
    return sum + r;
  }, 0) / entries.length;
  const worker = workerData.find(w => w.id === workerId);
  if (worker) worker.rating = Math.round(avgRating * 10) / 10;
}

// ══════════════════════════════════════════════════════
//  DASHBOARD PANEL — 我的后台
// ══════════════════════════════════════════════════════
function renderDashboard() {
  const projects = PROJECTS_DB;
  const totalProjects  = projects.length;
  const activeProjects = projects.filter(p => p.published).length;
  const draftProjects  = projects.filter(p => !p.published).length;

  // Calculate totals from projects
  let totalContractAmt = 0;
  let totalPaid = 0;
  projects.forEach(p => {
    totalContractAmt += parseFloat(p.contractAmount || 0);
    // Mock: 50% paid for published projects
    if (p.published) totalPaid += parseFloat(p.contractAmount || 0) * 0.5;
  });

  // AI usage
  const aiUsed  = getPricingUsed();
  const aiTotal = getPricingTotal();
  const aiPct   = aiTotal === Infinity ? 60 : Math.round(aiUsed / aiTotal * 100);

  // Quotation items breakdown (from lastAnalysisResult)
  const lr = lastAnalysisResult;
  const itemBreakdown = lr ? buildItemBreakdown(lr) : null;

  const el = document.getElementById('dashboard-content');
  if (!el) return;

  el.innerHTML = `
    <!-- KPI row -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
      ${kpiCard('📁','项目总数', totalProjects + ' 个', totalProjects?'var(--blue)':'var(--text3)')}
      ${kpiCard('🚀','进行中', activeProjects + ' 个', 'var(--green)')}
      ${kpiCard('📝','草稿', draftProjects + ' 个', 'var(--text3)')}
      ${kpiCard('💰','合同总额', totalContractAmt ? 'RM '+totalContractAmt.toLocaleString() : '—', 'var(--gold-dk,#C89B09)')}
      ${kpiCard('✅','已收款估计', totalPaid ? 'RM '+Math.round(totalPaid).toLocaleString() : '—', 'var(--teal)')}
      ${kpiCard('🤖','AI 分析', aiUsed + (aiTotal===Infinity?'' : '/'+aiTotal) + ' 次', 'var(--blue)')}
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <!-- AI Usage donut -->
      <div class="ai-review-card" style="padding:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:12px;">🤖 AI 额度使用</div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="position:relative;width:72px;height:72px;flex-shrink:0;">
            <svg viewBox="0 0 36 36" style="width:72px;height:72px;transform:rotate(-90deg)">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border2)" stroke-width="3.5"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--gold)" stroke-width="3.5"
                stroke-dasharray="${Math.min(aiPct,100) * 0.879} 87.9" stroke-linecap="round"/>
            </svg>
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--text);">${aiPct}%</div>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800;color:var(--text);">${aiUsed}<span style="font-size:12px;font-weight:400;color:var(--text3);">/${aiTotal===Infinity?'∞':aiTotal}</span></div>
            <div style="font-size:11px;color:var(--text3);">次已使用</div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">方案：<span style="font-weight:700;color:var(--text);">${PRICING_STATE.plan==='free'?'免费版':PRICING_STATE.plan==='pro'?'Pro 专业版':'Elite 无限版'}</span></div>
          </div>
        </div>
        <button class="btn btn-gold" style="width:100%;margin-top:12px;padding:8px;" onclick="switchPortal('pricing')">查看升级方案</button>
      </div>

      <!-- Payment tracking -->
      <div class="ai-review-card" style="padding:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:12px;">💳 付款概览</div>
        ${totalContractAmt > 0 ? `
          <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text3);margin-bottom:4px;">
              <span>已收款</span><span style="color:var(--teal);font-weight:700;">RM ${Math.round(totalPaid).toLocaleString()}</span>
            </div>
            <div style="background:var(--surface3);border-radius:4px;height:8px;overflow:hidden;">
              <div style="height:100%;background:var(--teal);border-radius:4px;width:${totalContractAmt?Math.round(totalPaid/totalContractAmt*100):0}%;transition:width .5s;"></div>
            </div>
          </div>
          <div style="font-size:20px;font-weight:800;color:var(--text);">RM ${Math.round(totalPaid).toLocaleString()}</div>
          <div style="font-size:11px;color:var(--text3);">/ RM ${totalContractAmt.toLocaleString()} 合同总额</div>
        ` : `<div style="padding:20px 0;text-align:center;color:var(--text3);font-size:12px;">保存项目后显示付款数据</div>`}
      </div>
    </div>

    <!-- Projects table -->
    <div class="ai-review-card" style="padding:0;overflow:hidden;margin-bottom:16px;">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border2);font-size:12px;font-weight:700;color:var(--text);">📁 所有项目</div>
      ${projects.length === 0 ?
        '<div style="padding:24px;text-align:center;color:var(--text3);font-size:12px;">暂无项目 · 上传报价单后保存为项目</div>' :
        `<table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="background:var(--surface2);">
            <th style="padding:8px 14px;text-align:left;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;">项目</th>
            <th style="padding:8px 14px;text-align:left;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;">业主</th>
            <th style="padding:8px 14px;text-align:right;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;">合同额</th>
            <th style="padding:8px 14px;text-align:center;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;">状态</th>
            <th style="padding:8px 14px;text-align:center;font-size:10px;color:var(--text3);font-weight:700;letter-spacing:1px;text-transform:uppercase;"></th>
          </tr></thead>
          <tbody>
            ${projects.map(p=>`<tr style="border-bottom:1px solid var(--border2);">
              <td style="padding:10px 14px;font-weight:600;color:var(--text);">${p.projectName||'—'}</td>
              <td style="padding:10px 14px;color:var(--text2);">${p.ownerName||'—'}</td>
              <td style="padding:10px 14px;text-align:right;font-weight:700;color:var(--gold-dk,#C89B09);">${p.contractAmount?'RM '+parseFloat(p.contractAmount).toLocaleString():'—'}</td>
              <td style="padding:10px 14px;text-align:center;">
                <span style="padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${p.published?'rgba(22,163,74,.1)':'rgba(100,116,139,.1)'};color:${p.published?'var(--green)':'var(--text3)'};">${p.published?'进行中':'草稿'}</span>
              </td>
              <td style="padding:10px 14px;text-align:center;">
                <button onclick="openProject('${p.id}');showPanel('project')" style="padding:3px 10px;font-size:10px;border:1px solid var(--border2);border-radius:6px;background:transparent;cursor:pointer;color:var(--text2);font-family:'DM Sans',sans-serif;">查看</button>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>`
      }
    </div>

    <!-- Worker performance -->
    <div class="ai-review-card" style="padding:0;overflow:hidden;">
      <div style="padding:14px 16px;border-bottom:1px solid var(--border2);font-size:12px;font-weight:700;color:var(--text);">👷 工人绩效</div>
      <div style="padding:12px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">
          ${workerData.map(w=>`
            <div style="padding:12px;border:1px solid var(--border2);border-radius:10px;background:var(--surface);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                <div style="width:32px;height:32px;border-radius:50%;background:${w.color}18;color:${w.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${w.initials}</div>
                <div>
                  <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.2;">${w.name.split(' ')[0]}</div>
                  <div style="font-size:10px;color:var(--text3);">${w.trade}</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;">
                <div style="text-align:center;">
                  <div style="font-size:16px;font-weight:800;color:var(--gold-dk,#C89B09);">${w.rating}</div>
                  <div style="font-size:9px;color:var(--text3);">评分</div>
                </div>
                <div style="text-align:center;">
                  <div style="font-size:16px;font-weight:800;color:${w.completion>=95?'var(--green)':w.completion>=85?'var(--gold-dk,#C89B09)':'var(--orange)'};">${w.completion}%</div>
                  <div style="font-size:9px;color:var(--text3);">完成率</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:10px;font-size:10px;color:var(--text3);">
          ⭐ 评分来源：设计师评分（权重70%）+ 业主评分（权重30%）· 完成率：系统按任务打卡记录自动计算
        </div>
      </div>
    </div>

    <!-- Quotation breakdown (if data available) -->
    ${itemBreakdown ? `
    <div class="ai-review-card" style="padding:16px;margin-top:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:12px;">📊 最新报价单工种分布</div>
      ${itemBreakdown}
    </div>` : ''}
  `;
}

function kpiCard(icon, label, value, color) {
  return `<div style="padding:14px 16px;background:var(--surface);border:1px solid var(--border2);border-radius:12px;">
    <div style="font-size:16px;margin-bottom:6px;">${icon}</div>
    <div style="font-size:20px;font-weight:800;color:${color};line-height:1.1;">${value}</div>
    <div style="font-size:10px;color:var(--text3);margin-top:3px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">${label}</div>
  </div>`;
}

function buildItemBreakdown(lr) {
  if (!lr || !lr.sections) return null;
  const cats = {};
  (lr.sections || []).forEach(sec => {
    (sec.items || []).forEach(item => {
      const cat = item.category || sec.name || '其他';
      if (!cats[cat]) cats[cat] = 0;
      cats[cat] += parseFloat(item.subtotal || item.total || 0);
    });
  });
  const total = Object.values(cats).reduce((a,b)=>a+b, 0);
  if (!total) return null;
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const colors = ['#3b82f6','#f59e0b','#10b981','#ec4899','#f97316','#6366f1'];
  return sorted.map(([cat, amt], i) => {
    const pct = Math.round(amt / total * 100);
    return `<div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
        <span style="color:var(--text2);">${cat}</span>
        <span style="font-weight:700;color:${colors[i%colors.length]};">RM ${Math.round(amt).toLocaleString()} · ${pct}%</span>
      </div>
      <div style="background:var(--surface3);border-radius:4px;height:6px;overflow:hidden;">
        <div style="height:100%;background:${colors[i%colors.length]};border-radius:4px;width:${pct}%;"></div>
      </div>
    </div>`;
  }).join('');
}





// ── Initially show ROLE SELECT overlay (first entry point) ──────
document.addEventListener('DOMContentLoaded', () => {
  // Role select is visible by default (not hidden in HTML)
  // Auth overlays shown after role is picked (via switchPortal → auth gate)
  // If already logged in, skip to portal
  if (AUTH_STATE.designer || AUTH_STATE.owner || AUTH_STATE.worker) {
    const overlay = document.getElementById('role-select-overlay');
    if (overlay) overlay.style.display = 'none';
  }
});

// ══════════════════════════════════════════════════════════════
//  PROJECT MANAGEMENT ENGINE
// ══════════════════════════════════════════════════════════════

// ── Data stores ────────────────────────────────────────────────
const PROJECTS_DB = [];        // all saved projects
const ASSIGNED_WORK_DB = {};   // workerId → [{projectId, tasks, ...}]
let activeProjectId = null;    // currently open project

// ── Project gantt edit state ────────────────────────────────────
let projEditScheduleItems = [];  // working copy for project panel gantt
let projEditStartDate = null;
let projEditDirty = false;       // modified but not published
let _projGanttDrag = null;
let _projGanttTotalW = 84;

// ── Render sidebar project list ─────────────────────────────────
function renderProjectsSidebar() {
  const el = document.getElementById('projects-sidebar-list');
  if (!el) return;

  if (!PROJECTS_DB.length) {
    el.innerHTML = `<div style="padding:8px 14px;font-size:11px;color:var(--text3);font-style:italic;">
      尚无已保存项目 · 排完进度后点击「保存为项目」
    </div>`;
    return;
  }

  let html = PROJECTS_DB.map(proj => {
    const isActive = proj.id === activeProjectId;
    const hasAssign = Object.keys(proj.taskAssignments || {}).some(k => (proj.taskAssignments[k]||[]).length);
    const badgeClass = proj.published ? 'badge-active' : (hasAssign ? 'badge-draft' : 'badge-draft');
    const badgeText  = proj.published ? '进行中' : (hasAssign ? '待发布' : '草稿');
    return `<div class="sidebar-proj-item ${isActive ? 'active' : ''}" onclick="openProject('${proj.id}')">
      <span style="font-size:14px;">${proj.icon || '🏠'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${proj.name}</span>
      <span class="sidebar-proj-badge ${badgeClass}">${badgeText}</span>
    </div>`;
  }).join('');

  html += `<div class="sidebar-proj-item" onclick="openSaveProjectModal()" style="color:var(--text3);border:1.5px dashed var(--border2);margin-top:4px;">
    <span style="font-size:14px;">+</span>
    <span>新建项目</span>
  </div>`;

  el.innerHTML = html;
}

// ── Open save project modal ─────────────────────────────────────
function openSaveProjectModal() {
  const c = window.lastExtractedClient || window.projectClientData || {};

  // Auto-fill from extracted client
  const nameInput = document.getElementById('sp-name');
  if (nameInput) {
    // Build project name from address or company
    const autoName = c.address
      ? c.address.split(',')[0].trim()
      : (c.company || 'My Project');
    nameInput.value = autoName;
  }
  const fill = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  fill('sp-attention', c.attention);
  fill('sp-tel',       c.tel);
  fill('sp-address',   c.address);
  fill('sp-ref',       c.projectRef);

  openModal('modal-save-project');
}

// ── Confirm save project ────────────────────────────────────────
function confirmSaveProject() {
  const name = (document.getElementById('sp-name')?.value || '').trim();
  if (!name) { showToast('⚠️', '请填写项目名称'); return; }

  const client = {
    attention: document.getElementById('sp-attention')?.value || '',
    tel:       document.getElementById('sp-tel')?.value || '',
    address:   document.getElementById('sp-address')?.value || '',
    projectRef:document.getElementById('sp-ref')?.value || '',
    contractAmt: parseFloat(document.getElementById('sp-contract')?.value) || 0,
  };

  const proj = {
    id: 'proj_' + Date.now(),
    name,
    icon: '🏠',
    status: 'active',
    client,
    scheduleItems: scheduleItems.map(t => ({...t})),  // snapshot
    startDate: new Date(projectStartDate),
    workOnSaturday,
    workOnSunday,
    taskAssignments: {},   // taskKey → [workerId]
    published: false,
    publishedAt: null,
    savedAt: new Date(),
  };

  PROJECTS_DB.push(proj);
  closeModal('modal-save-project');
  renderProjectsSidebar();
  showToast('✅', `「${name}」已保存到项目列表`);

  // Open the project immediately
  openProject(proj.id);
}

// ── Open a project in panel-project ────────────────────────────
function openProject(projId) {
  const proj = PROJECTS_DB.find(p => p.id === projId);
  if (!proj) return;

  activeProjectId = projId;

  // Update panel-project header
  const titleEl = document.querySelector('#panel-project .panel-title');
  const subEl   = document.querySelector('#panel-project .panel-sub');
  if (titleEl) titleEl.textContent = proj.name;
  if (subEl)   subEl.textContent   = `${proj.client.address || ''} · ${proj.client.projectRef || ''} · 合约 RM ${(proj.client.contractAmt||0).toLocaleString()}`;

  // Update export/send buttons
  const sendBtn = document.querySelector('#panel-project .btn-gold');
  if (sendBtn) sendBtn.onclick = () => showToast('📱', `已发送给业主 ${proj.client.attention || ''}`);

  // Load schedule into edit state
  projEditScheduleItems = proj.scheduleItems.map(t => ({...t}));
  projEditStartDate = new Date(proj.startDate);
  projEditDirty = false;

  // Update header button state
  const title = document.getElementById('proj-gantt-title');
  if (title) title.textContent = proj.name + ' · 施工进度';

  // Populate client fields
  window.projectClientData = proj.client;

  // Show panel and switch to gantt tab
  showPanel('project');

  // Switch to gantt tab
  const ganttBtn = document.getElementById('proj-tab-btn-gantt');
  if (ganttBtn) switchProjTab('gantt', ganttBtn);

  // Sidebar highlight
  renderProjectsSidebar();
}

// ── Updated switchProjTab (now includes gantt) ──────────────────
function switchProjTab(name, btn) {
  document.querySelectorAll('.proj-tab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  document.getElementById('proj-tab-gantt').style.display    = name === 'gantt'    ? '' : 'none';
  document.getElementById('proj-tab-payment').style.display  = name === 'payment'  ? '' : 'none';
  document.getElementById('proj-tab-photos').style.display   = name === 'photos'   ? '' : 'none';
  document.getElementById('proj-tab-client').style.display   = name === 'client'   ? '' : 'none';
  if (name === 'photos')  renderPhotos();
  if (name === 'client') {
    const c = window.projectClientData || window.lastExtractedClient || {};
    const fill = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    fill('cf-company',   c.company   || c.attention);
    fill('cf-attention', c.attention);
    fill('cf-tel',       c.tel);
    fill('cf-email',     c.email);
    fill('cf-address',   c.address);
    fill('cf-ref',       c.projectRef);
  }
  if (name === 'gantt') {
    renderProjectPanelGantt();
  }
}

// ══════════════════════════════════════════════════════════════
//  PROJECT PANEL GANTT — render + drag
// ══════════════════════════════════════════════════════════════

function renderProjectPanelGantt() {
  const proj = PROJECTS_DB.find(p => p.id === activeProjectId);

  // If no project open yet, show placeholder
  const chartEl = document.getElementById('proj-gantt-chart');
  const hdrEl   = document.getElementById('proj-gantt-cal-header');
  if (!chartEl || !hdrEl) return;

  if (!proj) {
    chartEl.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text3);font-size:13px;">
      请先从侧边栏选择一个项目，或将当前进度表保存为项目
    </div>`;
    hdrEl.innerHTML = '';
    return;
  }

  // Use projEditScheduleItems (working copy)
  const items = projEditScheduleItems;
  const startDate = projEditStartDate;

  // Compute schedule using stored items
  // Build week array
  const lastEnd = (() => {
    let maxEnd = addDays(startDate, 90);
    items.forEach(t => {
      const s = addWorkDays(startDate, t.offsetDays);
      const e = addWorkDays(s, t.workDays);
      if (e > maxEnd) maxEnd = e;
    });
    return maxEnd;
  })();

  const totalCalDays = diffDays(startDate, lastEnd) + 8;
  const numWeeks = Math.max(6, Math.ceil(totalCalDays / 7) + 1);
  const weeks = [];
  for (let w = 0; w < numWeeks; w++) {
    const mon = addDays(startDate, w * 7);
    let workCount = 0;
    for (let i = 0; i < 7; i++) { if (isWorkingDay(addDays(mon, i))) workCount++; }
    weeks.push({ mon, workCount });
  }
  const totalW = numWeeks * 7;
  _projGanttTotalW = totalW;

  // ── Calendar header ──────────────────────────────────────────
  hdrEl.innerHTML = weeks.map((wk, i) => `
    <div class="proj-gantt-col-week">
      <div class="proj-gantt-week-date">${fmtDate(wk.mon)}</div>
      <div class="proj-gantt-week-label">W${i+1}</div>
      <div class="proj-gantt-week-days" style="color:${wk.workCount<5?'var(--orange)':'var(--text3)'};">${wk.workCount}天</div>
    </div>`).join('');

  // ── Gantt rows ───────────────────────────────────────────────
  const todayOff = diffDays(startDate, TODAY_DATE);
  const todayPct = (todayOff >= 0 && todayOff < totalW) ? (todayOff / totalW * 100) : -1;

  chartEl.innerHTML = '';
  items.forEach(task => {
    const taskKey  = task.id || task.name;
    const sOff     = task.offsetDays;
    const calStart = addWorkDays(startDate, sOff);
    const calEnd   = addWorkDays(calStart, task.workDays);
    const span     = diffDays(calStart, calEnd) + 1;
    const lPct     = (diffDays(startDate, calStart) / totalW * 100).toFixed(2);
    const wPct     = Math.max(1, (span / totalW * 100)).toFixed(2);
    const isPast   = calEnd < TODAY_DATE;
    const isActive = calStart <= TODAY_DATE && calEnd >= TODAY_DATE;

    // Worker chips for this task
    const assignedIds = (proj.taskAssignments[taskKey] || []);
    const workerChips = assignedIds.map(wid => {
      const w = workerData.find(x => x.id === wid);
      if (!w) return '';
      return `<span class="worker-chip" style="background:${w.color}18;color:${w.color};border:1px solid ${w.color}33;">${w.initials}</span>`;
    }).join('');
    const assignedCount = assignedIds.length;

    const row = document.createElement('div');
    row.className = 'proj-gantt-row';
    row.innerHTML = `
      <div class="proj-gantt-label" onclick="showProjectTaskDetail('${taskKey}')">
        <div>${task.name || (task.names && task.names.zh) || ''}</div>
        <div class="date-sub">${fmtDate(calStart)}–${fmtDate(calEnd)} · ${task.workDays}天</div>
      </div>
      <div class="proj-gantt-track">
        <div class="proj-gantt-bar"
          data-task-key="${taskKey}"
          style="left:${lPct}%;width:${wPct}%;background:${task.color};opacity:${isPast?0.45:isActive?1:0.7};"
          onmousedown="window._projBarDragStartX=event.clientX">
          <span class="proj-gantt-bar-label">${span>=totalW*0.08 ? (task.name||'').substring(0,6) : ''}</span>
          <div class="proj-gantt-resize" data-resize="1"></div>
        </div>
        ${todayPct>=0 ? `<div class="proj-gantt-today-line" style="left:${todayPct}%"></div>` : ''}
      </div>
      <div class="proj-gantt-workers">
        ${workerChips}
        <button class="assign-btn" onclick="openAssignWorkerModal('${taskKey}')">${assignedCount ? '✏' : '+ 分配'}</button>
      </div>`;
    chartEl.appendChild(row);
  });

  // ── Drag init ────────────────────────────────────────────────
  setTimeout(initProjectGanttDrag, 0);

  // ── Dirty banner ────────────────────────────────────────────
  const banner = document.getElementById('proj-dirty-banner');
  if (banner) banner.style.display = projEditDirty ? 'flex' : 'none';

  // ── Assignment summary ───────────────────────────────────────
  updateAssignmentSummary(proj);

  // ── Date range ──────────────────────────────────────────────
  const drEl = document.getElementById('proj-gantt-daterange');
  if (drEl) drEl.textContent = `${fmtDate(addWorkDays(startDate, 0))} – ${fmtDate(lastEnd)}`;
}

// ── Project gantt drag ──────────────────────────────────────────
function initProjectGanttDrag() {
  const chartEl = document.getElementById('proj-gantt-chart');
  if (!chartEl || chartEl.dataset.projDragInited) return;
  chartEl.dataset.projDragInited = '1';

  chartEl.addEventListener('mousedown', function(e) {
    const bar = e.target.closest('.proj-gantt-bar');
    if (!bar) return;
    const isResize = e.target.dataset.resize === '1';
    const taskKey  = bar.dataset.taskKey;
    const task     = projEditScheduleItems.find(t => (t.id||t.name) === taskKey);
    if (!task) return;
    e.preventDefault();
    const track = bar.closest('.proj-gantt-track');
    const trackRect = track.getBoundingClientRect();
    const calStart = addWorkDays(projEditStartDate, task.offsetDays);
    _projGanttDrag = {
      bar, taskKey, isResize,
      startX: e.clientX,
      trackWidth: trackRect.width,
      origWorkDays: task.workDays,
      origOffsetDays: task.offsetDays,
      origCalStart: new Date(calStart),
    };
    bar.classList.add('dragging');
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', function(e) {
    if (!_projGanttDrag) return;
    const { bar, startX, trackWidth, isResize } = _projGanttDrag;
    const deltaX = e.clientX - startX;
    bar.style.transition = 'none';
    if (isResize) {
      const origW = parseFloat(bar.style.width) || 5;
      bar.style.width = Math.max(10, origW / 100 * trackWidth + deltaX) + 'px';
    } else {
      bar.style.transform = `translateX(${deltaX}px)`;
    }
  });

  document.addEventListener('mouseup', function(e) {
    if (!_projGanttDrag) return;
    const { bar, taskKey, isResize, startX, trackWidth, origWorkDays, origOffsetDays, origCalStart } = _projGanttDrag;
    const task = projEditScheduleItems.find(t => (t.id||t.name) === taskKey);
    if (task) {
      const deltaX = e.clientX - startX;
      const daysPerPx = _projGanttTotalW / trackWidth;
      const calDayDelta = Math.round(deltaX * daysPerPx);
      if (isResize) {
        const newEndCal = addDays(addWorkDays(origCalStart, origWorkDays), calDayDelta);
        task.workDays = Math.max(1, countWorkDaysBetween(origCalStart, newEndCal));
      } else {
        const newCalStart = addDays(origCalStart, calDayDelta);
        task.offsetDays = Math.max(0, countWorkDaysBetween(projEditStartDate, newCalStart));
      }
      projEditDirty = true;
    }
    bar.style.transform = '';
    bar.style.width = '';
    bar.style.transition = '';
    bar.classList.remove('dragging');
    document.body.style.userSelect = '';
    _projGanttDrag = null;

    // Re-render and show dirty banner
    chartEl.dataset.projDragInited = '';  // allow re-init
    renderProjectPanelGantt();

    const banner = document.getElementById('proj-dirty-banner');
    if (banner) banner.style.display = 'flex';
  });
}

// ── Show task detail from project gantt ─────────────────────────
function showProjectTaskDetail(taskKey) {
  // Use the project's schedule items for detail panel
  const origScheduleItems = scheduleItems;
  const origProjectStart  = projectStartDate;
  // Temporarily swap globals so showTaskDetail works
  scheduleItems = projEditScheduleItems;
  projectStartDate = projEditStartDate;
  showTaskDetail(taskKey);
  // Restore (task detail panel will still use the swapped data since it's shown)
  scheduleItems = origScheduleItems;
  projectStartDate = origProjectStart;
}

// ── Update assignment summary card ──────────────────────────────
function updateAssignmentSummary(proj) {
  const el = document.getElementById('proj-assignment-summary');
  if (!el || !proj) return;
  const totalTasks = projEditScheduleItems.length;
  const assignedTasks = Object.values(proj.taskAssignments).filter(v => v&&v.length).length;
  const totalWorkers  = new Set(Object.values(proj.taskAssignments).flat()).size;
  if (assignedTasks === 0) {
    el.innerHTML = `<span style="color:var(--text3);">尚未分配工人 · 点击各工序旁的「+ 分配」选择工人</span>`;
  } else {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
        <div><span style="font-size:18px;font-weight:700;color:var(--text);">${assignedTasks}</span> <span style="font-size:11px;color:var(--text3);">/ ${totalTasks} 个工序已分配</span></div>
        <div><span style="font-size:18px;font-weight:700;color:var(--teal);">${totalWorkers}</span> <span style="font-size:11px;color:var(--text3);">位工人参与</span></div>
        ${assignedTasks === totalTasks ? '<span style="font-size:11px;color:var(--green);font-weight:700;">✓ 全部工序已分配，可以发布</span>' : `<span style="font-size:11px;color:var(--orange);">${totalTasks - assignedTasks} 个工序待分配</span>`}
      </div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  WORKER ASSIGNMENT MODAL
// ══════════════════════════════════════════════════════════════

let _assigningTaskKey = null;
let _assigningProjectId = null;

// openAssignWorkerModal: see enhanced version above

function toggleWorkerSelect(el, workerId) {
  el.classList.toggle('checked');
  const check = el.querySelector('.ws-check');
  if (check) check.textContent = el.classList.contains('checked') ? '✓' : '';
}

function saveWorkerAssignment() {
  const proj = PROJECTS_DB.find(p => p.id === _assigningProjectId);
  if (!proj || !_assigningTaskKey) return;

  // Collect checked workers
  const checked = [...document.querySelectorAll('#worker-select-grid .worker-select-item.checked')]
    .map(el => el.dataset.workerId);

  proj.taskAssignments[_assigningTaskKey] = checked;
  closeModal('modal-assign-worker');

  const taskName = (() => {
    const t = projEditScheduleItems.find(t => (t.id||t.name) === _assigningTaskKey);
    return t ? (t.name || (t.names && t.names.zh) || _assigningTaskKey) : _assigningTaskKey;
  })();

  if (checked.length) {
    const names = checked.map(id => workerData.find(w => w.id === id)?.name.split(' ')[0]).join('、');
    showToast('✅', `「${taskName}」已分配给 ${names}`);
  } else {
    showToast('🔄', `已清除「${taskName}」的工人分配`);
  }

  projEditDirty = true;
  renderProjectPanelGantt();
  renderProjectsSidebar();
}

// ══════════════════════════════════════════════════════════════
//  PUBLISH FLOW
// ══════════════════════════════════════════════════════════════

function openPublishModal() {
  const proj = PROJECTS_DB.find(p => p.id === activeProjectId);
  if (!proj) { showToast('⚠️','请先保存项目'); return; }

  // Project name
  const nameEl = document.getElementById('publish-project-name');
  if (nameEl) nameEl.innerHTML = `正在发布 <strong style="color:var(--text);">${proj.name}</strong> 的进度表给工人`;

  // Build assignment list per worker
  const workerTasks = {};  // workerId → [taskObj]
  projEditScheduleItems.forEach(task => {
    const taskKey = task.id || task.name;
    (proj.taskAssignments[taskKey] || []).forEach(wid => {
      if (!workerTasks[wid]) workerTasks[wid] = [];
      const calStart = addWorkDays(projEditStartDate, task.offsetDays);
      const calEnd   = addWorkDays(calStart, task.workDays);
      workerTasks[wid].push({
        taskKey, taskName: task.name || (task.names && task.names.zh) || taskKey,
        calStart, calEnd, color: task.color, workDays: task.workDays
      });
    });
  });

  const listEl = document.getElementById('publish-assignment-list');
  if (listEl) {
    if (Object.keys(workerTasks).length === 0) {
      listEl.innerHTML = `<div style="padding:14px;text-align:center;color:var(--text3);">尚未分配任何工人 · 发布后工人端不会收到通知</div>`;
    } else {
      listEl.innerHTML = Object.entries(workerTasks).map(([wid, tasks]) => {
        const w = workerData.find(x => x.id === wid);
        if (!w) return '';
        return `<div class="publish-assignment-row">
          <div class="ws-avatar" style="width:36px;height:36px;background:${w.color}18;color:${w.color};flex-shrink:0;">${w.initials}</div>
          <div class="pub-task-info">
            <div class="ws-name">${w.name} · <span style="color:var(--text3);font-size:11px;">${w.trade}</span></div>
            <div class="pub-workers" style="margin-top:6px;">
              ${tasks.map(t => `<span class="worker-chip" style="background:${t.color}18;color:${t.color};border:1px solid ${t.color}33;">
                ${t.taskName.substring(0,8)} · ${fmtDate(t.calStart)}
              </span>`).join('')}
            </div>
          </div>
          <div style="font-size:18px;font-weight:700;color:var(--teal);flex-shrink:0;">${tasks.length}<div style="font-size:9px;color:var(--text3);font-weight:400;text-align:center;">工序</div></div>
        </div>`;
      }).join('');
    }
  }

  // Warning if any tasks unassigned
  const unassigned = projEditScheduleItems.filter(t => {
    const k = t.id||t.name; return !(proj.taskAssignments[k]||[]).length;
  });
  const warnEl = document.getElementById('publish-warning');
  if (warnEl) warnEl.style.display = unassigned.length ? 'block' : 'none';

  openModal('modal-publish');
}

function confirmPublish() {
  const proj = PROJECTS_DB.find(p => p.id === activeProjectId);
  if (!proj) return;

  // Save current edit back to project
  proj.scheduleItems = projEditScheduleItems.map(t => ({...t}));
  proj.published = true;
  proj.publishedAt = new Date();
  projEditDirty = false;

  // Write to ASSIGNED_WORK_DB
  projEditScheduleItems.forEach(task => {
    const taskKey = task.id || task.name;
    const calStart = addWorkDays(projEditStartDate, task.offsetDays);
    const calEnd   = addWorkDays(calStart, task.workDays);
    (proj.taskAssignments[taskKey] || []).forEach(wid => {
      if (!ASSIGNED_WORK_DB[wid]) ASSIGNED_WORK_DB[wid] = [];
      // Remove previous entry for this project+task
      ASSIGNED_WORK_DB[wid] = ASSIGNED_WORK_DB[wid].filter(
        e => !(e.projectId === proj.id && e.taskKey === taskKey)
      );
      ASSIGNED_WORK_DB[wid].push({
        projectId: proj.id,
        projectName: proj.name,
        projectAddress: proj.client.address || '',
        designerName: 'Ahmad Faris',
        taskKey,
        taskName: task.name || (task.names && task.names.zh) || taskKey,
        calStart, calEnd,
        color: task.color,
        workDays: task.workDays,
        subItems: task.subItems,
      });
    });
  });

  closeModal('modal-publish');
  renderProjectPanelGantt();
  renderProjectsSidebar();

  // Refresh worker portal
  renderWorkerPortalFromAssignments();

  const assignedWorkers = new Set(Object.keys(proj.taskAssignments).flatMap(k => proj.taskAssignments[k]||[]));
  const workerNames = [...assignedWorkers].map(id => workerData.find(w=>w.id===id)?.name.split(' ')[0]).filter(Boolean).join('、');
  showToast('📱', `进度已发布！${workerNames || '工人'} 已即时收到通知`);
}

// ══════════════════════════════════════════════════════════════
//  WORKER PORTAL — reads from ASSIGNED_WORK_DB
// ══════════════════════════════════════════════════════════════

// Demo: treat logged-in worker as 'w3' (Kumar Selvam)
const DEMO_WORKER_ID = 'w3';

function renderWorkerPortalFromAssignments() {
  // Called after publish — refresh worker portal data
  const assignments = ASSIGNED_WORK_DB[DEMO_WORKER_ID] || [];

  if (!assignments.length) return; // No assignments, keep old WORKER_SITES demo data

  // Build WORKER_SITES-compatible array from assignments
  const newSites = [];
  // Group by project
  const byProject = {};
  assignments.forEach(a => {
    if (!byProject[a.projectId]) byProject[a.projectId] = [];
    byProject[a.projectId].push(a);
  });

  const SITE_COLORS = ['#4ade80','#fb923c','#a78bfa','#fbbf24','#60a5fa','#f472b6'];
  let colorIdx = 0;

  Object.entries(byProject).forEach(([projId, tasks]) => {
    const color = SITE_COLORS[colorIdx++ % SITE_COLORS.length];
    const proj  = PROJECTS_DB.find(p => p.id === projId);
    const firstTask = tasks[0];
    const dow = [1,2,3,4,5]; // weekdays

    newSites.push({
      id: 'site_' + projId,
      name: firstTask.projectName,
      shortName: firstTask.projectName.split(' ')[0],
      address: firstTask.projectAddress,
      role: workerData.find(w=>w.id===DEMO_WORKER_ID)?.trade || '工人',
      roleEN: 'Worker',
      color: color,
      bgColor: color + '22',
      progress: proj ? Math.round((Object.values(proj.taskAssignments).filter(v=>v&&v.length).length / Math.max(1,proj.scheduleItems.length)) * 100) : 0,
      status: 'active',
      phase: firstTask.taskName,
      designer: firstTask.designerName,
      workDays: dow,
      startOffset: 0,
      tasks: tasks.map(t => ({
        name: t.taskName,
        loc: t.projectAddress || t.projectName,
        done: false,
        time: fmtDate(t.calStart),
        spec: `${t.workDays}工作日 · ${fmtDate(t.calStart)}–${fmtDate(t.calEnd)}`,
        priority: 'mid',
      }))
    });
  });

  // Show "assigned by designer" banner in worker portal
  showWorkerAssignedBanner(assignments.length);

  // Replace WORKER_SITES with new data and re-render
  WORKER_SITES.length = 0;
  newSites.forEach(s => WORKER_SITES.push(s));

  // Reset done state
  WORKER_SITES.forEach(s => {
    wkTaskDoneState[s.id] = {};
    s.tasks.forEach((t, i) => { wkTaskDoneState[s.id][i] = false; });
  });

  renderWorkerCalendar();
  renderWorkerTodayTasks();
}

function showWorkerAssignedBanner(count) {
  // Insert banner in worker tasks tab if not already present
  const tasksEl = document.getElementById('wk-today-task-list');
  if (!tasksEl) return;
  const existing = document.getElementById('wk-assigned-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'wk-assigned-banner';
  banner.className = 'wk-assigned-banner';
  banner.innerHTML = `<div class="wk-ab-title">✅ 设计师已分配 ${count} 项工程给你</div>
    <div class="wk-ab-sub">进度表已更新 · 请查看今日任务</div>`;
  tasksEl.parentNode.insertBefore(banner, tasksEl);
}

renderPayment();
initWorkerPortal();
initScheduleControls();
rebuildGantt();
syncUsageUI();
</script>


<!-- ═══════════════════════════════════════════════════
     MODAL: SAVE PROJECT
═══════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-save-project" onclick="if(event.target===this)closeModal('modal-save-project')">
  <div class="modal-box" style="max-width:480px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div style="font-size:16px;font-weight:700;color:var(--text);">💾 保存为项目</div>
      <button onclick="closeModal('modal-save-project')" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">以下资料从报价单自动带入，可修改后保存</div>

    <label class="client-field-label">项目名称 *</label>
    <input class="client-field-input" id="sp-name" placeholder="例：Taman Desa #A22">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
      <div>
        <label class="client-field-label">业主 / 联系人</label>
        <input class="client-field-input" id="sp-attention" placeholder="例：Dato Catherine">
      </div>
      <div>
        <label class="client-field-label">电话</label>
        <input class="client-field-input" id="sp-tel" placeholder="+6019-710 2676">
      </div>
    </div>

    <label class="client-field-label" style="margin-top:12px;display:block;">施工地址</label>
    <input class="client-field-input" id="sp-address" placeholder="No.22, Jln Desa Utama, KL">

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:4px;">
      <div>
        <label class="client-field-label">报价单编号</label>
        <input class="client-field-input" id="sp-ref" placeholder="Q-2025-041">
      </div>
      <div>
        <label class="client-field-label">合约总额 (RM)</label>
        <input class="client-field-input" id="sp-contract" type="number" placeholder="65000">
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="btn btn-gold" style="flex:1;" onclick="confirmSaveProject()">✅ 保存并加入项目列表</button>
      <button class="btn btn-ghost" onclick="closeModal('modal-save-project')">取消</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     MODAL: ASSIGN WORKER (per gantt task)
═══════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-assign-worker" onclick="if(event.target===this)closeModal('modal-assign-worker')">
  <div class="modal-box" style="max-width:440px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
      <div style="font-size:15px;font-weight:700;color:var(--text);">👷 分配工人</div>
      <button onclick="closeModal('modal-assign-worker')" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div id="assign-task-info" style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:8px 10px;background:var(--surface2);border-radius:8px;"></div>

    <!-- Search bar -->
    <div class="assign-search-row">
      <input class="assign-search-input" id="assign-search-input"
        placeholder="🔍 搜索姓名或电话…" oninput="filterAssignWorkers()">
    </div>

    <!-- Trade filter chips -->
    <div class="assign-trade-filter" id="assign-trade-filter">
      <button class="assign-trade-chip on" onclick="setAssignTrade('all',this)">全部工种</button>
      <button class="assign-trade-chip" onclick="setAssignTrade('泥水工',this)">🧱 泥水工</button>
      <button class="assign-trade-chip" onclick="setAssignTrade('木工',this)">🪵 木工</button>
      <button class="assign-trade-chip" onclick="setAssignTrade('电工',this)">⚡ 电工</button>
      <button class="assign-trade-chip" onclick="setAssignTrade('地砖工',this)">🔲 地砖工</button>
      <button class="assign-trade-chip" onclick="setAssignTrade('油漆工',this)">🎨 油漆工</button>
    </div>

    <div id="assign-recommended-section"></div>
    <div class="worker-select-grid" id="worker-select-grid">
      <!-- rendered by JS -->
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-gold" style="flex:1;" onclick="saveWorkerAssignment()">✅ 确认分配</button>
      <button class="btn btn-ghost" onclick="closeModal('modal-assign-worker')">取消</button>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     MODAL: PUBLISH PROJECT
═══════════════════════════════════════════════════ -->
<div class="modal-overlay" id="modal-publish" onclick="if(event.target===this)closeModal('modal-publish')">
  <div class="modal-box" style="max-width:480px;">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
      <div style="font-size:15px;font-weight:700;color:var(--text);">📤 确认并发布</div>
      <button onclick="closeModal('modal-publish')" style="background:none;border:none;color:var(--text2);font-size:20px;cursor:pointer;">✕</button>
    </div>
    <div id="publish-project-name" style="font-size:12px;color:var(--text3);margin-bottom:16px;">正在发布进度表给已分配工人</div>

    <!-- Assignment summary -->
    <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-bottom:10px;">工人分配概览</div>
    <div id="publish-assignment-list" style="max-height:280px;overflow-y:auto;border:1px solid var(--border2);border-radius:10px;padding:0 12px;">
      <!-- rendered by JS -->
    </div>
    <div id="publish-warning" style="display:none;margin-top:12px;padding:10px 12px;background:rgba(229,57,53,.06);border:1px solid rgba(229,57,53,.2);border-radius:8px;font-size:11px;color:var(--red);">
      ⚠️ 有工序尚未分配工人，发布后这些工序不会推送给任何工人。是否继续？
    </div>

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button class="btn btn-gold" style="flex:1;" id="confirm-publish-btn" onclick="confirmPublish()">
        📱 确认发布 · 工人即时收到通知
      </button>
      <button class="btn btn-ghost" onclick="closeModal('modal-publish')">取消</button>
    </div>
    <div style="text-align:center;font-size:10px;color:var(--text3);margin-top:8px;">
      发布后工人端将即时更新 · 可随时重新调整并再次发布
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════
     AUTH OVERLAYS — Designer / Owner / Worker
═══════════════════════════════════════════════════ -->

<!-- ── DESIGNER AUTH ─────────────────────────────── -->
<div class="auth-overlay" id="auth-designer">
  <div class="auth-card">
    <div class="auth-logo-mark gold">🏗</div>
    <div class="auth-tag auth-tag-designer">🖥 设计师端</div>
    <div class="auth-title">欢迎使用 RenoSmart</div>
    <div class="auth-sub">专为室内设计师打造的 AI 装修管理平台</div>

    <div class="auth-tab-row">
      <button class="auth-tab on" id="auth-d-tab-login" onclick="authSwitchTab('designer','login')">登入</button>
      <button class="auth-tab" id="auth-d-tab-register" onclick="authSwitchTab('designer','register')">注册</button>
    </div>

    <!-- LOGIN STEP 1: Phone -->
    <div class="auth-step on" id="auth-d-login-phone">
      <label class="auth-field-label">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789" id="auth-d-phone">
      </div>
      <button class="auth-btn auth-btn-blue" onclick="authLoginWithPhone('designer')">登入 →</button>
      <div class="auth-divider">或</div>
      <div class="auth-social-row">
        <button class="auth-social-btn" onclick="authDemoLogin('designer')">🔑 Demo 登入（跳过验证）</button>
      </div>
      <div class="auth-footer">还没有账户？<a onclick="authSwitchTab('designer','register')">免费注册</a></div>
    </div>

    <!-- LOGIN STEP 2: OTP -->
    <div class="auth-step" id="auth-d-login-otp">
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">验证码已发送至 WhatsApp<button class="auth-send-btn" onclick="authBackToPhone('designer')">更改号码</button></div>
      <label class="auth-field-label">输入 6 位验证码</label>
      <div class="auth-otp-row">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',0)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',1)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',2)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',3)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',4)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'designer-l',5)">
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:8px;">Demo 验证码：<strong style="color:var(--gold-dk,#C89B09)">888888</strong> <button class="auth-send-btn" onclick="authAutoFillOTP('designer-l')">自动填入</button></div>
      <button class="auth-btn auth-btn-blue" onclick="authVerifyOTP('designer')">登入 →</button>
    </div>

    <!-- REGISTER -->
    <div class="auth-step" id="auth-d-register">
      <label class="auth-field-label">姓名 / 公司名</label>
      <input class="auth-input" type="text" placeholder="Ahmad Faris Design" id="auth-d-name">
      <label class="auth-field-label">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789">
      </div>
      <label class="auth-field-label">选择方案</label>
      <div class="auth-plan-chips">
        <div class="auth-plan-chip selected" onclick="authSelectPlan(this,'free')" data-plan="free">免费版 · RM 0</div>
        <div class="auth-plan-chip" onclick="authSelectPlan(this,'pro')" data-plan="pro">Pro · RM 99/月</div>
        <div class="auth-plan-chip" onclick="authSelectPlan(this,'elite')" data-plan="elite">无限版 · RM 499/月</div>
      </div>
      <button class="auth-btn auth-btn-blue" onclick="authDemoLogin('designer')">注册并获 3 次免费体验 →</button>
      <div class="auth-footer">已有账户？<a onclick="authSwitchTab('designer','login')">立即登入</a></div>
    </div>
  </div>
</div>

<!-- ── OWNER AUTH ───────────────────────────────── -->
<div class="auth-overlay hidden" id="auth-owner">
  <div class="auth-card">
    <div class="auth-logo-mark gold">🏠</div>
    <div class="auth-tag auth-tag-owner">📱 业主端</div>
    <div class="auth-title">查看你的装修进度</div>
    <div class="auth-sub">设计师已邀请你加入 RenoSmart，随时掌握每一个细节</div>

    <div class="auth-tab-row">
      <button class="auth-tab on" id="auth-o-tab-login" onclick="authSwitchTab('owner','login')">登入</button>
      <button class="auth-tab" id="auth-o-tab-register" onclick="authSwitchTab('owner','register')">首次设置</button>
    </div>

    <div class="auth-step on" id="auth-o-login-phone">
      <label class="auth-field-label">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789" id="auth-o-phone">
      </div>
      <button class="auth-btn auth-btn-gold" onclick="authLoginWithPhone('owner')">登入 →</button>
      <div class="auth-divider">或</div>
      <button class="auth-social-btn" style="width:100%" onclick="authDemoLogin('owner')">🔑 Demo 登入（跳过验证）</button>
      <div style="margin-top:16px;padding:12px 14px;background:rgba(240,185,11,.06);border:1px solid rgba(240,185,11,.2);border-radius:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--gold-dk,#C89B09);margin-bottom:3px;">📩 收到邀请链接？</div>
        <div style="font-size:11px;color:var(--text3);">点击设计师发送给你的 WhatsApp 链接，直接跳过登入步骤。</div>
      </div>
    </div>

    <div class="auth-step" id="auth-o-login-otp">
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">验证码已发送<button class="auth-send-btn" onclick="authBackToPhone('owner')">更改</button></div>
      <label class="auth-field-label">输入 6 位验证码</label>
      <div class="auth-otp-row">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',0)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',1)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',2)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',3)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',4)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'owner-l',5)">
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:8px;">Demo 验证码：<strong style="color:var(--gold-dk,#C89B09)">888888</strong> <button class="auth-send-btn" onclick="authAutoFillOTP('owner-l')">自动填入</button></div>
      <button class="auth-btn auth-btn-gold" onclick="authVerifyOTP('owner')">进入我的项目 →</button>
    </div>

    <div class="auth-step" id="auth-o-register">
      <div style="font-size:12px;color:var(--text2);padding:12px;background:var(--surface2);border-radius:10px;margin-bottom:20px;border:1px solid var(--border2);">
        <strong style="color:var(--text);">📩 首次登入？</strong><br>请向你的设计师要求发送邀请链接，或让他们在系统里发送邀请给你的手机号码。
      </div>
      <label class="auth-field-label">你的姓名</label>
      <input class="auth-input" type="text" placeholder="Dato Catherine Lim">
      <label class="auth-field-label">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789">
      </div>
      <button class="auth-btn auth-btn-gold" onclick="authDemoLogin('owner')">继续 →</button>
    </div>
  </div>
</div>

<!-- ── WORKER AUTH ───────────────────────────────── -->
<div class="auth-overlay hidden" id="auth-worker">
  <div class="auth-card">
    <div class="auth-logo-mark teal">👷</div>
    <div class="auth-tag auth-tag-worker">👷 工人端</div>
    <div class="auth-title">工人登入</div>
    <div class="auth-sub">接收任务 · 记录工时 · 上传完工照片</div>

    <div class="auth-tab-row">
      <button class="auth-tab on" id="auth-w-tab-login" onclick="authSwitchTab('worker','login')">登入</button>
      <button class="auth-tab" id="auth-w-tab-register" onclick="authSwitchTab('worker','register')">新工人注册</button>
    </div>

    <div class="auth-step on" id="auth-w-login-phone">
      <label class="auth-field-label">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789" id="auth-w-phone">
      </div>
      <button class="auth-btn auth-btn-teal" onclick="authLoginWithPhone('worker')">登入 →</button>
      <div class="auth-divider">或</div>
      <button class="auth-social-btn" style="width:100%" onclick="authDemoLogin('worker')">🔑 Demo 登入（跳过验证）</button>

      <!-- Today preview hint -->
      <div style="margin-top:16px;padding:12px 14px;background:var(--teal-lt,#E0FAF5);border:1px solid rgba(0,201,167,.2);border-radius:10px;">
        <div style="font-size:11px;font-weight:700;color:var(--teal);margin-bottom:4px;">📍 今日出勤预览</div>
        <div style="font-size:13px;color:var(--text);font-weight:600;">2 个工地 · 3 项任务</div>
        <div style="font-size:11px;color:var(--text3);">预计日薪 RM 280</div>
      </div>
    </div>

    <div class="auth-step" id="auth-w-login-otp">
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">验证码已发送<button class="auth-send-btn" style="color:var(--teal)" onclick="authBackToPhone('worker')">更改</button></div>
      <label class="auth-field-label">输入 6 位验证码</label>
      <div class="auth-otp-row">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',0)" style="--otp-focus:var(--teal)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',1)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',2)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',3)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',4)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-l',5)">
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:8px;">Demo 验证码：<strong style="color:var(--teal)">888888</strong> <button class="auth-send-btn" style="color:var(--teal)" onclick="authAutoFillOTP('worker-l')">自动填入</button></div>
      <button class="auth-btn auth-btn-teal" onclick="authVerifyOTP('worker')">登入查看今日任务 →</button>
    </div>

    <!-- REGISTER STEP 1: basic info -->
    <div class="auth-step" id="auth-w-register">
      <label class="auth-field-label">姓名</label>
      <input class="auth-input" type="text" placeholder="Kumar Selvam" id="auth-w-reg-name">

      <label class="auth-field-label" style="margin-top:12px;display:block;">工种（可多选）</label>
      <div class="trade-chip-grid" id="worker-trade-chips">
        <div class="trade-chip" onclick="toggleTrade(this,'木工 Carpenter')">
          <span class="tc-icon">🪵</span><span>木工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'泥水工 Plasterer')">
          <span class="tc-icon">🧱</span><span>泥水工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'油漆工 Painter')">
          <span class="tc-icon">🎨</span><span>油漆工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'水电工 M&E')">
          <span class="tc-icon">⚡</span><span>水电工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'瓷砖工 Tiler')">
          <span class="tc-icon">🔲</span><span>瓷砖工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'吊顶工 Ceiling')">
          <span class="tc-icon">🏛️</span><span>吊顶工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'铝窗工 Aluminum')">
          <span class="tc-icon">🪟</span><span>铝窗工</span><span class="tc-check">✓</span>
        </div>
        <div class="trade-chip" onclick="toggleTrade(this,'其他 Others')">
          <span class="tc-icon">🔧</span><span>其他</span><span class="tc-check">✓</span>
        </div>
      </div>
      <div class="trade-selected-preview" id="trade-selected-preview" style="display:none;"></div>

      <label class="auth-field-label" style="margin-top:12px;display:block;">手机号码</label>
      <div class="auth-phone-row">
        <div class="auth-phone-prefix">🇲🇾 +60</div>
        <input class="auth-input" type="tel" placeholder="11-2345 6789" id="auth-w-reg-phone">
      </div>

      <div style="font-size:11px;color:var(--text3);margin-top:12px;line-height:1.6;padding:10px;background:var(--surface2);border-radius:8px;">
        📋 注册后需等待设计师审核批准，通过后才能接收工地任务。
      </div>
      <button class="auth-btn auth-btn-teal" style="margin-top:14px;" onclick="workerRegisterSendOTP()">发送验证码确认手机 →</button>
      <div class="auth-footer">已有账户？<a onclick="authSwitchTab('worker','login')" style="color:var(--teal)">立即登入</a></div>
    </div>

    <!-- REGISTER STEP 2: OTP verification -->
    <div class="auth-step" id="auth-w-reg-otp">
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px;">
        验证码已发送至 WhatsApp
        <button class="auth-send-btn" style="color:var(--teal)" onclick="workerRegBackToForm()">更改</button>
      </div>
      <label class="auth-field-label">输入 6 位验证码</label>
      <div class="auth-otp-row">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',0)" style="--otp-focus:var(--teal)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',1)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',2)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',3)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',4)">
        <input class="auth-otp-box" maxlength="1" oninput="authOTPNext(this,'worker-r',5)">
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:8px;">
        Demo 验证码：<strong style="color:var(--teal)">888888</strong>
        <button class="auth-send-btn" style="color:var(--teal)" onclick="authAutoFillOTP('worker-r')">自动填入</button>
      </div>
      <button class="auth-btn auth-btn-teal" onclick="workerRegisterComplete()">提交注册申请 →</button>
    </div>
  </div>
</div>

</body>
</html>
