"use client";

/**
 * Cross-tab and live sync engine for Command Center
 * Ensures state updates propagate across components in the same tab,
 * across all other open browser tabs, and over Socket.IO where applicable.
 */

export function broadcastStoreUpdate(eventName: string, data?: unknown) {
  if (typeof window === "undefined") return;

  // 1. Same-tab CustomEvent
  window.dispatchEvent(new CustomEvent(eventName, { detail: data }));

  // 2. Cross-tab BroadcastChannel
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("icc_sync_channel");
      bc.postMessage({ eventName, data, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // BroadcastChannel unsupported or blocked
  }

  // 3. Cross-tab localStorage storage event fallback
  try {
    localStorage.setItem(
      "icc_tab_sync_ping",
      JSON.stringify({ eventName, timestamp: Date.now() })
    );
  } catch {
    // Quota exceeded or private mode
  }
}

/**
 * Initialize cross-tab sync listeners once on client mount
 */
let isInitialized = false;

export function initCrossTabSync() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("icc_sync_channel");
      bc.onmessage = (event) => {
        if (event.data?.eventName) {
          window.dispatchEvent(
            new CustomEvent(event.data.eventName, { detail: event.data.data })
          );
        }
      };
    }
  } catch {}

  window.addEventListener("storage", (e) => {
    if (e.key === "icc_tab_sync_ping" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed.eventName) {
          window.dispatchEvent(
            new CustomEvent(parsed.eventName, { detail: parsed.data })
          );
        }
      } catch {}
    }
  });
}
