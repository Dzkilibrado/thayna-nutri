import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  MousePointerClick,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { FileField } from "@/components/admin/file-field";
import { IconPicker } from "@/components/admin/icon-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { iconFor } from "@/lib/icons";
import { KINDS, PAGES, SOURCE_HAS_AUTO_COVER, videoSource, type ContentBlock } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Cada página exibe só alguns tipos de item. Uma combinação inválida salva sem
 * erro e não aparece em lugar nenhum — por isso o painel avisa antes.
 */
const ALL_KINDS = ["link", "video", "image", "file", "text"];

const PAGE_ACCEPTS: Record<string, { kinds: string[]; says: string }> = {
  home: { kinds: ["link", "video"], says: "links/botões e vídeos" },
  links: { kinds: ["link"], says: "links/botões" },
  videos: { kinds: ["video"], says: "vídeos" },
  sobre: { kinds: ALL_KINDS, says: "qualquer tipo" },
  presencial: { kinds: ALL_KINDS, says: "qualquer tipo" },
  online: { kinds: ALL_KINDS, says: "qualquer tipo" },
  privado: { kinds: ALL_KINDS, says: "qualquer tipo" },
};

function mismatchMessage(page: string, kind: string): string | null {
  const rule = PAGE_ACCEPTS[page];
  if (!rule || rule.kinds.includes(kind)) return null;
  const pageLabel = PAGES.find((p) => p.value === page)?.label ?? page;
  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? kind;
  const suggestion = KINDS.find((k) => rule.kinds.includes(k.value))?.label ?? "";
  return `A página ${pageLabel} mostra apenas ${rule.says}. Este item é do tipo "${kindLabel}", então ele não vai aparecer no site. Troque o tipo para "${suggestion}" ou escolha outra página.`;
}

/**
 * O que cada tipo faz, na linguagem de quem edita. O nome sozinho não diz o
 * suficiente — "Texto" e "Link / botão" parecem intercambiáveis para quem não
 * construiu o site.
 */
const KIND_HELP: Record<string, { help: string; Icon: LucideIcon }> = {
  link: {
    help: "Botão que leva a outro lugar: WhatsApp, Instagram ou outra página do site.",
    Icon: MousePointerClick,
  },
  video: {
    help: "Vídeo do YouTube, do Instagram ou arquivo enviado por você.",
    Icon: PlayCircle,
  },
  image: { help: "Foto exibida no meio da página.", Icon: ImageIcon },
  file: { help: "PDF ou documento que o visitante pode baixar.", Icon: FileText },
  text: { help: "Parágrafo de texto na página.", Icon: AlignLeft },
};

const LINK_SHORTCUTS = [
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
  { label: "Sobre mim", value: "/sobre" },
  { label: "Como chegar", value: "/como-chegar" },
  { label: "Depoimentos", value: "/depoimentos" },
  { label: "Calculadoras", value: "/calculadoras" },
  { label: "Vídeos", value: "/videos" },
];

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

/* ------------------------------------------------------------------ *
 * Lista da página: conferir, ordenar, editar e excluir.
 * Nenhuma edição de conteúdo acontece aqui — só na janela de edição,
 * com um único botão de salvar.
 * ------------------------------------------------------------------ */

export function ContentEditor({ blocks }: { blocks: ContentBlock[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<string>("home");
  const [editing, setEditing] = useState<ContentBlock | null>(null);
  const [creating, setCreating] = useState(false);

  const items = blocks.filter((b) => b.page === page);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });

  const pageLabel = PAGES.find((p) => p.value === page)?.label ?? page;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full sm:w-64">
          <Field label="Página que você quer organizar">
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          A página {pageLabel} ainda não tem nenhum item. Clique em &ldquo;Novo item&rdquo; para
          começar.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Esta é a ordem em que os itens aparecem na página {pageLabel}. Use as setas para
            reorganizar e o lápis para alterar o conteúdo.
          </p>
          <ul className="space-y-2">
            {items.map((block, index) => (
              <BlockRow
                key={block.id}
                block={block}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                previous={items[index - 1]}
                next={items[index + 1]}
                onEdit={() => setEditing(block)}
                onChanged={refresh}
              />
            ))}
          </ul>
        </>
      )}

      {editing ? (
        <BlockDialog
          block={editing}
          allBlocks={blocks}
          onClose={() => setEditing(null)}
          onSaved={refresh}
        />
      ) : null}

      {creating ? (
        <BlockDialog
          block={{
            id: "",
            page,
            kind: (PAGE_ACCEPTS[page]?.kinds[0] ?? "link") as string,
            title: "",
            subtitle: null,
            body: null,
            url: null,
            icon: "link",
            category: null,
            cover_url: null,
            sort_order: items.length + 1,
            featured: false,
            published: true,
          }}
          allBlocks={blocks}
          onClose={() => setCreating(false)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}

/**
 * Só oferece os tipos que a página realmente exibe. Antes a lista mostrava os
 * cinco sempre, e escolher um tipo incompatível criava um item que salvava sem
 * erro e não aparecia em lugar nenhum.
 */
function KindPicker({
  page,
  value,
  onChange,
}: {
  page: string;
  value: string;
  onChange: (kind: string) => void;
}) {
  const allowed = PAGE_ACCEPTS[page]?.kinds ?? ALL_KINDS;
  const options = KINDS.filter((k) => allowed.includes(k.value));
  const pageLabel = PAGES.find((p) => p.value === page)?.label ?? page;

  if (options.length <= 1) {
    const only = options[0];
    return (
      <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
        Na página {pageLabel}, todo item é do tipo{" "}
        <strong className="text-foreground">{only?.label ?? value}</strong>.{" "}
        {only ? KIND_HELP[only.value]?.help : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        O que é este item
      </Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((k) => {
          const info = KIND_HELP[k.value];
          const Icon = info?.Icon;
          const active = value === k.value;
          return (
            <button
              key={k.value}
              type="button"
              onClick={() => onChange(k.value)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface-2 hover:border-primary/40",
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "mt-0.5 size-[18px] shrink-0",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
              ) : null}
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {k.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                  {info?.help}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BlockRow({
  block,
  isFirst,
  isLast,
  previous,
  next,
  onEdit,
  onChanged,
}: {
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
  previous?: ContentBlock | undefined;
  next?: ContentBlock | undefined;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const Icon = iconFor(block.icon);
  const mismatch = mismatchMessage(block.page, block.kind);
  const kindLabel = KINDS.find((k) => k.value === block.kind)?.label ?? block.kind;

  const swap = useMutation({
    mutationFn: async (other: ContentBlock) => {
      const [r1, r2] = await Promise.all([
        supabase.from("content_blocks").update({ sort_order: other.sort_order }).eq("id", block.id),
        supabase.from("content_blocks").update({ sort_order: block.sort_order }).eq("id", other.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_blocks").delete().eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item excluído.");
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

      <span className="icon-tile flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{block.title || "(sem título)"}</p>
        <p className="truncate text-xs text-muted-foreground">
          {kindLabel}
          {block.subtitle ? ` · ${block.subtitle}` : ""}
        </p>
      </div>

      <span
        className={cn(
          "hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:flex",
          block.published ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
        )}
      >
        {block.published ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
        {block.published ? "No site" : "Rascunho"}
      </span>

      {mismatch ? (
        <span
          title={mismatch}
          className="hidden shrink-0 rounded-full bg-destructive/20 px-2.5 py-1 text-[11px] sm:block"
        >
          Não aparece
        </span>
      ) : null}

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar item">
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmDelete(true)}
          aria-label="Excluir item"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir &ldquo;{block.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              O item sai do site na hora e não tem como desfazer. Se você só quer escondê-lo por um
              tempo, edite o item e desligue a chave &ldquo;Aparecendo no site&rdquo;.
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

/* ------------------------------------------------------------------ *
 * Janela de edição: todos os campos do item, um único botão de salvar.
 * ------------------------------------------------------------------ */

function BlockDialog({
  block,
  allBlocks,
  onClose,
  onSaved,
}: {
  block: ContentBlock;
  allBlocks: ContentBlock[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ContentBlock>(block);
  useEffect(() => setForm(block), [block]);

  const isNew = block.id === "";
  const set = (key: keyof ContentBlock, value: string | boolean | number | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const mismatch = mismatchMessage(form.page, form.kind);

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const b of allBlocks) {
      const name = b.category?.trim();
      if (name) found.add(name);
    }
    return [...found].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [allBlocks]);

  const save = useMutation({
    mutationFn: async (values: ContentBlock) => {
      const { id, ...rest } = values;
      const { error } = isNew
        ? await supabase.from("content_blocks").insert(rest)
        : await supabase.from("content_blocks").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        form.published
          ? isNew
            ? "Item criado e já visível no site."
            : "Item salvo e atualizado no site."
          : "Item salvo como rascunho — ele não aparece no site.",
      );
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = form.title.trim().length > 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo item" : "Editar item"}</DialogTitle>
          <DialogDescription>
            As alterações só valem depois de salvar. Fechar esta janela descarta o que você mudou.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Página">
              <Select
                value={form.page}
                onValueChange={(v) => {
                  const rule = PAGE_ACCEPTS[v];
                  setForm((prev) => ({
                    ...prev,
                    page: v,
                    kind: rule && !rule.kinds.includes(prev.kind) ? rule.kinds[0]! : prev.kind,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Título">
              <Input
                value={form.title}
                autoFocus
                placeholder="Ex.: Agendar consulta"
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label="Subtítulo" hint="Opcional. Aparece em letra menor abaixo do título.">
              <Input
                value={form.subtitle ?? ""}
                onChange={(e) => set("subtitle", e.target.value)}
              />
            </Field>
          </div>

          <KindPicker page={form.page} value={form.kind} onChange={(v) => set("kind", v)} />

          {mismatch ? (
            <p
              role="alert"
              className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
            >
              {mismatch}
            </p>
          ) : null}

          {form.kind === "image" ? (
            <Field label="Foto" hint="Envie do computador ou do celular, ou cole o link da imagem.">
              <ImageUploadField
                value={form.url ?? ""}
                onChange={(v) => set("url", v)}
                folder="conteudo"
              />
            </Field>
          ) : form.kind === "file" ? (
            <Field label="Arquivo" hint="PDF, documento ou planilha para o visitante baixar.">
              <FileField value={form.url ?? ""} onChange={(v) => set("url", v)} folder="conteudo" />
            </Field>
          ) : form.kind === "text" ? (
            <Field label="Texto">
              <Textarea
                rows={6}
                value={form.body ?? ""}
                onChange={(e) => set("body", e.target.value)}
              />
            </Field>
          ) : form.kind === "video" ? (
            <>
              <Field
                label="Link do vídeo"
                hint="Cole um link ou envie um arquivo do computador ou do celular."
              >
                <VideoField value={form.url ?? ""} onChange={(v) => set("url", v)} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Assunto"
                  hint="Agrupa o vídeo na página. Ex.: Competições, Nutrição, Atendimento."
                >
                  <Input
                    list="assuntos-de-video"
                    value={form.category ?? ""}
                    placeholder="Competições"
                    onChange={(e) => set("category", e.target.value)}
                  />
                  <datalist id="assuntos-de-video">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field
                  label="Capa"
                  hint={
                    SOURCE_HAS_AUTO_COVER[videoSource(form.url)]
                      ? "Este vídeo já usa a capa automática do YouTube."
                      : "Esta origem não fornece capa automática. Envie uma imagem."
                  }
                >
                  <ImageUploadField
                    value={form.cover_url ?? ""}
                    onChange={(v) => set("cover_url", v)}
                    folder="capas"
                  />
                </Field>
              </div>
            </>
          ) : (
            <Field label="Link de destino" hint="Cole o link completo, ou use um dos atalhos.">
              <Input
                value={form.url ?? ""}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://instagram.com/thaynanpablo.nutri"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {LINK_SHORTCUTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("url", s.value)}
                    className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {form.kind === "link" ? (
            <Field label="Ícone" hint="Escolha o desenho que aparece ao lado do título.">
              <IconPicker value={form.icon} onChange={(id) => set("icon", id)} />
            </Field>
          ) : null}
        </div>

        {/* Rodapé fixo: a decisão de publicar fica sempre à vista, junto do
            botão que a efetiva — antes ficava no fim da janela, depois da
            grade de ícones, e passava despercebida. */}
        <div className="sticky bottom-0 -mx-6 mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="pub"
                checked={form.published}
                onCheckedChange={(v) => set("published", v)}
              />
              <Label htmlFor="pub" className="text-sm">
                {form.published ? "Vai aparecer no site" : "Salvar como rascunho"}
              </Label>
            </div>
            {form.kind === "video" ? (
              <div className="flex items-center gap-2">
                <Switch
                  id="feat"
                  checked={form.featured}
                  onCheckedChange={(v) => set("featured", v)}
                />
                <Label htmlFor="feat" className="text-sm">
                  Destacar na home
                </Label>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={() => save.mutate(form)} disabled={save.isPending || !canSave}>
              {save.isPending ? "Salvando…" : isNew ? "Criar item" : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
