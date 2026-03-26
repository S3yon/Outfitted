"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Loader2, RotateCcw, RefreshCw, Timer, TimerOff } from "lucide-react";
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
  const { outfits, setOutfits, capturedImages, setCapturedImage: storeCapture } = useAppStore();
  const [selectedId, setSelectedId] = useState(initialOutfit.id);

  const storedCapture = capturedImages[initialOutfit.id] ?? null;
  const hasExistingResult = !!(initialOutfit.modelImageUrl && storedCapture);

  const [stage, setStage] = useState<Stage>(hasExistingResult ? "result" : "webcam");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [resultUrl, setResultUrl] = useState<string | null>(initialOutfit.modelImageUrl ?? null);
  const [capturedImage, setCapturedImage] = useState<string | null>(storedCapture);
  const [sliderPos, setSliderPos] = useState(50);
  const [imagesReady, setImagesReady] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [timerEnabled, setTimerEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const facingModeRef = useRef<"user" | "environment">("user");
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
        video: { facingMode: { ideal: facingModeRef.current }, width: { ideal: 1080 }, height: { ideal: 1440 } },
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
    if (hasExistingResult) return;
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera, hasExistingResult]);

  // Re-attach stream to video element after it mounts (e.g. after Retake)
  useEffect(() => {
    if (stage === "webcam" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [stage]);

  // Detect portrait/landscape from the video stream dimensions
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    function onMeta() {
      setIsPortrait(video!.videoHeight >= video!.videoWidth);
    }
    video.addEventListener("loadedmetadata", onMeta);
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, []);

  // Show hint bubble once both images are decoded, auto-dismiss after 2.5s
  useEffect(() => {
    if (imagesReady < 2) return;
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(t);
  }, [imagesReady]);

  // Also update on device orientation change
  useEffect(() => {
    function onOrientationChange() {
      const landscape = window.matchMedia("(orientation: landscape)").matches;
      setIsPortrait(!landscape);
    }
    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("resize", onOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("resize", onOrientationChange);
    };
  }, []);

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

    // Mirror front camera to match what the user sees
    if (facingModeRef.current === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
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

    // Persist captured image so user can re-open the slider later
    storeCapture(selected.id, dataUrl);

    // Update outfit in store
    setOutfits(
      outfits.map((o) =>
        o.id === selected.id ? { ...o, modelImageUrl: data.resultUrl } : o,
      ),
    );
  }

  async function flipCamera() {
    const next = facingModeRef.current === "user" ? "environment" : "user";
    facingModeRef.current = next;
    setFacingMode(next);
    await startCamera();
  }

  async function handleRetake() {
    setResultUrl(null);
    setCapturedImage(null);
    setSliderPos(50);
    setImagesReady(0);
    setShowHint(false);
    await startCamera();
  }

  function handleSwitchOutfit(id: string) {
    setSelectedId(id);
    setResultUrl(null);
    setCapturedImage(null);
    setSliderPos(50);
    setImagesReady(0);
    setShowHint(false);
    if (stage === "result") {
      startCamera();
    }
  }

  function handleSliderDrag(e: React.PointerEvent) {
    e.preventDefault();
    setShowHint(false);
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

      {/* Top (mobile) / Left (desktop): webcam / result */}
      <div
        className="relative shrink-0 md:h-auto md:flex-1 transition-all duration-300"
        style={{ height: `${isPortrait ? 78 : 55}vh` }}
      >
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute left-4 z-20 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
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
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
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
                className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-4"
              >
                <button
                  onClick={() => setTimerEnabled((v) => !v)}
                  className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  title={timerEnabled ? "Disable timer" : "Enable timer"}
                >
                  {timerEnabled ? <Timer className="size-5" /> : <TimerOff className="size-5 opacity-50" />}
                </button>
                <Button
                  size="lg"
                  onClick={timerEnabled ? startCountdown : captureAndProcess}
                  className="rounded-full px-8 shadow-lg"
                >
                  <Camera className="size-5" />
                  Capture
                </Button>
                <button
                  onClick={flipCamera}
                  className="flex size-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                >
                  <RefreshCw className="size-5" />
                </button>
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
              style={{ touchAction: "none" }}
              onPointerDown={handleSliderDrag}
            >
              {/* After (result) — full behind */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="Try-on result"
                className="absolute inset-0 h-full w-full object-cover"
                onLoad={() => setImagesReady((r) => r + 1)}
              />

              {/* Before (original) — clipped from left via clip-path */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Original"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                onLoad={() => setImagesReady((r) => r + 1)}
              />

              {/* Loading overlay — visible until both images decoded */}
              {imagesReady < 2 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                  <Loader2 className="size-8 animate-spin text-white/40" />
                </div>
              )}

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 z-10 w-px bg-white/90"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full bg-white shadow-xl ring-1 ring-black/10">
                  <ChevronLeft className="size-3.5 text-black" />
                  <ChevronRight className="size-3.5 text-black" />
                </div>
                {/* Hint bubble */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.25 }}
                      className="absolute top-[calc(50%+32px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                    >
                      Drag to compare
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Labels */}
              {sliderPos > 8 && (
                <span className="absolute left-3 bottom-20 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  Before
                </span>
              )}
              {sliderPos < 92 && (
                <span className="absolute right-3 bottom-20 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
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

      {/* Bottom (mobile) / Right (desktop): outfit panel */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-border bg-background md:w-[340px] md:shrink-0 md:flex-none md:border-l md:border-t-0"
      >
        {/* Current outfit items */}
        <div className="shrink-0 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Current Outfit</p>
          <div className="flex gap-2">
            {sortedItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-secondary"
              >
                <Image
                  src={item.cloudinaryUrl}
                  alt={item.category}
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Other outfits */}
        {otherOutfits.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Other Outfits</p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {otherOutfits.map((o) => {
                const thumbItems = [...o.items]
                  .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
                  .slice(0, 4);
                return (
                  <button
                    key={o.id}
                    onClick={() => handleSwitchOutfit(o.id)}
                    className="grid shrink-0 grid-cols-2 gap-0.5 rounded-xl border-2 border-border bg-secondary p-1 transition-all hover:border-foreground"
                    style={{ width: 60, height: 60 }}
                  >
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
