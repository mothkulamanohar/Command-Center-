"use client";

import { Camera, X, Upload } from "lucide-react";

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function PhotoUploadModal({ isOpen, onClose, onSave }: PhotoUploadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel border border-line w-full max-w-sm shadow-panel p-5 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-ink">Set Profile Photo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-mutedText hover:text-ink cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="text-center py-4 space-y-3">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-dashed border-primary mx-auto flex items-center justify-center text-primary">
            <Camera className="h-8 w-8" />
          </div>
          <p className="text-xs text-mutedText">
            Choose an image from your device or use camera.
          </p>
          <input type="file" accept="image/*" className="hidden" id="photo-file" />
          <label
            htmlFor="photo-file"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-ground hover:bg-surface-alt border border-line text-ink rounded-control text-xs font-medium cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-mutedText" />
            <span>Select Image File</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-mutedText hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 bg-primary text-white rounded-control text-xs font-medium shadow-xs"
          >
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
}
