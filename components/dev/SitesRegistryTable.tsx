"use client";

import { useState } from "react";
import { Globe, ShieldCheck, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";

export interface SiteItem {
  id: string;
  domain: string;
  url: string;
  hosting?: string | null;
  dns?: string | null;
  sslExpiresAt?: string | null;
  sslDaysRemaining?: number;
  lastStatus: "UP" | "DOWN" | "UNKNOWN";
  uptimePercent: number;
  lastCheckedAt?: string | null;
}

interface SitesRegistryTableProps {
  sites: SiteItem[];
  onPing: (id: string) => void;
}

export function SitesRegistryTable({ sites, onPing }: SitesRegistryTableProps) {
  const [pingingId, setPingingId] = useState<string | null>(null);

  const handlePing = async (id: string) => {
    setPingingId(id);
    await onPing(id);
    setTimeout(() => setPingingId(null), 800);
  };

  return (
    <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-xs">
      <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/40">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Sites & Domains Registry</span>
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
              F-DEV-07
            </span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            5-minute automated HTTP uptime checks & SSL certificate expiry tracking
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-alt/70 text-mutedText uppercase text-[10px] font-mono border-b border-line">
            <tr>
              <th className="py-2.5 px-4">Domain</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Uptime (7d)</th>
              <th className="py-2.5 px-3">SSL Certificate</th>
              <th className="py-2.5 px-3">Hosting / DNS</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sites.map((site) => {
              const isSslWarning = site.sslDaysRemaining !== undefined && site.sslDaysRemaining <= 30;
              const isSslCritical = site.sslDaysRemaining !== undefined && site.sslDaysRemaining <= 7;

              return (
                <tr key={site.id} className="hover:bg-surface-alt/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink">{site.domain}</span>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-mutedText hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        site.lastStatus === "UP"
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : site.lastStatus === "DOWN"
                          ? "bg-danger/10 text-danger border border-danger/30"
                          : "bg-ground text-mutedText border border-line"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          site.lastStatus === "UP"
                            ? "bg-primary"
                            : site.lastStatus === "DOWN"
                            ? "bg-danger"
                            : "bg-mutedText"
                        }`}
                      />
                      <span>{site.lastStatus}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-ink font-medium">
                    {site.uptimePercent}%
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {isSslCritical ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-danger shrink-0" />
                      ) : (
                        <ShieldCheck
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isSslWarning ? "text-chasing" : "text-primary"
                          }`}
                        />
                      )}
                      <span
                        className={`font-mono text-[11px] ${
                          isSslCritical
                            ? "text-danger font-bold"
                            : isSslWarning
                            ? "text-chasing font-semibold"
                            : "text-mutedText"
                        }`}
                      >
                        {site.sslDaysRemaining !== undefined
                          ? `${site.sslDaysRemaining} days`
                          : site.sslExpiresAt || "Valid"}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-mutedText text-[11px]">
                    {site.hosting || "Cloud"} · {site.dns || "Cloudflare"}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handlePing(site.id)}
                      disabled={pingingId === site.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control bg-surface border border-line hover:bg-ground text-mutedText hover:text-ink text-xs transition-colors"
                      title="Run manual HTTP check"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${pingingId === site.id ? "animate-spin text-primary" : ""}`}
                      />
                      <span>Ping</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
