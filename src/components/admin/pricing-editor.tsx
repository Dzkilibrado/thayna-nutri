import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  PRICING_COLUMNS,
  formatBRL,
  type PricingItem,
  type PricingSection,
  type SiteSettings,
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

const SECTIONS: { value: PricingSection; title: string; noteKey: keyof SiteSettings }[] = [
  {
    value: "presencial",
    title: "Investimento — Consulta presencial ou on-line",
    noteKey: "pricing_note_presencial",
  },
  {
    value: "online",
    title: "Investimento — Consultoria on-line",
    noteKey: "pricing_note_online",
  },
];

export function PricingEditor({ settings }: { settings: SiteSettings }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PricingItem | null>(null);
  const [creatingSection, setCreatingSection] = useState<PricingSection | null>(null);

  const query = useQuery({
    queryKey: ["admin-pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_items")
        .select(PRICING_COLUMNS)
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as PricingItem[];
    },
  });

  const items = query.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-pricing"] });

  return (
    <div className="space-y-8">
      <p className="max-w-xl text-sm text-muted-foreground">
        Estas duas tabelas aparecem na página privada enviada aos clientes. Cada seção pode ter
        quantos itens quiser, além de um texto sobre formas de pagamento.
      </p>

      {SECTIONS.map((section) => (
        <SectionEditor
          key={section.value}
          section={section}
          items={items.filter((i) => i.section === section.value)}
          settings={settings}
          onEdit={setEditing}
          onCreate={() => setCreatingSection(section.value)}
          onChanged={refresh}
        />
      ))}

      {editing ? (
        <ItemDialog item={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      ) : null}

      {creatingSection ? (
        <ItemDialog
          item={{
            id: "",
            section: creatingSection,
            title: "",
            description: "",
            price: 0,
            sort_order: items.filter((i) => i.section === creatingSection).length + 1,
            published: true,
          }}
          onClose={() => setCreatingSection(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}

function SectionEditor({
  section,
  items,
  settings,
  onEdit,
  onCreate,
  onChanged,
}: {
  section: (typeof SECTIONS)[number];
  items: PricingItem[];
  settings: SiteSettings;
  onEdit: (item: PricingItem) => void;
  onCreate: () => void;
  onChanged: () => void;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg">{section.title}</h3>
        <Button size="sm" onClick={onCreate}>
          <Plus className="size-4" /> Novo item
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhum item nesta tabela ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <PricingRow
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              previous={items[index - 1]}
              next={items[index + 1]}
              onEdit={() => onEdit(item)}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}

      <PaymentNoteField section={section} settings={settings} />
    </section>
  );
}

function PricingRow({
  item,
  isFirst,
  isLast,
  previous,
  next,
  onEdit,
  onChanged,
}: {
  item: PricingItem;
  isFirst: boolean;
  isLast: boolean;
  previous?: PricingItem | undefined;
  next?: PricingItem | undefined;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const swap = useMutation({
    mutationFn: async (other: PricingItem) => {
      const [r1, r2] = await Promise.all([
        supabase.from("pricing_items").update({ sort_order: other.sort_order }).eq("id", item.id),
        supabase.from("pricing_items").update({ sort_order: item.sort_order }).eq("id", other.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: onChanged,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pricing_items").delete().eq("id", item.id);
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
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-3">
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

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {item.title || "(sem título)"}
          {!item.published ? (
            <span className="ml-2 text-[11px] text-muted-foreground">(oculto)</span>
          ) : null}
        </p>
        {item.description ? (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        ) : null}
      </div>

      <span className="shrink-0 font-display text-base text-primary">{formatBRL(item.price)}</span>

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
            <AlertDialogTitle>Excluir &ldquo;{item.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>Não tem como desfazer.</AlertDialogDescription>
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

function ItemDialog({
  item,
  onClose,
  onSaved,
}: {
  item: PricingItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PricingItem>(item);
  useEffect(() => setForm(item), [item]);

  const isNew = item.id === "";
  const set = <K extends keyof PricingItem>(key: K, value: PricingItem[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.title.trim().length > 0 && form.price >= 0;

  const save = useMutation({
    mutationFn: async (values: PricingItem) => {
      const { id, ...rest } = values;
      const { error } = isNew
        ? await supabase.from("pricing_items").insert(rest)
        : await supabase.from("pricing_items").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isNew ? "Item criado." : "Item salvo.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo item" : "Editar item"}</DialogTitle>
          <DialogDescription>As alterações só valem depois de salvar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Título">
            <Input
              value={form.title}
              autoFocus
              placeholder="Ex.: Consulta Avulsa"
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
          <Field label="Descrição" hint="Opcional. Ex.: presencial ou on-line">
            <Input
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Valor (R$)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
            <Label htmlFor="pub-price" className="text-sm">
              Aparecendo na tabela
            </Label>
            <Switch
              id="pub-price"
              checked={form.published}
              onCheckedChange={(v) => set("published", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending || !canSave}>
            {save.isPending ? "Salvando…" : isNew ? "Criar item" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PaymentNoteField({
  section,
  settings,
}: {
  section: (typeof SECTIONS)[number];
  settings: SiteSettings;
}) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(String(settings[section.noteKey] ?? ""));

  useEffect(() => setValue(String(settings[section.noteKey] ?? "")), [settings, section.noteKey]);

  const save = useMutation({
    mutationFn: async () => {
      const payload =
        section.value === "presencial"
          ? { pricing_note_presencial: value }
          : { pricing_note_online: value };
      const { error } = await supabase.from("site_settings").update(payload).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Forma de pagamento salva.");
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <Field label="Forma de pagamento desta seção">
        <Textarea rows={2} value={value} onChange={(e) => setValue(e.target.value)} />
      </Field>
      <Button size="sm" variant="secondary" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar texto de pagamento"}
      </Button>
    </div>
  );
}
