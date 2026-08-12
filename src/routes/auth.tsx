import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acesso administrativo | Thaynan Nutricionista" },
      { name: "description", content: "Área restrita de gestão do site." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso administrativo" },
      { property: "og:description", content: "Área restrita de gestão do site." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/admin" });
        else toast.success("Conta criada. Confirme o e-mail para entrar.");
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (/invalid login credentials/i.test(raw)) {
        toast.error(
          mode === "signin"
            ? "E-mail ou senha incorretos. Se você ainda não criou sua conta, use a aba \u201cCriar conta\u201d."
            : "Não foi possível criar a conta. Confira o e-mail e a senha.",
        );
      } else if (/already registered|already been registered/i.test(raw)) {
        toast.error("Já existe uma conta com esse e-mail. Use a aba \u201cEntrar\u201d.");
      } else if (/signups? not allowed|signup is disabled/i.test(raw)) {
        toast.error("A criação de contas está desativada nas configurações do site.");
      } else {
        toast.error(raw || "Não foi possível continuar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="hero-surface flex min-h-screen items-center justify-center px-5">
      <form
        onSubmit={onSubmit}
        className="card-shadow w-full max-w-sm space-y-4 rounded-2xl border border-border bg-surface p-6"
      >
        <div>
          <h1 className="text-2xl">Painel administrativo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Entre para gerenciar o site."
              : "Primeiro acesso? Crie sua conta com o e-mail que foi convidado."}
          </p>
        </div>

        <div
          role="tablist"
          className="grid grid-cols-2 gap-1 rounded-full border border-border bg-surface-2 p-1"
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-3 py-2 text-sm transition-colors",
                mode === m
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "signin" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
        </Button>

        {mode === "signup" ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Só quem foi convidado pelo painel recebe acesso à gestão do site. A senha é escolhida
            por você agora e não fica visível para mais ninguém.
          </p>
        ) : null}
      </form>
    </div>
  );
}
