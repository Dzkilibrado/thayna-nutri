import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type AdminUser = {
  user_id: string;
  email: string;
  created_at: string;
  is_self: boolean;
};

type Invite = {
  email: string;
  created_at: string;
  accepted_at: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function AccessEditor() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-invites"] });
  };

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_users_list");
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const invites = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("email, created_at, accepted_at")
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invite[];
    },
  });

  const invite = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.rpc("admin_invite_create", { _email: value });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite criado. Avise a pessoa para se cadastrar com esse e-mail.");
      setEmail("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase.rpc("admin_invite_revoke", { _email: value });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite cancelado.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeAccess = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_access_revoke", { _user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acesso removido.");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl">Convidar novo acesso</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Informe o e-mail da pessoa. Ela vai criar a própria senha ao se cadastrar — você nunca
            precisa saber nem digitar a senha de ninguém.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full space-y-1.5 sm:min-w-[260px] sm:flex-1">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</Label>
            <Input
              type="email"
              value={email}
              placeholder="nome@exemplo.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={() => invite.mutate(email.trim())}
            disabled={invite.isPending || !email.includes("@")}
          >
            {invite.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Convidar
          </Button>
        </div>

        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Depois de convidar, mande o endereço do site com <code>/auth</code> no fim para a pessoa.
          Ela se cadastra com o e-mail convidado e já entra com acesso ao painel. Quem não foi
          convidado até consegue criar conta, mas não enxerga nada do painel.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Convites aguardando cadastro</h2>
        {invites.isLoading ? <p className="text-sm">Carregando…</p> : null}
        {!invites.isLoading && (invites.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Nenhum convite pendente.
          </p>
        ) : null}
        {(invites.data ?? []).map((item) => (
          <div
            key={item.email}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{item.email}</p>
              <p className="text-xs text-muted-foreground">
                Convidado em {formatDate(item.created_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={revokeInvite.isPending}
              onClick={() => revokeInvite.mutate(item.email)}
            >
              <Trash2 className="size-4 text-destructive" />
              Cancelar
            </Button>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Quem tem acesso ao painel</h2>
        {users.isLoading ? <p className="text-sm">Carregando…</p> : null}
        {(users.data ?? []).map((user) => (
          <div
            key={user.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm">
                  {user.email}
                  {user.is_self ? (
                    <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                      você
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  Acesso desde {formatDate(user.created_at)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={user.is_self || revokeAccess.isPending}
              title={user.is_self ? "Você não pode remover o seu próprio acesso" : undefined}
              onClick={() => revokeAccess.mutate(user.user_id)}
            >
              <Trash2 className="size-4 text-destructive" />
              Remover acesso
            </Button>
          </div>
        ))}
        <p className="text-[11px] text-muted-foreground">
          Remover o acesso não apaga a conta da pessoa — ela apenas deixa de enxergar o painel.
          Sempre precisa sobrar pelo menos um administrador.
        </p>
      </section>
    </div>
  );
}
