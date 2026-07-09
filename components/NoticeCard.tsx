import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, EditIcon, Trash2Icon, FileImageIcon } from "lucide-react";
import DeleteConfirm from "./DeleteConfirm";
import NoticeViewModal from "./NoticeViewModal";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  body: string;
  category: "Exam" | "Event" | "General";
  priority: "Normal" | "Urgent";
  publishDate: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface NoticeCardProps {
  notice: Notice;
  onDeleteSuccess: () => void;
}

export default function NoticeCard({ notice, onDeleteSuccess }: NoticeCardProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Format date to "DD Month YYYY" (e.g., "10 July 2026")
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/notices/${notice.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete notice");
      }

      onDeleteSuccess();
    } catch (err) {
      console.error("Error deleting notice:", err);
      alert("Failed to delete notice. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const isUrgent = notice.priority === "Urgent";

  return (
    <>
      <Card className={`group/card relative flex flex-col h-full bg-card border ${isUrgent ? "border-red-500 ring-1 ring-red-500/20 shadow-md" : "border-border shadow-sm"} transition-all duration-200 hover:shadow-md`}>
        
        {/* Responsive Aspect-Ratio Image or Placeholder to Prevent CLS */}
        <div 
          onClick={() => setIsViewOpen(true)}
          className="relative w-full aspect-video overflow-hidden bg-muted border-b border-border cursor-pointer"
        >
          {notice.imageUrl ? (
            <Image
              src={notice.imageUrl}
              alt={notice.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
              unoptimized={false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/60 bg-muted/40 p-4">
              <FileImageIcon className="size-10 stroke-[1.5] text-muted-foreground/40 mb-2" />
              <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/50">
                No Image Provided
              </span>
            </div>
          )}
        </div>

        <CardHeader className="flex flex-col gap-2 p-5 pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Category Badge */}
            <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
              {notice.category}
            </Badge>
            
            {/* Urgent Badge (red) */}
            {isUrgent && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-0.5 text-[10px] uppercase tracking-wide">
                Urgent
              </Badge>
            )}
          </div>

          <CardTitle 
            onClick={() => setIsViewOpen(true)}
            className="text-xl font-bold tracking-tight text-foreground line-clamp-2 mt-1 hover:text-primary transition-colors cursor-pointer"
          >
            {notice.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-5 pt-0 pb-4 space-y-4">
          {/* Publish Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            <span>Published on {formatDate(notice.publishDate)}</span>
          </div>

          {/* Priority display detail */}
          <div className="grid grid-cols-2 gap-x-2 text-xs border-y border-border/60 py-2">
            <div>
              <span className="text-muted-foreground block font-medium">Category</span>
              <span className="text-foreground font-semibold">{notice.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground block font-medium">Priority</span>
              <span className={`font-semibold ${isUrgent ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                {notice.priority}
              </span>
            </div>
          </div>

          {/* Notice Body */}
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">
            {notice.body}
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 p-5 pt-3 border-t border-border bg-muted/20">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsViewOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 font-medium"
          >
            <span>View Notice</span>
          </Button>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/notice/${notice.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-sm" }),
                "size-7 flex items-center justify-center"
              )}
              title="Edit"
            >
              <EditIcon className="size-3.5" />
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsDeleteOpen(true)}
              className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center"
              disabled={isDeleting}
              title="Delete"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </CardFooter>

        <DeleteConfirm
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
        />
      </Card>

      {/* View Modal */}
      <NoticeViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        notice={notice}
        onDeleteClick={() => {
          setIsViewOpen(false);
          setIsDeleteOpen(true);
        }}
      />
    </>
  );
}
