"use client";

import { useState } from "react";
import { format, addMinutes, setHours, setMinutes, isSameDay } from "date-fns";
import { Clock, AlertTriangle, CheckSquare, Calendar as CalendarIcon } from "lucide-react";

export interface ScheduledTodo {
  id: string;
  title: string;
  notes?: string | null;
  startAt: string;
  endAt?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  done: boolean;
  list: string;
}

export interface ReadOnlyEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string | null;
}

export interface ReadOnlyTask {
  id: string;
  number: number;
  title: string;
  priority: string;
  dueAt?: string | null;
}

interface DayScheduleViewProps {
  date: Date;
  scheduledTodos: ScheduledTodo[];
  unscheduledTodos: any[];
  events: ReadOnlyEvent[];
  tasksDue: ReadOnlyTask[];
  onToggleTodo: (id: string) => void;
  onScheduleSlot: (todoId: string, timeStr: string) => void;
  onQuickAdd: (title: string, timeStr?: string) => void;
}

export function DayScheduleView({
  date,
  scheduledTodos,
  unscheduledTodos,
  events,
  tasksDue,
  onToggleTodo,
  onScheduleSlot,
  onQuickAdd,
}: DayScheduleViewProps) {
  const [newTitle, setNewTitle] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Time slots from 07:00 to 21:00 (every 30 mins = 28 slots)
  const hours = Array.from({ length: 15 }, (_, i) => i + 7);
  const slots: string[] = [];
  hours.forEach((h) => {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  });

  const handleSlotSubmit = (timeStr: string) => {
    if (!newTitle.trim()) return;
    onQuickAdd(newTitle.trim(), timeStr);
    setNewTitle("");
    setSelectedSlot(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Time Grid (07:00 to 21:00) */}
      <div className="lg:col-span-8 bg-surface rounded-panel border border-line p-4 md:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">
              Schedule · {format(date, "EEEE, d MMMM yyyy")}
            </h2>
          </div>
          <span className="text-[11px] font-mono text-mutedText">30-min slots</span>
        </div>

        <div className="space-y-1 relative">
          {slots.map((slot) => {
            // Find to-dos starting in this slot
            const matchedTodos = scheduledTodos.filter((t) => {
              const d = new Date(t.startAt);
              const tStr = `${String(d.getHours()).padStart(2, "0")}:${d.getMinutes() < 30 ? "00" : "30"}`;
              return tStr === slot;
            });

            // Find events in this slot
            const matchedEvents = events.filter((e) => {
              const d = new Date(e.startAt);
              const tStr = `${String(d.getHours()).padStart(2, "0")}:${d.getMinutes() < 30 ? "00" : "30"}`;
              return tStr === slot;
            });

            const hasClash = matchedTodos.length > 0 && matchedEvents.length > 0;

            return (
              <div
                key={slot}
                className="group flex items-start gap-3 py-1 px-2 rounded-control hover:bg-ground/50 transition-colors border-b border-line/40 min-h-[38px]"
              >
                <div className="w-12 text-[11px] font-mono text-mutedText pt-0.5 select-none">
                  {slot}
                </div>

                <div className="flex-1 space-y-1.5">
                  {/* Read-only events in this slot */}
                  {matchedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="px-2.5 py-1 bg-shared/10 border border-shared/30 rounded-control text-xs text-shared flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>Meeting: {evt.title}</span>
                      </div>
                      {evt.location && (
                        <span className="text-[10px] text-mutedText">{evt.location}</span>
                      )}
                    </div>
                  ))}

                  {/* Scheduled to-dos */}
                  {matchedTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => onToggleTodo(todo.id)}
                      className={`px-3 py-1.5 rounded-control border text-xs flex items-center justify-between transition-all cursor-pointer select-none ${
                        todo.done
                          ? "bg-ground text-mutedText line-through border-line opacity-75"
                          : "bg-surface border-primary/40 shadow-xs hover:border-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={todo.done}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleTodo(todo.id);
                          }}
                          className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className={`font-medium truncate ${todo.done ? "line-through text-mutedText" : "text-ink"}`}>
                          {todo.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-ground text-mutedText border border-line shrink-0">
                          {todo.list}
                        </span>
                      </div>

                      {hasClash && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-chasing font-medium shrink-0 ml-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Clashes with meeting</span>
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Quick Add row on slot hover or click */}
                  {selectedSlot === slot ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSlotSubmit(slot)}
                        placeholder={`To-do at ${slot}...`}
                        autoFocus
                        className="flex-1 px-2.5 py-1 text-xs bg-surface border border-primary rounded-control text-ink focus:outline-none"
                      />
                      <button
                        onClick={() => handleSlotSubmit(slot)}
                        className="px-2.5 py-1 bg-primary text-white rounded-control text-xs font-medium cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setSelectedSlot(null)}
                        className="text-xs text-mutedText hover:text-ink cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    matchedTodos.length === 0 &&
                    matchedEvents.length === 0 && (
                      <button
                        onClick={() => setSelectedSlot(slot)}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-mutedText hover:text-primary transition-opacity"
                      >
                        + Add to-do at {slot}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Unscheduled To-dos & Tasks Due */}
      <div className="lg:col-span-4 space-y-6">
        {/* Unscheduled to-dos */}
        <div className="bg-surface rounded-panel border border-line p-4 md:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wide font-mono">
              Unscheduled ({unscheduledTodos.length})
            </h3>
            <span className="text-[10px] text-mutedText">Drag or assign slot</span>
          </div>

          <div className="space-y-2 mb-3 max-h-72 overflow-y-auto">
            {unscheduledTodos.length === 0 ? (
              <p className="text-xs text-mutedText italic py-3 text-center">
                No unscheduled items for today.
              </p>
            ) : (
              unscheduledTodos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => onToggleTodo(todo.id)}
                  className={`p-2.5 border rounded-control text-xs flex items-center justify-between transition-colors cursor-pointer select-none ${
                    todo.done
                      ? "bg-ground/40 border-line/60 text-mutedText line-through"
                      : "bg-ground/60 border-line hover:bg-surface hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleTodo(todo.id);
                      }}
                      className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary cursor-pointer shrink-0"
                    />
                    <span className={`font-medium truncate ${todo.done ? "line-through text-mutedText" : "text-ink"}`}>
                      {todo.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onScheduleSlot(todo.id, "09:00");
                    }}
                    className="text-[10px] text-primary hover:underline cursor-pointer shrink-0 font-medium"
                  >
                    Schedule
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick add unscheduled */}
          <div className="flex items-center gap-2 pt-2 border-t border-line">
            <input
              type="text"
              placeholder="+ New to-do for today..."
              className="flex-1 px-3 py-1.5 text-xs bg-ground border border-line rounded-control text-ink focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                  onQuickAdd((e.target as HTMLInputElement).value.trim());
                  (e.target as HTMLInputElement).value = "";
                }
              }}
            />
          </div>
        </div>

        {/* Read-Only Tasks Due Today */}
        <div className="bg-surface rounded-panel border border-line p-4 md:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
            <h3 className="text-xs font-semibold text-ink uppercase tracking-wide font-mono">
              Tasks Due Today ({tasksDue.length})
            </h3>
            <span className="text-[10px] text-mutedText font-mono">From Work Engine</span>
          </div>

          <div className="space-y-2">
            {tasksDue.length === 0 ? (
              <p className="text-xs text-mutedText italic py-2 text-center">
                No tasks due today.
              </p>
            ) : (
              tasksDue.map((task) => (
                <div
                  key={task.id}
                  className="p-2.5 bg-ground/40 border border-line rounded-control text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary">
                      T-{task.number}
                    </span>
                    <span className="text-ink font-medium">{task.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase ${
                      task.priority === "URGENT" || task.priority === "HIGH"
                        ? "bg-danger/10 text-danger"
                        : "bg-ground text-mutedText"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
