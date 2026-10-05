"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { createCampus, toggleCampusSupportMode } from "@/lib/services/org";
import { SupportMode } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getCampusesAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const campuses = await db.campus.findMany({
      where: { archived: false },
      include: {
        _count: { select: { users: true, teams: true } },
      },
      orderBy: { name: "asc" },
    });

    const leadIds = campuses.map((c) => c.leadId).filter((id): id is string => Boolean(id));
    const leads = await db.user.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, name: true },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l.name]));

    const mapped = campuses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code || c.name.slice(0, 4).toUpperCase(),
      mode: c.mode as "ONSITE" | "REMOTE",
      leadName: c.leadId ? leadMap.get(c.leadId) || "Lead Assigned" : "Lead Assigned",
      userCount: c._count.users,
      teamCount: c._count.teams,
      status: "Active",
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load campuses", data: [] };
  }
}

export async function createCampusAction(params: {
  name: string;
  code?: string;
  mode?: "ONSITE" | "REMOTE";
  leadName?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    let leadId: string | undefined;
    if (params.leadName) {
      const lead = await db.user.findFirst({
        where: { name: { contains: params.leadName, mode: "insensitive" } },
      });
      if (lead) leadId = lead.id;
    }

    const campus = await createCampus(user, {
      name: params.name,
      code: params.code,
      mode: params.mode === "ONSITE" ? SupportMode.ONSITE : SupportMode.REMOTE,
      leadId,
    });

    revalidatePath("/setup");
    return { success: true, data: campus };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create campus" };
  }
}

export async function toggleCampusSupportModeAction(campusId: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const updated = await toggleCampusSupportMode(user, campusId);
    revalidatePath("/setup");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle mode" };
  }
}
