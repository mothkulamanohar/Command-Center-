"use client";

import { Smartphone, X } from "lucide-react";

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PwaInstallModal({ isOpen, onClose, onConfirm }: PwaInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">Install on Your Phone (PWA)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 text-xs text-mutedText">
          <p>
            Command Center is installable directly as a native-like PWA with offline outbox and push notifications:
          </p>
          <div className="p-3 bg-ground rounded-control border border-line space-y-2">
            <div className="font-semibold text-ink">Android (Chrome / Edge):</div>
            <div className="text-[11px]">
              1. Tap the three dots menu (⋮) in the top-right corner.
              <br />
              2. Select <span className="font-mono font-medium text-ink">&ldquo;Install app&rdquo;</span> or <span className="font-mono font-medium text-ink">&ldquo;Add to Home Screen&rdquo;</span>.
            </div>
          </div>
          <div className="p-3 bg-ground rounded-control border border-line space-y-2">
            <div className="font-semibold text-ink">iPhone (iOS Safari):</div>
            <div className="text-[11px]">
              1. Tap the Share button (<span className="font-mono">􀈂</span>) at the bottom.
              <br />
              2. Scroll down and select <span className="font-mono font-medium text-ink">&ldquo;Add to Home Screen&rdquo;</span>.
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2 border-t border-line">
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-primary text-white rounded-control text-xs font-medium shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
