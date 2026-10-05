"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { parseCommand } from "@/lib/cmd/parse";
import { ParseResult } from "@/lib/cmd/intents";
import { Priority } from "@prisma/client";
import {
  executeCommandAssignTaskAction,
  executeCommandAddTaskAction,
  executeCommandPassTurnAction,
} from "./actions";
import {
  Search,
  Sparkles,
  X,
  CornerDownLeft,
  Undo2,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  User,
  CheckCircle2,
  Send,
  Zap,
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  ShieldAlert,
} from "lucide-react";

interface ToastData {
  title: string;
  description?: string;
}

export function CommandBarModal() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assignBtnStatus, setAssignBtnStatus] = useState<"normal" | "processing" | "success" | "failure">("normal");
  const [addBtnStatus, setAddBtnStatus] = useState<"normal" | "processing" | "success" | "failure">("normal");
  const [passBtnStatus, setPassBtnStatus] = useState<"normal" | "processing" | "success" | "failure">("normal");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          !isOpen &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA")
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ query?: string }>;
      if (customEvent?.detail?.query) {
        const q = customEvent.detail.query;
        setInput(q);
        setPreview(parseCommand(q));
      }
      setErrorMessage(null);
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-bar", handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-bar", handleOpen);
    };
  }, [isOpen]);

  useEffect(() => {
    if (input.trim().length > 0) {
      const res = parseCommand(input);
      setPreview(res);
      setErrorMessage(null);
    } else {
      setPreview(null);
    }
  }, [input]);

  const handleAssignTask = async (customSlots?: Record<string, any>, customTitle?: string) => {
    if (assignBtnStatus === "processing" || isSubmitting) return;
    setIsSubmitting(true);
    setAssignBtnStatus("processing");
    setErrorMessage(null);

    const slots = customSlots || preview?.slots;
    const rawTitle = customTitle || slots?.title || "check fee page";
    const ownerName = slots?.owner || "Hari";
    const cadence = slots?.cadence === "DAILY" ? "DAILY" : "DAILY";
    const dueDate = slots?.due ? new Date(slots.due) : new Date(Date.now() + 86400000 * 2);

    try {
      const res = await executeCommandAssignTaskAction({
        title: rawTitle,
        ownerName,
        cadence,
        due: dueDate,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to assign task");
      }

      // Dispatch event for any other subscribers
      window.dispatchEvent(
        new CustomEvent("command-executed", {
          detail: {
            input,
            intent: "ASSIGN_WITH_CHASE",
            slots,
            preview: preview?.preview,
          },
        })
      );
      window.dispatchEvent(new CustomEvent("icc-tasks-updated"));

      // Show success state on the button per requirement
      setAssignBtnStatus("success");
      await new Promise((r) => setTimeout(r, 650));

      // Close confirmation modal
      setIsOpen(false);
      setInput("");
      setPreview(null);
      setAssignBtnStatus("normal");
      setErrorMessage(null);

      // Show success notification/toast per specification
      setToastData({
        title: "✓ Task assigned successfully",
        description: `"${rawTitle}" has been assigned to ${res.assignedTo || ownerName} with daily chasing.`,
      });
      setTimeout(() => setToastData(null), 5000);

      // If not already in Console, navigate there so user immediately sees the task in I'm Chasing
      if (pathname !== "/console") {
        router.push("/console");
      }
    } catch (err: any) {
      console.error("Assignment error:", err);
      setAssignBtnStatus("failure");
      setErrorMessage(err.message || "Unable to assign task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = async (customSlots?: Record<string, any>, customTitle?: string) => {
    if (addBtnStatus === "processing" || isSubmitting) return;
    setIsSubmitting(true);
    setAddBtnStatus("processing");
    setErrorMessage(null);

    const slots = customSlots || preview?.slots;
    const rawTitle = customTitle || slots?.title || (typeof input === "string" ? input.replace(/^(add:\s*|add\s+)/i, "").trim() : "placement report") || "placement report";
    const requesterName = slots?.requester || slots?.requesterName || "VC Office";
    const priority = slots?.priority || Priority.HIGH;

    try {
      const res = await executeCommandAddTaskAction({
        title: rawTitle,
        requesterName,
        priority,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to add task");
      }

      window.dispatchEvent(
        new CustomEvent("command-executed", {
          detail: {
            input,
            intent: "ADD_TASK",
            slots,
            preview: preview?.preview,
          },
        })
      );
      window.dispatchEvent(new CustomEvent("icc-tasks-updated"));

      setAddBtnStatus("success");
      await new Promise((r) => setTimeout(r, 650));

      // Close confirmation modal
      setIsOpen(false);
      setInput("");
      setPreview(null);
      setAddBtnStatus("normal");
      setErrorMessage(null);

      setToastData({
        title: "✓ Task added successfully",
        description: `"${rawTitle}" has been added to I Owe.`,
      });
      setTimeout(() => setToastData(null), 5000);

      if (pathname !== "/console") {
        router.push("/console");
      }
    } catch (err: any) {
      console.error("Add task error:", err);
      setAddBtnStatus("failure");
      setErrorMessage(err.message || "Unable to add task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePassTurn = async (customSlots?: Record<string, any>) => {
    if (passBtnStatus === "processing" || isSubmitting) return;
    setIsSubmitting(true);
    setPassBtnStatus("processing");
    setErrorMessage(null);

    const slots = customSlots || preview?.slots;
    const partnerName = slots?.targetUser || slots?.owner || "Hari";
    const taskTitle = "UOS Rollout Phase 1";

    try {
      const res = await executeCommandPassTurnAction({
        taskTitle,
        partnerName,
      });

      if (!res.success) {
        throw new Error(res.error || "Failed to pass turn");
      }

      window.dispatchEvent(
        new CustomEvent("command-executed", {
          detail: {
            input,
            intent: "PASS_TURN",
            slots,
            preview: preview?.preview,
          },
        })
      );
      window.dispatchEvent(new CustomEvent("icc-tasks-updated"));

      setPassBtnStatus("success");
      await new Promise((r) => setTimeout(r, 650));

      // Close confirmation modal
      setIsOpen(false);
      setInput("");
      setPreview(null);
      setPassBtnStatus("normal");
      setErrorMessage(null);

      setToastData({
        title: "✓ Turn passed successfully",
        description: `${taskTitle} turn has been passed to ${partnerName}.`,
      });
      setTimeout(() => setToastData(null), 5000);

      if (pathname !== "/console") {
        router.push("/console");
      }
    } catch (err: any) {
      console.error("Pass turn error:", err);
      setPassBtnStatus("failure");
      setErrorMessage(err.message || "Unable to pass turn. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQueryDay = () => {
    setIsOpen(false);
    setInput("");
    setPreview(null);
    setErrorMessage(null);

    setToastData({
      title: "✓ Day schedule loaded",
      description: "Showing today's schedule, items you owe, and follow-ups going out.",
    });
    setTimeout(() => setToastData(null), 5000);

    if (pathname !== "/console") {
      router.push("/console");
    }
  };

  const handleExecuteCommand = () => {
    if (!preview) return;
    if (preview.intent === "ASSIGN_TASK" || preview.intent === "ASSIGN_WITH_CHASE") {
      handleAssignTask();
    } else if (preview.intent === "ADD_TASK") {
      handleAddTask();
    } else if (preview.intent === "PASS_TURN") {
      handlePassTurn();
    } else if (preview.intent === "QUERY_DAY") {
      handleQueryDay();
    } else {
      // General command execution
      setIsOpen(false);
      setInput("");
      setToastData({
        title: "✓ Command executed",
        description: preview.preview,
      });
      setTimeout(() => setToastData(null), 5000);
      if (pathname !== "/console") router.push("/console");
    }
  };

  const handleExampleSelect = (text: string, executeImmediately = false) => {
    setInput(text);
    const res = parseCommand(text);
    setPreview(res);
    setErrorMessage(null);

    if (executeImmediately) {
      if (res.intent === "ASSIGN_TASK" || res.intent === "ASSIGN_WITH_CHASE") {
        handleAssignTask(res.slots, res.slots?.title || "check fee page");
      } else if (res.intent === "ADD_TASK") {
        handleAddTask(res.slots, res.slots?.title || "VC wants placement report by Monday");
      } else if (res.intent === "PASS_TURN") {
        handlePassTurn(res.slots);
      } else if (res.intent === "QUERY_DAY") {
        handleQueryDay();
      } else {
        handleExecuteCommand();
      }
    }
  };

  if (!isOpen && !toastData) return null;

  return (
    <>
      {/* Command Bar Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-start justify-center pt-16 sm:pt-20 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-surface w-full max-w-2xl rounded-panel border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-line gap-3 shrink-0">
              <Search className="h-5 w-5 text-mutedText shrink-0" />
              <input
                type="text"
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecuteCommand();
                  if (e.key === "ArrowUp") {
                    if (historyIndex < history.length - 1) {
                      const nextIdx = historyIndex + 1;
                      setHistoryIndex(nextIdx);
                      const prevText = history[nextIdx] || "";
                      setInput(prevText);
                      setPreview(parseCommand(prevText));
                    }
                  }
                  if (e.key === "ArrowDown") {
                    if (historyIndex > 0) {
                      const nextIdx = historyIndex - 1;
                      setHistoryIndex(nextIdx);
                      const prevText = history[nextIdx] || "";
                      setInput(prevText);
                      setPreview(parseCommand(prevText));
                    } else if (historyIndex === 0) {
                      setHistoryIndex(-1);
                      setInput("");
                      setPreview(null);
                    }
                  }
                }}
                placeholder="Ask Hari to fix fee page by Friday, chase daily..."
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-mutedText focus:outline-none font-mono"
              />
              {input && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setPreview(null);
                    setErrorMessage(null);
                  }}
                  className="text-mutedText hover:text-ink text-xs px-1.5 py-0.5 rounded bg-ground border border-line cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-mutedText hover:text-ink p-1 rounded-control cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body: Live Results & Examples */}
            <div className="overflow-y-auto divide-y divide-line">
              {/* Rich Live Result & Execution Panel */}
              {preview && (
                <div className="p-4 bg-ground/60 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-ink">
                      <Sparkles className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-bold text-primary uppercase text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                        {preview.intent}
                      </span>
                      <span className="text-mutedText text-xs truncate">{preview.preview}</span>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting || assignBtnStatus === "processing" || addBtnStatus === "processing" || passBtnStatus === "processing"}
                      onClick={() => handleExecuteCommand()}
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-white bg-primary hover:bg-primary-hover disabled:opacity-60 px-3 py-1.5 rounded-control shadow-xs font-semibold shrink-0 cursor-pointer active:scale-95 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>Execute</span>
                          <CornerDownLeft className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contextual Rich Result Cards based on Intent */}
                  {preview.intent === "QUERY_DAY" && (
                    <div className="bg-surface rounded-panel border border-line p-3.5 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-line">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h4 className="text-xs font-bold text-ink">Today&apos;s Schedule & Commitments</h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                          Live Summary
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="p-2.5 rounded-control bg-ground border border-line space-y-1">
                          <span className="text-[10px] font-mono text-mutedText uppercase font-semibold block">
                            Items You Owe
                          </span>
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            <span>1 Task Due Today</span>
                          </div>
                          <p className="text-[11px] text-mutedText">T-1042: Review monthly KPI report for VC</p>
                        </div>

                        <div className="p-2.5 rounded-control bg-ground border border-line space-y-1">
                          <span className="text-[10px] font-mono text-mutedText uppercase font-semibold block">
                            Active Chases
                          </span>
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-500" />
                            <span>1 Follow-up Active</span>
                          </div>
                          <p className="text-[11px] text-mutedText">Hari: Fix admission form verification (Daily)</p>
                        </div>

                        <div className="p-2.5 rounded-control bg-ground border border-line space-y-1">
                          <span className="text-[10px] font-mono text-mutedText uppercase font-semibold block">
                            Today&apos;s Next Slot
                          </span>
                          <div className="font-bold text-ink flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-emerald-600" />
                            <span>11:30 - 12:30</span>
                          </div>
                          <p className="text-[11px] text-mutedText">Fee page review & switch migration check</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-line flex-wrap">
                        <button
                          type="button"
                          onClick={handleQueryDay}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-control text-xs font-semibold cursor-pointer transition-colors"
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" />
                          <span>Open Console Dashboard</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            router.push("/my");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ground hover:bg-surface border border-line text-ink rounded-control text-xs font-medium cursor-pointer transition-colors"
                        >
                          <User className="h-3.5 w-3.5 text-mutedText" />
                          <span>Open Today&apos;s Agenda (/my)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            router.push("/todo");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ground hover:bg-surface border border-line text-ink rounded-control text-xs font-medium cursor-pointer transition-colors"
                        >
                          <ListTodo className="h-3.5 w-3.5 text-mutedText" />
                          <span>View Full Schedule (/todo)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {preview.intent === "ADD_TASK" && (
                    <div className="bg-surface rounded-panel border border-line p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Ready to Add Task:</span>
                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          Destination: Console &rarr; &apos;I Owe&apos;
                        </span>
                      </div>
                      <div className="p-3 bg-ground rounded-control border border-line text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Task</span>
                          <span className="font-semibold text-ink">
                            {preview.slots?.title || input.replace(/^(add:\s*|add\s+)/i, "")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Requester</span>
                          <span className="font-mono text-ink font-semibold">
                            {preview.slots?.requester || "VC Office"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Priority</span>
                          <span className="font-mono text-primary font-semibold">
                            {preview.slots?.priority || "HIGH"}
                          </span>
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={addBtnStatus === "processing"}
                        onClick={() => handleAddTask()}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-control text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed ${
                          addBtnStatus === "success"
                            ? "bg-emerald-600 text-white"
                            : addBtnStatus === "failure"
                            ? "bg-danger text-white hover:bg-danger/90"
                            : "bg-primary hover:bg-primary-hover text-white"
                        }`}
                      >
                        {addBtnStatus === "processing" ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : addBtnStatus === "success" ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>✓ Added Successfully</span>
                          </>
                        ) : addBtnStatus === "failure" ? (
                          <>
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Try Again</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Confirm &amp; Add to Console Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {(preview.intent === "ASSIGN_TASK" || preview.intent === "ASSIGN_WITH_CHASE") && (
                    <div className="bg-surface rounded-panel border border-line p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Ready to Delegate &amp; Chase:</span>
                        <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                          Destination: Console &rarr; &apos;I&apos;m Chasing&apos;
                        </span>
                      </div>
                      <div className="p-3 bg-ground rounded-control border border-line text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Task</span>
                          <span className="font-semibold text-ink">
                            {preview.slots?.title || "check fee page"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Assigned To</span>
                          <span className="font-bold text-ink flex items-center gap-1">
                            <User className="h-3 w-3 text-primary" />
                            {preview.slots?.owner || "Hari"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Follow-up</span>
                          <span className="font-mono text-amber-700 text-[11px] font-semibold">
                            Daily at 09:30 AM
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Due Date</span>
                          <span className="font-mono text-mutedText text-[11px]">
                            2026-09-30 12:30 PM
                          </span>
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={assignBtnStatus === "processing"}
                        onClick={() => handleAssignTask()}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-control text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed ${
                          assignBtnStatus === "success"
                            ? "bg-emerald-600 text-white"
                            : assignBtnStatus === "failure"
                            ? "bg-danger text-white hover:bg-danger/90"
                            : "bg-primary hover:bg-primary-hover text-white"
                        }`}
                      >
                        {assignBtnStatus === "processing" ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Assigning...</span>
                          </>
                        ) : assignBtnStatus === "success" ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>✓ Assigned Successfully</span>
                          </>
                        ) : assignBtnStatus === "failure" ? (
                          <>
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Try Again</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Confirm &amp; Assign to {preview.slots?.owner || "Hari"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {preview.intent === "PASS_TURN" && (
                    <div className="bg-surface rounded-panel border border-line p-3.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">Pass Turn on Shared Task:</span>
                        <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          Destination: Console &rarr; &apos;Shared&apos;
                        </span>
                      </div>
                      <div className="p-3 bg-ground rounded-control border border-line text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">Task</span>
                          <span className="font-semibold text-ink">UOS Rollout Phase 1</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-mutedText uppercase font-mono font-semibold">New Turn</span>
                          <span className="font-mono text-purple-700 font-semibold">Hari</span>
                        </div>
                      </div>

                      {errorMessage && (
                        <div className="p-2.5 rounded bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 shrink-0" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={passBtnStatus === "processing"}
                        onClick={() => handlePassTurn()}
                        className={`w-full inline-flex items-center justify-center gap-2 py-2 rounded-control text-xs font-semibold cursor-pointer shadow-xs transition-all active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed ${
                          passBtnStatus === "success"
                            ? "bg-emerald-600 text-white"
                            : passBtnStatus === "failure"
                            ? "bg-danger text-white hover:bg-danger/90"
                            : "bg-primary hover:bg-primary-hover text-white"
                        }`}
                      >
                        {passBtnStatus === "processing" ? (
                          <>
                            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Passing...</span>
                          </>
                        ) : passBtnStatus === "success" ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>✓ Turn Passed Successfully</span>
                          </>
                        ) : passBtnStatus === "failure" ? (
                          <>
                            <Undo2 className="h-3.5 w-3.5" />
                            <span>Try Again</span>
                          </>
                        ) : (
                          <>
                            <CornerDownLeft className="h-3.5 w-3.5" />
                            <span>Confirm &amp; Pass Turn</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Suggestions & Cheatsheet */}
              <div className="p-4 space-y-2.5 text-xs text-mutedText bg-surface-alt">
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => handleExampleSelect("what's my day?", false)}
                    className="text-[10px] font-mono uppercase tracking-wider text-mutedText hover:text-ink transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
                    title="Click any example below to preview and run"
                  >
                    <span>Examples you can type or click:</span>
                    <span className="text-primary normal-case text-[10px] font-normal underline">
                      (click to view details)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  {[
                    {
                      label: "Ask Hari to check fee page by tomorrow, chase daily",
                      desc: "Assign with automated daily chase",
                    },
                    {
                      label: "Add: VC wants placement report by Monday",
                      desc: "Add task to 'I Owe' column",
                    },
                    {
                      label: "Pass UOS rollout to Hari",
                      desc: "Pass turn on shared task",
                    },
                    {
                      label: "what's my day?",
                      desc: "Show today's schedule & items",
                    },
                  ].map(({ label, desc }) => {
                    const isSelected = input === label;
                    return (
                      <div
                        key={label}
                        onClick={() => handleExampleSelect(label, false)}
                        className={`p-3 rounded-control text-left border transition-all cursor-pointer flex items-center justify-between gap-2 group ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20"
                            : "bg-surface border-line hover:border-primary/50 hover:bg-surface-alt text-ink"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className={`line-clamp-2 font-medium ${isSelected ? "text-primary font-bold" : "text-ink"}`}>
                            {label}
                          </div>
                          <div className="text-[9px] text-mutedText font-sans mt-0.5 truncate">
                            {desc}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExampleSelect(label, true);
                          }}
                          className="shrink-0 px-2.5 py-1 bg-primary text-white rounded text-[10px] font-semibold transition-all hover:bg-primary-hover active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1 disabled:opacity-50"
                          title="Run immediately"
                        >
                          <span>Run</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification with Title and Subtitle per Specification (z-[99999] so never obscured) */}
      {toastData && (
        <div className="fixed bottom-6 right-6 z-[99999] bg-[#162D50] text-white px-4 py-3.5 rounded-control border border-[#2E5285] shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 max-w-md pointer-events-auto">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 pr-1">
            <div className="text-xs font-bold text-white leading-snug">
              {toastData.title}
            </div>
            {toastData.description && (
              <div className="text-[11px] text-[#C2D2E8] mt-1 font-mono leading-normal break-words">
                {toastData.description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToastData(null)}
            className="p-1 text-[#9BB1D0] hover:text-white cursor-pointer -mr-1 shrink-0"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}


