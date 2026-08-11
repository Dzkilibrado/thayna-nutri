import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, LogOut, ExternalLink } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BLOCK_COLUMNS,
  KINDS,
  PAGES,
  SETTINGS_COLUMNS,
  type ContentBlock,
  type SiteSettings,
} from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel de gestão | Thaynan Nutricionista" },
      { name: "description", content: "Gerencie textos, links, vídeos e cores do site." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel de gestão" },
      { property: "og:description", content: "Área restrita de administração do site." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const roleQuery = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      return Boolean(data);
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    enabled: roleQuery.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select(SETTINGS_COLUMNS)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as SiteSettings;
    },
  });

  const blocksQuery = useQuery({
    queryKey: ["admin-blocks"],
    enabled: roleQuery.data === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_blocks")
        .select(BLOCK_COLUMNS)
        .order("page", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ContentBlock[];
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (roleQuery.isLoading) {
    return <CenteredMessage title="Carregando painel…" />;
  }

  if (roleQuery.data !== true) {
    return (
      <CenteredMessage
        title="Sem permissão"
        description="Sua conta não tem acesso de administrador. Peça para um administrador liberar seu acesso."
        action={
          <Button variant="secondary" onClick={signOut}>
            Sair
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="text-2xl">Painel de gestão</h1>
            <p className="text-xs text-muted-foreground">Edite todo o conteúdo do site</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/">
                <ExternalLink className="size-4" /> Ver site
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <Tabs defaultValue="conteudo">
          <TabsList>
            <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
            <TabsTrigger value="perfil">Perfil & contato</TabsTrigger>
            <TabsTrigger value="cores">Cores</TabsTrigger>
          </TabsList>

          <TabsContent value="conteudo" className="mt-6">
            {blocksQuery.data ? <BlocksEditor blocks={blocksQuery.data} /> : <p>Carregando…</p>}
          </TabsContent>

          <TabsContent value="perfil" className="mt-6">
            {settingsQuery.data ? (
              <SettingsForm settings={settingsQuery.data} section="perfil" />
            ) : (
              <p>Carregando…</p>
            )}
          </TabsContent>

          <TabsContent value="cores" className="mt-6">
            {settingsQuery.data ? (
              <SettingsForm settings={settingsQuery.data} section="cores" />
            ) : (
              <p>Carregando…</p>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CenteredMessage({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 text-center">
      <div className="space-y-3">
        <h1 className="text-2xl">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {action}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SettingsForm({
  settings,
  section,
}: {
  settings: SiteSettings;
  section: "perfil" | "cores";
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SiteSettings>(settings);

  useEffect(() => setForm(settings), [settings]);

  const save = useMutation({
    mutationFn: async (values: SiteSettings) => {
      const { error } = await supabase.from("site_settings").update(values).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alterações salvas.");
      void queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof SiteSettings, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-surface p-5"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate(form);
      }}
    >
      {section === "perfil" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nome / marca">
              <Input value={form.brand_name} onChange={(e) => set("brand_name", e.target.value)} />
            </Field>
            <Field label="Assinatura (subtítulo)">
              <Input
                value={form.brand_tagline}
                onChange={(e) => set("brand_tagline", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Bio da página inicial">
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
          <Field label="Foto de perfil" hint="Envie um arquivo do seu computador ou cole uma URL.">
            <ImageUploadField
              value={form.avatar_url ?? ""}
              onChange={(v) => set("avatar_url", v)}
              folder="avatars"
            />
          </Field>

          <Field
            label="Vídeo de apresentação (URL)"
            hint="YouTube, Instagram (reel) ou link direto .mp4"
          >
            <Input
              value={form.intro_video_url ?? ""}
              onChange={(e) => set("intro_video_url", e.target.value)}
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="WhatsApp (só números com DDI)" hint="Ex.: 5527996657309">
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </Field>
            <Field label="Mensagem automática do WhatsApp">
              <Input
                value={form.whatsapp_message}
                onChange={(e) => set("whatsapp_message", e.target.value)}
              />
            </Field>
            <Field label="E-mail">
              <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Horário de atendimento">
              <Input value={form.hours} onChange={(e) => set("hours", e.target.value)} />
            </Field>
            <Field label="Instagram (URL)">
              <Input
                value={form.instagram_url ?? ""}
                onChange={(e) => set("instagram_url", e.target.value)}
              />
            </Field>
            <Field label="YouTube (URL)">
              <Input
                value={form.youtube_url ?? ""}
                onChange={(e) => set("youtube_url", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Endereço">
            <Textarea
              rows={2}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>
          <Field label="Link do Google Maps">
            <Input value={form.maps_url ?? ""} onChange={(e) => set("maps_url", e.target.value)} />
          </Field>
        </>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <ColorField
            label="Fundo"
            value={form.color_background}
            onChange={(v) => set("color_background", v)}
          />
          <ColorField
            label="Superfície (cards)"
            value={form.color_surface}
            onChange={(v) => set("color_surface", v)}
          />
          <ColorField
            label="Destaque"
            value={form.color_accent}
            onChange={(v) => set("color_accent", v)}
          />
          <ColorField
            label="Texto"
            value={form.color_foreground}
            onChange={(v) => set("color_foreground", v)}
          />
        </div>
      )}

      <Button type="submit" disabled={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 cursor-pointer rounded-md border border-border bg-transparent"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </Field>
  );
}

function BlocksEditor({ blocks }: { blocks: ContentBlock[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState<string>("home");
  const items = blocks.filter((b) => b.page === page);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_blocks").insert({
        page,
        kind: "link",
        title: "Novo bloco",
        sort_order: items.length + 1,
        published: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloco criado.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-56">
          <Field label="Página">
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
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          <Plus className="size-4" /> Novo bloco
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum bloco nesta página ainda.
        </p>
      ) : (
        <div className="space-y-4">
          {items.map((block, index) => (
            <BlockCard
              key={block.id}
              block={block}
              isFirst={index === 0}
              isLast={index === items.length - 1}
              neighbour={index === 0 ? undefined : items[index - 1]}
              next={index === items.length - 1 ? undefined : items[index + 1]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockCard({
  block,
  isFirst,
  isLast,
  neighbour,
  next,
}: {
  block: ContentBlock;
  isFirst: boolean;
  isLast: boolean;
  neighbour?: ContentBlock | undefined;
  next?: ContentBlock | undefined;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContentBlock>(block);

  useEffect(() => setForm(block), [block]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });

  const save = useMutation({
    mutationFn: async (values: ContentBlock) => {
      const { id, ...rest } = values;
      const { error } = await supabase.from("content_blocks").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloco salvo.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_blocks").delete().eq("id", block.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bloco removido.");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = useMutation({
    mutationFn: async (other: ContentBlock) => {
      const a = supabase
        .from("content_blocks")
        .update({ sort_order: other.sort_order })
        .eq("id", block.id);
      const b = supabase
        .from("content_blocks")
        .update({ sort_order: block.sort_order })
        .eq("id", other.id);
      const [r1, r2] = await Promise.all([a, b]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
    },
    onSuccess: () => void refresh(),
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (key: keyof ContentBlock, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            disabled={isFirst || swap.isPending}
            onClick={() => neighbour && swap.mutate(neighbour)}
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
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {form.kind}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {form.kind === "video" ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => set("featured", v)}
                id={`feat-${block.id}`}
              />
              <Label htmlFor={`feat-${block.id}`} className="text-xs">
                Na página inicial
              </Label>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Switch
              checked={form.published}
              onCheckedChange={(v) => set("published", v)}
              id={`pub-${block.id}`}
            />
            <Label htmlFor={`pub-${block.id}`} className="text-xs">
              Publicado
            </Label>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove.mutate()}
            aria-label="Excluir bloco"
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select value={form.kind} onValueChange={(v) => set("kind", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Página">
          <Select value={form.page} onValueChange={(v) => set("page", v)}>
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
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
      </div>

      {form.kind === "text" ? (
        <Field label="Texto">
          <Textarea rows={5} value={form.body ?? ""} onChange={(e) => set("body", e.target.value)} />
        </Field>
      ) : (
        <Field
          label={form.kind === "video" ? "URL do vídeo" : "Destino do link"}
          hint={
            form.kind === "video"
              ? "YouTube, Instagram (reel) ou link direto .mp4"
              : "Use whatsapp para abrir o WhatsApp, /sobre para páginas internas ou uma URL completa."
          }
        >
          <Input value={form.url ?? ""} onChange={(e) => set("url", e.target.value)} />
        </Field>
      )}

      {form.kind === "link" ? (
        <Field
          label="Ícone"
          hint="message-circle, map-pin, video, user, instagram, youtube, play, link"
        >
          <Input value={form.icon ?? ""} onChange={(e) => set("icon", e.target.value)} />
        </Field>
      ) : null}

      <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar bloco"}
      </Button>
    </div>
  );
}
