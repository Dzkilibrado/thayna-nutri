import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
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
            {mode === "signin" ? "Entre para gerenciar o site." : "Crie a conta de administração."}
          </p>
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

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {mode === "signin" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </form>
    </div>
  );
}
