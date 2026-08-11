import { toEmbedUrl } from "@/lib/site";

export function VideoEmbed({ url, title }: { url: string | null | undefined; title?: string }) {
  const embed = toEmbedUrl(url);
  if (embed.type === "none") return null;

  return (
    <div className="card-shadow overflow-hidden rounded-2xl border border-border bg-surface-2">
      <div className="aspect-video w-full">
        {embed.type === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={embed.src} controls playsInline className="h-full w-full object-cover" />
        ) : (
          <iframe
            src={embed.src}
            title={title ?? "Vídeo"}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}
