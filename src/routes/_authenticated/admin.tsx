import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { IconPicker } from "@/components/admin/icon-picker";
import { VideoField } from "@/components/admin/video-field";
import { FileField } from "@/components/admin/file-field";
import { AccessEditor } from "@/components/admin/access-editor";
import { TestimonialsEditor } from "@/components/admin/testimonials-editor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { ImageUploadField } from "@/components/admin/image-upload";
import {
  BLOCK_COLUMNS,
  KINDS,
  PAGES,
  SETTINGS_COLUMNS,
  SOURCE_HAS_AUTO_COVER,
  videoSource,
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

  // A permissão é apenas lida. Antes, esta consulta CONCEDIA o papel de
  // administrador a quem chegasse primeiro — bastava criar uma conta e abrir
  // esta página. Agora o acesso vem de convite, feito na aba Acessos.
  const roleQuery = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return data !== null;
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
    // Sair devolve à página inicial do site. Voltar para a tela de login dava a
    // impressão de que a saída não tinha funcionado, e deixava a pessoa presa
    // no painel sem caminho de volta para o site.
    navigate({ to: "/", replace: true });
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="secondary" asChild>
              <Link to="/">Ir para o site</Link>
            </Button>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="size-4" /> Sair
            </Button>
          </div>
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
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Ver site
              </a>
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
            <TabsTrigger value="depoimentos">Depoimentos</TabsTrigger>
            <TabsTrigger value="perfil">Perfil & contato</TabsTrigger>
            <TabsTrigger value="cores">Cores</TabsTrigger>
            <TabsTrigger value="acessos">Acessos</TabsTrigger>
          </TabsList>

          <TabsContent value="conteudo" className="mt-6">
            {blocksQuery.data ? <BlocksEditor blocks={blocksQuery.data} /> : <p>Carregando…</p>}
          </TabsContent>

          <TabsContent value="depoimentos" className="mt-6">
            <TestimonialsEditor />
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

          <TabsContent value="acessos" className="mt-6">
            <AccessEditor />
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

          <Field label="Vídeo de apresentação" hint="Aparece no topo da página inicial.">
            <VideoField
              value={form.intro_video_url ?? ""}
              onChange={(v) => set("intro_video_url", v)}
              folder="apresentacao"
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

/**
 * Cada página exibe só um tipo de item. Uma combinação inválida (ex: um
 * "Link / botão" na página Vídeos) salva sem erro e não aparece em lugar
 * nenhum — por isso o painel avisa antes que a pessoa vá procurar no site.
 */
const ALL_KINDS = ["link", "video", "image", "file", "text"];

const PAGE_ACCEPTS: Record<string, { kinds: string[]; says: string }> = {
  home: { kinds: ["link", "video"], says: "links/botões e vídeos" },
  links: { kinds: ["link"], says: "links/botões" },
  videos: { kinds: ["video"], says: "vídeos" },
  sobre: { kinds: ALL_KINDS, says: "qualquer tipo" },
  presencial: { kinds: ALL_KINDS, says: "qualquer tipo" },
  online: { kinds: ALL_KINDS, says: "qualquer tipo" },
};

function mismatchMessage(page: string, kind: string): string | null {
  const rule = PAGE_ACCEPTS[page];
  if (!rule || rule.kinds.includes(kind)) return null;
  const pageLabel = PAGES.find((p) => p.value === page)?.label ?? page;
  const kindLabel = KINDS.find((k) => k.value === kind)?.label ?? kind;
  const suggestion = KINDS.find((k) => rule.kinds.includes(k.value))?.label ?? "";
  return `A página ${pageLabel} mostra apenas ${rule.says}. Este item é do tipo "${kindLabel}", então ele não vai aparecer no site. Troque o tipo para "${suggestion}" ou escolha outra página.`;
}

const LINK_SHORTCUTS = [
  {
    label: "WhatsApp",
    value: "whatsapp",
    hint: "Abre a conversa com o número cadastrado em Perfil & contato",
  },
  { label: "Instagram", value: "instagram", hint: "Abre o perfil cadastrado em Perfil & contato" },
  { label: "YouTube", value: "youtube", hint: "Abre o canal cadastrado em Perfil & contato" },
  { label: "Sobre mim", value: "/sobre", hint: "Leva à página Sobre deste site" },
  {
    label: "Como chegar",
    value: "/como-chegar",
    hint: "Leva à página com o endereço do consultório",
  },
  { label: "Depoimentos", value: "/depoimentos", hint: "Leva à página de depoimentos" },
  { label: "Calculadoras", value: "/calculadoras", hint: "Leva à lista de calculadoras" },
  { label: "Vídeos", value: "/videos", hint: "Leva à galeria de vídeos" },
];

function LinkShortcuts({ onPick }: { onPick: (value: string) => void }) {
  return (
    <div className="mt-2 space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Atalhos — clique para preencher o campo acima:
      </p>
      <div className="flex flex-wrap gap-2">
        {LINK_SHORTCUTS.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.hint}
            onClick={() => onPick(s.value)}
            className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
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
        title: "Novo item",
        sort_order: items.length + 1,
        published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item criado e já visível no site.");
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
          <Plus className="size-4" /> Novo item
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
              allBlocks={blocks}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockCard({
  block,
  allBlocks,
  isFirst,
  isLast,
  neighbour,
  next,
}: {
  block: ContentBlock;
  allBlocks: ContentBlock[];
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
      toast.success("Item salvo.");
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
      toast.success("Item excluído.");
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

  const mismatch = mismatchMessage(form.page, form.kind);

  const categories = useMemo(() => {
    const found = new Set<string>();
    for (const b of allBlocks) {
      const name = b.category?.trim();
      if (name) found.add(name);
    }
    return [...found].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [allBlocks]);

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
            {KINDS.find((k) => k.value === form.kind)?.label ?? form.kind}
          </span>
          {mismatch ? (
            <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] text-foreground">
              Não aparece no site
            </span>
          ) : null}
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
              {form.published ? "Aparecendo no site" : "Rascunho (oculto)"}
            </Label>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove.mutate()}
            aria-label="Excluir item"
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
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Subtítulo">
          <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </Field>
      </div>

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
            rows={5}
            value={form.body ?? ""}
            onChange={(e) => set("body", e.target.value)}
          />
        </Field>
      ) : (
        <Field
          label={form.kind === "video" ? "Link do vídeo" : "Link de destino"}
          hint={
            form.kind === "video"
              ? "Cole um link ou envie um arquivo do computador ou do celular."
              : "Cole o link completo, ou use um dos atalhos abaixo."
          }
        >
          {form.kind === "video" ? (
            <VideoField value={form.url ?? ""} onChange={(v) => set("url", v)} />
          ) : (
            <>
              <Input
                value={form.url ?? ""}
                onChange={(e) => set("url", e.target.value)}
                placeholder="https://instagram.com/thaynanpablo.nutri"
              />
              <LinkShortcuts onPick={(v) => set("url", v)} />
            </>
          )}
        </Field>
      )}

      {form.kind === "video" ? (
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
                ? "Este vídeo já usa a capa automática do YouTube. Envie uma imagem só se quiser substituir."
                : "Esta origem não fornece capa automática. Envie uma imagem para o vídeo aparecer bem na galeria."
            }
          >
            <ImageUploadField
              value={form.cover_url ?? ""}
              onChange={(v) => set("cover_url", v)}
              folder="capas"
            />
          </Field>
        </div>
      ) : null}

      {form.kind === "link" ? (
        <Field label="Ícone" hint="Escolha o desenho que aparece ao lado do título.">
          <IconPicker value={form.icon} onChange={(id) => set("icon", id)} />
        </Field>
      ) : null}

      {mismatch ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
        >
          {mismatch}
        </p>
      ) : null}

      {!form.published ? (
        <p className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Este item está como rascunho e não aparece no site. Ligue a chave &ldquo;Aparecendo no
          site&rdquo; acima e salve para publicar.
        </p>
      ) : null}

      <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
        {save.isPending ? "Salvando…" : "Salvar item"}
      </Button>
    </div>
  );
}
