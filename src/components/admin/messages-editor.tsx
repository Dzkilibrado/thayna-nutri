import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy as CopyIcon,
  FileText,
  Link as LinkIcon,
  MessageCircle,
  Pencil,
  Plus,
  Send,
  Trash2,
  Video,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl } from "@/lib/seo";
import {
  ACCESS_LINK_COLUMNS,
  DURATION_OPTIONS,
  MESSAGE_COLUMNS,
  MESSAGE_KIND_OPTIONS,
  buildMessageSendText,
  whatsappLink,
  type ClientAccessLink,
  type MessageKind,
  type MessageTemplate,
} from "@/lib/site";
import { cn } from "@/lib/utils";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string | undefined;
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

const KIND_ICON: Record<MessageKind, typeof FileText> = {
  text: FileText,
  video: Video,
  link: LinkIcon,
};

const kindLabel = (k: MessageKind) => MESSAGE_KIND_OPTIONS.find((o) => o.value === k)?.label ?? k;

const ALL = "all";
const EMPTY: MessageTemplate = {
  id: "",
  title: "",
  description: null,
  kind: "text",
  body: "",
  url: null,
};

export function MessagesEditor() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState<MessageTemplate | null>(null);
  const [kindFilter, setKindFilter] = useState(ALL);

  const query = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select(MESSAGE_COLUMNS)
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MessageTemplate[];
    },
  });

  const items = query.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
  const shown = kindFilter === ALL ? items : items.filter((m) => m.kind === kindFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Mensagens prontas para reaproveitar com qualquer cliente já cadastrado. Enviar gera um
          link pessoal, com validade, só com aquele conteúdo.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Nova mensagem
        </Button>
      </div>

      <div className="w-full sm:w-56">
        <Field label="Filtrar por tipo">
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os tipos</SelectItem>
              {MESSAGE_KIND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {query.isLoading ? <p className="text-sm">Carregando…</p> : null}

      {!query.isLoading && shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {items.length === 0
            ? "Nenhuma mensagem cadastrada ainda."
            : "Nenhuma mensagem deste tipo."}
        </p>
      ) : null}

      <ul className="space-y-2">
        {shown.map((item) => {
          const Icon = KIND_ICON[item.kind];
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3"
            >
              <span className="icon-tile flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title || "(sem título)"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {kindLabel(item.kind)}
                  {item.description ? ` · ${item.description}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" onClick={() => setSending(item)}>
                  <Send className="size-4" /> Enviar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(item)}
                  aria-label="Editar"
                >
                  <Pencil className="size-4" />
                </Button>
                <DeleteButton item={item} onChanged={refresh} />
              </div>
            </li>
          );
        })}
      </ul>

      {creating ? (
        <MessageDialog item={EMPTY} onClose={() => setCreating(false)} onSaved={refresh} />
      ) : null}
      {editing ? (
        <MessageDialog item={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      ) : null}
      {sending ? <SendDialog message={sending} onClose={() => setSending(null)} /> : null}
    </div>
  );
}

function DeleteButton({ item, onChanged }: { item: MessageTemplate; onChanged: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("message_templates").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem excluída.");
      setConfirm(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setConfirm(true)} aria-label="Excluir">
        <Trash2 className="size-4 text-destructive" />
      </Button>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir &ldquo;{item.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Links já enviados com esta mensagem param de funcionar. Não tem como desfazer.
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
    </>
  );
}

function MessageDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MessageTemplate;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(item);
  useEffect(() => setForm(item), [item]);

  const isNew = item.id === "";
  const set = <K extends keyof MessageTemplate>(key: K, value: MessageTemplate[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Texto é sempre opcional para vídeo e link — só é obrigatório quando a
  // mensagem inteira É o texto (kind "text"), onde não existe outro conteúdo.
  const canSave =
    form.title.trim().length > 0 &&
    (form.kind === "text"
      ? (form.body ?? "").trim().length > 0
      : (form.url ?? "").trim().length > 0);

  const save = useMutation({
    mutationFn: async (values: MessageTemplate) => {
      const { id, ...rest } = values;
      const { error } = isNew
        ? await supabase.from("message_templates").insert(rest)
        : await supabase.from("message_templates").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isNew ? "Mensagem criada." : "Mensagem salva.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async () => {
      const { id, ...rest } = form;
      const { error } = await supabase
        .from("message_templates")
        .insert({ ...rest, title: `${rest.title} (cópia)` });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mensagem duplicada.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nova mensagem" : "Editar mensagem"}</DialogTitle>
          <DialogDescription>As alterações só valem depois de salvar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Título" hint="Só para você identificar na lista.">
            <Input value={form.title} autoFocus onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Descrição" hint="Opcional. Ajuda a filtrar quando for enviar.">
            <Input
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              placeholder="Ex.: Explicação sobre a consultoria online"
            />
          </Field>
          <Field label="Tipo">
            <Select value={form.kind} onValueChange={(v) => set("kind", v as MessageKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_KIND_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Texto"
            hint={
              form.kind === "text"
                ? undefined
                : "Opcional. Aparece junto do vídeo ou do link, como uma introdução."
            }
          >
            <Textarea
              rows={5}
              value={form.body ?? ""}
              onChange={(e) => set("body", e.target.value)}
            />
          </Field>

          {form.kind !== "text" ? (
            <Field
              label={form.kind === "video" ? "Link do vídeo" : "Link de destino"}
              hint={
                form.kind === "video"
                  ? "Cole o link do YouTube, Instagram ou Facebook."
                  : "Cole o endereço completo."
              }
            >
              <Input
                value={form.url ?? ""}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          ) : null}
        </div>

        <DialogFooter>
          {!isNew ? (
            <Button
              variant="secondary"
              onClick={() => duplicate.mutate()}
              disabled={duplicate.isPending}
            >
              <CopyIcon className="size-4" /> Duplicar
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending || !canSave}>
            {save.isPending ? "Salvando…" : isNew ? "Criar mensagem" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * Envio: escolhe um cliente já cadastrado e uma validade, gera um link
 * pessoal apontando só para esta mensagem e abre o WhatsApp pronto.
 * ------------------------------------------------------------------ */

function SendDialog({ message, onClose }: { message: MessageTemplate; onClose: () => void }) {
  const [clientId, setClientId] = useState<string>("");
  const [duration, setDuration] = useState<string>("48");

  const clientsQuery = useQuery({
    queryKey: ["admin-access-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_access_links")
        .select(ACCESS_LINK_COLUMNS)
        .is("message_template_id", null)
        .order("client_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClientAccessLink[];
    },
  });

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);
  const selected = clients.find((c) => c.id === clientId);

  const send = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Escolha um cliente.");
      if (!selected.client_phone) throw new Error("Este cliente não tem telefone cadastrado.");

      const hours = duration === "none" ? null : Number(duration);
      const expires_at = hours ? new Date(Date.now() + hours * 3600 * 1000).toISOString() : null;

      const { data, error } = await supabase
        .from("client_access_links")
        .insert({
          client_name: selected.client_name,
          client_phone: selected.client_phone,
          message_template_id: message.id,
          duration_hours: hours,
          expires_at,
        })
        .select("token")
        .single();
      if (error) throw error;

      const link = absoluteUrl(`/informacoes/${data.token}`);
      const text = buildMessageSendText(selected.client_name, message.title, link);
      window.open(whatsappLink(selected.client_phone, text), "_blank", "noreferrer");
    },
    onSuccess: () => {
      toast.success("Link gerado e WhatsApp aberto.");
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle>Enviar &ldquo;{message.title}&rdquo;</DialogTitle>
          <DialogDescription>
            Gera um link pessoal só com esta mensagem e abre o WhatsApp do cliente escolhido, com o
            texto já pronto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field
            label="Cliente"
            hint={
              clients.length === 0
                ? "Nenhum cliente cadastrado ainda. Cadastre em Cadastros → Clientes."
                : undefined
            }
          >
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.client_name || c.client_phone || "Sem nome"}
                    {c.client_phone ? ` · ${c.client_phone}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {selected && !selected.client_phone ? (
            <p
              role="alert"
              className={cn(
                "rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm",
              )}
            >
              Este cliente não tem telefone cadastrado — edite o cadastro dele antes de enviar.
            </p>
          ) : null}

          <Field label="Validade do link">
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
          <Button onClick={() => send.mutate()} disabled={send.isPending || !clientId}>
            <MessageCircle className="size-4" />
            {send.isPending ? "Gerando…" : "Gerar link e abrir WhatsApp"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
