import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Medal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { ATHLETE_COLUMNS, type Athlete } from "@/lib/site";

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

const EMPTY: Athlete = { id: "", name: "", phone: null, sponsored: false };

export function AthletesEditor() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Athlete | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
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

  const items = query.data ?? [];
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin-athletes"] });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Atletas que indicam clientes ou recebem patrocínio. Esse cadastro alimenta o campo
          &ldquo;indicado por&rdquo; da Central de Clientes.
        </p>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Novo atleta
        </Button>
      </div>

      {query.isLoading ? <p className="text-sm">Carregando…</p> : null}

      {!query.isLoading && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum atleta cadastrado ainda.
        </p>
      ) : null}

      <ul className="space-y-2">
        {items.map((item) => (
          <AthleteRow
            key={item.id}
            item={item}
            onEdit={() => setEditing(item)}
            onChanged={refresh}
          />
        ))}
      </ul>

      {editing ? (
        <AthleteDialog item={editing} onClose={() => setEditing(null)} onSaved={refresh} />
      ) : null}
      {creating ? (
        <AthleteDialog item={EMPTY} onClose={() => setCreating(false)} onSaved={refresh} />
      ) : null}
    </div>
  );
}

function AthleteRow({
  item,
  onEdit,
  onChanged,
}: {
  item: Athlete;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("athletes").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atleta excluído.");
      setConfirmDelete(false);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
      <span className="icon-tile flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
        <Medal className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">{item.phone || "Sem telefone"}</p>
      </div>
      {item.sponsored ? (
        <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] text-primary">
          Patrocinado
        </span>
      ) : null}
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar atleta">
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setConfirmDelete(true)}
          aria-label="Excluir atleta"
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {item.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Não tem como desfazer. Clientes que já citam este atleta como indicação continuam com
              o registro, mas o nome deixa de aparecer na lista de seleção.
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

function AthleteDialog({
  item,
  onClose,
  onSaved,
}: {
  item: Athlete;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Athlete>(item);
  useEffect(() => setForm(item), [item]);

  const isNew = item.id === "";
  const set = <K extends keyof Athlete>(key: K, value: Athlete[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = form.name.trim().length > 0;

  const save = useMutation({
    mutationFn: async (values: Athlete) => {
      const { id, ...rest } = values;
      const { error } = isNew
        ? await supabase.from("athletes").insert(rest)
        : await supabase.from("athletes").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(isNew ? "Atleta cadastrado." : "Atleta salvo.");
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo atleta" : "Editar atleta"}</DialogTitle>
          <DialogDescription>As alterações só valem depois de salvar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Nome">
            <Input value={form.name} autoFocus onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Telefone" hint="Opcional.">
            <Input
              value={form.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="27996657309"
            />
          </Field>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
            <Label htmlFor="sponsored" className="text-sm">
              Patrocinado atualmente
            </Label>
            <Switch
              id="sponsored"
              checked={form.sponsored}
              onCheckedChange={(v) => set("sponsored", v)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => save.mutate(form)} disabled={save.isPending || !canSave}>
            {save.isPending ? "Salvando…" : isNew ? "Cadastrar" : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
