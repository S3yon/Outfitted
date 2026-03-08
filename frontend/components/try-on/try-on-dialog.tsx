"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { Camera, RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { PopulatedOutfit } from "@/stores/use-app-store"
import type { ClothingItem } from "@/db/schema"

type Stage = "idle" | "webcam" | "countdown" | "captured" | "processing" | "result"

const TRYABLE_CATEGORIES = new Set(["tops", "bottoms", "outerwear"])

function pickGarment(items: ClothingItem[]): ClothingItem | null {
  const priority = ["tops", "outerwear", "bottoms"]
  for (const cat of priority) {
    const item = items.find((i) => i.category === cat)
    if (item) return item
  }
  return items[0] ?? null
}

export function TryOnDialog({
  outfit,
  open,
  onOpenChange,
}: {
  outfit: PopulatedOutfit
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [stage, setStage] = useState<Stage>("idle")
  const [countdown, setCountdown] = useState(3)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [sliderPos, setSliderPos] = useState(50)
  const [selectedGarment, setSelectedGarment] = useState<ClothingItem | null>(
    () => pickGarment(outfit.items),
  )

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  const tryableItems = outfit.items.filter((i) =>
    TRYABLE_CATEGORIES.has(i.category),
  )

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  // Clean up camera on close
  useEffect(() => {
    if (!open) {
      stopCamera()
      setStage("idle")
      setCapturedImage(null)
      setResultUrl(null)
      setSliderPos(50)
      setSelectedGarment(pickGarment(outfit.items))
    }
  }, [open, stopCamera, outfit.items])

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
    })
    streamRef.current = stream
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
    setStage("webcam")
  }

  function startCountdown() {
    setCountdown(3)
    setStage("countdown")
  }

  // Countdown timer
  useEffect(() => {
    if (stage !== "countdown") return

    if (countdown <= 0) {
      captureFrame()
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, countdown])

  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedImage(dataUrl)
    stopCamera()
    setStage("captured")
  }

  function handleRetake() {
    setCapturedImage(null)
    setResultUrl(null)
    startCamera()
  }

  async function handleTryOn() {
    if (!capturedImage || !selectedGarment) return

    setStage("processing")

    const res = await fetch("/api/try-on", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personImage: capturedImage,
        garmentUrl: selectedGarment.cloudinaryUrl,
        category: selectedGarment.category,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? "Try-on failed")
      setStage("captured")
      return
    }

    const data = await res.json()
    setResultUrl(data.resultUrl)
    setStage("result")
  }

  function handleSliderDrag(e: React.PointerEvent) {
    const container = sliderRef.current
    if (!container) return

    function onMove(ev: PointerEvent) {
      const rect = container!.getBoundingClientRect()
      const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width))
      setSliderPos((x / rect.width) * 100)
    }

    function onUp() {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" showCloseButton={stage !== "processing"}>
        <DialogHeader>
          <DialogTitle>Virtual Try-On</DialogTitle>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />

        {/* Garment selector */}
        {tryableItems.length > 1 && stage !== "result" && stage !== "processing" && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tryableItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedGarment(item)}
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all",
                  selectedGarment?.id === item.id
                    ? "border-foreground"
                    : "border-border opacity-60 hover:opacity-100",
                )}
              >
                <Image
                  src={item.cloudinaryUrl}
                  alt={item.category}
                  fill
                  className="object-contain p-1"
                  sizes="56px"
                />
              </button>
            ))}
          </div>
        )}

        {/* Stage: idle */}
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Camera className="size-7 text-muted-foreground" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Take a photo and see how this outfit looks on you.
              <br />
              <span className="text-xs">Experimental feature — results may vary.</span>
            </p>
            <Button onClick={startCamera}>Start Camera</Button>
          </div>
        )}

        {/* Stage: webcam / countdown */}
        {(stage === "webcam" || stage === "countdown") && (
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full object-cover"
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

        {/* Stage: captured */}
        {stage === "captured" && capturedImage && (
          <div className="flex flex-col gap-3">
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured"
                className="size-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleRetake}>
                <RotateCcw className="size-4" data-icon="inline-start" />
                Retake
              </Button>
              <Button className="flex-1" onClick={handleTryOn}>
                Try On
              </Button>
            </div>
          </div>
        )}

        {/* Stage: processing */}
        {stage === "processing" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Applying outfit... this may take 30-60 seconds.
            </p>
          </div>
        )}

        {/* Stage: result */}
        {stage === "result" && capturedImage && resultUrl && (
          <div className="flex flex-col gap-3">
            <div
              ref={sliderRef}
              className="relative aspect-[3/4] cursor-col-resize select-none overflow-hidden rounded-lg"
              onPointerDown={handleSliderDrag}
            >
              {/* After (result) — full width behind */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="Try-on result"
                className="absolute inset-0 size-full object-cover"
              />
              {/* Before (original) — clipped */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  alt="Original"
                  className="size-full object-cover"
                  style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
                />
              </div>
              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-lg"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
                  <span className="text-xs font-bold text-black">&#x2194;</span>
                </div>
              </div>
              {/* Labels */}
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                Before
              </span>
              <span className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                After
              </span>
            </div>
            <Button variant="outline" onClick={handleRetake}>
              <RotateCcw className="size-4" data-icon="inline-start" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
