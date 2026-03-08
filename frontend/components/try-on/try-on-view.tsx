"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type PopulatedOutfit } from "@/stores/use-app-store";
import { toast } from "sonner";

const CATEGORY_ORDER = ["accessories", "outerwear", "tops", "bottoms", "shoes"];
const COUNTDOWN_SECONDS = 5;

type Stage = "webcam" | "countdown" | "processing" | "result";

export function TryOnView({
  outfit: initialOutfit,
  onBack,
}: {
  outfit: PopulatedOutfit;
  onBack: () => void;
}) {
  const { outfits, setOutfits } = useAppStore();
  const [selectedId, setSelectedId] = useState(initialOutfit.id);
  const [stage, setStage] = useState<Stage>("webcam");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sliderPos, setSliderPos] = useState(100);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const selected = outfits.find((o) => o.id === selectedId) ?? initialOutfit;
  const sortedItems = [...selected.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );
  const otherOutfits = outfits.filter((o) => o.id !== selectedId);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 1080 }, height: { ideal: 1440 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStage("webcam");
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStage("webcam");
      } catch {
        toast.error("Camera access denied. Check your browser site settings.");
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Countdown timer
  useEffect(() => {
    if (stage !== "countdown") return;
    if (countdown <= 0) {
      captureAndProcess();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, countdown]);

  function startCountdown() {
    setCountdown(COUNTDOWN_SECONDS);
    setStage("countdown");
  }

  async function captureAndProcess() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setCapturedImage(dataUrl);
    stopCamera();
    setStage("processing");

    const res = await fetch("/api/try-on", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personImage: dataUrl, outfitId: selected.id }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Try-on failed" }));
      toast.error(err.error ?? "Try-on failed");
      await startCamera();
      return;
    }

    const data = await res.json();
    setResultUrl(data.resultUrl);
    setStage("result");

    // Update outfit in store
    setOutfits(
      outfits.map((o) =>
        o.id === selected.id ? { ...o, modelImageUrl: data.resultUrl } : o,
      ),
    );
  }

  async function handleRetake() {
    setResultUrl(null);
    setCapturedImage(null);
    setSliderPos(100);
    await startCamera();
  }

  function handleSwitchOutfit(id: string) {
    setSelectedId(id);
    setResultUrl(null);
    setCapturedImage(null);
    setSliderPos(100);
    if (stage === "result") {
      startCamera();
    }
  }

  function handleSliderDrag(e: React.PointerEvent) {
    const container = sliderRef.current;
    if (!container) return;

    function onMove(ev: PointerEvent) {
      const rect = container!.getBoundingClientRect();
      const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex flex-col md:flex-row bg-background"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera / result — top half on mobile, full height on desktop */}
      <div className="relative flex-1 min-h-0">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        {/* Webcam / countdown */}
        {(stage === "webcam" || stage === "countdown") && (
          <div className="relative h-full bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />

            <AnimatePresence mode="wait">
              {stage === "countdown" && (
                <motion.div
                  key="countdown-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-8xl font-bold text-white drop-shadow-lg"
                    >
                      {countdown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {stage === "webcam" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute inset-x-0 bottom-8 flex justify-center"
              >
                <Button
                  size="lg"
                  onClick={startCountdown}
                  className="rounded-full px-8 shadow-lg"
                >
                  <Camera className="size-5" />
                  Capture
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {/* Processing */}
        {stage === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full flex-col items-center justify-center gap-4 bg-black"
          >
            <Loader2 className="size-10 animate-spin text-white/60" />
            <p className="text-sm text-white/60">Styling your outfit...</p>
          </motion.div>
        )}

        {/* Result — before/after slider */}
        {stage === "result" && resultUrl && capturedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-full bg-black"
          >
            <div
              ref={sliderRef}
              className="relative h-full cursor-col-resize select-none"
              onPointerDown={handleSliderDrag}
            >
              {/* After (result) — full behind */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="Try-on result"
                className="absolute inset-0 h-full w-full object-contain"
              />

              {/* Before (original) — clipped from left */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Original"
                  className="h-full object-contain"
                  style={{
                    width: sliderRef.current
                      ? `${sliderRef.current.offsetWidth}px`
                      : "100vw",
                    maxWidth: "none",
                  }}
                />
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/80"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg">
                  <span className="text-sm font-bold text-black">&#x2194;</span>
                </div>
              </div>

              {/* Labels */}
              {sliderPos > 8 && (
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  Before
                </span>
              )}
              {sliderPos < 92 && (
                <span className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  After
                </span>
              )}
            </div>

            <div className="absolute inset-x-0 bottom-8 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetake}
                className="rounded-full border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              >
                <RotateCcw className="size-4" />
                Retake
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Outfit panel — bottom sheet on mobile, right sidebar on desktop */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex h-[42vh] w-full shrink-0 flex-col overflow-y-auto border-t border-border bg-background md:h-auto md:w-[340px] md:overflow-hidden md:border-l md:border-t-0"
      >
        {/* Selected outfit */}
        <div className="shrink-0 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current Outfit
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight">
            {selected.outfit_description ?? selected.explanation}
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {sortedItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-background">
                  <Image
                    src={item.cloudinaryUrl}
                    alt={item.notes ?? item.category}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </p>
                  {item.notes && (
                    <p className="truncate text-sm text-foreground">{item.notes}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other outfits */}
        {otherOutfits.length > 0 && (
          <div className="flex min-h-0 flex-1 flex-col border-t border-border p-4">
            <p className="mb-3 shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Other Outfits
            </p>
            <div className="flex flex-col gap-2 md:overflow-y-auto pr-1">
              {otherOutfits.map((o) => {
                const thumbItems = [...o.items]
                  .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
                  .slice(0, 4);
                return (
                  <button
                    key={o.id}
                    onClick={() => handleSwitchOutfit(o.id)}
                    className="flex shrink-0 items-center gap-3 rounded-lg border-2 border-border bg-secondary p-2 transition-all hover:border-foreground"
                  >
                    <div className="grid shrink-0 grid-cols-2 gap-0.5" style={{ width: 56, height: 56 }}>
                      {thumbItems.map((item) => (
                        <div key={item.id} className="relative overflow-hidden rounded bg-background">
                          <Image
                            src={item.cloudinaryUrl}
                            alt={item.category}
                            fill
                            className="object-contain p-0.5"
                            sizes="28px"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="min-w-0 truncate text-left text-xs text-muted-foreground">
                      {o.outfit_description ?? o.explanation}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
