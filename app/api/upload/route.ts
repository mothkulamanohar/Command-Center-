import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB per SPEC F-CHAT-04

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ownerType = (formData.get("ownerType") as string) || "MESSAGE";
    const ownerId = (formData.get("ownerId") as string) || "general";
    const uploadedById = (formData.get("uploadedById") as string) || "u_sri";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 25 MB maximum size limit" },
        { status: 413 }
      );
    }

    // Ensure uploads directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    await fs.writeFile(filePath, buffer);

    // Save Attachment record in database
    const attachment = await db.attachment.create({
      data: {
        ownerType,
        ownerId,
        fileName: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        path: filePath,
        uploadedById,
      },
    });

    return NextResponse.json({
      ok: true,
      attachment: {
        id: attachment.id,
        fileName: attachment.fileName,
        size: attachment.size,
        mime: attachment.mime,
        url: `/data/uploads/${safeFileName}`,
      },
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "File upload failed" },
      { status: 500 }
    );
  }
}
