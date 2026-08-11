import { Link } from "@tanstack/react-router";
import { ArrowLeft, Home } from "lucide-react";

import { cn } from "@/lib/utils";

interface BackButtonProps {
  to?: string;
  label?: string;
  showHome?: boolean;
  className?: string;
}

export function BackButton({
  to = "/",
  label = "Voltar",
  showHome = false,
  className,
}: BackButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
        className,
      )}
    >
      {showHome ? <Home className="size-4" /> : <ArrowLeft className="size-4" />}
      {label}
    </Link>
  );
}

export function HomeButton({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Voltar para página inicial"
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-border bg-surface p-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground",
        className,
      )}
    >
      <Home className="size-5" />
    </Link>
  );
}
