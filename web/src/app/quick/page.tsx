import Link from "next/link";
import { AnalysisForm } from "@/components/analysis-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function QuickScanPage() {
  return (
    <main className="relative min-h-screen">
      <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "w-fit")}>
          ← Back to agent fact-check
        </Link>
        <AnalysisForm variant="secondary" />
      </div>
    </main>
  );
}
