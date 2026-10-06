"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  createChannelAction,
  getOrCreateDmAction,
  postChatMessageAction,
  toggleReactionAction,
  makeTaskFromChatAction,
  makeRequestFromChatAction,
  fetchChannelMessagesAction,
  fetchLinksAction,
} from "./actions";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChannelSidebar,
  ChannelItem,
  DirectMessageUser,
} from "@/components/chat/ChannelSidebar";
import { MessageItem, ChatMessage } from "@/components/chat/MessageItem";
import { MessageInput } from "@/components/chat/MessageInput";
import { LinksBoard, LinkItem } from "@/components/chat/LinksBoard";
import { AnnouncementBanner } from "@/components/chat/AnnouncementBanner";
import { Hash, Users, ShieldCheck, Menu } from "lucide-react";
import { parseKudosCommand, extractTaskRefs, extractUrls } from "@/lib/utils/stringParsing";
import { io, Socket } from "socket.io-client";

export default function ChatClient({
  initialChannels,
  initialDMs,
  allUsers,
  currentUser,
  initialMessages = {},
  initialLinks = [],
}: any) {
  const searchParams = useSearchParams();
  const [activeType, setActiveType] = useState<"channel" | "dm" | "links">("channel");
  const [activeChannel, setActiveChannel] = useState<ChannelItem>(
    initialChannels[0] || { id: "0", name: "General", slug: "general", kind: "TEAM" }
  );
  const [activeDm, setActiveDm] = useState<DirectMessageUser | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);
  const [notification, setNotification] = useState<string | null>(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const [isAddChannelOpen, setAddChannelOpen] = useState(false);
  const [isAddDmOpen, setAddDmOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isNewChannelPrivate, setIsNewChannelPrivate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChannelId = activeType === "dm" ? activeDm?.id ?? "u-1" : activeChannel.id;
  const currentMessages = messages[currentChannelId] || [];

  // Socket.IO Real-Time Connection
  useEffect(() => {
    let socket: Socket | null = null;
    try {
      socket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        if (currentChannelId) {
          socket?.emit("join", `channel:${currentChannelId}`);
        }
      });

      socket.on("message:new", (newMsg: any) => {
        if (!newMsg) return;
        const author = allUsers.find((u: any) => u.id === newMsg.authorId);
        const formattedMsg: ChatMessage = {
          id: newMsg.id,
          authorName: newMsg.authorId === currentUser?.id ? currentUser?.name : (author?.name || "Team"),
          authorRole: newMsg.authorId === currentUser?.id ? currentUser?.role : (author?.role || "MEMBER"),
          body: newMsg.body,
          kind: newMsg.kind || "TEXT",
          meta: newMsg.meta || {},
          createdAt: new Date(newMsg.createdAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          reactions: [],
        };

        setMessages((prev) => {
          const list = prev[newMsg.channelId] || [];
          if (list.some((m) => m.id === newMsg.id)) return prev;
          return {
            ...prev,
            [newMsg.channelId]: [...list, formattedMsg],
          };
        });
      });

      socket.on("typing", (data: { channelId: string; userId: string; isTyping: boolean }) => {
        if (data.channelId === currentChannelId && data.userId !== currentUser?.id) {
          const userName = allUsers.find((u: any) => u.id === data.userId)?.name || "Someone";
          if (data.isTyping) {
            setTypingUsers((prev) => Array.from(new Set([...prev, userName])));
          } else {
            setTypingUsers((prev) => prev.filter((u) => u !== userName));
          }
        }
      });
    } catch (e) {
      console.warn("Socket.IO client connection deferred:", e);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [currentUser?.id, allUsers, currentChannelId]);

  // Join room and sync channel messages when currentChannelId changes
  useEffect(() => {
    if (socketRef.current && currentChannelId) {
      socketRef.current.emit("join", `channel:${currentChannelId}`);
    }

    // Load initial messages for active channel from DB
    if (currentChannelId) {
      fetchChannelMessagesAction(currentChannelId).then((res) => {
        if (res.success && res.data) {
          setMessages((prev) => ({
            ...prev,
            [currentChannelId]: res.data as ChatMessage[],
          }));
        }
      });
    }

    // Polling sync fallback (every 5 seconds)
    const interval = setInterval(() => {
      if (currentChannelId) {
        fetchChannelMessagesAction(currentChannelId).then((res) => {
          if (res.success && res.data && res.data.length > 0) {
            setMessages((prev) => ({
              ...prev,
              [currentChannelId]: res.data as ChatMessage[],
            }));
          }
        });
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      if (socketRef.current && currentChannelId) {
        socketRef.current.emit("leave", `channel:${currentChannelId}`);
      }
    };
  }, [currentChannelId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages.length]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", newChannelName);
      if (isNewChannelPrivate) fd.append("isPrivate", "on");
      const res = await createChannelAction(fd);
      if (res.success) {
        toast.success("Channel created!");
        setAddChannelOpen(false);
        setNewChannelName("");
      } else {
        toast.error(res.error || "Failed");
      }
    });
  };

  const handleCreateDm = async (userId: string) => {
    startTransition(async () => {
      const res = await getOrCreateDmAction(userId);
      if (res.success) {
        toast.success("DM created/opened!");
        setAddDmOpen(false);
      } else {
        toast.error(res.error || "Failed");
      }
    });
  };

  // Auto-select channel or DM from query parameters (?channel=dev-team or ?dm=u-2)
  useEffect(() => {
    const channelParam = searchParams.get("channel");
    const dmParam = searchParams.get("dm");

    if (channelParam) {
      const match = initialChannels.find(
        (c: any) => c.slug === channelParam || c.name === channelParam
      );
      if (match) {
        setActiveChannel(match);
        setActiveType("channel");
        setShowMobileSidebar(false);
      }
    } else if (dmParam) {
      const match = initialDMs.find(
        (u: any) => u.id === dmParam || u.name.toLowerCase().includes(dmParam.toLowerCase())
      );
      if (match) {
        setActiveDm(match);
        setActiveType("dm");
        setShowMobileSidebar(false);
      }
    }
  }, [searchParams, initialChannels, initialDMs]);

  const handleSendMessage = async (text: string, kind = "TEXT", meta?: Record<string, unknown>) => {
    if (!text.trim()) return;
    const kudos = parseKudosCommand(text);
    const taskRefs = extractTaskRefs(text);
    const extractedUrls = extractUrls(text);

    let messageKind = kind;
    const finalMeta = { ...meta };

    if (kudos) {
      messageKind = "KUDOS";
      finalMeta.kudosTarget = kudos.targetName;
      finalMeta.kudosReason = kudos.reason;
      toast.success(`Kudos recognized for @${kudos.targetName}!`);
    } else if (taskRefs.length > 0) {
      finalMeta.taskRefs = taskRefs;
    }

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      authorName: currentUser?.name || "Sri",
      authorRole: currentUser?.role || "IT Manager",
      body: text,
      kind: messageKind,
      meta: finalMeta,
      createdAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      reactions: [],
    };

    setMessages((prev) => ({
      ...prev,
      [currentChannelId]: [...(prev[currentChannelId] || []), optimisticMsg],
    }));

    try {
      const res = await postChatMessageAction({
        channelId: currentChannelId,
        body: text,
        kind: messageKind,
        meta: finalMeta,
      });

      if (res.success && res.message) {
        setMessages((prev) => {
          const list = prev[currentChannelId] || [];
          return {
            ...prev,
            [currentChannelId]: list.map((m) => (m.id === tempId ? (res.message as ChatMessage) : m)),
          };
        });

        // If URLs were in the message, refresh Links Board
        if (extractedUrls.length > 0) {
          fetchLinksAction().then((linksRes) => {
            if (linksRes.success && linksRes.data) {
              setLinks(linksRes.data as LinkItem[]);
            }
          });
        }
      } else {
        toast.error(res.error || "Failed to deliver message");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to deliver message");
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    // Optimistic update
    setMessages((prev) => {
      const list = prev[currentChannelId] || [];
      return {
        ...prev,
        [currentChannelId]: list.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions || [])];
          const existing = reactions.find((r) => r.emoji === emoji);
          if (existing) {
            if (existing.userReacted) {
              existing.count -= 1;
              existing.userReacted = false;
            } else {
              existing.count += 1;
              existing.userReacted = true;
            }
          } else {
            reactions.push({ emoji, count: 1, userReacted: true });
          }
          return { ...m, reactions: reactions.filter((r) => r.count > 0) };
        }),
      };
    });

    try {
      await toggleReactionAction(messageId, emoji);
    } catch (err) {
      console.error("handleReact error:", err);
    }
  };

  const handleMakeTask = async (text: string) => {
    const sender = activeType === "dm" ? activeDm?.name || "Direct Message" : activeChannel.name;
    try {
      const res = await makeTaskFromChatAction({ text, channelName: sender });
      if (res.success) {
        toast.success(`Task created: "${res.title?.slice(0, 35)}..."`);
        return;
      }
    } catch {}

    const { taskStore } = await import("@/lib/store/taskStore");
    taskStore.addTask({
      title: text.replace(/^add:\s*/i, ""),
      requesterName: sender,
      priority: "MEDIUM" as any,
    });
    toast.success(`Task created: "${text.slice(0, 35)}..."`);
  };

  const handleMakeRequest = async (text: string) => {
    const sender = activeType === "dm" ? activeDm?.name || "Direct Message" : activeChannel.name;
    try {
      const res = await makeRequestFromChatAction({ text, channelName: sender });
      if (res.success) {
        toast.success(`Leadership ask routed to Inbox: "${text.slice(0, 30)}..."`);
        return;
      }
    } catch {}

    const { inboxStore } = await import("@/lib/store/inboxStore");
    inboxStore.addRequest({
      text,
      why: `Routed from #${sender}`,
      priority: "HIGH" as any,
      toUserId: "u_sri",
    });
    toast.success(`Leadership ask routed to Inbox: "${text.slice(0, 30)}..."`);
  };

  return (
    <div className="space-y-4">
      {isAddChannelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel w-full max-w-sm p-6 shadow-panel">
            <h2 className="text-lg font-bold mb-4">Create Channel</h2>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">Name</label>
                <input
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="w-full bg-ground border border-line rounded px-3 py-2 text-sm"
                  placeholder="e.g. project-apollo"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isNewChannelPrivate}
                  onChange={(e) => setIsNewChannelPrivate(e.target.checked)}
                />
                <span className="text-sm">Make Private</span>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setAddChannelOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-ground text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 text-sm cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddDmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel w-full max-w-md p-6 shadow-panel">
            <h2 className="text-lg font-bold mb-4">New Direct Message</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allUsers
                .filter((u: any) => u.id !== currentUser.id)
                .map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleCreateDm(u.id)}
                    disabled={isPending}
                    className="w-full flex items-center justify-between p-3 border rounded hover:bg-ground text-left cursor-pointer"
                  >
                    <div>
                      <div className="font-bold">{u.name}</div>
                      <div className="text-xs text-mutedText">{u.role}</div>
                    </div>
                  </button>
                ))}
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setAddDmOpen(false)}
                className="px-4 py-2 border rounded hover:bg-ground text-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Chat Panel Container */}
      <div className="bg-surface rounded-panel border border-line h-[calc(100dvh-175px)] sm:h-[calc(100vh-140px)] min-h-[460px] sm:min-h-[540px] flex overflow-hidden shadow-xs relative">
        {/* Desktop Sidebar / Mobile Drawer */}
        <div
          className={`absolute md:static inset-y-0 left-0 z-30 transition-transform duration-200 ease-in-out md:translate-x-0 ${
            showMobileSidebar ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <ChannelSidebar
            channels={initialChannels}
            onAddChannel={() => setAddChannelOpen(true)}
            directMessages={initialDMs}
            onAddDm={() => setAddDmOpen(true)}
            activeId={activeType === "dm" ? activeDm?.id || "" : activeChannel.id}
            activeType={activeType}
            onSelectChannel={(ch) => {
              setActiveChannel(ch);
              setActiveType("channel");
              setShowMobileSidebar(false);
            }}
            onSelectDm={(user) => {
              setActiveDm(user);
              setActiveType("dm");
              setShowMobileSidebar(false);
            }}
            onOpenLinks={() => {
              setActiveType("links");
              setShowMobileSidebar(false);
            }}
          />
        </div>

        {/* Backdrop for Mobile Sidebar Drawer */}
        {showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/40 z-20 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Content Area */}
        {activeType === "links" ? (
          <LinksBoard links={links} onClose={() => setActiveType("channel")} />
        ) : (
          <div className="flex-1 flex flex-col bg-surface overflow-hidden min-w-0">
            {/* Channel Top Header */}
            <div className="p-3 border-b border-line flex items-center justify-between bg-surface-alt/40 gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile Channel Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMobileSidebar((prev) => !prev)}
                  className="md:hidden p-1.5 text-mutedText hover:text-ink hover:bg-surface rounded-control cursor-pointer"
                  aria-label="Toggle Channel List"
                >
                  <Menu className="h-4 w-4" />
                </button>

                <Hash className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-bold text-ink truncate">
                  {activeType === "dm" ? activeDm?.name : activeChannel.name}
                </span>
                <span className="text-xs text-mutedText border-l border-line pl-2 ml-1 hidden sm:inline truncate">
                  {activeType === "dm" ? activeDm?.role : `#${activeChannel.slug}`}
                </span>
                {activeType === "channel" && activeChannel.totalMembers !== undefined && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 ml-2 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold">
                      {activeChannel.presentCount} of {activeChannel.totalMembers} present
                    </span>
                  </span>
                )}
                {activeType === "dm" && activeDm && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ml-2 shrink-0 ${
                      activeDm.attendanceStatus === "PRESENT" || activeDm.attendanceStatus === "LATE"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-danger/10 text-danger border-danger/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        activeDm.attendanceStatus === "PRESENT" || activeDm.attendanceStatus === "LATE"
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-danger"
                      }`}
                    />
                    <span>{activeDm.attendanceStatus || "ONLINE"}</span>
                  </span>
                )}
              </div>

              {/* Right Header: Team Roster Connection Link */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/teams"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface hover:bg-surface-alt text-primary border border-line rounded-control text-xs font-semibold shadow-2xs transition-colors"
                  title="View Teams & Roster"
                >
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Teams Roster</span>
                  {activeType === "channel" && activeChannel.totalMembers !== undefined && (
                    <span className="bg-emerald-500/15 text-emerald-600 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                      {activeChannel.presentCount}/{activeChannel.totalMembers}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Announcement Banner if applicable */}
            {activeChannel.kind === "ANNOUNCE" && (
              <AnnouncementBanner
                id="ann-1"
                title="Critical Maintenance"
                content="Core network maintenance scheduled tonight at 23:00 IST. Campus Wi-Fi will reboot."
                acknowledgedCount={12}
                onAcknowledge={() => toast.success("Announcement acknowledged!")}
              />
            )}

            {/* Messages Scroll Feed */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
              {currentMessages.length === 0 ? (
                <div className="text-center py-16 text-mutedText text-xs font-mono">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                currentMessages.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    onReact={handleReact}
                    onMakeTask={handleMakeTask}
                    onMakeRequest={handleMakeRequest}
                  />
                ))
              )}
              {typingUsers.length > 0 && (
                <div className="text-[11px] text-mutedText font-mono italic px-3 py-1 flex items-center gap-1.5 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Follow-up Replies Bar */}
            <div className="px-3 pt-2 pb-1.5 border-t border-line/60 bg-surface flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
              <span className="text-[10px] uppercase font-bold text-mutedText shrink-0 mr-1">Quick:</span>
              {[
                "Approved 👍",
                "Working on this now 🚀",
                "Will verify in 15 mins ⏱",
                "Task completed & deployed ✔",
                "Please share the document / ticket ref 📄",
              ].map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => handleSendMessage(reply)}
                  className="px-2.5 py-1 bg-surface-alt hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-line rounded-control text-ink whitespace-nowrap transition-all cursor-pointer shadow-2xs active:scale-95"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <MessageInput
              channelName={activeType === "dm" ? activeDm?.name || "dm" : activeChannel.name}
              isAnnouncementOnly={activeChannel.kind === "ANNOUNCE"}
              onSendMessage={handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
