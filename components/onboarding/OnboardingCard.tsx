"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Smartphone,
  Bell,
  MessageSquare,
  Send,
  Camera,
  X,
  Upload,
  Download,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: typeof Camera;
  done: boolean;
}

interface OnboardingCardProps {
  onOpenDailyUpdate?: () => void;
}

export function OnboardingCard({ onOpenDailyUpdate }: OnboardingCardProps) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([
    {
      id: "photo",
      title: "Set your profile photo",
      description: "Upload a picture so colleagues recognize you in chat & updates",
      icon: Camera,
      done: false,
    },
    {
      id: "pwa",
      title: "Install app on your phone",
      description: "Install as a PWA from your browser menu for instant access",
      icon: Smartphone,
      done: true,
    },
    {
      id: "notifs",
      title: "Allow push notifications",
      description: "Get notified when tasks are assigned or someone nudges you",
      icon: Bell,
      done: false,
    },
    {
      id: "chat",
      title: "Join your team chat",
      description: "Say hello in your assigned campus or department channel",
      icon: MessageSquare,
      done: false,
    },
    {
      id: "update",
      title: "Post your first daily update",
      description: "Share what you're working on before 18:00 IST",
      icon: Send,
      done: false,
    },
  ]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const markStepDone = (id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: true } : s)));
  };

  const handleStepClick = async (stepId: string) => {
    if (stepId === "photo") {
      setActiveModal("photo");
    } else if (stepId === "pwa") {
      setActiveModal("pwa");
    } else if (stepId === "notifs") {
      if ("Notification" in window) {
        try {
          const perm = await Notification.requestPermission();
          markStepDone("notifs");
          showToast(perm === "granted" ? "Push notifications enabled!" : "Notification preference updated.");
        } catch {
          markStepDone("notifs");
          showToast("Push notification preference saved.");
        }
      } else {
        markStepDone("notifs");
        showToast("Push notifications ready in PWA mode.");
      }
    } else if (stepId === "chat") {
      markStepDone("chat");
      router.push("/chat");
    } else if (stepId === "update") {
      markStepDone("update");
      if (onOpenDailyUpdate) {
        onOpenDailyUpdate();
      } else {
        window.dispatchEvent(new CustomEvent("open-daily-update"));
      }
    }
  };

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (completedCount === steps.length) return null;

  return (
    <>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface px-4 py-2.5 rounded-control text-xs font-medium shadow-panel border border-line flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Checklist Card */}
      <div className="bg-surface rounded-panel border border-line p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h2 className="text-sm font-semibold text-ink">Getting Started Checklist</h2>
            <p className="text-xs text-mutedText mt-0.5">
              Complete your setup to get the most out of Command Center
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-semibold text-primary">
              {completedCount}/{steps.length} done
            </span>
            <div className="w-24 h-1.5 bg-ground rounded-full mt-1 overflow-hidden border border-line">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-line/50 mt-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepClick(step.id)}
                className="w-full flex items-center justify-between py-2.5 px-2 text-left hover:bg-surface-alt rounded-control transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-control ${
                      step.done ? "bg-primary/10 text-primary" : "bg-ground text-mutedText group-hover:text-ink"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        step.done ? "line-through text-mutedText" : "text-ink group-hover:text-primary"
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-[11px] text-mutedText">{step.description}</div>
                  </div>
                </div>
                <div>
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-line group-hover:text-mutedText transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Photo Modal */}
      {activeModal === "photo" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-sm shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">Set Profile Photo</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
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
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 text-xs text-mutedText hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  markStepDone("photo");
                  setActiveModal(null);
                  showToast("Profile photo updated successfully!");
                }}
                className="px-4 py-1.5 bg-primary text-white rounded-control text-xs font-medium shadow-xs"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Phone Install Guide Modal */}
      {activeModal === "pwa" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-panel border border-line w-full max-w-md shadow-panel p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-ink">Install on Your Phone (PWA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
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
                onClick={() => {
                  markStepDone("pwa");
                  setActiveModal(null);
                  showToast("PWA status verified!");
                }}
                className="px-4 py-2 bg-primary text-white rounded-control text-xs font-medium shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
