import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Disable Next.js default body parsing for this route to allow Multer to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Set up Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Verify file MIME type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!") as any, false);
    }
  },
});

const uploadMiddleware = upload.single("file");

// Reusable middleware runner helper
function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // 1. Run the multer parsing middleware
    await runMiddleware(req, res, uploadMiddleware);

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded. Please attach a file." });
    }

    // 2. Upload parsed file buffer directly to Cloudinary folder "notices"
    const uploadResult = await uploadToCloudinary(file.buffer, "notices");

    // 3. Return structured Cloudinary metadata response
    return res.status(200).json({
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    // Helper to mask secrets in logs (e.g. "api_key: ***35539")
    const maskSecret = (str: string | undefined) => {
      if (!str) return "not configured";
      const trimmed = str.trim();
      return trimmed.length > 6 ? `***${trimmed.slice(-4)}` : "***";
    };

    console.error("Cloudinary upload API error details:", {
      message: error.message || error,
      name: error.name || "Error",
      http_code: error.http_code || 500,
      cloudName: "dtopjfdrv",
      apiKey: '291763556227889',
      apiSecretPresent: '58XzkKNKq_VWa1ruTZN9yTI7kVM',
    });

    // Check if the error was due to file size limit or file filter rejection
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File is too large. Maximum size allowed is 5MB." });
    }
    if (error.message && error.message.includes("Only image files")) {
      return res.status(400).json({ error: error.message });
    }

    const statusCode = error.http_code || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal server error during image upload.",
      code: error.name || "UploadError",
    });
  }
}
