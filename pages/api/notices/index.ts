import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to check and save base64 image
async function saveBase64Image(base64String: string): Promise<string> {
  const match = base64String.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format. Expected a base64 encoded image.");
  }
  const ext = match[1];
  const data = match[2];
  const buffer = Buffer.from(data, "base64");

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `notice_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  await fs.promises.writeFile(filepath, buffer);

  return `/uploads/${filename}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Query database: Urgent first, then Normal, then by publishDate descending
      const notices = await prisma.notice.findMany({
        orderBy: [
          { priority: "desc" },
          { publishDate: "desc" },
        ],
      });
      return res.status(200).json(notices);
    } catch (error) {
      console.error("Error fetching notices:", error);
      return res.status(500).json({ error: "Failed to fetch notices" });
    }
  }

  if (req.method === "POST") {
    try {
      const { title, body, category, priority, publishDate, image } = req.body;

      // Server-side validation
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required and must be a string." });
      }
      if (!body || typeof body !== "string" || body.trim() === "") {
        return res.status(400).json({ error: "Body is required and must be a string." });
      }
      if (!["Exam", "Event", "General"].includes(category)) {
        return res.status(400).json({ error: "Category must be one of: Exam, Event, General." });
      }
      if (!["Normal", "Urgent"].includes(priority)) {
        return res.status(400).json({ error: "Priority must be one of: Normal, Urgent." });
      }
      if (!publishDate || isNaN(Date.parse(publishDate))) {
        return res.status(400).json({ error: "A valid publish date is required." });
      }

      // Handle optional image upload
      let imageUrl: string | null = null;
      if (image && typeof image === "string" && image.startsWith("data:image/")) {
        try {
          imageUrl = await saveBase64Image(image);
        } catch (imgError: any) {
          return res.status(400).json({ error: imgError.message || "Failed to process image upload." });
        }
      }

      // Create new Notice in database
      const notice = await prisma.notice.create({
        data: {
          title: title.trim(),
          body: body.trim(),
          category: category as any,
          priority: priority as any,
          publishDate: new Date(publishDate),
          image: imageUrl,
        },
      });

      return res.status(201).json(notice);
    } catch (error) {
      console.error("Error creating notice:", error);
      return res.status(500).json({ error: "Failed to create notice" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
