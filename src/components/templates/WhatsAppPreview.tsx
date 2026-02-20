import { useState } from "react";
import { Signal, Battery, Wifi, Sun, Moon, Play, FileText } from "lucide-react";
import type { TemplateComponent, TemplateButton } from "@/types/template.types";

// ── WhatsApp Theme tokens ─────────────────────────────────────
const THEMES = {
  dark: {
    phoneBg: "#111b21",
    phoneBorder: "#2a3942",
    statusText: "#ffffff",
    appHeaderBg: "#1f2c34",
    appHeaderText: "#ffffff",
    appHeaderSub: "#8696a0",
    chatBg: "#0b141a",
    bubbleBg: "#202c33",
    bodyText: "#e9edef",
    boldText: "#e9edef",
    // footerText: "#8696a0",
    footerText: "#c9d1d9",
    timestamp: "#8696a0",
    buttonColor: "#00a5f4",
    dividerColor: "#2a3942",
    cardBg: "#2a3942",
    inputBarBg: "#1f2c34",
    inputFieldBg: "#2a3942",
    // inputFieldText: "#8696a0",
    inputFieldText: "#ffffff",
    imagePlaceholderFrom: "#334155",
    imagePlaceholderTo: "#475569",
    imagePlaceholderIcon: "#94a3b8",
    videoBgFrom: "#1e293b",
    videoBgTo: "#0f172a",
    videoIcon: "#94a3b8",
    docBgFrom: "#1a2c35",
    docBgTo: "#162330",
    docIcon: "#00a5f4",
    docText: "#c9d1d9",
  },
  light: {
    phoneBg: "#111b21",
    phoneBorder: "#2a3942",
    statusText: "#ffffff",
    appHeaderBg: "#008069",
    appHeaderText: "#ffffff",
    appHeaderSub: "#7abfb0",
    chatBg: "#efeae2",
    bubbleBg: "#d9fdd3",
    bodyText: "#111b21",
    boldText: "#111b21",
    footerText: "#667781",
    timestamp: "#667781",
    buttonColor: "#008069",
    dividerColor: "#c8d4ca",
    cardBg: "#ffffff",
    inputBarBg: "#f0f2f5",
    inputFieldBg: "#ffffff",
    inputFieldText: "#8696a0",
    imagePlaceholderFrom: "#cbd5e1",
    imagePlaceholderTo: "#e2e8f0",
    imagePlaceholderIcon: "#94a3b8",
    videoBgFrom: "#475569",
    videoBgTo: "#334155",
    videoIcon: "#e2e8f0",
    docBgFrom: "#eff6ff",
    docBgTo: "#dbeafe",
    docIcon: "#3b82f6",
    docText: "#1d4ed8",
  },
} as const;

type PreviewTheme = "dark" | "light";

// ── Props ─────────────────────────────────────────────────────
export interface WhatsAppPreviewProps {
  name?: string;
  components: TemplateComponent[];
  variables?: Record<string, string>;
  /** Object URL or data URL of the uploaded header media */
  mediaPreviewUrl?: string;
  /** MIME type e.g. "image/jpeg", "video/mp4", "application/pdf" */
  mediaType?: string;
  /** Filename shown for document headers */
  mediaFileName?: string;
  /** Override theme externally (hides toggle) */
  theme?: PreviewTheme;
  /** Default true — show the dark/light toggle */
  showThemeToggle?: boolean;
}

function resolveVars(text: string, vars?: Record<string, string>) {
  if (!vars) return text;
  return text.replace(/\{\{(\d+)\}\}/g, (_, n) => vars[n] || `{{${n}}}`);
}

// ── Header Media Preview ──────────────────────────────────────
function HeaderPreview({
  component,
  t,
  mediaPreviewUrl,
  mediaType,
  mediaFileName,
}: {
  component: TemplateComponent;
  t: (typeof THEMES)[PreviewTheme];
  mediaPreviewUrl?: string;
  mediaType?: string;
  mediaFileName?: string;
}) {
  const isImage = mediaType?.startsWith("image/");
  const isVideo = mediaType?.startsWith("video/");

  switch (component.format) {
    /* ── IMAGE ─────────────────────────────────────── */
    case "IMAGE":
      if (mediaPreviewUrl && isImage) {
        return (
          <div className="w-full h-36 overflow-hidden rounded-t-[9px] relative">
            <img
              src={mediaPreviewUrl}
              alt="Header"
              className="w-full h-full object-cover"
            />
            {/* Subtle vignette so text below reads clearly */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        );
      }
      return (
        <div
          className="w-full h-36 rounded-t-[9px] flex flex-col items-center justify-center gap-1.5"
          style={{
            background: `linear-gradient(135deg, ${t.imagePlaceholderFrom}, ${t.imagePlaceholderTo})`,
          }}
        >
          <svg
            className="w-10 h-10"
            style={{ color: t.imagePlaceholderIcon }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs" style={{ color: t.imagePlaceholderIcon }}>
            Image Header
          </span>
        </div>
      );

    /* ── VIDEO ─────────────────────────────────────── */
    case "VIDEO":
      if (mediaPreviewUrl && isVideo) {
        return (
          <div className="w-full h-36 rounded-t-[9px] overflow-hidden relative bg-black">
            <video
              src={mediaPreviewUrl}
              className="w-full h-full object-cover opacity-75"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur flex items-center justify-center shadow-lg">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            {/* Duration badge placeholder */}
            <div className="absolute bottom-1.5 right-2 bg-black/60 rounded px-1.5 py-0.5">
              <span className="text-white text-[9px] font-medium">0:00</span>
            </div>
          </div>
        );
      }
      return (
        <div
          className="w-full h-36 rounded-t-[9px] flex flex-col items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${t.videoBgFrom}, ${t.videoBgTo})`,
          }}
        >
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
            <Play className="w-5 h-5 fill-current ml-0.5" style={{ color: t.videoIcon }} />
          </div>
          <span className="text-xs" style={{ color: t.videoIcon }}>
            Video Header
          </span>
        </div>
      );

    /* ── DOCUMENT ──────────────────────────────────── */
    case "DOCUMENT":
      return (
        <div
          className="w-full rounded-t-[9px] flex items-center gap-3 px-3 py-3"
          style={{
            background: `linear-gradient(135deg, ${t.docBgFrom}, ${t.docBgTo})`,
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <FileText className="w-5 h-5" style={{ color: t.docIcon }} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: t.docText }}
            >
              {mediaFileName || "Document.pdf"}
            </p>
            <p
              className="text-[10px] mt-0.5 uppercase tracking-wide opacity-70"
              style={{ color: t.docText }}
            >
              {mediaType?.split("/")[1] || "PDF"} · Tap to open
            </p>
          </div>
          {/* Download icon */}
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: t.docIcon }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
      );

    /* ── TEXT ──────────────────────────────────────── */
    case "TEXT":
      return (
        <div className="px-3 pt-2.5 pb-0">
          <p
            className="font-bold text-[13px] leading-snug"
            style={{ color: t.boldText }}
          >
            {component.text || ""}
          </p>
        </div>
      );

    default:
      return null;
  }
}

// ── Buttons Preview ───────────────────────────────────────────
function ButtonsPreview({
  buttons,
  t,
}: {
  buttons: TemplateButton[];
  t: (typeof THEMES)[PreviewTheme];
}) {
  return (
    <div
      className="mt-0.5"
      style={{ borderTop: `1px solid ${t.dividerColor}` }}
    >
      {buttons.map((btn, i) => (
        <div
          key={i}
          className="flex items-center justify-center gap-1.5 py-2 text-[12.5px] font-medium"
          style={{
            color: t.buttonColor,
            ...(i > 0 ? { borderTop: `1px solid ${t.dividerColor}` } : {}),
          }}
        >
          {btn.type === "URL" && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
          {btn.type === "PHONE_NUMBER" && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          )}
          {btn.type === "OTP" && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {btn.type === "FLOW" && (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          <span>{btn.text || `Button ${i + 1}`}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────
export default function WhatsAppPreview({
  name,
  components,
  variables,
  mediaPreviewUrl,
  mediaType,
  mediaFileName,
  theme: controlledTheme,
  showThemeToggle = true,
}: WhatsAppPreviewProps) {
  const [internalTheme, setInternalTheme] = useState<PreviewTheme>("light");
  const activeTheme: PreviewTheme = controlledTheme ?? internalTheme;
  const t = THEMES[activeTheme];

  const header = components.find((c) => c.type === "HEADER");
  const body = components.find((c) => c.type === "BODY");
  const footer = components.find((c) => c.type === "FOOTER");
  const buttonsComp = components.find((c) => c.type === "BUTTONS");
  const carousel = components.find((c) => c.type === "CAROUSEL");
  const isAuthentication = body?.add_security_recommendation;

  return (
    <div className="flex flex-col items-center w-full select-none">

      {/* ── Theme Toggle ── */}
      {showThemeToggle && !controlledTheme && (
        <div className="flex items-center justify-between w-70 mb-3">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
            Preview
          </span>
          <button
            type="button"
            onClick={() =>
              setInternalTheme((p) => (p === "dark" ? "light" : "dark"))
            }
            aria-label={`Switch to ${activeTheme === "dark" ? "light" : "dark"} mode`}
            className="group flex items-center gap-0 rounded-full overflow-hidden border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary"
            style={{
              borderColor: activeTheme === "dark" ? "#2a3942" : "#d1e7dd",
            }}
          >
            {/* Dark segment */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
              style={{
                background: activeTheme === "dark" ? "#1e2d35" : "transparent",
                color: activeTheme === "dark" ? "#e9edef" : "#94a3b8",
              }}
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </div>
            {/* Divider */}
            <div
              className="w-px h-5 transition-colors duration-300"
              style={{
                background: activeTheme === "dark" ? "#2a3942" : "#d1e7dd",
              }}
            />
            {/* Light segment */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-all duration-300"
              style={{
                background: activeTheme === "light" ? "#f0fdf4" : "transparent",
                color: activeTheme === "light" ? "#16a34a" : "#94a3b8",
              }}
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </div>
          </button>
        </div>
      )}

      {/* ── Phone Frame ── */}
      <div
        className="w-70 rounded-[36px] p-3 shadow-2xl transition-colors duration-300"
        style={{
          background: t.phoneBg,
          border: `1.5px solid ${t.phoneBorder}`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)`,
        }}
      >
        {/* Pill notch */}
        <div className="flex justify-center mb-1.5">
          <div className="w-14 h-[4px] rounded-full bg-slate-600 opacity-50" />
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-3 pb-1.5">
          <span className="text-[10px] font-semibold" style={{ color: t.statusText }}>
            9:41
          </span>
          <div className="flex items-center gap-1" style={{ color: t.statusText }}>
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* WhatsApp app header */}
        <div
          className=" flex items-center gap-2 px-3 py-2.5 transition-colors duration-300"
          style={{ background: t.appHeaderBg }}
        >
          {/* Back chevron */}
          <svg
            className="w-3.5 h-[14px] shrink-0"
            style={{ color: t.appHeaderText }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-[10px] font-bold shadow-sm">
            {name ? name[0].toUpperCase() : "B"}
          </div>
          {/* Contact info */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-semibold leading-tight truncate"
              style={{ color: t.appHeaderText }}
            >
              {name || "Business"}
            </p>
            <p className="text-[9px]" style={{ color: t.appHeaderSub }}>
              Business Account
            </p>
          </div>
          {/* Action icons */}
          <div className="flex items-center gap-3 shrink-0" style={{ color: t.appHeaderText }}>
            <svg className="w-3.5 h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg className="w-3.5 h-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>

        {/* ── Chat Area ── */}
        <div
          className="h-95 overflow-auto px-3 pt-3 pb-10 relative transition-colors duration-300"
          style={{ background: t.chatBg }}
        >
          {/* Wallpaper dots for light mode */}
          {activeTheme === "light" && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #000 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
          )}

          {/* ── Message bubble ── */}
          <div className="ml-auto max-w-[95%] relative">

            {/* ─ Authentication OTP ─ */}
            {isAuthentication ? (
              <div
                className="rounded-[10px] overflow-hidden shadow-sm transition-colors duration-300"
                style={{ background: t.bubbleBg }}
              >
                <div className="px-3 pt-3 pb-1.5">
                  <p className="text-[12.5px] leading-relaxed" style={{ color: t.bodyText }}>
                    <span className="font-bold">123456</span> is your verification code.
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: t.footerText }}>
                    🔒 For your security, do not share this code.
                  </p>
                </div>
                {buttonsComp?.buttons && (
                  <ButtonsPreview buttons={buttonsComp.buttons} t={t} />
                )}
                <div className="flex justify-end items-center gap-1 px-3 pb-2 pt-1">
                  <span className="text-[10px]" style={{ color: t.timestamp }}>
                    10:24 AM
                  </span>
                  <span className="text-[10px] text-[#53bdeb]">✓✓</span>
                </div>
              </div>

              /* ─ Carousel ─ */
            ) : carousel ? (
              <div
                className="rounded-[10px] overflow-hidden shadow-sm transition-colors duration-300"
                style={{ background: t.bubbleBg }}
              >
                {body?.text && (
                  <p
                    className="text-[12.5px] leading-relaxed px-3 pt-3 pb-1"
                    style={{ color: t.bodyText }}
                  >
                    {resolveVars(body.text, variables)}
                  </p>
                )}
                <div className="flex gap-2 px-2 pb-2 overflow-x-auto">
                  {(carousel.cards || []).map((card, i) => {
                    const cHeader = card.components.find((c) => c.type === "HEADER");
                    const cBody = card.components.find((c) => c.type === "BODY");
                    const cBtns = card.components.find((c) => c.type === "BUTTONS");
                    return (
                      <div
                        key={i}
                        className="min-w-[160px] rounded-lg overflow-hidden shrink-0 shadow"
                        style={{ background: t.cardBg }}
                      >
                        {cHeader?.format === "IMAGE" && (
                          <div
                            className="h-24 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${t.imagePlaceholderFrom}, ${t.imagePlaceholderTo})`,
                            }}
                          >
                            <svg
                              className="w-8 h-8"
                              style={{ color: t.imagePlaceholderIcon }}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        {cBody?.text && (
                          <p
                            className="text-[11px] px-2 py-1.5"
                            style={{ color: t.bodyText }}
                          >
                            {cBody.text}
                          </p>
                        )}
                        {cBtns?.buttons?.map((btn, j) => (
                          <div
                            key={j}
                            className="py-1.5 text-center text-[11px]"
                            style={{
                              color: t.buttonColor,
                              borderTop: `1px solid ${t.dividerColor}`,
                            }}
                          >
                            {btn.text}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end items-center gap-1 px-3 pb-2">
                  <span className="text-[10px]" style={{ color: t.timestamp }}>
                    10:24 AM
                  </span>
                  <span className="text-[10px] text-[#53bdeb]">✓✓</span>
                </div>
              </div>

              /* ─ Standard ─ */
            ) : (
              <div
                className="rounded-[10px] overflow-hidden shadow-sm transition-colors duration-300"
                style={{ background: t.bubbleBg }}
              >
                {/* Pointer tail */}
                <div
                  className="absolute right-[-6px] top-2 w-0 h-0"
                  style={{
                    borderLeft: `6px solid ${t.bubbleBg}`,
                    borderTop: "4px solid transparent",
                    borderBottom: "4px solid transparent",
                  }}
                />
                {header && (
                  <HeaderPreview
                    component={header}
                    t={t}
                    mediaPreviewUrl={mediaPreviewUrl}
                    mediaType={mediaType}
                    mediaFileName={mediaFileName}
                  />
                )}
                <div
                  className={`px-3 pb-1 ${header?.format && header.format !== "TEXT" ? "pt-2" : "pt-2.5"
                    }`}
                >
                  {body?.text && (
                    <p
                      className="text-[12.5px] leading-relaxed whitespace-pre-wrap"
                      style={{ color: t.bodyText }}
                    >
                      {resolveVars(body.text, variables)}
                    </p>
                  )}
                  {footer?.text && (
                    <p
                      className="text-[11px] mt-1.5"
                      style={{ color: t.footerText }}
                    >
                      {footer.text}
                    </p>
                  )}
                  <div className="flex justify-end items-center gap-1 mt-1 pb-0.5">
                    <span className="text-[10px]" style={{ color: t.timestamp }}>
                      10:24 AM
                    </span>
                    <span className="text-[10px] text-[#53bdeb]">✓✓</span>
                  </div>
                </div>
                {buttonsComp?.buttons && (
                  <ButtonsPreview buttons={buttonsComp.buttons} t={t} />
                )}
              </div>
            )}
          </div>
        </div>
        {/* ── Input bar ── */}
        <div
          className="rounded-b-2xl flex items-center gap-2 px-3 py-1.5 transition-colors duration-300"
          style={{ background: t.inputBarBg }}
        >
          {/* Emoji icon */}
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: t.appHeaderSub }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div
            className="flex-1 rounded-full px-3 py-1 text-[10px]"
            style={{
              background: t.inputFieldBg,
              color: t.inputFieldText,
            }}
          >
            Message
          </div>
          {/* Attachment */}
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: t.appHeaderSub }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          {/* Mic / Send */}
          <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93V8h2v1c0 3.31 2.69 6 6 6s6-2.69 6-6V8h2v1c0 4.08-3.06 7.44-7 7.93V19h3v2H9v-2h3v-2.07z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Template name pill */}
      {name && (
        <p className="mt-3 text-[11px] text-muted-foreground font-mono bg-muted px-3 py-0.5 rounded-full border border-border/60">
          {name}
        </p>
      )}
    </div>
  );
}
