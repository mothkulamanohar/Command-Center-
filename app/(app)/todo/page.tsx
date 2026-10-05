"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, addDays, isSameDay } from "date-fns";
import {
  CheckSquare,
  Users,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Calendar as CalendarIcon,
  ArrowRight,
  Sparkles,
  Filter,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { DayScheduleView, ScheduledTodo, ReadOnlyEvent, ReadOnlyTask } from "@/components/todo/DayScheduleView";
import {
  fetchTodoDataAction,
  toggleTodoAction,
  scheduleTodoAction,
  createTodoAction,
} from "./actions";
import { TaskStatus } from "@prisma/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  initials: string;
  avatarBg: string;
  campus: string;
  status: "PRESENT" | "REMOTE" | "LATE" | "NOT_YET";
  inTime?: string;
}

interface TodoItem {
  id: string;
  userId: string;
  title: string;
  list: "Work" | "Personal" | "Learning" | "Operations";
  date: Date | string | null;
  startAt: string | null;
  endAt?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  done: boolean;
  doneAt?: Date | string | null;
}

export default function TodoPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "someday" | "completed">("today");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const res = await fetchTodoDataAction();
    if (res.success && res.data) {
      const d = res.data as any;
      setMembers(d.users || []);
      setTodos(d.todos || []);
      if (d.tasksDue) setTasksDue(d.tasksDue);
      setCurrentUser(d.currentUser);
      if (selectedUserId === "ALL" && d.currentUser) {
        setQuickAddUser(d.currentUser.id);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [quickAddUser, setQuickAddUser] = useState<string>("user-sri");
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddList, setQuickAddList] = useState<TodoItem["list"]>("Work");
  const [quickAddPriority, setQuickAddPriority] = useState<TodoItem["priority"]>("MEDIUM");
  const [tasksDue, setTasksDue] = useState<ReadOnlyTask[]>([]);

  // Keep quickAddUser in sync when user changes
  useEffect(() => {
    if (selectedUserId !== "ALL") {
      setQuickAddUser(selectedUserId);
    }
  }, [selectedUserId]);

  const selectedMember = members.find((m) => m.id === selectedUserId);

  const handleToggleTodo = async (id: string) => {
    const target = todos.find((t) => t.id === id);
    const nextDone = target ? !target.done : true;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              doneAt: !t.done ? new Date() : null,
            }
          : t
      )
    );
    const res = await toggleTodoAction(id);
    if (res.success) {
      toast.success(nextDone ? `Completed: "${target?.title || "Item"}"` : `Restored to active: "${target?.title || "Item"}"`);
    } else {
      toast.error(res.error || "Failed to update to-do");
      loadData();
    }
  };

  const handleScheduleSlot = async (todoId: string, timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const scheduledDate = new Date(currentDate);
    scheduledDate.setHours(h, m, 0, 0);

    const target = todos.find((t) => t.id === todoId);
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? {
              ...t,
              date: currentDate,
              startAt: scheduledDate.toISOString(),
            }
          : t
      )
    );

    const res = await scheduleTodoAction(todoId, currentDate.toISOString(), scheduledDate.toISOString());
    if (res.success) {
      toast.success(`Scheduled "${target?.title || "Item"}" for ${timeStr}`);
    } else {
      toast.error(res.error || "Failed to schedule to-do");
      loadData();
    }
  };

  const handleQuickAdd = async (title: string, timeStr?: string) => {
    let startAt: string | null = null;
    if (timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(currentDate);
      d.setHours(h, m, 0, 0);
      startAt = d.toISOString();
    }

    const res = await createTodoAction({
      title,
      list: quickAddList,
      dateIso: currentDate.toISOString(),
      startAtIso: startAt,
      priority: quickAddPriority as any,
    });

    if (res.success && res.data) {
      toast.success(`Added to-do: "${title}"`);
      setQuickAddTitle("");
      loadData();
    } else {
      toast.error(res.error || "Failed to add to-do");
    }
  };

  // Filter to-dos by selected user, search query, category, priority, and completion status
  const userFilteredTodos = todos.filter((t) => {
    const matchesUser = selectedUserId === "ALL" || t.userId === selectedUserId;
    const matchesSearch =
      search.trim() === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.list.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || t.list === filterCategory;
    const matchesPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "ACTIVE" && !t.done) ||
      (filterStatus === "DONE" && t.done);

    return matchesUser && matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const scheduledTodos: ScheduledTodo[] = userFilteredTodos
    .filter((t) => t.date && t.startAt && isSameDay(new Date(t.date), currentDate))
    .map((t) => ({
      id: t.id,
      title: t.title,
      startAt: t.startAt!,
      endAt: t.endAt,
      priority: t.priority,
      done: t.done,
      list: t.list,
    }));

  const unscheduledTodos = userFilteredTodos.filter(
    (t) => t.date && !t.startAt && isSameDay(new Date(t.date), currentDate)
  );
  const somedayTodos = userFilteredTodos.filter((t) => !t.date && !t.done);
  const completedTodos = userFilteredTodos.filter((t) => t.done);

  // Read-only meetings/events
  const events: ReadOnlyEvent[] = [
    {
      id: "evt-1",
      title: "COO Office Weekly Review",
      startAt: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
      endAt: new Date(new Date().setHours(13, 30, 0, 0)).toISOString(),
      location: "Board Room 1",
    },
    {
      id: "evt-2",
      title: "IT Command Center Standup",
      startAt: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
      endAt: new Date(new Date().setHours(17, 30, 0, 0)).toISOString(),
      location: "Dev Lab",
    },
  ];



  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      

      {/* Header and View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-ink">Team & Personal To-Do Lists</h1>
          </div>
          <p className="text-xs text-mutedText mt-0.5">
            Individual day schedules, daily task planners, and planned routines for every member of the IT Command Center.
          </p>
        </div>

        {/* Date Switcher for Schedule */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentDate((d) => addDays(d, -1))}
            className="p-1.5 border border-line rounded-control hover:bg-surface text-mutedText hover:text-ink cursor-pointer transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            className={`px-3 py-1.5 border rounded-control text-xs font-semibold cursor-pointer transition-all ${
              isSameDay(currentDate, new Date())
                ? "bg-primary text-white border-primary shadow-xs"
                : "border-line text-ink hover:bg-surface"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            className="p-1.5 border border-line rounded-control hover:bg-surface text-mutedText hover:text-ink cursor-pointer transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-ink font-semibold ml-1 whitespace-nowrap">
            {format(currentDate, "d MMM yyyy")}
          </span>
        </div>
      </div>

      {/* Member Selection Ribbon (Switch between all persons or view individual todo list) */}
      <div className="bg-surface rounded-panel border border-line p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink">
            <Users className="h-4 w-4 text-primary" />
            <span>Select Person to View To-Do List:</span>
          </div>
          <span className="text-[11px] font-mono text-mutedText">
            {todos.filter((t) => !t.done).length} active to-dos across {members.length} members
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {/* All Members Toggle */}
          <button
            type="button"
            onClick={() => setSelectedUserId("ALL")}
            className={`px-3 py-2 rounded-control text-xs font-medium transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
              selectedUserId === "ALL"
                ? "bg-primary text-white border-primary shadow-xs font-semibold"
                : "bg-ground hover:bg-surface text-ink border-line"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>All Members (Team Board)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                selectedUserId === "ALL" ? "bg-white/20 text-white" : "bg-line text-ink"
              }`}
            >
              {todos.filter((t) => !t.done).length}
            </span>
          </button>

          {/* Individual Member Tabs */}
          {members.map((member) => {
            const memberTodos = todos.filter((t) => t.userId === member.id);
            const pendingCount = memberTodos.filter((t) => !t.done).length;
            const isSelected = selectedUserId === member.id;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedUserId(member.id)}
                className={`px-3 py-2 rounded-control text-xs transition-all flex items-center gap-2.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-primary text-white border-primary shadow-xs font-semibold"
                    : "bg-ground hover:bg-surface text-ink border-line"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${member.avatarBg}`}
                >
                  {member.initials}
                </div>
                <div className="text-left flex items-center gap-1.5">
                  <span className="truncate max-w-[120px]">{member.name}</span>
                  <span
                    className={`text-[9px] uppercase px-1 py-0.2 rounded font-mono font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-line/80 text-mutedText"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-line text-ink"
                  }`}
                  title={`${pendingCount} pending to-dos`}
                >
                  {pendingCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Member Profile Card (when specific person is selected) */}
      {selectedMember && (
        <div className="bg-surface rounded-panel border border-line p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-base font-black text-white shadow-sm shrink-0 ${selectedMember.avatarBg}`}
            >
              {selectedMember.initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-ink">{selectedMember.name}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  {selectedMember.role}
                </span>
                <span className="text-xs text-mutedText font-medium">• {selectedMember.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-mutedText font-mono mt-1">
                <span>📍 {selectedMember.campus}</span>
                <span>
                  ⏰{" "}
                  {selectedMember.inTime ? (
                    <strong className="text-primary font-bold">In since {selectedMember.inTime}</strong>
                  ) : (
                    "Not checked in today"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-center px-3 py-1.5 bg-ground rounded-control border border-line">
              <div className="text-primary font-bold text-sm">
                {todos.filter((t) => t.userId === selectedMember.id && !t.done).length}
              </div>
              <div className="text-[10px] text-mutedText">Pending</div>
            </div>
            <div className="text-center px-3 py-1.5 bg-ground rounded-control border border-line">
              <div className="text-emerald-600 font-bold text-sm">
                {todos.filter((t) => t.userId === selectedMember.id && t.done).length}
              </div>
              <div className="text-[10px] text-mutedText">Done Today</div>
            </div>
            <div className="text-center px-3 py-1.5 bg-ground rounded-control border border-line">
              <div className="text-ink font-bold text-sm">
                {todos.filter((t) => t.userId === selectedMember.id && t.startAt && !t.done).length}
              </div>
              <div className="text-[10px] text-mutedText">Scheduled</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Bar */}
      <div className="bg-surface rounded-panel border border-line p-3 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {selectedUserId === "ALL" && (
          <div className="w-full sm:w-48 shrink-0">
            <select
              aria-label="Assign to-do to person"
              value={quickAddUser}
              onChange={(e) => setQuickAddUser(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-ground border border-line rounded-control text-xs font-medium text-ink focus:outline-none focus:border-primary"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder={
              selectedMember
                ? `Add a new to-do item for ${selectedMember.name}...`
                : `Add a to-do item for ${members.find((m) => m.id === quickAddUser)?.name || "member"}...`
            }
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && quickAddTitle.trim()) {
                handleQuickAdd(quickAddTitle.trim());
              }
            }}
            className="w-full pl-3 pr-20 py-1.5 bg-ground border border-line rounded-control text-xs text-ink focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            aria-label="To-do list category"
            value={quickAddList}
            onChange={(e) => setQuickAddList(e.target.value as TodoItem["list"])}
            className="px-2 py-1.5 bg-ground border border-line rounded-control text-xs text-ink font-medium"
          >
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
            <option value="Operations">Operations</option>
            <option value="Learning">Learning</option>
          </select>

          <select
            aria-label="To-do priority"
            value={quickAddPriority}
            onChange={(e) => setQuickAddPriority(e.target.value as TodoItem["priority"])}
            className="px-2 py-1.5 bg-ground border border-line rounded-control text-xs text-ink font-medium"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (quickAddTitle.trim()) {
                handleQuickAdd(quickAddTitle.trim());
              }
            }}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="bg-surface rounded-panel border border-line p-3 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-mutedText pointer-events-none" />
            <input
              type="text"
              placeholder="Search to-dos by title or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-ground border border-line rounded-control text-xs text-ink placeholder:text-mutedText focus:outline-none focus:border-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-mutedText hover:text-ink cursor-pointer p-0.5"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Active filter summary & Reset button */}
          {(filterCategory !== "ALL" || filterPriority !== "ALL" || filterStatus !== "ALL" || search.trim() !== "") && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs text-mutedText font-mono">
                {userFilteredTodos.length} result{userFilteredTodos.length === 1 ? "" : "s"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFilterCategory("ALL");
                  setFilterPriority("ALL");
                  setFilterStatus("ALL");
                  setSearch("");
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/10 rounded-control border border-danger/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Pills Groups */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-line text-xs">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-mutedText font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="h-3 w-3" /> List:
            </span>
            {(["ALL", "Work", "Personal", "Operations", "Learning"] as const).map((cat) => {
              const count = todos.filter((t) => {
                const userMatch = selectedUserId === "ALL" || t.userId === selectedUserId;
                return userMatch && (cat === "ALL" || t.list === cat);
              }).length;
              const isSelected = filterCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                      : "bg-ground text-ink border-line hover:border-mutedText/50 hover:bg-surface"
                  }`}
                >
                  {cat === "ALL" ? "All Lists" : cat}
                  <span
                    className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? "bg-white/25 text-white" : "bg-line text-mutedText"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-mutedText font-semibold uppercase tracking-wider mr-1">
              Priority:
            </span>
            {[
              { id: "ALL", label: "All" },
              { id: "URGENT", label: "Urgent" },
              { id: "HIGH", label: "High" },
              { id: "MEDIUM", label: "Medium" },
              { id: "LOW", label: "Low" },
            ].map(({ id, label }) => {
              const isSelected = filterPriority === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterPriority(id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                      : "bg-ground text-ink border-line hover:border-mutedText/50 hover:bg-surface"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-mutedText font-semibold uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { id: "ALL", label: "All" },
              { id: "ACTIVE", label: "Active" },
              { id: "DONE", label: "Done" },
            ].map(({ id, label }) => {
              const isSelected = filterStatus === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilterStatus(id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary text-white border-primary shadow-2xs font-semibold"
                      : "bg-ground text-ink border-line hover:border-mutedText/50 hover:bg-surface"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIEW 1: ALL MEMBERS TEAM BOARD */}
      {selectedUserId === "ALL" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Team To-Do Board — All Members</span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-mutedText font-mono flex-wrap">
              <span>Date: <strong className="text-ink">{format(currentDate, "d MMM yyyy")}</strong></span>
              <span>• Click task to toggle status</span>
              <span>• Click member to open schedule</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member) => {
              const allMemberTodos = todos.filter((t) => t.userId === member.id);
              const memberFilteredTodos = userFilteredTodos.filter((t) => t.userId === member.id);
              const doneTodos = allMemberTodos.filter((t) => t.done);
              const pendingTodos = allMemberTodos.filter((t) => !t.done);
              const scheduledCount = allMemberTodos.filter((t) => t.startAt && !t.done).length;
              const percentDone =
                allMemberTodos.length > 0 ? Math.round((doneTodos.length / allMemberTodos.length) * 100) : 0;

              return (
                <div
                  key={member.id}
                  className="bg-surface rounded-panel border border-line p-4 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all space-y-3"
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-line">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          onClick={() => setSelectedUserId(member.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer ${member.avatarBg}`}
                        >
                          {member.initials}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setSelectedUserId(member.id)}
                            className="font-bold text-ink text-xs hover:text-primary transition-colors truncate block text-left cursor-pointer"
                          >
                            {member.name}
                          </button>
                          <div className="text-[10px] text-mutedText font-mono truncate">{member.role}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-ground border border-line font-bold text-primary shrink-0">
                        {pendingTodos.length} left
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-mutedText">
                        <span>Progress</span>
                        <span>
                          {doneTodos.length}/{allMemberTodos.length} ({percentDone}%)
                        </span>
                      </div>
                      <div className="w-full bg-ground h-1.5 rounded-full overflow-hidden border border-line">
                        <div
                          className="bg-primary h-full transition-all rounded-full"
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                    </div>

                    {/* Todo Item List */}
                    <div className="mt-3 space-y-2">
                      {memberFilteredTodos.length === 0 ? (
                        <div className="text-center py-4 text-xs text-mutedText font-mono">
                          {allMemberTodos.length === 0
                            ? "No to-dos scheduled yet"
                            : "No to-dos match active filter"}
                        </div>
                      ) : (
                        memberFilteredTodos.slice(0, 4).map((todo) => (
                          <div
                            key={todo.id}
                            onClick={() => handleToggleTodo(todo.id)}
                            className={`p-2 rounded-control border text-xs flex items-start gap-2 transition-all cursor-pointer select-none hover:border-primary/60 ${
                              todo.done
                                ? "bg-ground/40 border-line/60 text-mutedText line-through opacity-75"
                                : "bg-ground/80 border-line text-ink hover:bg-ground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={todo.done}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleTodo(todo.id);
                              }}
                              className="h-3.5 w-3.5 rounded border-line text-primary focus:ring-primary cursor-pointer mt-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`leading-tight truncate ${todo.done ? "line-through text-mutedText" : "text-ink"}`}>
                                {todo.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono">
                                <span
                                  className={`px-1 py-0.2 rounded font-bold uppercase ${
                                    todo.priority === "URGENT"
                                      ? "bg-danger/10 text-danger"
                                      : todo.priority === "HIGH"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-ground text-mutedText"
                                  }`}
                                >
                                  {todo.priority}
                                </span>
                                {todo.startAt && (
                                  <span className="text-primary font-semibold flex items-center gap-0.5">
                                    <Clock className="h-2.5 w-2.5" />
                                    {format(new Date(todo.startAt), "HH:mm")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {memberFilteredTodos.length > 4 && (
                        <div className="text-[10px] text-mutedText font-mono text-center pt-1">
                          +{memberFilteredTodos.length - 4} more to-dos
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-line mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-mutedText font-mono">
                      {scheduledCount} scheduled slots
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(member.id)}
                      className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Day Schedule</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: INDIVIDUAL PERSON TO-DO VIEW */
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-line pb-px overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("today")}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "today"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-mutedText hover:text-ink"
              }`}
            >
              Today Schedule ({scheduledTodos.length + unscheduledTodos.length})
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "upcoming"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-mutedText hover:text-ink"
              }`}
            >
              Upcoming ({userFilteredTodos.filter((t) => t.date && !t.done).length})
            </button>
            <button
              onClick={() => setActiveTab("someday")}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "someday"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-mutedText hover:text-ink"
              }`}
            >
              Someday ({somedayTodos.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "completed"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-mutedText hover:text-ink"
              }`}
            >
              Completed ({completedTodos.length})
            </button>
          </div>

          {/* Tab 1: Today DayScheduleView */}
          {activeTab === "today" && (
            <DayScheduleView
              date={currentDate}
              scheduledTodos={scheduledTodos}
              unscheduledTodos={unscheduledTodos}
              events={events}
              tasksDue={tasksDue}
              onToggleTodo={handleToggleTodo}
              onScheduleSlot={handleScheduleSlot}
              onQuickAdd={(title, timeStr) => handleQuickAdd(title, timeStr)}
            />
          )}

          {/* Tab 2: Upcoming */}
          {activeTab === "upcoming" && (
            <div className="bg-surface rounded-panel border border-line p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">Upcoming Tasks for {selectedMember?.name}</h2>
                <span className="text-xs text-mutedText font-mono">Next 14 Days</span>
              </div>
              <div className="space-y-3">
                {userFilteredTodos
                  .filter((t) => t.date && !t.done)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTodo(t.id)}
                      className="flex items-center justify-between p-3 border border-line rounded-control hover:bg-ground/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTodo(t.id);
                          }}
                          className="h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="text-xs font-medium text-ink">{t.title}</div>
                          <div className="text-[11px] text-mutedText font-mono">
                            {format(new Date(t.date!), "EEEE, d MMM yyyy")}{" "}
                            {t.startAt ? `at ${format(new Date(t.startAt), "HH:mm")}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ground border border-line">
                          {t.list}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                            t.priority === "URGENT"
                              ? "bg-danger/10 text-danger border border-danger/20"
                              : "bg-primary/10 text-primary border border-primary/20"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Tab 3: Someday */}
          {activeTab === "someday" && (
            <div className="bg-surface rounded-panel border border-line p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold text-ink">Someday (No Specific Date Assigned)</h2>
              <div className="space-y-3">
                {somedayTodos.length === 0 ? (
                  <p className="text-xs text-mutedText font-mono text-center py-6">
                    No someday to-dos for {selectedMember?.name}. All tasks have scheduled dates!
                  </p>
                ) : (
                  somedayTodos.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTodo(t.id)}
                      className="flex items-center justify-between p-3 border border-line rounded-control hover:bg-ground/50 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTodo(t.id);
                          }}
                          className="h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className="text-xs font-medium text-ink">{t.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTodos((prev) =>
                            prev.map((item) => (item.id === t.id ? { ...item, date: currentDate } : item))
                          );
                        }}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Schedule for Selected Date →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Completed */}
          {activeTab === "completed" && (
            <div className="bg-surface rounded-panel border border-line p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold text-ink">Completed Tasks for {selectedMember?.name}</h2>
              <div className="space-y-3">
                {completedTodos.length === 0 ? (
                  <p className="text-xs text-mutedText font-mono text-center py-6">
                    No completed tasks yet. Mark tasks as done to see them here!
                  </p>
                ) : (
                  completedTodos.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTodo(t.id)}
                      className="flex items-center justify-between p-3 border border-line rounded-control bg-ground/40 text-mutedText line-through cursor-pointer select-none hover:bg-ground/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={t.done}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTodo(t.id);
                          }}
                          className="h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer shrink-0"
                        />
                        <span className="text-xs">{t.title}</span>
                      </div>
                      <span className="text-[10px] font-mono">
                        {t.doneAt ? format(new Date(t.doneAt), "d MMM, HH:mm") : "Done"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
