"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Crown,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  AppRole,
  ROLE_DEFINITIONS,
  COMPLETE_ROLE_MATRIX,
} from "@/lib/auth/roles";

export function RoleMatrixTable() {
  const [selectedRole, setSelectedRole] = useState<AppRole | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const rolesList: AppRole[] = [
    "PLATFORM_ADMIN",
    "IT_MANAGER",
    "LEAD",
    "DEVELOPER",
    "MEMBER",
    "INTERN",
    "GUEST",
  ];

  return (
    <div className="space-y-6">
      {/* Role Distinction Banner */}
      <div className="p-4 rounded-panel bg-gradient-to-r from-purple-950/20 via-blue-950/20 to-surface border border-purple-800/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-control bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink">Role Matrix & Privilege Governance</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/50 font-bold">
                OWNER CONTROLLED
              </span>
            </div>
            <p className="text-xs text-mutedText mt-0.5">
              The <strong className="text-ink">Platform Admin (Owner)</strong> holds supreme system ownership and role configuration.
              The <strong className="text-ink">IT Manager (Sri)</strong> is the primary operational authority leading tasks, teams, attendance, reports, and certificates.
            </p>
          </div>
        </div>

        {/* Role Quick Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-mono text-mutedText uppercase mr-1">Inspect:</span>
          <button
            type="button"
            onClick={() => setSelectedRole("ALL")}
            className={`px-2.5 py-1 text-xs rounded-control font-mono transition-all cursor-pointer ${
              selectedRole === "ALL"
                ? "bg-ink text-white font-bold shadow-xs"
                : "bg-surface border border-line text-mutedText hover:text-ink"
            }`}
          >
            All Roles
          </button>
          {rolesList.map((r) => {
            const def = ROLE_DEFINITIONS[r];
            const isSelected = selectedRole === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                className={`px-2 py-1 text-xs rounded-control font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "bg-surface border border-line text-mutedText hover:text-ink"
                }`}
              >
                <span>{def.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Definitions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rolesList.map((roleKey) => {
          const def = ROLE_DEFINITIONS[roleKey];
          const isSelected = selectedRole === "ALL" || selectedRole === roleKey;
          return (
            <div
              key={roleKey}
              onClick={() => setSelectedRole(roleKey)}
              className={`p-3.5 rounded-panel border transition-all cursor-pointer text-left ${
                isSelected
                  ? "bg-surface border-line shadow-xs hover:border-primary/40"
                  : "bg-surface/50 border-line/40 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: def.color }}
                  >
                    {def.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink leading-tight">{def.name}</div>
                    <div className="text-[10px] text-mutedText font-mono">{def.title}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${def.badgeBg}`}>
                  {def.badge}
                </span>
              </div>
              <p className="text-[11px] text-mutedText leading-relaxed line-clamp-3">
                {def.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Complete Matrix Table */}
      <div className="bg-surface rounded-panel border border-line shadow-xs overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ground/40">
          <div>
            <h4 className="text-xs font-bold text-ink font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Full Privileges Matrix</span>
            </h4>
            <p className="text-[11px] text-mutedText mt-0.5">
              Authoritative access capabilities per user role category
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search privileges..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2.5 py-1 text-xs bg-surface border border-line rounded-control text-ink focus:outline-none w-48 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-ground/70 border-b border-line text-[11px] font-mono text-mutedText">
                <th className="p-3 w-72 font-semibold">Privilege & Scope</th>
                {(selectedRole === "ALL" ? rolesList : [selectedRole]).map((r) => {
                  const def = ROLE_DEFINITIONS[r];
                  return (
                    <th key={r} className="p-2.5 text-center border-l border-line font-semibold">
                      <div className="text-ink font-bold">{def.name}</div>
                      <div className="text-[10px] text-mutedText">{def.title}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {COMPLETE_ROLE_MATRIX.map((group) => {
                const filteredPrivileges = group.privileges.filter(
                  (p) =>
                    !searchTerm ||
                    p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.description.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (filteredPrivileges.length === 0) return null;

                return (
                  <React.Fragment key={group.category}>
                    <tr className="bg-ground/40">
                      <td
                        colSpan={(selectedRole === "ALL" ? rolesList.length : 1) + 1}
                        className="px-3 py-2 text-[11px] font-bold font-mono text-ink uppercase tracking-wider bg-ground/80"
                      >
                        {group.category}
                      </td>
                    </tr>
                    {filteredPrivileges.map((priv) => (
                      <tr key={priv.id} className="hover:bg-ground/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-ink">{priv.label}</div>
                          <div className="text-[11px] text-mutedText mt-0.5">{priv.description}</div>
                        </td>
                        {(selectedRole === "ALL" ? rolesList : [selectedRole]).map((r) => {
                          const isAllowed = priv.allowedRoles.includes(r);
                          const isPlatformOwner = r === "PLATFORM_ADMIN";
                          const isItManager = r === "IT_MANAGER";

                          return (
                            <td
                              key={r}
                              className={`p-2.5 text-center border-l border-line/60 font-mono text-[11px] ${
                                isAllowed
                                  ? isPlatformOwner
                                    ? "bg-purple-950/10 text-purple-700 dark:text-purple-300 font-bold"
                                    : isItManager
                                    ? "bg-blue-950/10 text-blue-700 dark:text-blue-300 font-bold"
                                    : "bg-emerald-950/5 text-emerald-700 dark:text-emerald-300"
                                  : "text-mutedText/40"
                              }`}
                            >
                              {isAllowed ? (
                                <div className="inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 inline" />
                                  <span className="text-[10px]">Granted</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 opacity-50">
                                  <XCircle className="h-3.5 w-3.5 text-mutedText inline" />
                                  <span className="text-[10px]">Restricted</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
