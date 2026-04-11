import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { FrameVariant } from "@/lib/types";

export const runtime = "nodejs";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "frame";
}

function getFileExtension(fileName: string): string {
  const cleanName = fileName.toLowerCase();
  if (cleanName.endsWith(".png")) return "png";
  if (cleanName.endsWith(".webp")) return "webp";
  if (cleanName.endsWith(".jpg") || cleanName.endsWith(".jpeg")) return "jpg";
  return "png";
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN is not configured" },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFrames: FrameVariant[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
      }

      const ext = getFileExtension(file.name);
      const baseName = file.name.replace(/\.[^/.]+$/, "") || "frame";
      const safeName = slugify(baseName);
      const key = `frames/${Date.now()}-${randomUUID()}.${ext}`;

      const blob = await put(key, file, {
        access: "public",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      uploadedFrames.push({
        id: `${safeName}-${randomUUID().slice(0, 8)}`,
        name: baseName,
        image: blob.url,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ frames: uploadedFrames });
  } catch {
    return NextResponse.json({ error: "Frame upload failed" }, { status: 500 });
  }
}
