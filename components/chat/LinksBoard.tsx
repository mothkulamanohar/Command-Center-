"use client";

import { useState } from "react";
import { Link2, ExternalLink, Copy, Check, Search, Calendar, User as UserIcon } from "lucide-react";

export interface LinkItem {
  id: string;
  url: string;
  title?: string;
  channelName: string;
  authorName: string;
  createdAt: string;
}

interface LinksBoardProps {
  links: LinkItem[];
  onClose?: () => void;
}

export function LinksBoard({ links, onClose }: LinksBoardProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = links.filter(
    (l) =>
      l.url.toLowerCase().includes(search.toLowerCase()) ||
      l.channelName.toLowerCase().includes(search.toLowerCase()) ||
      (l.title && l.title.toLowerCase().includes(search.toLowerCase())) ||
      l.authorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/50">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Team Links Board</h2>
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded">
              F-CHAT-09
            </span>
          </div>
          <p className="text-xs text-mutedText mt-0.5">
            Auto-extracted web links, tools, and docs shared in conversations
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2.5 py-1 rounded-control bg-surface border border-line text-mutedText hover:text-ink font-medium"
          >
            Back to Chat
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-3 border-b border-line bg-surface">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-mutedText absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search links by URL, domain, channel, or sender..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Links List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-mutedText text-xs">
            No links found matching your criteria.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-card border border-line bg-surface hover:border-primary/40 transition-colors flex items-start justify-between gap-4 group"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    #{item.channelName}
                  </span>
                  <span className="text-xs font-semibold text-ink truncate">
                    {item.title || item.url}
                  </span>
                </div>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-mutedText hover:text-primary underline flex items-center gap-1 truncate font-mono"
                >
                  <span className="truncate">{item.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>

                <div className="flex items-center gap-3 text-[10px] text-mutedText pt-0.5">
                  <span className="flex items-center gap-1">
                    <UserIcon className="h-3 w-3" />
                    {item.authorName}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="h-3 w-3" />
                    {item.createdAt}
                  </span>
                </div>
              </div>

              {/* Copy URL Button */}
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.url)}
                className="p-1.5 rounded-control border border-line bg-surface-alt hover:bg-ground text-mutedText hover:text-ink transition-colors shrink-0"
                title="Copy Link URL"
              >
                {copiedId === item.id ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
