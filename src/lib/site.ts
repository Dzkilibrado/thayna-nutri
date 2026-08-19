export type SiteSettings = {
  brand_name: string;
  brand_tagline: string;
  headline: string;
  bio: string;
  avatar_url: string | null;
  whatsapp: string;
  whatsapp_message: string;
  email: string;
  address: string;
  maps_url: string | null;
  hours: string;
  instagram_url: string | null;
  youtube_url: string | null;
  intro_video_url: string | null;
  color_background: string;
  color_surface: string;
  color_accent: string;
  color_foreground: string;
  pricing_note_presencial: string | null;
  pricing_note_online: string | null;
};

export type ContentBlock = {
  id: string;
  page: string;
  kind: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  url: string | null;
  icon: string | null;
  sort_order: number;
  published: boolean;
  featured: boolean;
  category: string | null;
  cover_url: string | null;
};

export type Testimonial = {
  id: string;
  author_name: string;
  author_context: string | null;
  quote: string;
  photo_url: string | null;
  video_url: string | null;
  sort_order: number;
  featured: boolean;
  published: boolean;
  status: "pending" | "approved";
  source: string;
};

export const TESTIMONIAL_COLUMNS =
  "id, author_name, author_context, quote, photo_url, video_url, sort_order, featured, published, status, source";

export const SETTINGS_COLUMNS =
  "brand_name, brand_tagline, headline, bio, avatar_url, whatsapp, whatsapp_message, email, address, maps_url, hours, instagram_url, youtube_url, intro_video_url, color_background, color_surface, color_accent, color_foreground, pricing_note_presencial, pricing_note_online";

export const BLOCK_COLUMNS =
  "id, page, kind, title, subtitle, body, url, icon, sort_order, published, featured, category, cover_url";

export const PAGES = [
  { value: "home", label: "Início (links)" },
  { value: "links", label: "Links" },
  { value: "videos", label: "Vídeos" },
  { value: "sobre", label: "Sobre mim" },
  { value: "presencial", label: "Consulta presencial" },
  { value: "online", label: "Consulta online" },
  { value: "privado", label: "Página privada (só quem tem o link)" },
] as const;

export const MAX_TESTIMONIAL_QUOTE = 600;
export const MIN_TESTIMONIAL_QUOTE = 20;

export const KINDS = [
  { value: "link", label: "Link / botão" },
  { value: "video", label: "Vídeo" },
  { value: "image", label: "Foto / imagem" },
  { value: "file", label: "Arquivo para baixar" },
  { value: "text", label: "Texto" },
] as const;

export function whatsappLink(phone: string, message: string) {
  const digits = (phone || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message || "")}`;
}

/** Converts a YouTube / Instagram / direct URL into an embeddable src. */
export type EmbedInfo = {
  type: "iframe" | "video" | "none";
  src: string;
  /**
   * Proporção conhecida da origem. Reels e Shorts são verticais; o resto
   * assume-se horizontal. Arquivos enviados não declaram nada — quem manda é a
   * proporção real do arquivo, lida pelo próprio navegador.
   */
  ratio: "wide" | "vertical" | "intrinsic";
};

export function toEmbedUrl(raw: string | null | undefined): EmbedInfo {
  const url = (raw || "").trim();
  if (!url) return { type: "none", src: "", ratio: "wide" };

  const isShort = /youtube\.com\/shorts\//i.test(url);
  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{6,})/) ??
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  if (yt)
    return {
      type: "iframe",
      src: `https://www.youtube.com/embed/${yt[1]}`,
      ratio: isShort ? "vertical" : "wide",
    };

  const ig = url.match(/instagram\.com\/(?:p|reel|tv)\/([\w-]+)/);
  if (ig)
    return {
      type: "iframe",
      src: `https://www.instagram.com/reel/${ig[1]}/embed`,
      ratio: "vertical",
    };

  if (/facebook\.com|fb\.watch/i.test(url)) {
    return {
      type: "iframe",
      src: `https://www.facebook.com/plugins/video.php?height=476&show_text=false&href=${encodeURIComponent(url)}`,
      ratio: "wide",
    };
  }

  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive)
    return {
      type: "iframe",
      src: `https://drive.google.com/file/d/${drive[1]}/preview`,
      ratio: "wide",
    };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo)
    return { type: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}`, ratio: "wide" };

  if (/dropbox\.com/i.test(url)) {
    return {
      type: "video",
      src: url.replace(/[?&]dl=0/, "").concat(url.includes("?") ? "&raw=1" : "?raw=1"),
      ratio: "intrinsic",
    };
  }

  if (/1drv\.ms|onedrive\.live\.com/i.test(url)) {
    return { type: "iframe", src: url.replace("/redir?", "/embed?"), ratio: "wide" };
  }

  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url))
    return { type: "video", src: url, ratio: "intrinsic" };

  return { type: "iframe", src: url, ratio: "wide" };
}

/**
 * Imagem de capa do vídeo para a grade da galeria.
 * O YouTube publica a capa a partir do identificador do vídeo, então ela vem
 * de graça. Instagram e arquivos enviados não expõem capa pública — nesses
 * casos vale a capa informada no painel, e sem ela a grade usa um fundo neutro.
 */
export function videoCover(block: {
  cover_url?: string | null;
  url?: string | null;
}): string | null {
  if (block.cover_url) return block.cover_url;
  const embed = toEmbedUrl(block.url);
  const yt = embed.src.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return yt ? `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` : null;
}

export type VideoSource = "youtube" | "instagram" | "facebook" | "vimeo" | "file" | "other";

/** De onde vem o vídeo — usado para desenhar a capa quando não há imagem. */
export function videoSource(url: string | null | undefined): VideoSource {
  const value = (url ?? "").trim();
  if (!value) return "other";
  if (/youtube\.com|youtu\.be/i.test(value)) return "youtube";
  if (/instagram\.com/i.test(value)) return "instagram";
  if (/facebook\.com|fb\.watch/i.test(value)) return "facebook";
  if (/vimeo\.com/i.test(value)) return "vimeo";
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(value)) return "file";
  return "other";
}

/**
 * Só o YouTube publica capa a partir do endereço do vídeo. Instagram e
 * Facebook exigem API com token que expira, e arquivo enviado não tem capa —
 * nesses casos a página desenha uma capa própria com a marca da origem.
 */
export const SOURCE_HAS_AUTO_COVER: Record<VideoSource, boolean> = {
  youtube: true,
  instagram: false,
  facebook: false,
  vimeo: false,
  file: false,
  other: false,
};

export type ContactStatus =
  "contato_inicial" | "em_negociacao" | "cliente_ativo" | "cliente_inativo";

export const CONTACT_STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "contato_inicial", label: "Contato inicial" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "cliente_ativo", label: "Cliente ativo" },
  { value: "cliente_inativo", label: "Cliente inativo" },
];

export type AttendanceType = "presencial" | "online";

export const ATTENDANCE_OPTIONS: { value: AttendanceType; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
];

export type ClientAccessLink = {
  id: string;
  client_name: string | null;
  client_phone: string | null;
  token: string;
  duration_hours: number | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
  last_viewed_at: string | null;
  view_count: number;
  contact_status: ContactStatus;
  attendance_type: AttendanceType | null;
  last_appointment_date: string | null;
  is_athlete: boolean;
  sponsored: boolean;
  referred_by_athlete_id: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  message_template_id: string | null;
};

export const ACCESS_LINK_COLUMNS =
  "id, client_name, client_phone, token, duration_hours, expires_at, revoked, created_at, last_viewed_at, view_count, contact_status, attendance_type, last_appointment_date, is_athlete, sponsored, referred_by_athlete_id, instagram_url, facebook_url, youtube_url";

export const DURATION_OPTIONS: { value: number | null; label: string }[] = [
  { value: 24, label: "24 horas" },
  { value: 48, label: "48 horas" },
  { value: 72, label: "72 horas" },
  { value: 168, label: "7 dias" },
  { value: null, label: "Sem validade" },
];

export type PricingSection = "presencial" | "online";

export type PricingItem = {
  id: string;
  section: PricingSection;
  title: string;
  description: string | null;
  price: number;
  sort_order: number;
  published: boolean;
};

export const PRICING_COLUMNS = "id, section, title, description, price, sort_order, published";

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Mensagem padrão de abertura enviada junto com o link privado. O nome do
 * cliente, quando informado, entra como primeira linha; sem nome, a mensagem
 * começa direto na saudação.
 */
export function buildClientAccessMessage(clientName: string | null, link: string) {
  const greeting = clientName?.trim() ? `${clientName.trim()}!\n\n` : "";
  return (
    `${greeting}Oi! Tudo bem?\n\n` +
    "Aqui é a Carla, assistente do Dr. Thaynan Pablo.\n" +
    "Que bom que você nos procurou!\n" +
    "Estou aqui para tirar suas dúvidas e já deixar tudo pronto para sua consulta.\n" +
    "Me conta seu nome pra gente começar?\n" +
    "Após dar uma olhada, posso verificar os melhores horários disponíveis e já deixar seu agendamento encaminhado.\n" +
    "Fico à disposição para dar continuidade 😊\n\n" +
    `📎 Aqui estão os detalhes do atendimento e os valores:\n${link}`
  );
}

export type Athlete = {
  id: string;
  name: string;
  phone: string | null;
  sponsored: boolean;
  last_appointment_date: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  /** Preenchido sozinho quando este atleta veio de um cliente marcado como
   * atleta em Cadastros → Clientes — nome, telefone, patrocínio e última
   * consulta são atualizados a partir de lá. */
  client_link_id: string | null;
};

export const ATHLETE_COLUMNS =
  "id, name, phone, sponsored, last_appointment_date, instagram_url, facebook_url, youtube_url, client_link_id";

export type MessageKind = "text" | "video" | "link";

export const MESSAGE_KIND_OPTIONS: { value: MessageKind; label: string }[] = [
  { value: "text", label: "Texto" },
  { value: "video", label: "Vídeo" },
  { value: "link", label: "Link" },
];

export type MessageTemplate = {
  id: string;
  title: string;
  description: string | null;
  kind: MessageKind;
  body: string | null;
  url: string | null;
};

export const MESSAGE_COLUMNS = "id, title, description, kind, body, url";

/** Texto curto enviado junto do link, quando a mensagem é uma da biblioteca
 * (em vez do link fixo de apresentação e valores). */
export function buildMessageSendText(
  clientName: string | null,
  messageTitle: string,
  link: string,
) {
  const greeting = clientName?.trim() ? `${clientName.trim()}, tudo bem?` : "Oi, tudo bem?";
  return `${greeting} Preparei isto para você: ${messageTitle}.\n\n📎 ${link}`;
}
