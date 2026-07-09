import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid notice ID." });
  }

  // GET: Fetch notice details by ID
  if (req.method === "GET") {
    try {
      const notice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!notice) {
        return res.status(404).json({ error: "Notice not found." });
      }

      return res.status(200).json(notice);
    } catch (error) {
      console.error("Error fetching notice:", error);
      return res.status(500).json({ error: "Failed to fetch notice from database." });
    }
  }

  // PUT: Update notice details
  if (req.method === "PUT") {
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

      // Check if notice exists
      const existingNotice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!existingNotice) {
        return res.status(404).json({ error: "Notice not found." });
      }

      // Cloudinary lifecycle cleanup:
      // If the imagePublicId changed (either new image uploaded or image removed), delete the old one
      if (existingNotice.imagePublicId && existingNotice.imagePublicId !== imagePublicId) {
        try {
          console.log(`Deleting replaced image ${existingNotice.imagePublicId} from Cloudinary...`);
          await deleteFromCloudinary(existingNotice.imagePublicId);
        } catch (cloudinaryError) {
          // Handle failures safely: log the error, but do not block the DB update
          console.error("Failed to delete old image from Cloudinary:", cloudinaryError);
        }
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
          imageUrl: imageUrl || null,
          imagePublicId: imagePublicId || null,
        },
      });

      return res.status(200).json(updatedNotice);
    } catch (error) {
      console.error("Error updating notice:", error);
      return res.status(500).json({ error: "Failed to update notice in database." });
    }
  }

  // DELETE: Delete notice and clean up Cloudinary assets
  if (req.method === "DELETE") {
    try {
      // Check if notice exists
      const existingNotice = await prisma.notice.findUnique({
        where: { id },
      });

      if (!existingNotice) {
        return res.status(404).json({ error: "Notice not found." });
      }

      // Cloudinary lifecycle cleanup: Delete image before deleting DB record
      if (existingNotice.imagePublicId) {
        try {
          console.log(`Deleting image ${existingNotice.imagePublicId} from Cloudinary...`);
          await deleteFromCloudinary(existingNotice.imagePublicId);
        } catch (cloudinaryError) {
          // Handle failures safely: log the error, but do not block database record deletion
          console.error("Failed to delete notice image from Cloudinary:", cloudinaryError);
        }
      }

      // Delete notice record in database
      await prisma.notice.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Notice deleted successfully." });
    } catch (error) {
      console.error("Error deleting notice:", error);
      return res.status(500).json({ error: "Failed to delete notice from database." });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
