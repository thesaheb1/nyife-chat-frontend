// import { BrowserRouter } from "react-router-dom";
// import { useInternet } from "@/hooks/use-Internet";
// import NoInternet from "@/components/no-internet";
// import Routes from "@/routes/Routes";
// const App = () => {
//   const { isOnline, refresh } = useInternet();
//   return (
//     <BrowserRouter>
//       {isOnline ? <Routes /> : <NoInternet refresh={refresh} />}
//     </BrowserRouter>
//   );
// };

// export default App;


//////////////////////////////////////////////////////////////////////////////




import { useState, useEffect, useCallback, useRef } from "react";

/* ─────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────── */
const globalCSS = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ─── LIGHT MODE: Replace the entire :root block ─── */
:root {
  --bg: #F0F4F8;
  --surface: #FFFFFF;
  --surface2: #F8FAFC;
  --border: rgba(0,0,0,0.08);
  --border2: rgba(0,0,0,0.14);
  --text: #111827;
  --text-muted: #6B7280;
  --text-dim: #4B5563;
  --wa-green: #128C7E;          /* darker green looks better on light */
  --wa-green-dark: #075E54;
  --wa-green-glow: rgba(18,140,126,0.1);
  --accent: #4F46E5;
  --accent-glow: rgba(79,70,229,0.1);
  --danger: #DC2626;
  --warning: #D97706;
  --success: #059669;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
}

body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

.app-root { display: flex; height: 100vh; overflow: hidden; }

/* Sidebar */
.sidebar {
  width: 240px; min-width: 240px; background: var(--surface);
  border-right: 1px solid var(--border); display: flex; flex-direction: column;
  padding: 0; overflow: hidden;
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px; padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}
.sidebar-logo-icon {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, var(--wa-green), var(--wa-green-dark));
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  box-shadow: 0 4px 12px rgba(37,211,102,0.3);
}
.sidebar-logo-text { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; color: var(--text); letter-spacing: -0.3px; }
.sidebar-logo-sub { font-size: 10px; color: var(--text-muted); letter-spacing: 0.5px; }

.sidebar-nav { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.sidebar-nav-item {
  display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm);
  font-size: 13.5px; font-weight: 500; color: var(--text-dim); cursor: pointer;
  transition: all 0.15s; border: 1px solid transparent; text-decoration: none;
}
/* ─── LIGHT MODE: hover uses a light grey tint instead of white-alpha ─── */
.sidebar-nav-item:hover { background: rgba(0,0,0,0.04); color: var(--text); }
.sidebar-nav-item.active { background: var(--wa-green-glow); color: var(--wa-green); border-color: rgba(37,211,102,0.2); }
.sidebar-nav-item .nav-icon { width: 18px; text-align: center; font-size: 15px; }
.sidebar-section-title { font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; padding: 16px 12px 6px; }

.sidebar-footer { padding: 12px 10px; border-top: 1px solid var(--border); }
.settings-btn {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 12px;
  border-radius: var(--radius-sm); background: transparent; border: 1px solid var(--border);
  color: var(--text-dim); font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer;
  transition: all 0.15s;
}
.settings-btn:hover { background: var(--surface2); color: var(--text); border-color: var(--border2); }

/* Main */
.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 28px; border-bottom: 1px solid var(--border);
  background: var(--surface); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 10;
}
.topbar-left { display: flex; flex-direction: column; gap: 2px; }
.topbar-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.4px; }
.topbar-subtitle { font-size: 12px; color: var(--text-muted); }
.topbar-actions { display: flex; align-items: center; gap: 10px; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px;
  border-radius: var(--radius-sm); font-size: 13.5px; font-weight: 600;
  font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
  border: 1px solid transparent; white-space: nowrap; text-decoration: none;
}
/* ─── LIGHT MODE: use the darker green so text contrast is preserved ─── */
.btn-primary { background: var(--wa-green); color: #FFFFFF; border-color: var(--wa-green); }
.btn-primary:hover { background: #0e7a6e; box-shadow: 0 4px 16px rgba(18,140,126,0.3); }
/* ─── LIGHT MODE: secondary button needs visible border on white bg ─── */
.btn-secondary { background: #FFFFFF; color: var(--text); border-color: var(--border2); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.btn-secondary:hover { background: #F1F5F9; }
.btn-ghost { background: transparent; color: var(--text-dim); border-color: transparent; }
.btn-ghost:hover { color: var(--text); background: rgba(255,255,255,0.05); }
.btn-danger { background: rgba(239,68,68,0.12); color: var(--danger); border-color: rgba(239,68,68,0.25); }
.btn-danger:hover { background: rgba(239,68,68,0.2); }
.btn-sm { padding: 5px 12px; font-size: 12px; }
.btn-icon { padding: 8px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinning::before { content: ''; width: 13px; height: 13px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Content */
.content { flex: 1; overflow-y: auto; padding: 24px 28px; }

/* Search / Filter bar */
.filter-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 360px; }
.search-wrap .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 14px; }
.search-input {
  width: 100%; background: #FFFFFF; border: 1px solid var(--border2); border-radius: var(--radius-sm);
  padding: 8px 12px 8px 36px; color: var(--text); font-size: 13.5px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.search-input:focus { border-color: var(--wa-green); }
.search-input::placeholder { color: var(--text-muted); }

.filter-select {
  background: #FFFFFF; border: 1px solid var(--border2); border-radius: var(--radius-sm);
  padding: 8px 12px; color: var(--text); font-size: 13px; font-family: 'DM Sans', sans-serif;
  outline: none; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.filter-select:focus { border-color: var(--wa-green); }
.filter-select option { background: var(--surface2); }

/* ─── LIGHT MODE: inputs sit on a light grey page, give them a white fill ─── */

.filter-select option { background: #FFFFFF; }

/* Stats row */
.stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 16px 18px; display: flex; align-items: center; gap: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.stat-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.stat-icon.green { background: var(--wa-green-glow); }
.stat-icon.blue { background: var(--accent-glow); }
.stat-icon.yellow { background: rgba(245,158,11,0.12); }
.stat-icon.red { background: rgba(239,68,68,0.1); }
.stat-label { font-size: 11.5px; color: var(--text-muted); margin-bottom: 2px; }
.stat-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: var(--text); }

/* Template Grid */
.template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

.template-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px; cursor: pointer; transition: all 0.18s; position: relative; overflow: hidden;
}
.template-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--wa-green), var(--wa-green-dark));
  opacity: 0; transition: opacity 0.18s;
}
.template-card:hover { border-color: var(--border2); box-shadow: 0 8px 32px rgba(0,0,0,0.4); transform: translateY(-1px); }
.template-card:hover::before { opacity: 1; }

.card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.card-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px; color: var(--text); word-break: break-word; }
.card-lang { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

.card-body-preview { font-size: 12.5px; color: var(--text-dim); line-height: 1.5; margin-bottom: 14px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.card-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* Badges */
.badge {
  display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
  border-radius: 99px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.3px;
}
.badge-green { background: var(--wa-green-glow); color: var(--wa-green); }
.badge-yellow { background: rgba(245,158,11,0.12); color: #F59E0B; }
.badge-red { background: rgba(239,68,68,0.1); color: var(--danger); }
.badge-blue { background: var(--accent-glow); color: #818CF8; }
.badge-gray { background: rgba(107,114,128,0.15); color: var(--text-muted); }

.card-actions { display: flex; align-items: center; gap: 6px; margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border); }

/* Empty state */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: var(--text-muted); margin-bottom: 24px; }

/* ── MODAL ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: var(--surface); border: 1px solid var(--border2); border-radius: 16px;
  box-shadow: var(--shadow-lg); width: 100%; max-width: 960px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.2s ease;
}
.modal.modal-sm { max-width: 460px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.modal-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--text); }
.modal-close { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 4px; line-height: 1; transition: color 0.15s; border-radius: 6px; }
.modal-close:hover { color: var(--text); background: rgba(255,255,255,0.06); }
.modal-body { flex: 1; overflow: hidden; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: flex-end; gap: 10px; flex-shrink: 0; }

/* Template Builder */
.builder-layout { display: grid; grid-template-columns: 1fr 320px; height: 100%; }
.builder-form { overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
.builder-preview { border-left: 1px solid var(--border); background: var(--bg); overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }

/* Form */
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-dim); letter-spacing: 0.4px; text-transform: uppercase; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-input, .form-textarea, .form-select {
  background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm);
  padding: 9px 12px; color: var(--text); font-size: 13.5px; font-family: 'DM Sans', sans-serif;
  outline: none; transition: border-color 0.15s; width: 100%;
}
.form-input:focus, .form-textarea:focus, .form-select:focus { border-color: var(--wa-green); box-shadow: 0 0 0 3px var(--wa-green-glow); }
.form-textarea { resize: vertical; min-height: 80px; line-height: 1.5; }
.form-select option { background: var(--surface2); }
.form-hint { font-size: 11.5px; color: var(--text-muted); }
.form-error { font-size: 11.5px; color: var(--danger); }

.section-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.2px; display: flex; align-items: center; gap: 8px; }
.section-divider { height: 1px; background: var(--border); margin: 4px 0; }

/* Component builder */
.comp-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; }
.comp-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }

/* Buttons list */
.button-item { display: flex; align-items: center; gap: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; margin-bottom: 8px; }
.button-item-type { font-size: 11px; font-weight: 600; color: var(--accent); background: var(--accent-glow); padding: 2px 7px; border-radius: 99px; }

/* ── WhatsApp Phone Preview ── */
.wa-preview-label { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.wa-phone {
  width: 260px; background: #ECE5DD; border-radius: 40px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 8px #1A1A1A, 0 0 0 10px #2A2A2A;
  flex-shrink: 0;
}
.wa-status-bar { background: #1B8755; padding: 8px 16px 6px; display: flex; justify-content: space-between; align-items: center; }
.wa-status-time { font-size: 11px; font-weight: 600; color: #fff; }
.wa-status-icons { display: flex; gap: 4px; align-items: center; }
.wa-status-icon { font-size: 11px; color: rgba(255,255,255,0.85); }
.wa-topbar { background: #1B8755; padding: 6px 12px 10px; display: flex; align-items: center; gap: 10px; }
.wa-topbar-avatar { width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.wa-topbar-info { flex: 1; }
.wa-topbar-name { font-size: 13px; font-weight: 600; color: #fff; }
.wa-topbar-status { font-size: 10px; color: rgba(255,255,255,0.7); }
.wa-topbar-icons { display: flex; gap: 12px; color: rgba(255,255,255,0.85); font-size: 16px; }
.wa-chat-bg { background: #ECE5DD url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8B9AA' fill-opacity='0.25'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); min-height: 300px; padding: 12px 8px; display: flex; flex-direction: column; align-items: flex-end; }
.wa-message-wrap { width: 100%; display: flex; justify-content: flex-end; margin-bottom: 4px; }
.wa-bubble {
  background: #fff; border-radius: 8px 0 8px 8px; max-width: 90%; width: 90%;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15); overflow: hidden; position: relative;
}
.wa-bubble-header-img { width: 100%; height: 120px; background: linear-gradient(135deg, #C8B9AA, #B5A596); display: flex; align-items: center; justify-content: center; font-size: 28px; color: rgba(255,255,255,0.6); }
.wa-bubble-header-text { padding: 8px 10px 4px; font-size: 14px; font-weight: 700; color: #000; font-family: -apple-system, sans-serif; }
.wa-bubble-body { padding: 6px 10px; font-size: 12.5px; color: #111; line-height: 1.5; font-family: -apple-system, sans-serif; white-space: pre-wrap; word-break: break-word; }
.wa-bubble-footer { padding: 2px 10px 6px; font-size: 10.5px; color: #8696A0; font-family: -apple-system, sans-serif; }
.wa-bubble-time { text-align: right; padding: 0 8px 6px; font-size: 10px; color: #8696A0; display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.wa-bubble-divider { height: 1px; background: #e0e0e0; margin: 0 10px; }
.wa-button { padding: 8px; text-align: center; font-size: 12.5px; font-weight: 600; color: #009DE2; border-top: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: center; gap: 6px; font-family: -apple-system, sans-serif; }
.wa-carousel-wrap { display: flex; overflow-x: auto; gap: 8px; padding-bottom: 4px; width: 100%; }
.wa-carousel-card { background: #fff; border-radius: 8px; min-width: 130px; max-width: 130px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.15); flex-shrink: 0; }
.wa-carousel-img { width: 100%; height: 80px; background: linear-gradient(135deg, #C8B9AA, #B5A596); display: flex; align-items: center; justify-content: center; font-size: 20px; }
.wa-carousel-body { padding: 6px 8px; font-size: 10.5px; color: #111; line-height: 1.4; font-family: -apple-system, sans-serif; }
.wa-carousel-btn { padding: 6px; text-align: center; font-size: 11px; font-weight: 600; color: #009DE2; border-top: 1px solid #e0e0e0; font-family: -apple-system, sans-serif; }

/* Input bar */
.wa-input-bar { background: #F0F2F5; padding: 6px 8px; display: flex; align-items: center; gap: 8px; }
.wa-input-pill { flex: 1; background: #fff; border-radius: 20px; padding: 7px 12px; font-size: 11px; color: #8696A0; }
.wa-input-send { width: 30px; height: 30px; border-radius: 50%; background: #00A884; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; flex-shrink: 0; }

/* Detail pane */
.detail-pane { display: flex; gap: 24px; height: 100%; }
.detail-info { flex: 1; overflow-y: auto; padding: 24px; }
.detail-preview-col { width: 300px; min-width: 300px; overflow-y: auto; padding: 24px; border-left: 1px solid var(--border); display: flex; flex-direction: column; align-items: center; }

/* Tabs */
.tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.tab { padding: 10px 18px; font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
.tab.active { color: var(--wa-green); border-bottom-color: var(--wa-green); }
.tab:hover:not(.active) { color: var(--text); }

/* JSON viewer */
.json-viewer { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 14px; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11.5px; color: #9CA3AF; overflow-x: auto; white-space: pre; line-height: 1.6; }

/* Config modal */
.config-grid { display: flex; flex-direction: column; gap: 14px; padding: 24px; overflow-y: auto; max-height: 60vh; }

/* Confirm */
.confirm-body { padding: 24px; text-align: center; }
.confirm-icon { font-size: 40px; margin-bottom: 12px; }
.confirm-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.confirm-desc { font-size: 13.5px; color: var(--text-muted); line-height: 1.5; }

/* Loading */
.loading-row { display: flex; align-items: center; justify-content: center; padding: 60px; gap: 12px; color: var(--text-muted); font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid var(--border2); border-top-color: var(--wa-green); border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Toast */
.toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 10px; }
.toast {
  background: var(--surface); border: 1px solid var(--border2); border-radius: var(--radius-sm);
  padding: 12px 16px; font-size: 13px; color: var(--text); box-shadow: var(--shadow-lg);
  display: flex; align-items: center; gap: 10px; min-width: 260px; max-width: 360px;
  animation: slideLeft 0.25s ease;
}
.toast.success { border-left: 3px solid var(--success); }
.toast.error { border-left: 3px solid var(--danger); }
.toast.info { border-left: 3px solid var(--accent); }

/* Chip toggle */
.chip-toggle { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; color: var(--text-muted); background: transparent; font-family: 'DM Sans', sans-serif; }
.chip:hover { border-color: var(--border2); color: var(--text); }
.chip.active { border-color: var(--wa-green); background: var(--wa-green-glow); color: var(--wa-green); }

/* Variable highlight */
.var-highlight { display: inline-block; background: rgba(99,102,241,0.15); color: #A5B4FC; border-radius: 4px; padding: 0 3px; font-size: 0.92em; }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
`;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const STATUS_MAP = {
  APPROVED: { label: "Approved", cls: "badge-green", icon: "✓" },
  PENDING: { label: "Pending", cls: "badge-yellow", icon: "⏳" },
  REJECTED: { label: "Rejected", cls: "badge-red", icon: "✗" },
  DRAFT: { label: "Draft", cls: "badge-gray", icon: "◎" },
  PAUSED: { label: "Paused", cls: "badge-gray", icon: "⏸" },
  DISABLED: { label: "Disabled", cls: "badge-red", icon: "⊘" },
};
const CATEGORY_MAP = {
  MARKETING: { label: "Marketing", cls: "badge-blue" },
  UTILITY: { label: "Utility", cls: "badge-green" },
  AUTHENTICATION: { label: "Auth", cls: "badge-yellow" },
};

const getBodyText = (components = []) => {
  const body = components.find(c => c.type === "BODY");
  return body?.text || "No body text";
};

const renderVars = (text = "") =>
  text.replace(/\{\{(\d+)\}\}/g, (_, n) => `{{${n}}}`);

/* ─────────────────────────────────────────────
   API LAYER
───────────────────────────────────────────── */
const buildHeaders = (cfg) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${cfg.jwt}`,
  "x-organization-id": cfg.orgId,
  "x-meta-business-account-id": cfg.metaBusinessId,
  "x-meta-app-id": cfg.metaAppId,
});

const api = (cfg) => ({
  list: (params = {}) => {
    const q = new URLSearchParams({ limit: 20, offset: 0, ...params }).toString();
    return fetch(`${cfg.baseUrl}/api/templates?${q}`, { headers: buildHeaders(cfg) }).then(r => r.json());
  },
  get: (uuid) => fetch(`${cfg.baseUrl}/api/templates/${uuid}`, { headers: buildHeaders(cfg) }).then(r => r.json()),
  create: (body) => fetch(`${cfg.baseUrl}/api/templates`, { method: "POST", headers: buildHeaders(cfg), body: JSON.stringify(body) }).then(r => r.json()),
  update: (uuid, body) => fetch(`${cfg.baseUrl}/api/templates/${uuid}`, { method: "PUT", headers: buildHeaders(cfg), body: JSON.stringify(body) }).then(r => r.json()),
  del: (uuid) => fetch(`${cfg.baseUrl}/api/templates/${uuid}`, { method: "DELETE", headers: buildHeaders(cfg) }).then(r => r.json()),
  publish: (uuid) => fetch(`${cfg.baseUrl}/api/templates/${uuid}/publish`, { method: "POST", headers: buildHeaders(cfg) }).then(r => r.json()),
  sync: () => fetch(`${cfg.baseUrl}/api/templates/sync`, { method: "POST", headers: buildHeaders(cfg) }).then(r => r.json()),
  validate: (body) => fetch(`${cfg.baseUrl}/api/templates/validate`, { method: "POST", headers: buildHeaders(cfg), body: JSON.stringify(body) }).then(r => r.json()),
});

/* ─────────────────────────────────────────────
   MOCK DATA (for demo when no API)
───────────────────────────────────────────── */
const MOCK_TEMPLATES = [
  { uuid: "uuid-001", name: "welcome_offer_standard", category: "MARKETING", language: "en_US", status: "APPROVED", createdAt: "2024-01-15", components: [{ type: "HEADER", format: "TEXT", text: "🎉 Special Offer Just for You!" }, { type: "BODY", text: "Hello {{1}}, enjoy 20% off your next purchase. Use code SAVE20 at checkout before {{2}}." }, { type: "FOOTER", text: "Offer valid for 24 hours only" }, { type: "BUTTONS", buttons: [{ type: "URL", text: "Shop Now" }, { type: "QUICK_REPLY", text: "Not Interested" }] }] },
  { uuid: "uuid-002", name: "otp_login_template", category: "AUTHENTICATION", language: "en_US", status: "APPROVED", createdAt: "2024-01-20", components: [{ type: "BODY", text: "Your verification code is {{1}}. This code expires in 10 minutes. Do not share it with anyone.", add_security_recommendation: true }, { type: "BUTTONS", buttons: [{ type: "OTP", otp_type: "COPY_CODE", text: "Copy Code" }] }] },
  { uuid: "uuid-003", name: "order_shipped_notify", category: "UTILITY", language: "en_US", status: "APPROVED", createdAt: "2024-02-01", components: [{ type: "HEADER", format: "TEXT", text: "📦 Your Order is on the Way!" }, { type: "BODY", text: "Hi {{1}}, your order #{{2}} has been shipped via {{3}}. Expected delivery: {{4}}." }, { type: "FOOTER", text: "Track your package anytime" }, { type: "BUTTONS", buttons: [{ type: "URL", text: "Track Order" }, { type: "QUICK_REPLY", text: "Contact Support" }] }] },
  { uuid: "uuid-004", name: "new_arrivals_carousel", category: "MARKETING", language: "en_US", status: "PENDING", createdAt: "2024-02-10", components: [{ type: "BODY", text: "Check out our hottest new arrivals this season! 🛍️" }, { type: "CAROUSEL", cards: [{ components: [{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Air Max 2024 — Redefine comfort" }, { type: "BUTTONS", buttons: [{ type: "URL", text: "View" }] }] }, { components: [{ type: "HEADER", format: "IMAGE" }, { type: "BODY", text: "Urban Jacket — Stay warm, stay bold" }, { type: "BUTTONS", buttons: [{ type: "URL", text: "View" }] }] }] }] },
  { uuid: "uuid-005", name: "appointment_reminder", category: "UTILITY", language: "en_US", status: "APPROVED", createdAt: "2024-02-15", components: [{ type: "HEADER", format: "TEXT", text: "📅 Appointment Reminder" }, { type: "BODY", text: "Hello {{1}}, this is a reminder for your appointment on {{2}} at {{3}}. Please confirm your attendance." }, { type: "BUTTONS", buttons: [{ type: "QUICK_REPLY", text: "Confirm ✓" }, { type: "QUICK_REPLY", text: "Reschedule" }, { type: "QUICK_REPLY", text: "Cancel" }] }] },
  { uuid: "uuid-006", name: "flash_sale_promo", category: "MARKETING", language: "en_US", status: "REJECTED", createdAt: "2024-02-20", components: [{ type: "BODY", text: "⚡ FLASH SALE ⚡ Up to 70% off — Today only! Grab your deals before they're gone." }, { type: "BUTTONS", buttons: [{ type: "URL", text: "Shop Now" }] }] },
  { uuid: "uuid-007", name: "lead_capture_flow", category: "UTILITY", language: "en_US", status: "DRAFT", createdAt: "2024-03-01", components: [{ type: "BODY", text: "Please share your details to get a personalized quote from our team." }, { type: "BUTTONS", buttons: [{ type: "FLOW", text: "Fill Form →" }] }] },
];

/* ─────────────────────────────────────────────
   WA PREVIEW
───────────────────────────────────────────── */
function WAPreview({ template }) {
  if (!template) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
      <div style={{ fontSize: 12 }}>Preview will appear here</div>
    </div>
  );
  const { components = [], name } = template;
  const header = components.find(c => c.type === "HEADER");
  const body = components.find(c => c.type === "BODY");
  const footer = components.find(c => c.type === "FOOTER");
  const buttons = components.find(c => c.type === "BUTTONS");
  const carousel = components.find(c => c.type === "CAROUSEL");

  const renderBodyText = (text = "") =>
    text.split(/(\{\{\d+\}\})/g).map((part, i) =>
      /^\{\{\d+\}\}$/.test(part) ? <span key={i} style={{ background: "rgba(99,102,241,0.2)", color: "#A5B4FC", borderRadius: 3, padding: "0 2px", fontSize: "0.9em" }}>{part}</span> : part
    );

  return (
    <div className="wa-phone">
      <div className="wa-status-bar">
        <span className="wa-status-time">9:41</span>
        <div className="wa-status-icons">
          <span className="wa-status-icon">▲</span>
          <span className="wa-status-icon">WiFi</span>
          <span className="wa-status-icon">🔋</span>
        </div>
      </div>
      <div className="wa-topbar">
        <div style={{ fontSize: 16, cursor: "pointer", color: "rgba(255,255,255,0.8)" }}>←</div>
        <div className="wa-topbar-avatar">🏢</div>
        <div className="wa-topbar-info">
          <div className="wa-topbar-name">Business Name</div>
          <div className="wa-topbar-status">online</div>
        </div>
        <div className="wa-topbar-icons">
          <span>📹</span>
          <span>📞</span>
          <span>⋮</span>
        </div>
      </div>
      <div className="wa-chat-bg">
        <div style={{ fontSize: 10, color: "#8696A0", background: "rgba(255,255,255,0.7)", padding: "4px 12px", borderRadius: 99, marginBottom: 8, alignSelf: "center" }}>Today</div>
        <div className="wa-message-wrap">
          <div className="wa-bubble">
            {header?.format === "IMAGE" && (
              <div className="wa-bubble-header-img">🖼️</div>
            )}
            {header?.format === "TEXT" && header.text && (
              <div className="wa-bubble-header-text">{header.text}</div>
            )}
            {body && (
              <div className="wa-bubble-body">
                {renderBodyText(body.text || "")}
                {body.add_security_recommendation && (
                  <div style={{ marginTop: 6, fontSize: 10.5, color: "#667781", fontStyle: "italic" }}>🔒 For your security, do not share this code.</div>
                )}
              </div>
            )}
            {footer && <div className="wa-bubble-footer">{footer.text}</div>}
            {carousel && (
              <div style={{ padding: "8px 8px 4px", overflowX: "auto" }}>
                <div className="wa-carousel-wrap">
                  {carousel.cards?.map((card, ci) => {
                    const ch = card.components?.find(c => c.type === "HEADER");
                    const cb = card.components?.find(c => c.type === "BODY");
                    const cbtn = card.components?.find(c => c.type === "BUTTONS");
                    return (
                      <div key={ci} className="wa-carousel-card">
                        <div className="wa-carousel-img">{ch?.format === "IMAGE" ? "🖼️" : "📄"}</div>
                        {cb && <div className="wa-carousel-body">{cb.text}</div>}
                        {cbtn?.buttons?.map((b, bi) => (
                          <div key={bi} className="wa-carousel-btn">↗ {b.text}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="wa-bubble-time">10:30 <span style={{ color: "#53BDEB", fontSize: 12 }}>✓✓</span></div>
            {buttons?.buttons?.map((btn, bi) => (
              <div key={bi} className="wa-button">
                {btn.type === "URL" && <span>↗</span>}
                {btn.type === "FLOW" && <span>▶</span>}
                {btn.type === "QUICK_REPLY" && <span>↩</span>}
                {btn.type === "OTP" && <span>📋</span>}
                {btn.type === "PHONE_NUMBER" && <span>📞</span>}
                {btn.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="wa-input-bar">
        <span style={{ fontSize: 18, color: "#54656F" }}>😊</span>
        <div className="wa-input-pill">Message</div>
        <span style={{ fontSize: 18, color: "#54656F" }}>📎</span>
        <div className="wa-input-send">▶</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TEMPLATE BUILDER
───────────────────────────────────────────── */
const DEFAULT_FORM = {
  name: "", category: "MARKETING", language: "en_US",
  headerType: "NONE", headerText: "",
  bodyText: "", footerText: "",
  buttons: [],
};

const LANGUAGES = ["en_US", "en_GB", "hi", "es", "fr", "ar", "pt_BR", "de", "ja", "ko", "zh_CN"];

function TemplateBuilder({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(() => {
    if (!initial) return DEFAULT_FORM;
    const comps = initial.components || [];
    const header = comps.find(c => c.type === "HEADER");
    const body = comps.find(c => c.type === "BODY");
    const footer = comps.find(c => c.type === "FOOTER");
    const btns = comps.find(c => c.type === "BUTTONS");
    return {
      name: initial.name || "",
      category: initial.category || "MARKETING",
      language: initial.language || "en_US",
      headerType: header?.format || "NONE",
      headerText: header?.text || "",
      bodyText: body?.text || "",
      footerText: footer?.text || "",
      buttons: btns?.buttons || [],
    };
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const preview = {
    name: form.name,
    components: [
      ...(form.headerType !== "NONE" ? [{ type: "HEADER", format: form.headerType, text: form.headerText }] : []),
      ...(form.bodyText ? [{ type: "BODY", text: form.bodyText }] : []),
      ...(form.footerText ? [{ type: "FOOTER", text: form.footerText }] : []),
      ...(form.buttons.length ? [{ type: "BUTTONS", buttons: form.buttons }] : []),
    ],
  };

  const addButton = (type) => {
    const btn = type === "URL" ? { type: "URL", text: "Visit Site", url: "https://example.com" }
      : type === "QUICK_REPLY" ? { type: "QUICK_REPLY", text: "Reply" }
        : type === "OTP" ? { type: "OTP", otp_type: "COPY_CODE", text: "Copy Code" }
          : { type: "PHONE_NUMBER", text: "Call Us", phone_number: "+1234567890" };
    set("buttons", [...form.buttons, btn]);
  };

  const updateButton = (i, k, v) => {
    const btns = [...form.buttons];
    btns[i] = { ...btns[i], [k]: v };
    set("buttons", btns);
  };

  const removeButton = (i) => set("buttons", form.buttons.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const comps = [];
    if (form.headerType !== "NONE") comps.push({ type: "HEADER", format: form.headerType, ...(form.headerText ? { text: form.headerText } : {}) });
    if (form.bodyText) comps.push({ type: "BODY", text: form.bodyText, example: { body_text: [[...(form.bodyText.match(/\{\{\d+\}\}/g) || []).map(() => "Sample")]] } });
    if (form.footerText) comps.push({ type: "FOOTER", text: form.footerText });
    if (form.buttons.length) comps.push({ type: "BUTTONS", buttons: form.buttons });
    onSave({ name: form.name, category: form.category, language: form.language, components: comps });
  };

  return (
    <div className="modal" style={{ maxWidth: 980 }}>
      <div className="modal-header">
        <span className="modal-title">{initial ? "✏️ Edit Template" : "✨ Create Template"}</span>
        <button className="modal-close" onClick={onCancel}>✕</button>
      </div>
      <div className="modal-body">
        <div className="builder-layout">
          {/* Form */}
          <div className="builder-form">
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>📝 Basic Info</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Template Name *</label>
                  <input className="form-input" value={form.name} onChange={e => set("name", e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))} placeholder="e.g. welcome_offer" disabled={!!initial} />
                  <span className="form-hint">Lowercase, underscores only</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Language</label>
                <select className="form-select" value={form.language} onChange={e => set("language", e.target.value)}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <div className="section-divider" />
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>📋 Header</div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Header Type</label>
                <div className="chip-toggle">
                  {["NONE", "TEXT", "IMAGE", "VIDEO", "DOCUMENT"].map(t => (
                    <button key={t} className={`chip ${form.headerType === t ? "active" : ""}`} onClick={() => set("headerType", t)}>{t}</button>
                  ))}
                </div>
              </div>
              {form.headerType === "TEXT" && (
                <div className="form-group">
                  <label className="form-label">Header Text</label>
                  <input className="form-input" value={form.headerText} onChange={e => set("headerText", e.target.value)} placeholder="e.g. Special Offer 🎉" maxLength={60} />
                  <span className="form-hint">{60 - form.headerText.length} chars remaining</span>
                </div>
              )}
              {["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) && (
                <div className="comp-card" style={{ textAlign: "center", padding: "20px" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Media upload via API — handled via header_handle</div>
                </div>
              )}
            </div>

            <div className="section-divider" />
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>💬 Body *</div>
              <div className="form-group">
                <textarea className="form-textarea" rows={5} value={form.bodyText} onChange={e => set("bodyText", e.target.value)} placeholder="Hello {{1}}, your order {{2}} has been confirmed..." />
                <span className="form-hint">Use &#123;&#123;1&#125;&#125;, &#123;&#123;2&#125;&#125;, etc. for dynamic variables. {1024 - form.bodyText.length} chars remaining.</span>
              </div>
            </div>

            <div className="section-divider" />
            <div>
              <div className="section-title" style={{ marginBottom: 14 }}>🔤 Footer</div>
              <div className="form-group">
                <input className="form-input" value={form.footerText} onChange={e => set("footerText", e.target.value)} placeholder="e.g. Reply STOP to unsubscribe" maxLength={60} />
              </div>
            </div>

            <div className="section-divider" />
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div className="section-title">🔘 Buttons</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ t: "QUICK_REPLY", icon: "↩" }, { t: "URL", icon: "↗" }, { t: "PHONE_NUMBER", icon: "📞" }, { t: "OTP", icon: "📋" }].map(({ t, icon }) => (
                    <button key={t} className="btn btn-ghost btn-sm" onClick={() => addButton(t)} title={`Add ${t}`}>
                      {icon} {t.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              {form.buttons.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "16px", background: "var(--bg)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)" }}>No buttons — click above to add</div>}
              {form.buttons.map((btn, i) => (
                <div key={i} className="button-item" style={{ marginBottom: 8 }}>
                  <span className="button-item-type">{btn.type}</span>
                  <input className="form-input" style={{ flex: 1, padding: "5px 8px" }} value={btn.text} onChange={e => updateButton(i, "text", e.target.value)} placeholder="Button label" />
                  {btn.type === "URL" && (
                    <input className="form-input" style={{ flex: 1.5, padding: "5px 8px" }} value={btn.url || ""} onChange={e => updateButton(i, "url", e.target.value)} placeholder="https://..." />
                  )}
                  {btn.type === "PHONE_NUMBER" && (
                    <input className="form-input" style={{ flex: 1, padding: "5px 8px" }} value={btn.phone_number || ""} onChange={e => updateButton(i, "phone_number", e.target.value)} placeholder="+1234567890" />
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => removeButton(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="builder-preview">
            <div className="wa-preview-label">Live Preview</div>
            <WAPreview template={preview} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.bodyText}>
          {saving ? <><span className="btn-spinning" /> Saving…</> : initial ? "💾 Update Template" : "🚀 Create Template"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DETAIL MODAL
───────────────────────────────────────────── */
function DetailModal({ template, onClose, onEdit, onDelete, onPublish, publishing }) {
  const [tab, setTab] = useState("info");
  const s = STATUS_MAP[template.status] || STATUS_MAP.DRAFT;
  const cat = CATEGORY_MAP[template.category] || { label: template.category, cls: "badge-gray" };

  return (
    <div className="modal" style={{ maxWidth: 860 }}>
      <div className="modal-header">
        <div>
          <div className="modal-title" style={{ marginBottom: 4 }}>{template.name}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
            <span className={`badge ${cat.cls}`}>{cat.label}</span>
            <span className="badge badge-gray">{template.language}</span>
          </div>
        </div>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="detail-pane" style={{ maxHeight: "calc(90vh - 160px)" }}>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div className="tabs">
              {["info", "components", "json"].map(t => (
                <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                  {t === "info" && "📋 Info"}{t === "components" && "🔧 Components"}{t === "json" && "{ } JSON"}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
              {tab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[["Template ID", template.uuid], ["Name", template.name], ["Category", template.category], ["Language", template.language], ["Status", template.status], ["Created", template.createdAt || "—"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{k}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "components" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(template.components || []).map((comp, i) => (
                    <div key={i} className="comp-card">
                      <div className="comp-card-header">
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--wa-green)", letterSpacing: 0.5 }}>{comp.type}{comp.format ? ` · ${comp.format}` : ""}</span>
                      </div>
                      {comp.text && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{comp.text}</div>}
                      {comp.buttons && comp.buttons.map((b, bi) => (
                        <div key={bi} className="button-item" style={{ marginTop: bi === 0 ? 8 : 4 }}>
                          <span className="button-item-type">{b.type}</span>
                          <span style={{ fontSize: 12.5, color: "var(--text)" }}>{b.text}</span>
                          {b.url && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: "auto" }}>{b.url}</span>}
                        </div>
                      ))}
                      {comp.cards && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{comp.cards.length} carousel card(s)</div>}
                    </div>
                  ))}
                </div>
              )}
              {tab === "json" && (
                <div className="json-viewer">{JSON.stringify(template, null, 2)}</div>
              )}
            </div>
          </div>
          <div className="detail-preview-col">
            <div className="wa-preview-label">Preview</div>
            <WAPreview template={template} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(template)}>🗑 Delete</button>
        <button className="btn btn-secondary" onClick={() => onEdit(template)}>✏️ Edit</button>
        <button className="btn btn-primary" onClick={() => onPublish(template.uuid)} disabled={publishing}>
          {publishing ? <><span className="btn-spinning" /> Publishing…</> : "🚀 Publish"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SETTINGS MODAL
───────────────────────────────────────────── */
function SettingsModal({ config, onSave, onClose }) {
  const [form, setForm] = useState({ ...config });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal modal-sm">
      <div className="modal-header">
        <span className="modal-title">⚙️ API Configuration</span>
        <button className="modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="modal-body">
        <div className="config-grid">
          {[["baseUrl", "Base URL", "http://localhost:3003"], ["jwt", "JWT Token", "eyJ..."], ["orgId", "Organization ID", "org_demo_001"], ["metaBusinessId", "Meta Business Account ID", "1468289..."], ["metaAppId", "Meta App ID", "1915414..."]].map(([k, label, ph]) => (
            <div key={k} className="form-group">
              <label className="form-label">{label}</label>
              <input className="form-input" type={k === "jwt" ? "password" : "text"} value={form[k]} onChange={e => set(k, e.target.value)} placeholder={ph} />
            </div>
          ))}
          <div style={{ background: "var(--wa-green-glow)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: "var(--radius-sm)", padding: 12, fontSize: 12, color: "var(--wa-green)", lineHeight: 1.5 }}>
            ℹ️ Demo mode active — changes save to local state. Connect your API by filling in credentials above.
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>Save Config</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [config, setConfig] = useState({ baseUrl: "http://localhost:3003", jwt: "", orgId: "org_demo_001", metaBusinessId: "1468289684238203", metaAppId: "1915414522619516" });
  const [templates, setTemplates] = useState(MOCK_TEMPLATES);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState(null); // null | "create" | "edit" | "detail" | "delete" | "settings"
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const addToast = useCallback((message, type = "info") => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const apiClient = api(config);
  const useMock = !config.jwt;

  const loadTemplates = useCallback(async () => {
    if (useMock) { setTemplates(MOCK_TEMPLATES); return; }
    setLoading(true);
    try {
      const res = await apiClient.list();
      setTemplates(res.data?.templates || res.data || []);
    } catch (e) { addToast("Failed to load templates", "error"); }
    finally { setLoading(false); }
  }, [config]);

  useEffect(() => { loadTemplates(); }, []);

  const handleSync = async () => {
    if (useMock) { addToast("Sync simulated (demo mode) ✓", "success"); return; }
    setSyncing(true);
    try {
      await apiClient.sync();
      addToast("Templates synced from Meta ✓", "success");
      loadTemplates();
    } catch { addToast("Sync failed", "error"); }
    finally { setSyncing(false); }
  };

  const handleCreate = async (payload) => {
    setSaving(true);
    if (useMock) {
      await new Promise(r => setTimeout(r, 800));
      const newT = { ...payload, uuid: `uuid-${Date.now()}`, status: "PENDING", createdAt: new Date().toISOString().split("T")[0] };
      setTemplates(t => [newT, ...t]);
      addToast("Template created ✓", "success");
      setModal(null);
    } else {
      try {
        const res = await apiClient.create(payload);
        addToast("Template created ✓", "success");
        setModal(null);
        loadTemplates();
      } catch { addToast("Create failed", "error"); }
    }
    setSaving(false);
  };

  const handleUpdate = async (payload) => {
    setSaving(true);
    const uuid = activeTemplate.uuid;
    if (useMock) {
      await new Promise(r => setTimeout(r, 800));
      setTemplates(t => t.map(x => x.uuid === uuid ? { ...x, ...payload } : x));
      addToast("Template updated ✓", "success");
      setModal(null);
    } else {
      try {
        await apiClient.update(uuid, payload);
        addToast("Template updated ✓", "success");
        setModal(null);
        loadTemplates();
      } catch { addToast("Update failed", "error"); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const uuid = activeTemplate.uuid;
    if (useMock) {
      setTemplates(t => t.filter(x => x.uuid !== uuid));
      addToast("Template deleted", "info");
      setModal(null);
    } else {
      try {
        await apiClient.del(uuid);
        addToast("Template deleted", "info");
        setModal(null);
        loadTemplates();
      } catch { addToast("Delete failed", "error"); }
    }
  };

  const handlePublish = async (uuid) => {
    setPublishing(true);
    if (useMock) {
      await new Promise(r => setTimeout(r, 800));
      setTemplates(t => t.map(x => x.uuid === uuid ? { ...x, status: "APPROVED" } : x));
      addToast("Template published ✓", "success");
    } else {
      try {
        await apiClient.publish(uuid);
        addToast("Published ✓", "success");
        loadTemplates();
      } catch { addToast("Publish failed", "error"); }
    }
    setPublishing(false);
  };

  const filtered = templates.filter(t => {
    const q = search.toLowerCase();
    const matchQ = !q || t.name.includes(q) || (t.components || []).some(c => c.text?.toLowerCase().includes(q));
    const matchCat = catFilter === "ALL" || t.category === catFilter;
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchQ && matchCat && matchStatus;
  });

  const stats = {
    total: templates.length,
    approved: templates.filter(t => t.status === "APPROVED").length,
    pending: templates.filter(t => t.status === "PENDING").length,
    rejected: templates.filter(t => t.status === "REJECTED").length,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />
      <div className="app-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">💬</div>
            <div>
              <div className="sidebar-logo-text">WA Studio</div>
              <div className="sidebar-logo-sub">TEMPLATE MANAGER</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="sidebar-section-title">Core</div>
            <div className="sidebar-nav-item active"><span className="nav-icon">📋</span> Templates</div>
            <div className="sidebar-nav-item"><span className="nav-icon">🔄</span> Flows</div>
            <div className="sidebar-nav-item"><span className="nav-icon">📊</span> Analytics</div>
            <div className="sidebar-section-title">Config</div>
            <div className="sidebar-nav-item"><span className="nav-icon">🔔</span> Webhooks</div>
            <div className="sidebar-nav-item"><span className="nav-icon">📤</span> Media Library</div>
            <div className="sidebar-section-title">Account</div>
            <div className="sidebar-nav-item"><span className="nav-icon">🏢</span> Organization</div>
          </nav>
          <div className="sidebar-footer">
            <button className="settings-btn" onClick={() => setModal("settings")}>
              <span>⚙️</span> API Settings
              {useMock && <span className="badge badge-yellow" style={{ marginLeft: "auto", fontSize: 9 }}>DEMO</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-title">Templates</div>
              <div className="topbar-subtitle">{templates.length} templates · {useMock ? "🟡 Demo Mode" : "🟢 Connected"}</div>
            </div>
            <div className="topbar-actions">
              <button className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
                {syncing ? <><span className="btn-spinning" /> Syncing…</> : "🔄 Sync Meta"}
              </button>
              <button className="btn btn-primary" onClick={() => { setActiveTemplate(null); setModal("create"); }}>
                ✨ New Template
              </button>
            </div>
          </div>

          <div className="content">
            {/* Stats */}
            <div className="stats-row">
              <div className="stat-card"><div className="stat-icon blue">📋</div><div><div className="stat-label">Total</div><div className="stat-value">{stats.total}</div></div></div>
              <div className="stat-card"><div className="stat-icon green">✅</div><div><div className="stat-label">Approved</div><div className="stat-value">{stats.approved}</div></div></div>
              <div className="stat-card"><div className="stat-icon yellow">⏳</div><div><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div></div>
              <div className="stat-card"><div className="stat-icon red">❌</div><div><div className="stat-label">Rejected</div><div className="stat-value">{stats.rejected}</div></div></div>
            </div>

            {/* Filter bar */}
            <div className="filter-bar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="ALL">All Categories</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
                <option value="AUTHENTICATION">Authentication</option>
              </select>
              <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
                <option value="DRAFT">Draft</option>
              </select>
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="loading-row"><div className="spinner" /> Loading templates…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No templates found</div>
                <div className="empty-desc">Try adjusting filters or create your first template.</div>
                <button className="btn btn-primary" onClick={() => { setActiveTemplate(null); setModal("create"); }}>✨ Create Template</button>
              </div>
            ) : (
              <div className="template-grid">
                {filtered.map(t => {
                  const s = STATUS_MAP[t.status] || STATUS_MAP.DRAFT;
                  const cat = CATEGORY_MAP[t.category] || { label: t.category, cls: "badge-gray" };
                  const bodyText = getBodyText(t.components);
                  return (
                    <div key={t.uuid} className="template-card" onClick={() => { setActiveTemplate(t); setModal("detail"); }}>
                      <div className="card-header">
                        <div>
                          <div className="card-name">{t.name}</div>
                          <div className="card-lang">{t.language} · {t.createdAt}</div>
                        </div>
                        <span className={`badge ${s.cls}`} style={{ flexShrink: 0, marginLeft: 8 }}>{s.icon} {s.label}</span>
                      </div>
                      <div className="card-body-preview">{bodyText}</div>
                      <div className="card-meta">
                        <span className={`badge ${cat.cls}`}>{cat.label}</span>
                        {(t.components || []).find(c => c.type === "BUTTONS")?.buttons?.slice(0, 2).map((b, i) => (
                          <span key={i} className="badge badge-gray">{b.type === "URL" ? "↗" : b.type === "QUICK_REPLY" ? "↩" : b.type === "OTP" ? "📋" : "▶"} {b.text}</span>
                        ))}
                        {(t.components || []).find(c => c.type === "CAROUSEL") && <span className="badge badge-blue">🎠 Carousel</span>}
                      </div>
                      <div className="card-actions" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setActiveTemplate(t); setModal("edit"); }}>✏️ Edit</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handlePublish(t.uuid)} disabled={publishing}>🚀 Publish</button>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", color: "var(--danger)" }} onClick={() => { setActiveTemplate(t); setModal("delete"); }}>🗑</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {(modal === "create" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <TemplateBuilder
            initial={modal === "edit" ? activeTemplate : null}
            onSave={modal === "edit" ? handleUpdate : handleCreate}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </div>
      )}

      {modal === "detail" && activeTemplate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <DetailModal
            template={activeTemplate}
            onClose={() => setModal(null)}
            onEdit={(t) => { setActiveTemplate(t); setModal("edit"); }}
            onDelete={(t) => { setActiveTemplate(t); setModal("delete"); }}
            onPublish={handlePublish}
            publishing={publishing}
          />
        </div>
      )}

      {modal === "delete" && activeTemplate && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">Delete Template</span>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="confirm-body">
              <div className="confirm-icon">🗑️</div>
              <div className="confirm-title">Delete this template?</div>
              <div className="confirm-desc">
                You're about to permanently delete <strong style={{ color: "var(--text)" }}>{activeTemplate.name}</strong>.<br />This action cannot be undone and will also remove it from Meta.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      {modal === "settings" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <SettingsModal config={config} onSave={setConfig} onClose={() => setModal(null)} />
        </div>
      )}

      <Toast toasts={toasts} />
    </>
  );
}

