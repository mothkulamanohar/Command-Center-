"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Plus, Folder, Search, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";
import { DocViewerModal, DocItem } from "@/components/docs/DocViewerModal";
import { formatNotificationTime, formatOrgDate } from "@/lib/time";
import {
  getDocsAction,
  getDocSpacesAction,
  createDocAction,
  saveDocAction,
} from "./actions";

export default function DocsPage() {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [spacesList, setSpacesList] = useState<string[]>(["ALL"]);
  const [selectedSpace, setSelectedSpace] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [spacesRes, docsRes] = await Promise.all([
      getDocSpacesAction(),
      getDocsAction(selectedSpace, search),
    ]);

    if (spacesRes.success && spacesRes.data) {
      const sps = ["ALL", ...spacesRes.data.map((s: any) => s.name)];
      setSpacesList(Array.from(new Set(sps)));
    }

    if (docsRes.success && docsRes.data) {
      setDocs(docsRes.data as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedSpace]);

  const spaces = spacesList;

  const filteredDocs = docs.filter((d) => {
    const matchesSpace = selectedSpace === "ALL" || d.spaceName === selectedSpace;
    const matchesSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.content.toLowerCase().includes(search.toLowerCase());
    return matchesSpace && matchesSearch;
  });

  const handleOpenDoc = (doc: DocItem) => {
    setActiveDoc(doc);
    setIsModalOpen(true);
  };

  const handleSaveDoc = async (id: string, newTitle: string, newContent: string) => {
    const res = await saveDocAction({
      id,
      title: newTitle,
      content: newContent,
    });

    if (res.success) {
      toast.success(`Document "${newTitle}" saved successfully.`);
      loadData();
      setActiveDoc((prev) => (prev && prev.id === id ? { ...prev, title: newTitle, content: newContent } : prev));
    } else {
      toast.error(res.error || "Failed to save document");
    }
  };

  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDoc = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const res = await createDocAction({
        spaceId: selectedSpace,
        title: "New Document Draft",
        content: "# New Document\n\nEnter content here...",
      });

      if (res.success && res.data) {
        toast.success("Created new document draft.");
        loadData();
        setActiveDoc(res.data as any);
        setIsModalOpen(true);
      } else {
        toast.error(res.error || "Failed to create document");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create document");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight">Docs & SOPs</h1>
          <p className="text-xs text-mutedText mt-0.5 font-mono">
            Track F: Spaces, SOPs, Incident Reports & Technical Specifications
          </p>
        </div>
        <button
          type="button"
          disabled={isCreating}
          onClick={handleCreateDoc}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-2xs disabled:opacity-60 cursor-pointer"
        >
          {isCreating ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>New Document</span>
            </>
          )}
        </button>
      </div>

      {/* Spaces Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {spaces.map((sp) => (
            <button
              key={sp}
              type="button"
              onClick={() => setSelectedSpace(sp)}
              className={`px-3 py-1.5 rounded-control text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                selectedSpace === sp
                  ? "bg-primary text-white"
                  : "bg-surface border border-line text-mutedText hover:text-ink hover:bg-surface-alt"
              }`}
            >
              <Folder className="h-3.5 w-3.5" />
              <span>{sp}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 text-mutedText absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search docs and SOPs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-surface border border-line rounded-control text-ink focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => handleOpenDoc(doc)}
            className="bg-surface rounded-card border border-line p-4 shadow-xs hover:border-primary/50 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {doc.spaceName}
                </span>
                <span className="text-[10px] font-mono text-mutedText">{doc.updatedAt}</span>
              </div>
              <h3 className="text-xs font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
                {doc.title}
              </h3>
              <p className="text-xs text-mutedText mt-2 line-clamp-3 leading-relaxed font-sans">
                {doc.content.replace(/#+/g, "").slice(0, 140)}...
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-[11px] text-mutedText">
              <span>{doc.authorName}</span>
              <span className="text-primary font-medium group-hover:underline">Open &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      <DocViewerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        doc={activeDoc}
        onSave={handleSaveDoc}
      />
    </div>
  );
}
