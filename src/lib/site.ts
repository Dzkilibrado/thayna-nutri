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
};

export const TESTIMONIAL_COLUMNS =
  "id, author_name, author_context, quote, photo_url, video_url, sort_order, featured, published";

export const SETTINGS_COLUMNS =
  "brand_name, brand_tagline, headline, bio, avatar_url, whatsapp, whatsapp_message, email, address, maps_url, hours, instagram_url, youtube_url, intro_video_url, color_background, color_surface, color_accent, color_foreground";

export const BLOCK_COLUMNS =
  "id, page, kind, title, subtitle, body, url, icon, sort_order, published, featured, category, cover_url";

export const PAGES = [
  { value: "home", label: "Início (links)" },
  { value: "links", label: "Links" },
  { value: "videos", label: "Vídeos" },
  { value: "sobre", label: "Sobre mim" },
  { value: "presencial", label: "Consulta presencial" },
  { value: "online", label: "Consulta online" },
] as const;

export const MAX_TESTIMONIAL_QUOTE = 600;

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
