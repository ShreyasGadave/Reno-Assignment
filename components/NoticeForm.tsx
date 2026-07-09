import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Trash2Icon, UploadCloudIcon, Loader2Icon } from "lucide-react";

interface NoticeFormProps {
  initialData?: {
    id?: string;
    title: string;
    body: string;
    category: "Exam" | "Event" | "General";
    priority: "Normal" | "Urgent";
    publishDate: string; // ISO date string or YYYY-MM-DD
    imageUrl: string | null;
    imagePublicId: string | null;
  };
  onSubmit: (data: any) => Promise<void>;
  buttonText: string;
}

export default function NoticeForm({ initialData, onSubmit, buttonText }: NoticeFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"Exam" | "Event" | "General">("General");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [publishDate, setPublishDate] = useState("");
  
  // Cloudinary image properties
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePublicId, setImagePublicId] = useState<string | null>(null);
  
  // Selected local file and its preview URL
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize fields on load/edit
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setBody(initialData.body);
      setCategory(initialData.category);
      setPriority(initialData.priority);
      setImageUrl(initialData.imageUrl);
      setImagePublicId(initialData.imagePublicId);
      setImagePreview(initialData.imageUrl);
      
      // Format date to YYYY-MM-DD for standard html5 input
      if (initialData.publishDate) {
        const d = new Date(initialData.publishDate);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        setPublishDate(`${year}-${month}-${day}`);
      }
    }
  }, [initialData]);

  // Handle local image file selection and client-side validation
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed.");
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Remove selected image / clear existing image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl(null);
    setImagePublicId(null);
    setImagePreview(null);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Initial validation checks
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim()) {
      setError("Body description is required.");
      return;
    }
    if (!publishDate) {
      setError("Publish date is required.");
      return;
    }

    setIsSubmitting(true);
    let finalImageUrl = imageUrl;
    let finalImagePublicId = imagePublicId;

    // 1. If a new local file is selected, upload it to Cloudinary first
    if (selectedFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Failed to upload image.");
        }

        finalImageUrl = uploadData.imageUrl;
        finalImagePublicId = uploadData.publicId;
      } catch (err: any) {
        console.error("Client upload error:", err);
        setError(err.message || "Failed to upload image. Please try again.");
        setIsSubmitting(false);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    // 2. Submit notice details to standard notices endpoint
    try {
      await onSubmit({
        title,
        body,
        category,
        priority,
        publishDate: new Date(publishDate).toISOString(),
        imageUrl: finalImageUrl,
        imagePublicId: finalImagePublicId,
      });
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Something went wrong while saving the notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto bg-card p-6 rounded-2xl border border-border shadow-sm">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-foreground block">
          Title *
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter notice title"
          required
          disabled={isPending}
          className="w-full"
        />
      </div>

      {/* Body */}
      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium text-foreground block">
          Body *
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter notice body description"
          required
          disabled={isPending}
          rows={5}
          className="w-full resize-y"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category */}
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-foreground block">
            Category *
          </label>
          <NativeSelect
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            disabled={isPending}
            className="w-full"
          >
            <NativeSelectOption value="General">General</NativeSelectOption>
            <NativeSelectOption value="Exam">Exam</NativeSelectOption>
            <NativeSelectOption value="Event">Event</NativeSelectOption>
          </NativeSelect>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium text-foreground block">
            Priority *
          </label>
          <NativeSelect
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            disabled={isPending}
            className="w-full"
          >
            <NativeSelectOption value="Normal">Normal</NativeSelectOption>
            <NativeSelectOption value="Urgent">Urgent</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      {/* Publish Date */}
      <div className="space-y-2">
        <label htmlFor="publishDate" className="text-sm font-medium text-foreground block">
          Publish Date *
        </label>
        <Input
          id="publishDate"
          type="date"
          value={publishDate}
          onChange={(e) => setPublishDate(e.target.value)}
          required
          disabled={isPending}
          className="w-full"
        />
      </div>

      {/* Image (Optional Bonus) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground block">
          Image (Optional)
        </label>
        
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border bg-muted p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Upload preview"
                className="size-16 object-cover rounded-lg border border-border"
              />
              <span className="text-xs text-muted-foreground truncate max-w-[150px] md:max-w-[250px]">
                {selectedFile ? `Selected: ${selectedFile.name}` : "Image loaded"}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={handleRemoveImage}
              className="text-destructive hover:bg-destructive/10"
              title="Remove image"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="relative border border-dashed border-border rounded-xl p-6 hover:bg-accent/30 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer">
            <UploadCloudIcon className="size-8 text-muted-foreground" />
            <div className="text-sm text-foreground text-center">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP up to 5MB</p>
            <input
              type="file"
              accept="image/*"
              disabled={isPending}
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="min-w-[140px] flex items-center justify-center gap-2">
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          <span>
            {isUploading
              ? "Uploading Image..."
              : isSubmitting
              ? "Saving Notice..."
              : buttonText}
          </span>
        </Button>
      </div>
    </form>
  );
}
