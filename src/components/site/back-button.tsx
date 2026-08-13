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
        "group -ml-1 inline-flex items-center gap-1.5 rounded-md py-1 pl-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {showHome ? (
        <Home className="size-4" />
      ) : (
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      )}
      {label}
    </Link>
  );
}
