"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Download, Loader2, RotateCcw, RefreshCw, Share2, Timer, TimerOff, Copy, X } from "lucide-react";
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
  const [showShareSheet, setShowShareSheet] = useState(false);

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

            <div className="absolute inset-x-0 bottom-8 flex justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleRetake}
                className="rounded-full border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
              >
                <RotateCcw className="size-4" />
                Retake
              </Button>
              <Button
                size="lg"
                onClick={() => setShowShareSheet(true)}
                className="rounded-full bg-white/90 text-black backdrop-blur-sm hover:bg-white"
              >
                <Share2 className="size-4" />
                Share
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

      {/* Share Sheet */}
      <AnimatePresence>
        {showShareSheet && resultUrl && (
          <>
            <motion.div
              key="share-backdrop"
              className="fixed inset-0 z-[200] bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareSheet(false)}
            />
            {/* Mobile: bottom sheet */}
            <motion.div
              key="share-sheet"
              className="fixed inset-x-0 bottom-0 z-[201] rounded-t-2xl bg-background pb-safe md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="px-4 pb-8 pt-2">
                <h3 className="mb-4 text-base font-semibold">Share</h3>
                <ShareActions resultUrl={resultUrl} onClose={() => setShowShareSheet(false)} />
              </div>
            </motion.div>
            {/* Desktop: centered modal */}
            <motion.div
              key="share-modal"
              className="fixed left-1/2 top-1/2 z-[201] hidden w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-6 shadow-xl md:block"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Share</h3>
                <button
                  onClick={() => setShowShareSheet(false)}
                  className="flex size-7 items-center justify-center rounded-full hover:bg-secondary"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ShareActions resultUrl={resultUrl} onClose={() => setShowShareSheet(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ShareActions({ resultUrl, onClose }: { resultUrl: string; onClose: () => void }) {
  const [copying, setCopying] = useState(false);

  async function handleSave() {
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = "outfitted-tryon.png";
    a.click();
    onClose();
  }

  async function handleCopy() {
    setCopying(true);
    try {
      const blob = await fetch(resultUrl).then((r) => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      toast.success("Image copied");
      onClose();
    } catch {
      toast.error("Couldn't copy image");
    }
    setCopying(false);
  }

  async function handleNativeShare() {
    try {
      const blob = await fetch(resultUrl).then((r) => r.blob());
      const file = new File([blob], "outfitted-tryon.png", { type: blob.type || "image/png" });
      await navigator.share({ files: [file], title: "My outfit on Outfitted" });
      onClose();
    } catch {
      toast.error("Share not supported on this device");
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent("Check out my outfit on @OutfittedApp")}`;
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Check out my outfit on Outfitted! " + pageUrl)}`;

  const actions = [
    {
      icon: Download,
      label: "Save to Camera Roll",
      onClick: handleSave,
    },
    {
      icon: copying ? Loader2 : Copy,
      label: "Copy Image",
      onClick: handleCopy,
      loading: copying,
    },
    ...(typeof navigator !== "undefined" && "share" in navigator
      ? [{ icon: Share2, label: "Share via...", onClick: handleNativeShare }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-2">
      {actions.map(({ icon: Icon, label, onClick, loading }) => (
        <button
          key={label}
          disabled={loading}
          onClick={onClick}
          className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <Icon className={`size-4 shrink-0 ${loading ? "animate-spin" : ""}`} />
          {label}
        </button>
      ))}
      <div className="mt-1 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Share on</p>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.254 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X / Twitter
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <button
            onClick={async () => {
              try {
                const blob = await fetch(resultUrl).then((r) => r.blob());
                await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
                toast.success("Image copied — paste it into Instagram");
              } catch {
                toast("Open Instagram and share from your camera roll");
              }
              window.open("instagram://app", "_blank");
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
            Instagram
          </button>
        </div>
      </div>
    </div>
  );
}
