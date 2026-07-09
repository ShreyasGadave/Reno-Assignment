import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, EditIcon, Trash2Icon, FileImageIcon } from "lucide-react";
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

interface NoticeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notice: Notice;
  onDeleteClick?: () => void;
}

export default function NoticeViewModal({ isOpen, onClose, notice, onDeleteClick }: NoticeViewModalProps) {
  const isUrgent = notice.priority === "Urgent";

  // Format date to "DD Month YYYY" (e.g., "10 July 2026")
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
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

  // Format datetime to readable short form (e.g., "10 Jul 2026, 14:30")
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[90vh] h-auto sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] p-0 flex flex-col overflow-hidden bg-card rounded-2xl border border-border shadow-2xl transition-all duration-200">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto min-h-0">
          
          {/* Top Banner Image or Placeholder */}
          <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] md:aspect-[32/10] overflow-hidden bg-muted border-b border-border">
            {notice.imageUrl ? (
              <Image
                src={notice.imageUrl}
                alt={notice.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 70vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-r from-muted/50 to-muted/20 p-6">
                <FileImageIcon className="size-12 stroke-[1.25] text-muted-foreground/40 mb-2" />
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/50">
                  No Banner Image
                </span>
              </div>
            )}
          </div>

          {/* Modal Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs uppercase tracking-wider font-semibold">
                {notice.category}
              </Badge>
              <Badge className={cn(
                "font-bold px-2 py-0.5 text-[10px] uppercase tracking-wide",
                isUrgent 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}>
                {notice.priority} Priority
              </Badge>
            </div>

            {/* Title */}
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
              {notice.title}
            </DialogTitle>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-border/60 py-4 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarIcon className="size-4 shrink-0 text-muted-foreground/60" />
                <div>
                  <span className="block font-medium text-muted-foreground/50">Publish Date</span>
                  <span className="text-foreground font-semibold">{formatDate(notice.publishDate)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4 shrink-0 text-muted-foreground/60" />
                <div>
                  <span className="block font-medium text-muted-foreground/50">Created</span>
                  <span className="text-foreground font-semibold">{formatDateTime(notice.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4 shrink-0 text-muted-foreground/60" />
                <div>
                  <span className="block font-medium text-muted-foreground/50">Last Updated</span>
                  <span className="text-foreground font-semibold">{formatDateTime(notice.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Notice Details</h4>
              <DialogDescription className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-normal">
                {notice.body}
              </DialogDescription>
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className="border-t bg-muted/20 p-4 shrink-0 flex items-center justify-between sm:justify-between w-full">
          <div>
            {onDeleteClick && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDeleteClick}
                className="flex items-center gap-1.5"
              >
                <Trash2Icon className="size-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href={`/notice/${notice.id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-1.5"
              )}
            >
              <EditIcon className="size-3.5" />
              <span>Edit Notice</span>
            </Link>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
