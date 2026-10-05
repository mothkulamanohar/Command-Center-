"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  listDocs,
  listDocSpaces,
  saveDoc,
} from "@/lib/services/doc";
import { revalidatePath } from "next/cache";
import { formatOrgDate } from "@/lib/time";

export async function getDocSpacesAction() {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    let spaces = await listDocSpaces();
    if (spaces.length === 0) {
      // Seed default spaces if none exist
      await db.docSpace.createMany({
        data: [
          { name: "SMRU Campus IT" },
          { name: "Org Space" },
          { name: "Developers" },
        ],
      });
      spaces = await listDocSpaces();
    }
    return { success: true, data: spaces };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load spaces", data: [] };
  }
}

export async function getDocsAction(spaceId?: string, search?: string) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized", data: [] };

  try {
    const docs = await listDocs(spaceId === "ALL" ? undefined : spaceId, search);

    const mapped = docs.map((d) => ({
      id: d.id,
      title: d.title,
      spaceId: d.spaceId,
      spaceName: d.space?.name || "General Space",
      template: d.template || "Standard",
      authorName: d.updatedById ? "IT Team" : "Sri (IT Manager)",
      updatedAt: formatOrgDate(d.updatedAt),
      content: typeof d.content === "string" ? d.content : (d.content as any)?.markdown || String(d.content || ""),
    }));

    return { success: true, data: mapped };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load docs", data: [] };
  }
}

export async function createDocAction(params: {
  spaceId?: string;
  title: string;
  content: string;
  template?: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    let targetSpaceId = params.spaceId;
    if (!targetSpaceId || targetSpaceId === "ALL") {
      const firstSpace = await db.docSpace.findFirst();
      if (firstSpace) targetSpaceId = firstSpace.id;
      else {
        const created = await db.docSpace.create({ data: { name: "Org Space" } });
        targetSpaceId = created.id;
      }
    }

    const doc = await saveDoc(user as any, {
      spaceId: targetSpaceId,
      title: params.title,
      content: params.content,
      template: params.template,
    });

    revalidatePath("/docs");
    return { success: true, data: doc };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create doc" };
  }
}

export async function saveDocAction(params: {
  id: string;
  title: string;
  content: string;
}) {
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const existing = await db.doc.findUnique({ where: { id: params.id } });
    if (!existing) throw new Error("Document not found");

    const doc = await saveDoc(user as any, {
      id: params.id,
      spaceId: existing.spaceId,
      title: params.title,
      content: params.content,
    });

    revalidatePath("/docs");
    return { success: true, data: doc };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save doc" };
  }
}
