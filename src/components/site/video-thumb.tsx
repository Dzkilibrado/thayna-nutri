import { Facebook, Film, Instagram, Play, Video } from "lucide-react";

import { videoCover, videoSource } from "@/lib/site";
import { cn } from "@/lib/utils";

const SOURCE_ART = {
  instagram: { Icon: Instagram, label: "Instagram" },
  facebook: { Icon: Facebook, label: "Facebook" },
  vimeo: { Icon: Video, label: "Vimeo" },
  file: { Icon: Film, label: "Vídeo" },
  youtube: { Icon: Video, label: "YouTube" },
  other: { Icon: Film, label: "Vídeo" },
} as const;

/**
 * Capa desenhada para quando a origem não fornece miniatura.
 * Melhor do que um retângulo vazio: identifica de onde vem o vídeo e mantém a
 * grade com aparência intencional.
 */
export function SourceCover({ url }: { url: string | null | undefined }) {
  const { Icon, label } = SOURCE_ART[videoSource(url)];
  return (
    <span className="icon-tile flex size-full flex-col items-center justify-center gap-2">
      <Icon className="size-8 text-primary/70" />
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
    </span>
  );
}

/**
 * Capa clicável de um vídeo. O player só carrega quando a pessoa clica —
 * com vários vídeos na mesma página, carregar todos de uma vez deixa tudo
 * lento e consome dados de quem só queria ver um.
 */
export function VideoThumb({
  url,
  coverUrl,
  fallbackCover,
  onOpen,
  label,
  className,
}: {
  url: string | null | undefined;
  coverUrl?: string | null | undefined;
  /** Última alternativa de capa (ex.: a foto da pessoa, num depoimento). */
  fallbackCover?: string | null | undefined;
  onOpen: () => void;
  label?: string | undefined;
  className?: string | undefined;
}) {
  const cover = videoCover({ cover_url: coverUrl ?? null, url: url ?? null }) ?? fallbackCover;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label ? `Assistir: ${label}` : "Assistir vídeo"}
      className={cn(
        "group/thumb relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
        />
      ) : (
        <SourceCover url={url} />
      )}

      <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover/thumb:bg-black/10">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover/thumb:scale-110">
          <Play className="size-6 translate-x-0.5 fill-current" />
        </span>
      </span>
    </button>
  );
}
