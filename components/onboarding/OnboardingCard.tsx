"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Smartphone,
  Bell,
  MessageSquare,
  Send,
  Camera,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PhotoUploadModal } from "./PhotoUploadModal";
import { PwaInstallModal } from "./PwaInstallModal";

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
          toast.success(perm === "granted" ? "Push notifications enabled!" : "Notification preference updated.");
        } catch {
          markStepDone("notifs");
          toast.success("Push notification preference saved.");
        }
      } else {
        markStepDone("notifs");
        toast.success("Push notifications ready in PWA mode.");
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

      <PhotoUploadModal
        isOpen={activeModal === "photo"}
        onClose={() => setActiveModal(null)}
        onSave={() => {
          markStepDone("photo");
          setActiveModal(null);
          toast.success("Profile photo updated successfully!");
        }}
      />

      <PwaInstallModal
        isOpen={activeModal === "pwa"}
        onClose={() => setActiveModal(null)}
        onConfirm={() => {
          markStepDone("pwa");
          setActiveModal(null);
          toast.success("PWA status verified!");
        }}
      />
    </>
  );
}
