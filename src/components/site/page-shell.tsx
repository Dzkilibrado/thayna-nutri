import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { HomeButton } from "@/components/site/back-button";
import { ThemeVars } from "@/components/site/theme-vars";
import type { SiteSettings } from "@/lib/site";
import { whatsappLink } from "@/lib/site";
import { externalLinkProps } from "@/lib/external";

export function PageShell({
  settings,
  children,
}: {
  settings: SiteSettings | null;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen bg-background">
      <ThemeVars settings={settings} />
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/" className="font-display text-xl uppercase tracking-wider">
            {settings?.brand_name ?? "Thaynan"}
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            {[
              { to: "/links", label: "Links" },
              { to: "/videos", label: "Vídeos" },
              { to: "/calculadoras", label: "Calculadoras" },
              { to: "/sobre", label: "Sobre" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              {...externalLinkProps(
                whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? ""),
              )}
              className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Agendar
            </a>
            {!isHome ? <HomeButton /> : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-8">{children}</main>

      <footer className="border-t border-border/60 px-5 py-8 text-center text-xs text-muted-foreground">
        <p>
          {settings?.brand_name ?? "Thaynan"} — {settings?.brand_tagline ?? "Nutrição & Performance"}
        </p>
        <p className="mt-1">Atendimento {settings?.hours ?? "09:00 - 20:00"}</p>
        <p className="mt-3">
          <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">
            Acesso administrativo
          </Link>
        </p>
      </footer>
    </div>
  );
}
