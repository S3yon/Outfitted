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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"owned" | "wishlisted">("owned");
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setDialogOpen(true);
    e.target.value = "";
  }

  function resetState() {
    setFile(null);
    setPreview(null);
    setStatus("owned");
    setDialogOpen(false);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setDialogOpen(false);

    const formData = new FormData();
    formData.append("file", file);
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
        className="hidden"
        onChange={handleFileSelect}
      />
      <Button size="lg" onClick={() => inputRef.current?.click()}>
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
            <DialogTitle>Add to Wardrobe</DialogTitle>
          </DialogHeader>

          {preview && (
            <div className="mx-auto h-48 w-40 overflow-hidden rounded-lg bg-white">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            AI will detect and separate each item automatically.
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
                      ? "border-gold bg-gold/10 text-foreground"
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
          <Loader2 className="size-10 animate-spin text-gold" />
          <p className="text-sm font-medium text-foreground">
            AI is analyzing your photo...
          </p>
          <p className="text-xs text-muted-foreground">
            Detecting items, removing backgrounds, sorting into categories
          </p>
        </div>
      )}
    </>
  );
}
