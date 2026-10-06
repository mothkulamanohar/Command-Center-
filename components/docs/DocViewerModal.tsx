"use client";

import { useState, useEffect } from "react";
import { FileText, X, Download, Save, Check, ArrowLeft, Edit3 } from "lucide-react";

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

  useEffect(() => {
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
      setIsEditing(false);
    }
  }, [doc]);

  // Handle Backspace and Escape keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isEditing) {
          setIsEditing(false);
          if (doc) {
            setTitle(doc.title);
            setContent(doc.content);
          }
        } else {
          onClose();
        }
      } else if (e.key === "Backspace") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          e.preventDefault();
          if (isEditing) {
            setIsEditing(false);
            if (doc) {
              setTitle(doc.title);
              setContent(doc.content);
            }
          } else {
            onClose();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditing, doc, onClose]);

  if (!isOpen || !doc) return null;

  const handleBack = () => {
    if (isEditing) {
      setIsEditing(false);
      setTitle(doc.title);
      setContent(doc.content);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave?.(doc.id, title.trim(), content);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-surface rounded-panel border border-line w-full max-w-3xl max-h-[92vh] h-[90vh] sm:h-[85vh] flex flex-col shadow-panel animate-in zoom-in-95 overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-line flex items-center justify-between bg-surface-alt/60 gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface hover:bg-ground border border-line text-ink rounded-control text-xs font-semibold cursor-pointer transition-colors shadow-2xs shrink-0"
              title={isEditing ? "Cancel editing and go back" : "Go back to Docs list"}
            >
              <ArrowLeft className="h-3.5 w-3.5 text-primary" />
              <span>Back</span>
            </button>

            <FileText className="h-4 w-4 text-primary shrink-0 ml-1 hidden sm:inline" />
            <span className="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-semibold truncate">
              {doc.spaceName}
            </span>
            {isEditing && (
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase shrink-0">
                Editing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-mutedText hover:text-ink bg-surface border border-line rounded-control hover:bg-ground cursor-pointer transition-colors"
                title="Print / Save as PDF"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-2.5 py-1.5 text-xs text-mutedText hover:text-ink bg-surface border border-line rounded-control hover:bg-ground cursor-pointer transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-control cursor-pointer hover:bg-primary-hover shadow-xs transition-colors"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-control transition-colors shadow-2xs cursor-pointer"
                title="Edit this document"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-control text-mutedText hover:text-ink hover:bg-ground ml-1 cursor-pointer transition-colors"
              title="Close (Esc)"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {saved && (
            <div className="p-2.5 rounded bg-primary/10 text-primary border border-primary/20 text-xs flex items-center gap-1.5 font-medium animate-in fade-in">
              <Check className="h-3.5 w-3.5" />
              <span>Document updated and saved successfully!</span>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 font-mono">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                  className="w-full text-base font-bold text-ink bg-ground border border-line rounded-control p-2.5 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 font-mono">
                  Markdown Content
                </label>
                <textarea
                  rows={16}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter markdown content..."
                  className="w-full text-xs font-mono text-ink bg-ground border border-line rounded-control p-3 focus:outline-none focus:border-primary leading-relaxed resize-none"
                />
              </div>
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
