import Link from "next/link";
import { TiltCard, GlassCard } from "@/components/ui";

const features = [
  {
    title: "Two-Layer Verification",
    desc: "Every social media post requires biometric or PIN confirmation. If you cannot confirm, the clock keeps ticking."
  },
  {
    title: "Cryptographic Proof",
    desc: "Ed25519 signatures stored on IPFS. Anyone can verify your attestations independently. No trust required."
  },
  {
    title: "Distress Protocol",
    desc: "Silent alarm via duress keypair. Appears normal to authorities. Alerts subscribers immediately."
  },
  {
    title: "Automatic Alerts",
    desc: "Subscribers notified via email and Telegram when you go silent, device is locked, or distress is signaled."
  },
];

const threatModels = [
  { threat: "Phone Stolen", mitigation: "Biometrics + PIN required to sign attestations" },
  { threat: "Forced Unlock", mitigation: "Distress keypair fires silent alarm while appearing compliant" },
  { threat: "Server Compromise", mitigation: "All attestations verifiable on IPFS. Zero-trust architecture." },
  { threat: "Fake Social Posts", mitigation: "Attestation must match. No signature = clock keeps ticking." },
  { threat: "Failed Login Attempts", mitigation: "3 strikes = device_locked alert fires automatically" },
  { threat: "Censorship", mitigation: "No app store. Progressive Web App. Resistant to takedown." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 py-20 md:py-32">
        <div className="fade-in-up space-y-8 text-center">
          <div className="inline-block">
            <div className="badge-gold">
              CLASSIFIED BRIEFING — EYES ONLY
            </div>
          </div>
          
          <h1 className="heading-serif text-6xl text-white md:text-8xl">
            Lifer
          </h1>
          
          <p className="mono-caps text-slate-400">
            Decentralized Safety Canary
          </p>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed" style={{ color: "var(--text-muted)" }}>
            A zero-trust proof-of-life system for journalists, activists, and whistleblowers.
            If you go silent — your trusted subscribers are automatically alerted.
            Ed25519 cryptography. IPFS attestations. No central authority.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link href="/register">
              <button className="glass-button-primary">
                Initialize Protocol
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="glass-button">
                Access Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-40 space-y-12">
          <div className="fade-in-up text-center">
            <h2 className="heading-serif text-5xl text-white">Operational Protocol</h2>
            <p className="mono-caps mt-4 text-slate-500">Four-layer security architecture</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <TiltCard key={feature.title} className={`fade-in-up-${i + 1} p-8`}>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full" 
                     style={{ 
                       background: "rgba(0, 255, 140, 0.1)", 
                       border: "1px solid rgba(0, 255, 140, 0.3)" 
                     }}>
                  <span className="mono-caps text-xl" style={{ color: "var(--safe-green)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mono-caps mb-3 text-sm text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {feature.desc}
                </p>
              </TiltCard>
            ))}
          </div>
        </div>

        {/* Threat Models */}
        <div className="mt-40">
          <GlassCard className="fade-in-up p-8 md:p-16">
            <h2 className="heading-serif mb-12 text-4xl text-white md:text-5xl">
              Built for Threat Models
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {threatModels.map((item, i) => (
                <div 
                  key={item.threat}
                  className={`fade-in-up-${i + 1} flex gap-4 border-l-2 pl-4`}
                  style={{ borderColor: "var(--safe-green)" }}
                >
                  <div>
                    <p className="mono-caps mb-1 text-xs" style={{ color: "var(--safe-green)" }}>
                      Threat Vector
                    </p>
                    <p className="mb-2 font-semibold text-white">{item.threat}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                      {item.mitigation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Trust Signals */}
        <div className="mt-40 text-center">
          <GlassCard className="fade-in-up mx-auto max-w-3xl p-12">
            <h3 className="heading-serif mb-6 text-3xl text-white">
              Zero Trust. Zero Compromise.
            </h3>
            <div className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--safe-green)" }} />
                <p style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold text-white">Open Source:</span> Audit the code. Run your own infrastructure. No black boxes.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--safe-green)" }} />
                <p style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold text-white">Decentralized:</span> IPFS attestations. Anyone can verify. No central point of failure.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--safe-green)" }} />
                <p style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold text-white">Progressive Web App:</span> No app store. No takedown risk. Install directly.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Footer */}
        <footer className="mt-40 border-t pt-12 text-center" style={{ borderColor: "var(--glass-border)" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Built for{" "}
            <a
              href="https://lu.ma/safetytechhackathon2026"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold transition-colors"
              style={{ color: "var(--safe-green)" }}
            >
              Safety Tech Hackathon 2026
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
