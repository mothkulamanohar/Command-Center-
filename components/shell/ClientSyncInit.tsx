"use client";

import { useEffect } from "react";
import { initCrossTabSync } from "@/lib/store/sync";
import { UndoToastContainer } from "@/components/ui/UndoToast";

export function ClientSyncInit() {
  useEffect(() => {
    initCrossTabSync();
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <UndoToastContainer />;
}
