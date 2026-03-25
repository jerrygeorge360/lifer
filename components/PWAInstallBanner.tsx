"use client";

import { useState } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/**
 * PWAInstallBanner
 *
 * Shows a branded install prompt at the bottom of the screen when:
 *   - Android / Desktop Chrome: fires the native browser install dialog
 *   - iOS Safari: shows a step-by-step "Add to Home Screen" guide
 *
 * Renders nothing when:
 *   - The app is already installed (running in standalone mode)
 *   - The browser hasn't signalled the app is installable
 *   - The user has dismissed the banner
 *
 * Drop this into app/layout.tsx inside <body> — it's self-contained.
 */
export function PWAInstallBanner() {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Nothing to show
  if (!isInstallable || isInstalled || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    await triggerInstall();
    setInstalling(false);
  };

  return (
    <>
      {/* ── Main Banner ────────────────────────────────────────────────── */}
      <div
        role="banner"
        aria-label="Install Lifer app"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9000,
          width: "calc(100% - 2rem)",
          maxWidth: "480px",
          // Match the project's glass-card aesthetic from globals.css
          background: "rgba(8, 8, 8, 0.92)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(0, 255, 140, 0.2)",
          borderRadius: "20px",
          padding: "1.25rem 1.25rem 1.25rem 1.5rem",
          boxShadow:
            "0 0 0 1px rgba(0, 255, 140, 0.06), 0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "lifer-banner-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <style>{`
          @keyframes lifer-banner-up {
            from { opacity: 0; transform: translateX(-50%) translateY(16px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          {/* Shield icon */}
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(0, 255, 140, 0.08)",
              border: "1px solid rgba(0, 255, 140, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldIcon />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--safe-green)",
                marginBottom: "0.3rem",
              }}
            >
              Install Lifer
            </p>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.8rem",
                lineHeight: 1.5,
                color: "rgba(240, 244, 255, 0.75)",
              }}
            >
              {isIOS
                ? "Add to your Home Screen for offline access and instant alerts."
                : "Install for offline access, biometric auth, and push alerts."}
            </p>
          </div>

          {/* Dismiss × */}
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss install prompt"
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.25)",
              fontSize: "1.1rem",
              cursor: "pointer",
              padding: "0 0 0 0.5rem",
              lineHeight: 1,
              marginTop: "-2px",
            }}
          >
            ×
          </button>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginTop: "1rem",
          }}
        >
          {isIOS ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="glass-button-primary"
              style={{ flex: 1, padding: "0.625rem 1rem", fontSize: "0.75rem" }}
            >
              How to Install
            </button>
          ) : (
            <button
              onClick={handleInstall}
              disabled={installing}
              className="glass-button-primary"
              style={{
                flex: 1,
                padding: "0.625rem 1rem",
                fontSize: "0.75rem",
                opacity: installing ? 0.7 : 1,
              }}
            >
              {installing ? "Installing..." : "Install App"}
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="glass-button"
            style={{ padding: "0.625rem 1rem", fontSize: "0.75rem" }}
          >
            Later
          </button>
        </div>
      </div>

      {/* ── iOS Step-by-Step Guide Modal ───────────────────────────────── */}
      {showIOSGuide && (
        <IOSGuideModal onClose={() => { setShowIOSGuide(false); setDismissed(true); }} />
      )}
    </>
  );
}

// ── iOS Guide Modal ────────────────────────────────────────────────────────────

function IOSGuideModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      number: "01",
      icon: <ShareIcon />,
      title: "Tap the Share button",
      detail: "The box-with-arrow icon at the bottom of Safari's toolbar.",
    },
    {
      number: "02",
      icon: <AddIcon />,
      title: 'Tap "Add to Home Screen"',
      detail: "Scroll down in the share sheet until you find it.",
    },
    {
      number: "03",
      icon: <CheckIcon />,
      title: 'Tap "Add"',
      detail: "Confirm in the top-right corner. Lifer appears on your home screen.",
    },
  ];

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9100,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        padding: "1rem",
        animation: "lifer-fade-in 0.2s ease both",
      }}
    >
      <style>{`
        @keyframes lifer-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lifer-slide-up {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: "rgba(10, 10, 10, 0.97)",
          border: "1px solid rgba(0, 255, 140, 0.18)",
          borderRadius: 20,
          padding: "2rem",
          animation: "lifer-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
          boxShadow:
            "0 0 0 1px rgba(0,255,140,0.05), 0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div className="badge-gold" style={{ marginBottom: "0.75rem" }}>
            iPhone / iPad
          </div>
          <h2
            className="heading-serif"
            style={{ color: "var(--text-primary)", fontSize: "1.5rem", margin: 0 }}
          >
            Add to Home Screen
          </h2>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {steps.map(({ number, icon, title, detail }) => (
            <div
              key={number}
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                paddingBottom: "1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {/* Step number */}
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.65rem",
                  color: "rgba(0, 255, 140, 0.5)",
                  letterSpacing: "0.1em",
                  paddingTop: "3px",
                  flexShrink: 0,
                  width: 20,
                }}
              >
                {number}
              </span>

              {/* Icon */}
              <div
                style={{
                  flexShrink: 0,
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "rgba(0,255,140,0.07)",
                  border: "1px solid rgba(0,255,140,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </div>

              {/* Text */}
              <div>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    marginBottom: "0.2rem",
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="glass-button-primary"
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.75rem",
            fontSize: "0.8rem",
          }}
        >
          Got It
        </button>
      </div>
    </div>
  );
}

// ── Inline SVG icons (no external deps) ───────────────────────────────────────

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
        stroke="var(--safe-green)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="var(--safe-green)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
        stroke="var(--safe-green)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--safe-green)" strokeWidth="1.5" />
      <path d="M12 8v8M8 12h8" stroke="var(--safe-green)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="var(--safe-green)" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-5" stroke="var(--safe-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
