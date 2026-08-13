import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/admin/image-upload";
import { VideoField } from "@/components/admin/video-field";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MAX_TESTIMONIAL_QUOTE, TESTIMONIAL_COLUMNS, type Testimonial } from "@/lib/site";
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

const EMPTY: Testimonial = {
  id: "",
  author_name: "",
  author_context: null,
  quote: "",
  photo_url: null,
  video_url: null,
  sort_order: 0,
  featured: false,
  published: true,
  status: "approved",
  source: "admin",
};

export function TestimonialsEditor() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select(TESTIMONIAL_COLUMNS)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Testimonial[];
    },
  });

  const all = query.data ?? [];
  const pending = all.filter((t) => t.status === "pending");
  const items = all.filter((t) => t.status !== "pending");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Relatos de pacientes. Aparecem na página Depoimentos e, quando destacados, também na
          página inicial.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo depoimento
        </Button>
      </div>

      {pending.length > 0 ? (
        <section className="space-y-3 rounded-2xl border border-primary/50 bg-primary/5 p-4">
          <div>
            <h3 className="text-lg">Aguardando aprovação ({pending.length})</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enviados pelo formulário do site. Não aparecem para ninguém até serem aprovados.
            </p>
          </div>
          {pending.map((item) => (
            <PendingRow
              key={item.id}
              item={item}
              nextOrder={items.length + 1}
              onChanged={refresh}
            />
          ))}
        </section>
      ) : null}

      <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
        Não publique fotos de antes e depois. A resolução do Conselho Federal de Nutricionistas
        proíbe esse tipo de imagem na divulgação profissional. Fotos de rosto e vídeos de relato
        podem ser usados, sempre com autorização por escrito da pessoa.
      </p>

      {query.isLoading ? <p className="text-sm">Carregando…</p> : null}

      {!query.isLoading && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum depoimento ainda. Clique em &ldquo;Novo depoimento&rdquo; para começar.
        </p>
      ) : null}

      {items.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground">
            Esta é a ordem em que aparecem no site. Use as setas para reorganizar e o lápis para
            alterar o conteúdo.
          </p>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <TestimonialRow
                key={item.id}
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                previous={items[index - 1]}
                next={items[index + 1]}
                onEdit={() => setEditing(item)}
                onChanged={refresh}
              />
            ))}
          </ul>
        </>
      ) : null}

      {editing ? (
        <TestimonialDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => void refresh()}
        />
      ) : null}

      {creating ? (
        <TestimonialDialog
          item={{ ...EMPTY, sort_order: items.length + 1 }}
          onClose={() => setCreating(false)}
          onSaved={() => void refresh()}
        />
      ) : null}
    </div>
  );
}

/**
 * Item da fila de aprovação. Aprovar publica; recusar exclui, como combinado —
 * um depoimento recusado não deve ficar guardado no banco.
 */
function PendingRow({
  item,
  nextOrder,
  onChanged,
}: {
  item: Testimonial;
  nextOrder: number;
  onChanged: () => void;
}) {
  const [confirmReject, setConfirmReject] = useState(false);

  const approve = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("testimonials")
        .update({ status: "approved", published: true, sort_order: nextOrder })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento aprovado e publicado no site.");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento recusado e excluído.");
      setConfirmReject(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <p className="text-sm font-medium">{item.author_name}</p>
        {item.author_context ? (
          <p className="text-xs text-muted-foreground">{item.author_context}</p>
        ) : null}
      </div>

      <p className="break-words rounded-lg bg-surface-2 px-3 py-2 text-sm leading-relaxed text-foreground/90">
        {item.quote}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
          <Check className="size-4" /> Aprovar e publicar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirmReject(true)}>
          <X className="size-4 text-destructive" /> Recusar
        </Button>
      </div>

      <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar o depoimento de {item.author_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele será excluído e sairá desta lista. Não tem como recuperar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                reject.mutate();
              }}
            >
              Recusar e excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TestimonialRow({
  item,
  isFirst,
  isLast,
  previous,
  next,
  onEdit,
  onChanged,
}: {
  item: Testimonial;
  isFirst: boolean;
  isLast: boolean;
  previous?: Testimonial | undefined;
  next?: Testimonial | undefined;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const swap = useMutation({
    mutationFn: async (other: Testimonial) => {
      const [r1, r2] = await Promise.all([
        supabase.from("testimonials").update({ sort_order: other.sort_order }).eq("id", item.id),
        supabase.from("testimonials").update({ sort_order: item.sort_order }).eq("id", other.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento excluído.");
      setConfirmDelete(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          disabled={isFirst || swap.isPending}
          onClick={() => previous && swap.mutate(previous)}
          aria-label="Mover para cima"
          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowUp className="size-4" />
        </button>
        <button
          type="button"
          disabled={isLast || swap.isPending}
          onClick={() => next && swap.mutate(next)}
          aria-label="Mover para baixo"
          className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>

      {item.photo_url ? (
        <img
          src={item.photo_url}
          alt=""
          className="size-10 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span className="icon-tile flex size-10 shrink-0 items-center justify-center rounded-full font-display text-sm text-primary">
          {(item.author_name || "?").slice(0, 1).toUpperCase()}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.author_name || "(sem nome)"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.author_context ? `${item.author_context} · ` : ""}
          {item.quote || "(sem texto)"}
        </p>
      </div>

      {item.featured ? (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-primary sm:flex">
          <Star className="size-3" /> Na home
        </span>
      ) : null}

      <span
        className={cn(
          "hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:flex",
          item.published ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
        )}
      >
        {item.published ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        {item.published ? "No site" : "Rascunho"}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar depoimento">
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmDelete(true)}
          aria-label="Excluir depoimento"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o depoimento de {item.author_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              O depoimento sai do site na hora e não tem como desfazer. Se você só quer escondê-lo
              por um tempo, edite e desligue a chave &ldquo;Aparecendo no site&rdquo;.
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

function TestimonialDialog({
  item,
  onClose,
  onSaved,
}: {
  item: Testimonial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Testimonial>(item);
  useEffect(() => setForm(item), [item]);

  const isNew = item.id === "";
  const set = <K extends keyof Testimonial>(key: K, value: Testimonial[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const tooLong = form.quote.length > MAX_TESTIMONIAL_QUOTE;
  const canSave = form.author_name.trim().length > 0 && form.quote.trim().length > 0 && !tooLong;

  const save = useMutation({
    mutationFn: async (values: Testimonial) => {
      const { id, ...rest } = values;
      const { error } = isNew
        ? await supabase.from("testimonials").insert(rest)
        : await supabase.from("testimonials").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        form.published
          ? isNew
            ? "Depoimento criado e já visível no site."
            : "Depoimento salvo e atualizado no site."
          : "Depoimento salvo como rascunho — ele não aparece no site.",
      );
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo depoimento" : "Editar depoimento"}</DialogTitle>
          <DialogDescription>
            As alterações só valem depois de salvar. Fechar esta janela descarta o que você mudou.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome de quem falou">
              <Input
                autoFocus
                value={form.author_name}
                placeholder="Ex.: Marina S."
                onChange={(e) => set("author_name", e.target.value)}
              />
            </Field>
            <Field
              label="Sobre o acompanhamento"
              hint="Opcional. Ex.: Corrida de rua, Ganho de massa, Online."
            >
              <Input
                value={form.author_context ?? ""}
                onChange={(e) => set("author_context", e.target.value)}
              />
            </Field>
          </div>

          <Field
            label="Depoimento"
            hint={`${form.quote.length} de ${MAX_TESTIMONIAL_QUOTE} caracteres`}
          >
            <Textarea rows={5} value={form.quote} onChange={(e) => set("quote", e.target.value)} />
          </Field>

          {tooLong ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
            >
              O texto está longo demais para o card. Reduza para até {MAX_TESTIMONIAL_QUOTE}{" "}
              caracteres.
            </p>
          ) : null}

          <Field label="Foto da pessoa" hint="Opcional. Foto de rosto — nunca antes e depois.">
            <ImageUploadField
              value={form.photo_url ?? ""}
              onChange={(url) => set("photo_url", url)}
              folder="depoimentos"
            />
          </Field>

          <Field label="Vídeo do depoimento" hint="Opcional.">
            <VideoField
              value={form.video_url ?? ""}
              onChange={(v) => set("video_url", v)}
              folder="depoimentos"
            />
          </Field>
        </div>

        <div className="sticky bottom-0 -mx-6 mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="pub-dep"
                checked={form.published}
                onCheckedChange={(v) => set("published", v)}
              />
              <Label htmlFor="pub-dep" className="text-sm">
                {form.published ? "Vai aparecer no site" : "Salvar como rascunho"}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="feat-dep"
                checked={form.featured}
                onCheckedChange={(v) => set("featured", v)}
              />
              <Label htmlFor="feat-dep" className="text-sm">
                Destacar na home
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !canSave}>
              {save.isPending ? "Salvando…" : isNew ? "Criar depoimento" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
