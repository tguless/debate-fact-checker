"use client";

import { useState } from "react";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export async function deleteAnalysisJob(analysisId: string): Promise<void> {
  const response = await fetch(`/api/analyses/${analysisId}`, {
    method: "DELETE",
  });

  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to delete analysis");
  }
}

export function DeleteAnalysisButton({
  analysisId,
  videoId,
  onDeleted,
  variant = "outline",
  size = "default",
  confirmMessage,
}: {
  analysisId: string;
  videoId?: string;
  onDeleted?: () => void;
  variant?: "outline" | "destructive" | "secondary" | "ghost";
  size?: "default" | "sm";
  confirmMessage?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const label = videoId ? `analysis for ${videoId}` : "this analysis";
    const message =
      confirmMessage ??
      `Delete ${label}? This permanently removes the report, claims, and transcript from history.`;

    if (!window.confirm(message)) {
      return;
    }

    setLoading(true);
    try {
      await deleteAnalysisJob(analysisId);
      toast.success("Analysis deleted");
      onDeleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete analysis");
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
        handleDelete().catch(() => undefined);
      }}
    >
      {loading ? (
        <>
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
          Deleting…
        </>
      ) : (
        <>
          <Trash2Icon data-icon="inline-start" />
          Delete
        </>
      )}
    </Button>
  );
}
