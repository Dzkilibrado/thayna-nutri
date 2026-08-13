import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ReactNode } from "react";

import { ThemeVars } from "@/components/site/theme-vars";
import type { SiteSettings } from "@/lib/site";
import { whatsappLink } from "@/lib/site";
import { externalLinkProps } from "@/lib/external";

const NAV_ITEMS = [
  { to: "/links", label: "Links" },
  { to: "/videos", label: "Vídeos" },
  { to: "/depoimentos", label: "Depoimentos" },
  { to: "/calculadoras", label: "Calculadoras" },
  { to: "/sobre", label: "Sobre" },
];

export function PageShell({
  settings,
  children,
}: {
  settings: SiteSettings | null;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <ThemeVars settings={settings} />
      <header className="border-b border-border/60 bg-surface/40 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-5 py-4">
          <Link
            to="/"
            aria-label="Ir para a página inicial"
            className="shrink-0 rounded-md font-display text-xl uppercase leading-tight tracking-wider transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {settings?.brand_name ?? "Thaynan"}
          </Link>
          {/* Desktop: menu inteiro visível. */}
          <nav className="ml-auto hidden items-center gap-4 text-sm sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              {...externalLinkProps(
                whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? ""),
              )}
              className="shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Agendar
            </a>
          </nav>

          {/* Celular: Agendar continua à vista, o resto vai para o painel. */}
          <div className="ml-auto flex items-center gap-2 sm:hidden">
            <a
              {...externalLinkProps(
                whatsappLink(settings?.whatsapp ?? "", settings?.whatsapp_message ?? ""),
              )}
              className="shrink-0 whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Agendar
            </a>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Menu className="size-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-xs border-border bg-surface">
                <SheetHeader>
                  <SheetTitle className="font-display uppercase tracking-wider">
                    {settings?.brand_name ?? "Thaynan"}
                  </SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-1">
                  <Link
                    to="/"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                    activeProps={{ className: "bg-surface-2 text-foreground" }}
                    activeOptions={{ exact: true }}
                  >
                    Início
                  </Link>
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                      activeProps={{ className: "bg-surface-2 text-foreground" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    to="/como-chegar"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-base text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                    activeProps={{ className: "bg-surface-2 text-foreground" }}
                  >
                    Como chegar
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-8">{children}</main>

      <footer className="border-t border-border/60 px-5 py-8 text-center text-xs text-muted-foreground">
        <p>
          {settings?.brand_name ?? "Thaynan"} —{" "}
          {settings?.brand_tagline ?? "Nutrição & Performance"}
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
