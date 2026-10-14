"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UploadButton({ onTrigger }: { onTrigger?: (fn: () => void) => void } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"owned" | "wishlisted">("owned");
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    onTrigger?.(() => inputRef.current?.click());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <Button size="lg" variant="outline" onClick={() => inputRef.current?.click()} className="hidden md:flex">
        <Upload className="size-4" data-icon="inline-start" />
        Upload
      </Button>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!uploading) setDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to wardrobe</DialogTitle>
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
                  className="h-36 w-full overflow-hidden bg-white"
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
            <p className="label-caps text-muted-foreground">Add as</p>
            <div className="mt-1 flex gap-6 border-b border-border">
              {(["owned", "wishlisted"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "label-caps -mb-px border-b py-2.5 transition-colors",
                    status === s
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s === "owned" ? "Owned" : "Wishlist"}
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
            Process and add
          </Button>
        </DialogContent>
      </Dialog>

      {/* Full-screen processing overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-background/95">
          <Loader2 className="size-8 animate-spin stroke-[1.5] text-foreground" />
          <p className="font-serif text-3xl leading-none text-foreground">
            AI is analyzing your {files.length === 1 ? "photo" : `${files.length} photos`}...
          </p>
          <p className="label-caps text-muted-foreground">
            Detecting items, removing backgrounds, sorting into categories
          </p>
        </div>
      )}
    </>
  );
}
