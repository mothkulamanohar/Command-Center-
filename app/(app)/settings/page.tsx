"use client";

import { useState } from "react";
import { Settings, Shield, Bell, Cpu, Plus, X, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [seniorPeople, setSeniorPeople] = useState<string[]>([
    "VC Office",
    "CEO Office",
    "COO Office",
    "Janardhan sir",
  ]);
  const [newSenior, setNewSenior] = useState("");
  const [ollamaHost, setOllamaHost] = useState("http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b-instruct");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddSenior = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSenior.trim()) return;
    setSeniorPeople([...seniorPeople, newSenior.trim()]);
    setNewSenior("");
    showToast("Senior list updated. Follow-ups to this person will require approval.");
  };

  const handleRemoveSenior = (person: string) => {
    setSeniorPeople(seniorPeople.filter((p) => p !== person));
    showToast("Person removed from approval requirement list.");
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">System Settings</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Organization Defaults, Approval Lists, Working Hours & Local AI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Org & Working Hours */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Work Hours & Timezone</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-line">
              <span className="text-mutedText">Timezone</span>
              <span className="font-mono text-ink font-semibold">Asia/Kolkata (IST)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line">
              <span className="text-mutedText">Working Days</span>
              <span className="font-mono text-ink font-semibold">Mon – Sat (09:00 – 18:00)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line">
              <span className="text-mutedText">Daily Update Cutoff</span>
              <span className="font-mono text-primary font-semibold">18:00 IST</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-mutedText">Quiet Hours</span>
              <span className="font-mono text-ink font-semibold">21:00 – 08:00 IST</span>
            </div>
          </div>
        </div>

        {/* Senior People List */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-chasing" />
              <h2 className="text-sm font-bold text-ink">Senior People (Approval Always)</h2>
            </div>
            <span className="text-[10px] font-mono bg-chasing/10 text-chasing px-1.5 py-0.5 rounded font-bold">
              SPEC §9.2
            </span>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Follow-ups sent to people in this list are held in Sri&apos;s Console queue for one-tap approval.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {seniorPeople.map((person) => (
              <span
                key={person}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-ground border border-line text-xs font-semibold text-ink"
              >
                <span>{person}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSenior(person)}
                  className="hover:text-danger text-mutedText"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSenior} className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="Add senior officer / department..."
              value={newSenior}
              onChange={(e) => setNewSenior(e.target.value)}
              className="flex-1 text-xs p-2 bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-control"
            >
              Add
            </button>
          </form>
        </div>

        {/* Local AI Engine */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-shared" />
            <h2 className="text-sm font-bold text-ink">Local AI Engine (Ollama)</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Rule parser handles 95% of commands (0ms latency). Local Ollama is only a fallback. Zero cloud dependencies.
          </p>

          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">OLLAMA_HOST</label>
              <input
                type="text"
                value={ollamaHost}
                onChange={(e) => setOllamaHost(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
            </div>
            <div>
              <label className="block text-mutedText text-[11px] mb-1 font-mono">MODEL</label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full p-2 bg-ground border border-line rounded-control font-mono text-xs text-ink"
              />
            </div>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Push Notifications (PWA)</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Self-hosted VAPID push keys. Works on Android Chrome and iOS (16.4+ installed to Home Screen).
          </p>

          <div className="p-3 rounded bg-surface-alt border border-line text-xs font-mono space-y-1">
            <div className="text-primary font-bold">VAPID Keys Active</div>
            <div className="text-mutedText text-[11px]">Subject: mailto:sri@smru.in</div>
            <div className="text-mutedText text-[11px]">Digest Mode: Enabled (bundled every 2 hours)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
