"use client";

import { Code2, Calendar, User as UserIcon } from "lucide-react";

export interface BuildMapItem {
  id: string;
  developerName: string;
  projectName: string;
  featureTitle: string;
  stack: string;
  status: string;
  startedAt: string;
  expectedAt: string;
}

interface BuildMapTableProps {
  items: BuildMapItem[];
}

export function BuildMapTable({ items }: BuildMapTableProps) {
  return (
    <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-xs">
      <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/40">
        <div>
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Code2 className="h-4 w-4 text-shared" />
            <span>Active Build Map</span>
            <span className="text-[10px] font-mono bg-shared/10 text-shared border border-shared/20 px-1.5 py-0.5 rounded font-semibold">
              F-DEV-02
            </span>
          </h2>
          <p className="text-xs text-mutedText mt-0.5">
            Real-time developer allocation and feature delivery schedule visible to leadership
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[550px] text-left text-xs">
          <thead className="bg-surface-alt/70 text-mutedText uppercase text-[10px] font-mono border-b border-line">
            <tr>
              <th className="py-2.5 px-4">Developer</th>
              <th className="py-2.5 px-3">Project</th>
              <th className="py-2.5 px-3">Active Feature</th>
              <th className="py-2.5 px-3">Stack</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-4">Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-surface-alt/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-ground border border-line flex items-center justify-center text-[9px] font-bold text-ink">
                      {item.developerName.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-semibold text-ink">{item.developerName}</span>
                  </div>
                </td>

                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-surface border border-line text-[11px] font-mono text-ink">
                    {item.projectName}
                  </span>
                </td>

                <td className="py-3 px-3 font-medium text-ink">
                  {item.featureTitle}
                </td>

                <td className="py-3 px-3 font-mono text-[10px] text-mutedText">
                  {item.stack}
                </td>

                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    {item.status}
                  </span>
                </td>

                <td className="py-3 px-4 font-mono text-[11px] text-mutedText">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.expectedAt}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
