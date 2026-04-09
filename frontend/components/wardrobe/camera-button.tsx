"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "@/stores/use-app-store";

type Stage = "webcam" | "countdown" | "captured" | "confirm";

export function CameraButton({ open: controlledOpen, onOpenChange }: { open?: boolean; onOpenChange?: (v: boolean) => void } = {}) {
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };
  const [stage, setStage] = useState<Stage>("webcam");
  const [countdown, setCountdown] = useState(3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"owned" | "wishlisted">("owned");
  const [uploading, setUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  function resetState() {
    stopCamera();
    setStage("webcam");
    setCountdown(3);
    setCapturedImage(null);
    setStatus("owned");
  }

  useEffect(() => {
    if (!open) resetState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function startCamera() {
    stopCamera();
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile
          ? { facingMode: { ideal: "environment" }, width: { ideal: 1080 }, height: { ideal: 1080 } }
          : { width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        toast.error("Could not access camera. Make sure no other app is using it.");
        setOpen(false);
      }
    }
  }

  // Start camera when dialog opens and video element is mounted
  useEffect(() => {
    if (open && stage === "webcam") {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function startCountdown() {
    setCountdown(3);
    setStage("countdown");
  }

  useEffect(() => {
    if (stage !== "countdown") return;

    if (countdown <= 0) {
      captureFrame();
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, countdown]);

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    setStage("captured");
  }

  async function handleRetake() {
    setCapturedImage(null);
    setStage("webcam");
    // Small delay so the video element re-mounts
    await new Promise((r) => setTimeout(r, 100));
    await startCamera();
  }

  async function handleUpload() {
    if (!capturedImage) return;

    setUploading(true);
    setOpen(false);

    const blob = await fetch(capturedImage).then((r) => r.blob());
    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("files", file);
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

    setWardrobeItems([...data, ...wardrobeItems]);
    toast.success(
      data.length === 1
        ? "1 item added to your wardrobe"
        : `${data.length} items added to your wardrobe`,
    );
    setUploading(false);
    resetState();
  }

  return (
    <>
      <Button size="lg" variant="outline" onClick={() => setOpen(true)} className="hidden md:flex">
        <Camera className="size-4" data-icon="inline-start" />
        Camera
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!uploading) setOpen(v);
        }}
      >
        <DialogContent className="max-w-sm md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Snap a Clothing Item</DialogTitle>
          </DialogHeader>

          <canvas ref={canvasRef} className="hidden" />

          {/* Webcam / countdown */}
          {(stage === "webcam" || stage === "countdown") && (
            <div className="relative aspect-square md:aspect-video overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="size-full object-contain"
              />
              {stage === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="text-6xl font-bold text-white">{countdown}</span>
                </div>
              )}
              {stage === "webcam" && (
                <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
                  <Button size="lg" onClick={startCountdown}>
                    <Camera className="size-4" data-icon="inline-start" />
                    Capture
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Captured preview */}
          {stage === "captured" && capturedImage && (
            <div className="flex flex-col gap-3">
              <div className="relative aspect-square md:aspect-video overflow-hidden rounded-lg bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Captured clothing"
                  className="size-full object-contain"
                />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                AI will detect and separate each item automatically.
              </p>

              {/* Status toggle */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
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

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleRetake}>
                  <RotateCcw className="size-4" data-icon="inline-start" />
                  Retake
                </Button>
                <Button className="flex-1" onClick={handleUpload}>
                  Process & Add
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Processing overlay */}
      {uploading && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Loader2 className="size-10 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-neutral-100">
            AI is analyzing your photo...
          </p>
          <p className="text-xs text-neutral-400">
            Detecting items, removing backgrounds, sorting into categories
          </p>
        </div>
      )}
    </>
  );
}
