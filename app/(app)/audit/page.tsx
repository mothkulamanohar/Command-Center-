"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Shield,
  Filter,
  Download,
  CheckCircle2,
  Search,
  ArrowUpDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { getAuditLogsAction, exportAuditLogsCsvAction } from "./actions";

interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
  ip: string;
}

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEntry[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const res = await getAuditLogsAction({
        page: targetPage,
        pageSize: 20,
        search,
        action: selectedAction,
      });

      if (res.success && res.logs && res.logs.length > 0) {
        setEvents(res.logs as AuditEntry[]);
        setTotalPages(res.totalPages || 1);
        setTotalEntries(res.total || 0);
        setPage(res.page || 1);
        setIsLoading(false);
        return;
      }
    } catch {}

    const { auditStore } = await import("@/lib/store/auditStore");
    const fallbackLogs = auditStore.getEvents();
    const filtered = fallbackLogs.filter((l) => {
      const matchesAction = selectedAction === "ALL" || l.action === selectedAction;
      const matchesSearch =
        !search ||
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase());
      return matchesAction && matchesSearch;
    });

    setEvents(filtered as AuditEntry[]);
    setTotalPages(1);
    setTotalEntries(filtered.length);
    setPage(1);
    setIsLoading(false);
  }, [search, selectedAction]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleExportCsv = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const res = await exportAuditLogsCsvAction({ search, action: selectedAction });
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `System_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Audit log exported to CSV successfully.");
        return;
      }
    } catch {}

    try {
      const { auditStore } = await import("@/lib/store/auditStore");
      const logs = auditStore.getEvents();
      const csvRows = [
        "ID,Timestamp,Actor,Action,Entity,Details,IP",
        ...logs.map(
          (l) =>
            `"${l.id}","${l.timestamp}","${l.actor}","${l.action}","${l.entity}","${l.details.replace(/"/g, '""')}","${l.ip}"`
        ),
      ];
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `System_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Audit log exported to CSV successfully.");
    } catch {
      toast.error("Failed to export audit log");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">System Audit Log</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Immutable Record of All System Operations (SPEC §5 F-AUTH-08)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadData(page)}
            disabled={isLoading}
            className="p-1.5 bg-surface border border-line rounded-control text-xs text-ink hover:bg-surface-alt transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-line rounded-control text-xs cursor-pointer transition-colors ${
              showFilters
                ? "bg-primary text-white border-primary"
                : "bg-surface text-ink hover:bg-surface-alt"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-line rounded-control text-xs text-ink hover:bg-surface-alt transition-colors cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Export CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 bg-surface rounded-panel border border-line flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs animate-in fade-in">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-mutedText" />
            <input
              type="text"
              placeholder="Search by action, entity, details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-ground pl-8 pr-3 py-1.5 border border-line rounded-control focus:outline-none focus:border-primary font-mono text-xs text-ink"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-ground px-2.5 py-1.5 border border-line rounded-control font-mono text-xs text-ink focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE_TASK">CREATE_TASK</option>
              <option value="UPDATE_TASK">UPDATE_TASK</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CHECK_IN">CHECK_IN</option>
              <option value="CHECK_OUT">CHECK_OUT</option>
              <option value="REGULARIZE">REGULARIZE</option>
              <option value="ISSUE">ISSUE</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-surface rounded-panel border border-line shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-surface-alt/70 border-b border-line text-mutedText font-mono uppercase text-[10px]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Timestamp</th>
                <th className="px-4 py-2.5 font-semibold">Actor</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
                <th className="px-4 py-2.5 font-semibold">Entity</th>
                <th className="px-4 py-2.5 font-semibold">Details</th>
                <th className="px-4 py-2.5 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-mutedText">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      <span>Loading immutable audit records from PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-mutedText font-mono">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-ground/50 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-mutedText">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-mutedText" />
                        <span>{e.timestamp}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-semibold text-ink">
                      {e.actor}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                        {e.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-ink">
                      {e.entity}
                    </td>
                    <td className="px-4 py-2.5 text-mutedText max-w-xs truncate" title={e.details}>
                      {e.details}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-mutedText">
                      {e.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="px-4 py-3 border-t border-line bg-surface-alt/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-mutedText font-mono">
          <div>
            Showing <span className="font-bold text-ink">{events.length}</span> of{" "}
            <span className="font-bold text-ink">{totalEntries}</span> operations
          </div>
          <div className="flex items-center gap-2">
            <span>
              Page <span className="font-bold text-ink">{page}</span> of{" "}
              <span className="font-bold text-ink">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => loadData(page - 1)}
                className="p-1 rounded bg-surface border border-line hover:bg-surface-alt disabled:opacity-40 cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages || isLoading}
                onClick={() => loadData(page + 1)}
                className="p-1 rounded bg-surface border border-line hover:bg-surface-alt disabled:opacity-40 cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
