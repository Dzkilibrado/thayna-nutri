import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/admin/image-upload";
import { VideoField } from "@/components/admin/video-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MAX_TESTIMONIAL_QUOTE, TESTIMONIAL_COLUMNS, type Testimonial } from "@/lib/site";

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

export function TestimonialsEditor() {
  const queryClient = useQueryClient();

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

  const items = query.data ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").insert({
        author_name: "Novo depoimento",
        quote: "",
        sort_order: items.length + 1,
        published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento criado e já visível no site.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-md text-sm text-muted-foreground">
          Relatos de pacientes. Aparecem na página Depoimentos e, quando marcados, também na página
          inicial.
        </p>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          + Novo depoimento
        </Button>
      </div>

      <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
        Não publique fotos de antes e depois. A resolução do Conselho Federal de Nutricionistas
        proíbe esse tipo de imagem na divulgação profissional. Fotos de rosto e vídeos de relato
        podem ser usados, sempre com autorização por escrito da pessoa.
      </p>

      {query.isLoading ? <p className="text-sm">Carregando…</p> : null}

      {!query.isLoading && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum depoimento ainda. Clique em &ldquo;Novo depoimento&rdquo; para começar.
        </p>
      ) : null}

      {items.map((item, index) => (
        <TestimonialForm
          key={item.id}
          item={item}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          previous={items[index - 1]}
          next={items[index + 1]}
        />
      ))}
    </div>
  );
}

function TestimonialForm({
  item,
  isFirst,
  isLast,
  previous,
  next,
}: {
  item: Testimonial;
  isFirst: boolean;
  isLast: boolean;
  previous?: Testimonial | undefined;
  next?: Testimonial | undefined;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Testimonial>(item);

  useEffect(() => setForm(item), [item]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
  const set = <K extends keyof Testimonial>(key: K, value: Testimonial[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: async (values: Testimonial) => {
      const { id, ...rest } = values;
      const { error } = await supabase.from("testimonials").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento salvo.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("testimonials").delete().eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Depoimento excluído.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = useMutation({
    mutationFn: async (other: Testimonial) => {
      const [r1, r2] = await Promise.all([
        supabase.from("testimonials").update({ sort_order: other.sort_order }).eq("id", item.id),
        supabase.from("testimonials").update({ sort_order: item.sort_order }).eq("id", other.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const tooLong = form.quote.length > MAX_TESTIMONIAL_QUOTE;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={isFirst || swap.isPending}
            onClick={() => previous && swap.mutate(previous)}
            aria-label="Mover para cima"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLast || swap.isPending}
            onClick={() => next && swap.mutate(next)}
            aria-label="Mover para baixo"
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`feat-${item.id}`}
              checked={form.featured}
              onCheckedChange={(v) => set("featured", v)}
            />
            <Label htmlFor={`feat-${item.id}`} className="text-xs">
              Na página inicial
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`pub-${item.id}`}
              checked={form.published}
              onCheckedChange={(v) => set("published", v)}
            />
            <Label htmlFor={`pub-${item.id}`} className="text-xs">
              {form.published ? "Aparecendo no site" : "Rascunho (oculto)"}
            </Label>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove.mutate()}
            aria-label="Excluir depoimento"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome de quem falou">
          <Input
            value={form.author_name}
            onChange={(e) => set("author_name", e.target.value)}
            placeholder="Ex: Marina S."
          />
        </Field>
        <Field label="Sobre o acompanhamento" hint="Ex: Corrida de rua, Ganho de massa, Online">
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
        <Textarea rows={4} value={form.quote} onChange={(e) => set("quote", e.target.value)} />
      </Field>

      {tooLong ? (
        <p className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          O texto está longo demais para o card. Reduza para até {MAX_TESTIMONIAL_QUOTE} caracteres.
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

      {!form.published ? (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Este depoimento está como rascunho e não aparece no site. Ligue a chave &ldquo;Aparecendo
          no site&rdquo; acima e salve para publicar.
        </p>
      ) : null}

      <Button onClick={() => save.mutate(form)} disabled={save.isPending || tooLong}>
        {save.isPending ? "Salvando…" : "Salvar depoimento"}
      </Button>
    </div>
  );
}
