"use client"

import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <p className="text-sm text-destructive">
        {error.message || "Something went wrong"}
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
