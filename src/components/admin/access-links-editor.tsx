import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Eye, MessageCircle, Plus, RefreshCcw, ShieldOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl } from "@/lib/seo";
import {
  ACCESS_LINK_COLUMNS,
  DURATION_OPTIONS,
  buildClientAccessMessage,
  whatsappLink,
  type ClientAccessLink,
} from "@/lib/site";
import { cn } from "@/lib/utils";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function linkFor(token: string) {
  return absoluteUrl(`/informacoes/${token}`);
}

function statusOf(item: ClientAccessLink): { label: string; tone: "ok" | "warn" | "off" } {
  if (item.revoked) return { label: "Revogado", tone: "off" };
  if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) {
    return { label: "Expirado", tone: "warn" };
  }
  if (!item.expires_at) return { label: "Sem validade", tone: "ok" };
  return { label: `Ativo até ${formatDateTime(item.expires_at)}`, tone: "ok" };
}

export function AccessLinksEditor() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin-access-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_access_links")
        .select(ACCESS_LINK_COLUMNS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientAccessLink[];
    },
  });

  const items = query.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-access-links"] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Cada link é único e só existe aqui — não fica visível em nenhum menu do site. Quem tiver o
          endereço consegue abrir a página; não é pedida nenhuma senha.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo link
        </Button>
      </div>

      <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
        O conteúdo mostrado (apresentação e valores) é editado na aba Conteúdo, escolhendo a página
        &ldquo;Página privada&rdquo;. Aqui você só controla quem recebe o link e por quanto tempo.
      </p>

      {query.isLoading ? <p className="text-sm">Carregando…</p> : null}

      {!query.isLoading && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum link criado ainda. Clique em &ldquo;Novo link&rdquo; para gerar o primeiro.
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <AccessLinkRow key={item.id} item={item} onChanged={refresh} />
        ))}
      </ul>

      {creating ? <CreateDialog onClose={() => setCreating(false)} onSaved={refresh} /> : null}
    </div>
  );
}

function AccessLinkRow({ item, onChanged }: { item: ClientAccessLink; onChanged: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const status = statusOf(item);
  const link = linkFor(item.token);

  const revoke = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("client_access_links")
        .update({ revoked: !item.revoked })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(item.revoked ? "Acesso reativado." : "Acesso revogado.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("client_access_links").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link excluído.");
      setConfirmDelete(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function copyLink() {
    void navigator.clipboard.writeText(link).then(
      () => toast.success("Link copiado."),
      () => toast.error("Não foi possível copiar. Copie manualmente."),
    );
  }

  function sendWhatsApp() {
    if (!item.client_phone) {
      toast.error("Informe o telefone do cliente para enviar por aqui.");
      return;
    }
    const message = buildClientAccessMessage(item.client_name, link);
    window.open(whatsappLink(item.client_phone, message), "_blank", "noreferrer");
  }

  return (
    <li className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{item.client_name || "Sem nome"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {item.client_phone || "Sem telefone"} · criado em {formatDateTime(item.created_at)}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px]",
            status.tone === "ok" && "bg-primary/15 text-primary",
            status.tone === "warn" && "bg-destructive/20 text-foreground",
            status.tone === "off" && "bg-surface-2 text-muted-foreground",
          )}
        >
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
        <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{link}</code>
        <Button variant="ghost" size="icon" onClick={copyLink} aria-label="Copiar link">
          <Copy className="size-4" />
        </Button>
      </div>

      {item.view_count > 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="size-3" /> Aberto {item.view_count}{" "}
          {item.view_count === 1 ? "vez" : "vezes"}
          {item.last_viewed_at ? ` · última em ${formatDateTime(item.last_viewed_at)}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={sendWhatsApp} disabled={!item.client_phone}>
          <MessageCircle className="size-4" /> Enviar no WhatsApp
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setRenewing(true)}>
          <RefreshCcw className="size-4" /> Renovar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => revoke.mutate()}
          disabled={revoke.isPending}
        >
          <ShieldOff className="size-4" /> {item.revoked ? "Reativar" : "Revogar"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4 text-destructive" /> Excluir
        </Button>
      </div>

      {renewing ? (
        <RenewDialog item={item} onClose={() => setRenewing(false)} onSaved={onChanged} />
      ) : null}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este link?</AlertDialogTitle>
            <AlertDialogDescription>
              O link para de funcionar na hora e não tem como desfazer. Se for só por um tempo, use
              &ldquo;Revogar&rdquo; em vez de excluir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                remove.mutate();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}

function CreateDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [duration, setDuration] = useState<string>("48");

  const create = useMutation({
    mutationFn: async () => {
      const hours = duration === "none" ? null : Number(duration);
      const expires_at = hours ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;
      const { error } = await supabase.from("client_access_links").insert({
        client_name: name.trim() || null,
        client_phone: phone.trim() || null,
        duration_hours: hours,
        expires_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link criado.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle>Novo link para cliente</DialogTitle>
          <DialogDescription>
            Nome e telefone são só para você identificar o link depois — não bloqueiam nem liberam o
            acesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Nome do cliente" hint="Opcional.">
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field
            label="Telefone (WhatsApp)"
            hint="Opcional, mas necessário para usar o botão de enviar por aqui."
          >
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="27996657309"
            />
          </Field>
          <Field label="Validade">
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.label} value={o.value === null ? "none" : String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? "Criando…" : "Criar link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenewDialog({
  item,
  onClose,
  onSaved,
}: {
  item: ClientAccessLink;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [duration, setDuration] = useState<string>(
    item.duration_hours ? String(item.duration_hours) : "none",
  );

  const renew = useMutation({
    mutationFn: async () => {
      const hours = duration === "none" ? null : Number(duration);
      const { error } = await supabase.rpc("renew_client_access", {
        _id: item.id,
        _duration_hours: hours,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link renovado — o endereço mudou. Copie e envie o novo.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle>Renovar link</DialogTitle>
          <DialogDescription>
            Gera um endereço novo para {item.client_name || "este cliente"}. O link antigo para de
            funcionar imediatamente.
          </DialogDescription>
        </DialogHeader>

        <Field label="Nova validade">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((o) => (
                <SelectItem key={o.label} value={o.value === null ? "none" : String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => renew.mutate()} disabled={renew.isPending}>
            {renew.isPending ? "Renovando…" : "Renovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
