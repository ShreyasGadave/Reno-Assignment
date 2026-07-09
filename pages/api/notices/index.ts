import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: Retrieve notices ordered by priority desc (Urgent first), then publishDate desc
  if (req.method === "GET") {
    try {
      const notices = await prisma.notice.findMany({
        orderBy: [
          { priority: "desc" },
          { publishDate: "desc" },
        ],
      });
      return res.status(200).json(notices);
    } catch (error) {
      console.error("Error fetching notices:", error);
      return res.status(500).json({ error: "Failed to fetch notices from database" });
    }
  }

  // POST: Create a new notice
  if (req.method === "POST") {
    try {
      const { title, body, category, priority, publishDate, imageUrl, imagePublicId } = req.body;

      // Server-side structured validation
      const errors: Record<string, string> = {};

      if (!title || typeof title !== "string" || title.trim() === "") {
        errors.title = "Title is required.";
      }
      if (!body || typeof body !== "string" || body.trim() === "") {
        errors.body = "Body description is required.";
      }
      if (!category || !["Exam", "Event", "General"].includes(category)) {
        errors.category = "Category must be one of: Exam, Event, General.";
      }
      if (!priority || !["Normal", "Urgent"].includes(priority)) {
        errors.priority = "Priority must be one of: Normal, Urgent.";
      }
      if (!publishDate || isNaN(Date.parse(publishDate))) {
        errors.publishDate = "A valid publish date is required.";
      }
      if (imageUrl && typeof imageUrl !== "string") {
        errors.imageUrl = "Image URL must be a valid string.";
      }
      if (imagePublicId && typeof imagePublicId !== "string") {
        errors.imagePublicId = "Image Public ID must be a valid string.";
      }

      // If validation fails, return structured 400 Bad Request
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
      }

      // Create new Notice in database using Prisma
      const notice = await prisma.notice.create({
        data: {
          title: title.trim(),
          body: body.trim(),
          category: category as any,
          priority: priority as any,
          publishDate: new Date(publishDate),
          imageUrl: imageUrl || null,
          imagePublicId: imagePublicId || null,
        },
      });

      return res.status(201).json(notice);
    } catch (error) {
      console.error("Error creating notice:", error);
      return res.status(500).json({ error: "Failed to create notice in database" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
