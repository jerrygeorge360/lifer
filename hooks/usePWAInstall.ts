"use client";

import { useState, useEffect } from "react";

// Chrome / Edge fire this event before showing their own install UI.
// We intercept it so we can show our own branded install button instead.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAInstallState {
  /** True when the browser has signalled the app is installable */
  isInstallable: boolean;
  /** True when already running as an installed PWA (standalone mode) */
  isInstalled: boolean;
  /** True on iOS Safari — which never fires beforeinstallprompt */
  isIOS: boolean;
  /** Call this to trigger the native install prompt on Android / Desktop */
  triggerInstall: () => Promise<boolean>;
}

export function usePWAInstall(): PWAInstallState {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ── Already installed? ────────────────────────────────────────────────
    // matchMedia checks Chrome/Android standalone.
    // navigator.standalone is the iOS Safari equivalent.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (standalone) {
      setIsInstalled(true);
      return; // No need to set up install prompts — already running as PWA
    }

    // ── iOS detection ─────────────────────────────────────────────────────
    // iOS Safari never fires beforeinstallprompt. We detect it separately
    // so we can show manual "Add to Home Screen" instructions instead.
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;

    setIsIOS(ios);
    if (ios) {
      setIsInstallable(true); // iOS can always be added to home screen manually
    }

    // ── Android / Desktop Chrome / Edge ───────────────────────────────────
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Stop the browser's default mini-infobar
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstallable(false);
    }

    return outcome === "accepted";
  };

  return { isInstallable, isInstalled, isIOS, triggerInstall };
}



