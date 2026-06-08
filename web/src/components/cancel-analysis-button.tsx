"use client";

import { useState } from "react";
import { Loader2Icon, OctagonXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function cancelAnalysisJob(analysisId: string): Promise<void> {
  const response = await fetch(`/api/analyses/${analysisId}/cancel`, {
    method: "POST",
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to cancel job");
  }
}

export function CancelAnalysisButton({
  analysisId,
  onCancelled,
  variant = "outline",
  size = "default",
}: {
  analysisId: string;
  onCancelled?: () => void;
  variant?: "outline" | "destructive" | "secondary";
  size?: "default" | "sm";
}) {
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      await cancelAnalysisJob(analysisId);
      onCancelled?.();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={loading}
      onClick={() => {
        handleCancel().catch(() => undefined);
      }}
    >
      {loading ? (
        <>
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
          Cancelling…
        </>
      ) : (
        <>
          <OctagonXIcon data-icon="inline-start" />
          Cancel job
        </>
      )}
    </Button>
  );
}
