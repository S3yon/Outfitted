"use client";

import { Check, Loader2 } from "lucide-react";
import type { Step } from "./use-planner";

// The agent's tool calls as hairline rows: what it is doing, then what it found.
export function PlanSteps({ steps, running }: { steps: Step[]; running: boolean }) {
  if (steps.length === 0 && !running) return null;
  return (
    <ol className="mt-8 border-t border-border">
      {steps.length === 0 && (
        <li className="flex items-center gap-3 border-b border-border py-3 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Starting the planner
        </li>
      )}
      {steps.map((step) => (
        <li key={step.id} className="flex items-baseline gap-3 border-b border-border py-3">
          <span className="flex size-3.5 shrink-0 items-center justify-center self-center">
            {step.summary === null ? (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Check className="size-3.5 text-foreground" />
            )}
          </span>
          <p className="text-sm text-foreground">{step.label}</p>
          {step.summary && <p className="ml-auto truncate text-right text-sm text-muted-foreground">{step.summary}</p>}
        </li>
      ))}
    </ol>
  );
}
