"use client";

import { useState } from "react";
import { FileText, Plus, Folder, Search, Sparkles, BookOpen } from "lucide-react";
import { DocViewerModal, DocItem } from "@/components/docs/DocViewerModal";

const INITIAL_DOCS: DocItem[] = [
  {
    id: "d-1",
    title: "SOP: Campus Core Switch Migration & VLAN Config",
    spaceName: "SMRU Campus IT",
    template: "SOP",
    authorName: "Sri (IT Manager)",
    updatedAt: "22 Sep 2026",
    content: `# Standard Operating Procedure: Switch Migration

## 1. Objective
Ensure zero-downtime cutover of 48-port Cisco access switches in SMRU Main Server Room.

## 2. Prerequisites
- Backup running configuration to local TFTP.
- Verify uplink fiber patch cable signal dBm level.
- Label all trunk and edge patch cables before disconnection.

## 3. Execution Steps
1. Power up replacement switch on rack unit 14.
2. Load baseline VLAN config (VLAN 10 Admin, 20 Faculty, 30 Labs, 40 Wi-Fi).
3. Connect primary fiber trunk to GigabitEthernet0/1.
4. Verify STP topology convergence (no root bridge loops).
5. Migrate patch cables sequentially by port grouping.
6. Test ping reachability to gateway and core DNS.`,
  },
  {
    id: "d-2",
    title: "Incident Postmortem: DNS TTL Propagation Delay",
    spaceName: "Org Space",
    template: "Incident Report",
    authorName: "Hari (Coordinator)",
    updatedAt: "20 Sep 2026",
    content: `# Incident Report: DNS Propagation Delay

## Date & Severity
- Date: 19 Sep 2026
- Severity: Medium
- Resolution Time: 42 minutes

## Summary
Subdomain 'admissions.smru.edu.in' experienced intermittent resolution failures following an A-record IP change due to high TTL (86400s) on external resolvers.

## Root Cause
TTL had not been reduced to 300s 48 hours prior to migration.

## Corrective Actions
- Updated standard DNS change SOP to require 300s TTL 48 hours prior to all planned cutovers.`,
  },
  {
    id: "d-3",
    title: "Dev Setup & Architecture: Command Center",
    spaceName: "Developers",
    template: "Project Brief",
    authorName: "Dev · Web",
    updatedAt: "24 Sep 2026",
    content: `# Command Center Architecture & Setup Guide

## Technology Stack
- Next.js 15 App Router
- PostgreSQL with Prisma ORM
- Socket.IO Real-time Rooms
- pg-boss Background Jobs
- Local Ollama AI Fallback

## Running Locally
1. docker compose up -d postgres
2. npm run db:push && npm run db:seed
3. npm run dev`,
  },
];

export default function DocsPage() {
  const [docs, setDocs] = useState<DocItem[]>(INITIAL_DOCS);
  const [selectedSpace, setSelectedSpace] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [activeDoc, setActiveDoc] = useState<DocItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const spaces = ["ALL", "Org Space", "SMRU Campus IT", "Developers"];

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

  const handleSaveDoc = (id: string, newTitle: string, newContent: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, title: newTitle, content: newContent, updatedAt: "Just now" } : d
      )
    );
  };

  const handleCreateDoc = () => {
    const newDoc: DocItem = {
      id: `doc-${Date.now()}`,
      title: "New Document Draft",
      spaceName: selectedSpace === "ALL" ? "Org Space" : selectedSpace,
      authorName: "Sri",
      updatedAt: "Just now",
      content: "# New Document\n\nEnter content here...",
    };
    setDocs([newDoc, ...docs]);
    setActiveDoc(newDoc);
    setIsModalOpen(true);
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
          onClick={handleCreateDoc}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-control text-xs font-medium transition-colors shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Doc</span>
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
