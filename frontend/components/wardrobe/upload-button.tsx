"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"owned" | "wishlisted">("owned");
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
    setDialogOpen(true);
    e.target.value = "";
  }

  function resetState() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    setStatus("owned");
    setDialogOpen(false);
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setDialogOpen(false);

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    formData.append("status", status);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      toast.error("Server returned invalid response");
      setUploading(false);
      return;
    }

    if (!res.ok) {
      toast.error(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    const newItems = data;
    setWardrobeItems([...newItems, ...wardrobeItems]);
    toast.success(
      newItems.length === 1
        ? "1 item added to your wardrobe"
        : `${newItems.length} items added to your wardrobe`,
    );
    setUploading(false);
    resetState();
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button onClick={() => inputRef.current?.click()} className="h-10 w-10 p-0 sm:h-11 sm:w-auto sm:gap-2 sm:px-8">
        <Upload className="size-4 shrink-0" />
        <span className="hidden sm:inline">Upload</span>
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!uploading) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Wardrobe</DialogTitle>
          </DialogHeader>

          {previews.length > 0 && (
            <div className={cn(
              "mx-auto gap-2",
              previews.length === 1
                ? "flex"
                : "grid grid-cols-2",
            )}>
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="h-36 w-full overflow-hidden rounded-lg bg-white"
                >
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {files.length === 1
              ? "AI will detect and separate each item automatically."
              : `${files.length} images selected. AI will process each one.`}
          </p>

          {/* Status toggle */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Status
            </p>
            <div className="flex gap-2">
              {(["owned", "wishlisted"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-all",
                    status === s
                      ? "border-foreground bg-foreground/5 text-foreground"
                      : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button
            size="lg"
            className="mt-2 w-full"
            disabled={uploading}
            onClick={handleUpload}
          >
            Process & Add
          </Button>
        </DialogContent>
      </Dialog>

      {/* Full-screen processing overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Loader2 className="size-10 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-neutral-100">
            AI is analyzing your {files.length === 1 ? "photo" : `${files.length} photos`}...
          </p>
          <p className="text-xs text-neutral-400">
            Detecting items, removing backgrounds, sorting into categories
          </p>
        </div>
      )}
    </>
  );
}
