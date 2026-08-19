import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Eye,
  Facebook,
  Filter,
  Instagram,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCcw,
  RotateCcw,
  ShieldOff,
  Trash2,
  Youtube,
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
import { Switch } from "@/components/ui/switch";
import { externalLinkProps } from "@/lib/external";
import { supabase } from "@/integrations/supabase/client";
import { absoluteUrl } from "@/lib/seo";
import {
  ACCESS_LINK_COLUMNS,
  ATHLETE_COLUMNS,
  ATTENDANCE_OPTIONS,
  CONTACT_STATUS_OPTIONS,
  DURATION_OPTIONS,
  buildClientAccessMessage,
  whatsappLink,
  type Athlete,
  type AttendanceType,
  type ClientAccessLink,
  type ContactStatus,
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

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

function daysSince(dateStr: string) {
  const ms = Date.now() - new Date(`${dateStr}T00:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function linkFor(token: string) {
  return absoluteUrl(`/informacoes/${token}`);
}

function linkStatusOf(item: ClientAccessLink): { label: string; tone: "ok" | "warn" | "off" } {
  if (item.revoked) return { label: "Revogado", tone: "off" };
  if (item.expires_at && new Date(item.expires_at).getTime() < Date.now()) {
    return { label: "Expirado", tone: "warn" };
  }
  if (!item.expires_at) return { label: "Sem validade", tone: "ok" };
  return { label: `Ativo até ${formatDateTime(item.expires_at)}`, tone: "ok" };
}

const contactStatusLabel = (v: ContactStatus) =>
  CONTACT_STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
const attendanceLabel = (v: AttendanceType | null) =>
  v ? (ATTENDANCE_OPTIONS.find((o) => o.value === v)?.label ?? v) : null;

const ALL = "all";
const NO_RETURN_OPTIONS = [
  { value: ALL, label: "Qualquer período" },
  { value: "30", label: "30 dias ou mais" },
  { value: "60", label: "60 dias ou mais" },
  { value: "90", label: "90 dias ou mais" },
];
const LINK_STATUS_OPTIONS = [
  { value: ALL, label: "Qualquer status" },
  { value: "ok", label: "Ativo" },
  { value: "warn", label: "Expirado" },
  { value: "off", label: "Revogado" },
];
const YES_NO = [
  { value: ALL, label: "Tanto faz" },
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
];

const NONE_ATHLETE = "none";
const NONE_ATTENDANCE = "none";

const EMPTY_CLIENT: ClientAccessLink = {
  id: "",
  client_name: "",
  client_phone: "",
  token: "",
  duration_hours: 48,
  expires_at: null,
  revoked: false,
  created_at: "",
  last_viewed_at: null,
  view_count: 0,
  contact_status: "contato_inicial",
  attendance_type: null,
  last_appointment_date: null,
  is_athlete: false,
  sponsored: false,
  referred_by_athlete_id: null,
  instagram_url: null,
  facebook_url: null,
  youtube_url: null,
  message_template_id: null,
};

/* ------------------------------------------------------------------ *
 * Tela principal: filtros por seleção, resultado só depois de buscar.
 * ------------------------------------------------------------------ */

export function AccessLinksEditor() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ClientAccessLink | null>(null);

  const [attendance, setAttendance] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [isAthlete, setIsAthlete] = useState(ALL);
  const [sponsored, setSponsored] = useState(ALL);
  const [noReturn, setNoReturn] = useState(ALL);
  const [linkStatus, setLinkStatus] = useState(ALL);
  const [searched, setSearched] = useState(false);

  const query = useQuery({
    queryKey: ["admin-access-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_access_links")
        .select(ACCESS_LINK_COLUMNS)
        .is("message_template_id", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ClientAccessLink[];
    },
  });

  const athletesQuery = useQuery({
    queryKey: ["admin-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select(ATHLETE_COLUMNS)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Athlete[];
    },
  });

  const athletes = useMemo(() => athletesQuery.data ?? [], [athletesQuery.data]);
  const athleteName = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of athletes) map.set(a.id, a.name);
    return map;
  }, [athletes]);

  const items = useMemo(() => query.data ?? [], [query.data]);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-access-links"] });

  const results = useMemo(() => {
    return items.filter((item) => {
      if (attendance !== ALL && item.attendance_type !== attendance) return false;
      if (status !== ALL && item.contact_status !== status) return false;
      if (isAthlete !== ALL && item.is_athlete !== (isAthlete === "yes")) return false;
      if (sponsored !== ALL && item.sponsored !== (sponsored === "yes")) return false;
      if (noReturn !== ALL) {
        if (!item.last_appointment_date) return false;
        if (daysSince(item.last_appointment_date) < Number(noReturn)) return false;
      }
      if (linkStatus !== ALL && linkStatusOf(item).tone !== linkStatus) return false;
      return true;
    });
  }, [items, attendance, status, isAthlete, sponsored, noReturn, linkStatus]);

  function resetFilters() {
    setAttendance(ALL);
    setStatus(ALL);
    setIsAthlete(ALL);
    setSponsored(ALL);
    setNoReturn(ALL);
    setLinkStatus(ALL);
    setSearched(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Cada link é único e só existe aqui — não aparece em nenhum menu do site. Use os filtros
          abaixo para localizar um cliente; a lista começa vazia.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo cliente
        </Button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Atendimento">
          <Select value={attendance} onValueChange={setAttendance}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {ATTENDANCE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status do contato">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {CONTACT_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="É atleta">
          <Select value={isAthlete} onValueChange={setIsAthlete}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Patrocinado">
          <Select value={sponsored} onValueChange={setSponsored}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YES_NO.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Sem retorno há">
          <Select value={noReturn} onValueChange={setNoReturn}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NO_RETURN_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status do link">
          <Select value={linkStatus} onValueChange={setLinkStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LINK_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <Button onClick={() => setSearched(true)}>
            <Filter className="size-4" /> Buscar
          </Button>
          <Button variant="ghost" onClick={resetFilters}>
            <RotateCcw className="size-4" /> Limpar filtros
          </Button>
        </div>
      </div>

      {!searched ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Ajuste os filtros acima e clique em &ldquo;Buscar&rdquo; para ver os clientes.
        </p>
      ) : query.isLoading ? (
        <p className="text-sm">Carregando…</p>
      ) : results.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum cliente encontrado com esses filtros.
        </p>
      ) : (
        <ul className="space-y-2">
          {results.map((item) => (
            <AccessLinkRow
              key={item.id}
              item={item}
              referredByName={
                item.referred_by_athlete_id
                  ? athleteName.get(item.referred_by_athlete_id)
                  : undefined
              }
              onEdit={() => setEditing(item)}
              onChanged={refresh}
            />
          ))}
        </ul>
      )}

      {creating ? (
        <ClientDialog
          item={EMPTY_CLIENT}
          athletes={athletes}
          onClose={() => setCreating(false)}
          onSaved={refresh}
        />
      ) : null}
      {editing ? (
        <ClientDialog
          item={editing}
          athletes={athletes}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}

function AccessLinkRow({
  item,
  referredByName,
  onEdit,
  onChanged,
}: {
  item: ClientAccessLink;
  referredByName: string | undefined;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const status = linkStatusOf(item);
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
      toast.success("Cliente excluído.");
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
    if (status.tone !== "ok") {
      toast.error('Gere um link antes de enviar — use o botão "Gerar link".');
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

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{contactStatusLabel(item.contact_status)}</Badge>
        {attendanceLabel(item.attendance_type) ? (
          <Badge>{attendanceLabel(item.attendance_type)}</Badge>
        ) : null}
        {item.is_athlete ? <Badge>Atleta</Badge> : null}
        {item.sponsored ? <Badge>Patrocinado</Badge> : null}
        {referredByName ? <Badge>Indicado por {referredByName}</Badge> : null}
        {item.last_appointment_date ? (
          <Badge tone={daysSince(item.last_appointment_date) >= 30 ? "warn" : undefined}>
            Última consulta em {formatDate(item.last_appointment_date)} · há{" "}
            {daysSince(item.last_appointment_date)} dias
          </Badge>
        ) : null}

        {item.instagram_url ? (
          <a
            {...externalLinkProps(item.instagram_url)}
            className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            aria-label="Abrir Instagram"
          >
            <Instagram className="size-3.5" />
          </a>
        ) : null}
        {item.facebook_url ? (
          <a
            {...externalLinkProps(item.facebook_url)}
            className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            aria-label="Abrir Facebook"
          >
            <Facebook className="size-3.5" />
          </a>
        ) : null}
        {item.youtube_url ? (
          <a
            {...externalLinkProps(item.youtube_url)}
            className="flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            aria-label="Abrir YouTube"
          >
            <Youtube className="size-3.5" />
          </a>
        ) : null}
      </div>

      {status.tone === "ok" ? (
        <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{link}</code>
          <Button variant="ghost" size="icon" onClick={copyLink} aria-label="Copiar link">
            <Copy className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          Sem link ativo para este cliente — use &ldquo;Gerar link&rdquo; para criar um quando
          precisar enviar.
        </p>
      )}

      {item.view_count > 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Eye className="size-3" /> Aberto {item.view_count}{" "}
          {item.view_count === 1 ? "vez" : "vezes"}
          {item.last_viewed_at ? ` · última em ${formatDateTime(item.last_viewed_at)}` : ""}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={sendWhatsApp}
          disabled={!item.client_phone || status.tone !== "ok"}
        >
          <MessageCircle className="size-4" /> Enviar no WhatsApp
        </Button>
        <Button size="sm" variant="secondary" onClick={onEdit}>
          <Pencil className="size-4" /> Editar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setRenewing(true)}>
          <RefreshCcw className="size-4" /> {item.revoked ? "Gerar link" : "Renovar"}
        </Button>
        {!item.revoked ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => revoke.mutate()}
            disabled={revoke.isPending}
          >
            <ShieldOff className="size-4" /> Revogar
          </Button>
        ) : null}
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
            <AlertDialogTitle>Excluir este cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O link para de funcionar na hora e todo o histórico deste cadastro é apagado. Não tem
              como desfazer. Se for só por um tempo, use &ldquo;Revogar&rdquo; em vez de excluir.
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

function Badge({ children, tone }: { children: React.ReactNode; tone?: "warn" | undefined }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px]",
        tone === "warn"
          ? "bg-destructive/20 text-foreground"
          : "bg-surface-2 text-muted-foreground",
      )}
    >
      {children}
    </span>
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
          <DialogTitle>{item.revoked ? "Gerar link de acesso" : "Renovar link"}</DialogTitle>
          <DialogDescription>
            {item.revoked
              ? `Cria um link pessoal novo para ${item.client_name || "este cliente"}, com o prazo escolhido abaixo.`
              : `Gera um endereço novo para ${item.client_name || "este cliente"}. O link antigo para de funcionar imediatamente.`}
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
            {renew.isPending ? "Gerando…" : item.revoked ? "Gerar link" : "Renovar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ *
 * Janela única de criação/edição, com todos os campos visíveis desde o
 * início — a validade do link só aparece na criação; depois, mudar o
 * prazo é uma ação separada e deliberada ("Renovar"), porque troca o
 * endereço do link.
 * ------------------------------------------------------------------ */

function ClientDialog({
  item,
  athletes,
  onClose,
  onSaved,
}: {
  item: ClientAccessLink;
  athletes: Athlete[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = item.id === "";
  const [form, setForm] = useState(item);
  const [generateLink, setGenerateLink] = useState(true);
  const [duration, setDuration] = useState<string>("48");
  useEffect(() => setForm(item), [item]);

  const set = <K extends keyof ClientAccessLink>(key: K, value: ClientAccessLink[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        client_name: form.client_name || null,
        client_phone: form.client_phone || null,
        contact_status: form.contact_status,
        attendance_type: form.attendance_type,
        last_appointment_date: form.last_appointment_date,
        is_athlete: form.is_athlete,
        sponsored: form.sponsored,
        referred_by_athlete_id: form.referred_by_athlete_id,
        instagram_url: form.instagram_url || null,
        facebook_url: form.facebook_url || null,
        youtube_url: form.youtube_url || null,
      };

      if (isNew) {
        if (generateLink) {
          const hours = duration === "none" ? null : Number(duration);
          const expires_at = hours
            ? new Date(Date.now() + hours * 3600 * 1000).toISOString()
            : null;
          const { error } = await supabase
            .from("client_access_links")
            .insert({ ...payload, duration_hours: hours, expires_at });
          if (error) throw error;
        } else {
          // Sem link por enquanto: o cadastro é criado normalmente, mas com
          // o acesso já revogado, para não sobrar um link válido sem que o
          // administrador tenha decidido compartilhá-lo. "Gerar link" no
          // cliente ativa isso depois, a qualquer momento.
          const { error } = await supabase
            .from("client_access_links")
            .insert({ ...payload, revoked: true });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("client_access_links")
          .update(payload)
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Cliente cadastrado." : "Dados salvos.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo cliente" : "Editar cliente"}</DialogTitle>
          <DialogDescription>As alterações só valem depois de salvar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome do cliente" hint="Opcional.">
              <Input
                value={form.client_name ?? ""}
                autoFocus
                onChange={(e) => set("client_name", e.target.value)}
              />
            </Field>
            <Field label="Telefone (WhatsApp)" hint="Necessário para enviar por aqui.">
              <Input
                value={form.client_phone ?? ""}
                onChange={(e) => set("client_phone", e.target.value)}
                placeholder="27996657309"
              />
            </Field>
          </div>

          {isNew ? (
            <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="generate-link" className="text-sm">
                  Gerar link de acesso agora
                </Label>
                <Switch
                  id="generate-link"
                  checked={generateLink}
                  onCheckedChange={setGenerateLink}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {generateLink
                  ? "O cliente recebe um link pessoal com o prazo escolhido abaixo."
                  : "Só o cadastro é criado agora. Você pode gerar o link a qualquer momento depois, no botão \u201cGerar link\u201d do cliente — útil, por exemplo, para retomar contato com quem parou o atendimento."}
              </p>

              {generateLink ? (
                <Field label="Validade do link">
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((o) => (
                        <SelectItem
                          key={o.label}
                          value={o.value === null ? "none" : String(o.value)}
                        >
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}
            </div>
          ) : null}

          <Field label="Status do contato">
            <Select
              value={form.contact_status}
              onValueChange={(v) => set("contact_status", v as ContactStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tipo de atendimento">
            <Select
              value={form.attendance_type ?? NONE_ATTENDANCE}
              onValueChange={(v) =>
                set("attendance_type", v === NONE_ATTENDANCE ? null : (v as AttendanceType))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_ATTENDANCE}>Ainda não definido</SelectItem>
                {ATTENDANCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Data da última consulta"
            hint="Usada para calcular há quantos dias o cliente está sem retornar."
          >
            <Input
              type="date"
              value={form.last_appointment_date ?? ""}
              onChange={(e) => set("last_appointment_date", e.target.value || null)}
            />
          </Field>

          <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="is-athlete" className="text-sm">
                Este cliente é atleta
              </Label>
              <Switch
                id="is-athlete"
                checked={form.is_athlete}
                onCheckedChange={(v) => set("is_athlete", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sponsored" className="text-sm">
                Patrocinado pelo Thaynan
              </Label>
              <Switch
                id="sponsored"
                checked={form.sponsored}
                onCheckedChange={(v) => set("sponsored", v)}
              />
            </div>
          </div>

          <Field label="Indicado por" hint="Opcional. Cadastre o atleta em Cadastros → Atletas.">
            <Select
              value={form.referred_by_athlete_id ?? NONE_ATHLETE}
              onValueChange={(v) => set("referred_by_athlete_id", v === NONE_ATHLETE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_ATHLETE}>Nenhum</SelectItem>
                {athletes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Redes sociais (opcional, só para registro)
            </p>
            <Field label="Instagram">
              <Input
                value={form.instagram_url ?? ""}
                onChange={(e) => set("instagram_url", e.target.value || null)}
                placeholder="https://instagram.com/..."
              />
            </Field>
            <Field label="Facebook">
              <Input
                value={form.facebook_url ?? ""}
                onChange={(e) => set("facebook_url", e.target.value || null)}
                placeholder="https://facebook.com/..."
              />
            </Field>
            <Field label="YouTube">
              <Input
                value={form.youtube_url ?? ""}
                onChange={(e) => set("youtube_url", e.target.value || null)}
                placeholder="https://youtube.com/..."
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : isNew ? "Criar cliente" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
