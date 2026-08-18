import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { IconPicker } from "@/components/admin/icon-picker";
import { VideoField } from "@/components/admin/video-field";
import { FileField } from "@/components/admin/file-field";
import { AccessEditor } from "@/components/admin/access-editor";
import { ContentEditor } from "@/components/admin/content-editor";
import { TestimonialsEditor } from "@/components/admin/testimonials-editor";
import { PricingEditor } from "@/components/admin/pricing-editor";
import { RegistryEditor } from "@/components/admin/registry-editor";
import { VisitorsPanel } from "@/components/admin/visitors-panel";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  LayoutList,
  LogOut,
  MessageSquareQuote,
  Palette,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  UserCog,
  UsersRound,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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

const ADMIN_TABS = [
  { value: "conteudo", label: "Conteúdo", Icon: LayoutList },
  { value: "depoimentos", label: "Depoimentos", Icon: MessageSquareQuote },
  { value: "cadastros", label: "Cadastros", Icon: Users },
  { value: "valores", label: "Valores", Icon: Wallet },
  { value: "visitantes", label: "Visitantes", Icon: UsersRound },
  { value: "perfil", label: "Perfil & contato", Icon: UserCog },
  { value: "cores", label: "Cores", Icon: Palette },
  { value: "acessos", label: "Acessos", Icon: ShieldCheck },
] as const;

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
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 sm:flex sm:w-auto">
            {ADMIN_TABS.map(({ value, label, Icon }, i) => (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted-foreground transition-colors",
                  "hover:border-primary/40 hover:text-foreground",
                  "data-[state=active]:border-primary data-[state=active]:bg-primary/10 data-[state=active]:text-foreground data-[state=active]:shadow-none",
                  // com cinco abas, a última fica sozinha na terceira linha do
                  // celular; ocupando as duas colunas o bloco fecha certinho
                  i === ADMIN_TABS.length - 1 && "col-span-2 sm:col-span-1",
                  "sm:w-auto",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="conteudo" className="mt-6">
            {blocksQuery.data ? <ContentEditor blocks={blocksQuery.data} /> : <p>Carregando…</p>}
          </TabsContent>

          <TabsContent value="depoimentos" className="mt-6">
            <TestimonialsEditor />
          </TabsContent>

          <TabsContent value="cadastros" className="mt-6">
            <RegistryEditor />
          </TabsContent>

          <TabsContent value="valores" className="mt-6">
            {settingsQuery.data ? (
              <PricingEditor settings={settingsQuery.data} />
            ) : (
              <p>Carregando…</p>
            )}
          </TabsContent>

          <TabsContent value="visitantes" className="mt-6">
            <VisitorsPanel />
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
