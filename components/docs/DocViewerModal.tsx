"use client";

import { useState } from "react";
import { FileText, X, Download, Save, Check } from "lucide-react";

export interface DocItem {
  id: string;
  title: string;
  spaceName: string;
  template?: string;
  content: string;
  authorName: string;
  updatedAt: string;
}

interface DocViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
  onSave?: (id: string, title: string, content: string) => void;
}

export function DocViewerModal({ isOpen, onClose, doc, onSave }: DocViewerModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doc?.title || "");
  const [content, setContent] = useState(doc?.content || "");
  const [saved, setSaved] = useState(false);

  if (!isOpen || !doc) return null;

  const handleSave = () => {
    onSave?.(doc.id, title, content);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-3xl h-[85vh] flex flex-col shadow-panel animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-alt/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-semibold">
              {doc.spaceName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-mutedText hover:text-ink bg-surface border border-line rounded-control hover:bg-ground"
              title="Print / Save as PDF"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>

            {isEditing ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-control"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 bg-surface border border-line text-ink text-xs font-medium rounded-control hover:bg-ground"
              >
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-control text-mutedText hover:text-ink hover:bg-ground ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {saved && (
            <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20 text-xs flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              <span>Changes saved successfully</span>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-bold text-ink bg-ground border border-line rounded-control p-2 focus:outline-none focus:border-primary"
              />
              <textarea
                rows={18}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs font-mono text-ink bg-ground border border-line rounded-control p-3 focus:outline-none focus:border-primary leading-relaxed resize-none"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-line pb-3">
                <h1 className="text-xl font-bold text-ink">{title || doc.title}</h1>
                <div className="text-[11px] text-mutedText font-mono mt-1 flex items-center gap-3">
                  <span>Author: {doc.authorName}</span>
                  <span>Updated: {doc.updatedAt}</span>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-xs text-ink/90 whitespace-pre-wrap font-sans leading-relaxed">
                {content || doc.content}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
