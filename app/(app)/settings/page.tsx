import { Settings, Shield, Bell, Cpu } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink tracking-tight">System Settings</h1>
        <p className="text-xs text-mutedText mt-0.5 font-mono">
          Organization defaults, Working Hours, Senior People, and AI Fallback
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Organization & Work Hours</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Timezone: Asia/Kolkata • Working days: Mon–Sat, 09:00–18:00 IST • Daily update deadline: 18:00.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-chasing" />
            <h2 className="text-sm font-semibold text-ink">Senior People List</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            CEO, COO, VC, Janardhan sir. Follow-ups to these individuals are always drafted in Approval Mode.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-4 w-4 text-shared" />
            <h2 className="text-sm font-semibold text-ink">Local AI Engine (Ollama)</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Model: qwen2.5:7b-instruct. Rule parser runs first; local LLM is only a fallback. Zero outside APIs.
          </p>
        </div>

        <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Notifications & Push</h2>
          </div>
          <p className="text-xs text-mutedText leading-relaxed">
            Self-hosted VAPID push keys. Quiet hours (21:00–08:00) and digest bundling.
          </p>
        </div>
      </div>
    </div>
  );
}
