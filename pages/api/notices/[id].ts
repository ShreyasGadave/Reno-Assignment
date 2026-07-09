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
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid notice ID" });
  }

  // GET: Fetch a single notice by ID
  if (req.method === "GET") {
    try {
      const notice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!notice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      return res.status(200).json(notice);
    } catch (error) {
      console.error("Error fetching notice:", error);
      return res.status(500).json({ error: "Failed to fetch notice" });
    }
  }

  // PUT: Update a notice
  if (req.method === "PUT") {
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

      // Check if notice exists
      const existingNotice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!existingNotice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      // Handle image upload logic
      let imageUrl: string | null = existingNotice.image; // default to existing
      
      if (image === null) {
        imageUrl = null; // image removed
      } else if (typeof image === "string" && image.startsWith("data:image/")) {
        try {
          imageUrl = await saveBase64Image(image);
        } catch (imgError: any) {
          return res.status(400).json({ error: imgError.message || "Failed to process image upload." });
        }
      } else if (typeof image === "string" && image.startsWith("/uploads/")) {
        // Keeps the existing uploaded image url
        imageUrl = image;
      }

      // Update notice in database
      const updatedNotice = await prisma.notice.update({
        where: { id },
        data: {
          title: title.trim(),
          body: body.trim(),
          category: category as any,
          priority: priority as any,
          publishDate: new Date(publishDate),
          image: imageUrl,
        },
      });

      return res.status(200).json(updatedNotice);
    } catch (error) {
      console.error("Error updating notice:", error);
      return res.status(500).json({ error: "Failed to update notice" });
    }
  }

  // DELETE: Delete a notice
  if (req.method === "DELETE") {
    try {
      // Check if notice exists
      const existingNotice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!existingNotice) {
        return res.status(404).json({ error: "Notice not found" });
      }

      // Optional: Delete physical image file from public/uploads if it exists
      if (existingNotice.image) {
        const filepath = path.join(process.cwd(), "public", existingNotice.image);
        if (fs.existsSync(filepath)) {
          try {
            await fs.promises.unlink(filepath);
          } catch (err) {
            console.error("Failed to delete physical image file:", err);
          }
        }
      }

      // Delete notice in database
      await prisma.notice.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Notice deleted successfully" });
    } catch (error) {
      console.error("Error deleting notice:", error);
      return res.status(500).json({ error: "Failed to delete notice" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
