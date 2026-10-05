import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Certificate — SMRU IT Command Center",
  description: "Official credential verification portal for St. Mary's Group of Institutions",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PublicVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col font-sans antialiased">
      {/* Public Header */}
      <header className="h-16 bg-surface border-b border-line px-4 md:px-8 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-control bg-primary text-white flex items-center justify-center font-bold font-mono text-sm shadow-xs">
            SM
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-ink uppercase">
              St. Mary&apos;s Group of Institutions
            </div>
            <div className="text-[11px] text-mutedText font-mono">
              Official Credential Verification Service
            </div>
          </div>
        </div>

        <a
          href="https://smru.edu.in"
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary hover:underline font-mono"
        >
          smru.edu.in &rarr;
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="py-4 border-t border-line text-center text-xs text-mutedText bg-surface">
        <div className="max-w-md mx-auto space-y-1">
          <p>© 2026 St. Mary&apos;s Group of Institutions (SMRU). All rights reserved.</p>
          <p className="text-[10px] text-mutedText/80 font-mono">
            Secure verification portal • Cryptographically validated credentials
          </p>
        </div>
      </footer>
    </div>
  );
}
