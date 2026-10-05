"use server";

import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface SaveSettingsResult {
  success: boolean;
  error?: string;
}

/**
 * Save all settings to the Setting table (key-value pairs).
 * Only ADMIN can update settings.
 */
export async function saveSettingsAction(
  settings: Record<string, unknown>
): Promise<SaveSettingsResult> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  if (actor.role !== "ADMIN") {
    return { success: false, error: "Only Admins can update system settings" };
  }

  try {
    // Upsert each setting key
    const entries = Object.entries(settings);
    for (const [key, value] of entries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      });
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "UPDATE",
        entity: "Setting",
        entityId: "bulk",
        after: settings as any,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save settings";
    return { success: false, error: message };
  }
}

/**
 * Fetch all settings from the Setting table.
 */
export async function fetchSettingsAction(): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const actor = await getSessionUser();
  if (!actor) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const rows = await prisma.setting.findMany();
    const result: Record<string, unknown> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return { success: true, data: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch settings";
    return { success: false, error: message };
  }
}
