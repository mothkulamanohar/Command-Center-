
import { MessageSquare, Hash, Plus } from "lucide-react";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Team Chat</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Fast Internal Messaging, Voice Notes, Task Chips, and Kudos
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-panel border border-line h-[500px] flex overflow-hidden shadow-xs">
        {/* Channel List */}
        <div className="w-64 border-r border-line bg-surface-alt flex flex-col">
          <div className="p-3 border-b border-line flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-mutedText font-semibold">
              Channels
            </span>
            <button
              type="button"
              className="p-1 hover:bg-ground rounded-control text-mutedText"
              aria-label="New Channel"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto">
            <div className="flex items-center gap-2 px-3 py-2 rounded-control bg-surface border border-line text-xs font-medium text-ink">
              <Hash className="h-3.5 w-3.5 text-primary" />
              <span>smru-campus-it</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-control text-xs font-medium text-mutedText hover:bg-surface">
              <Hash className="h-3.5 w-3.5 text-mutedText" />
              <span>dev-team</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-control text-xs font-medium text-mutedText hover:bg-surface">
              <Hash className="h-3.5 w-3.5 text-mutedText" />
              <span>uos-rollout</span>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface">
          <MessageSquare className="h-10 w-10 text-mutedText mb-3" />
          <h2 className="text-sm font-semibold text-ink">Welcome to Real-time Chat</h2>
          <p className="text-xs text-mutedText mt-1 max-w-sm">
            Socket.IO real-time channels, file sharing, voice notes, and live task chips (`T-xxxx`).
          </p>
        </div>
      </div>
    </div>
  );
}
