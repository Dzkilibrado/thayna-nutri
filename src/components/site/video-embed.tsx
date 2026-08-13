import { toEmbedUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Exibe o vídeo inteiro, sem corte.
 *
 * Arquivo enviado: o próprio navegador aplica a proporção real do arquivo, então
 * um vídeo em pé aparece em pé e um deitado aparece deitado. Não há moldura fixa
 * nem `object-cover` — era o que cortava as laterais.
 *
 * Incorporado (YouTube, Instagram): não dá para ler a proporção de fora, então
 * usamos a proporção conhecida da origem — 9:16 para Reels e Shorts, 16:9 para
 * o resto. Vídeos em pé ficam com largura limitada para não dominar a página.
 */
export function VideoEmbed({ url, title }: { url: string | null | undefined; title?: string }) {
  const embed = toEmbedUrl(url);
  if (embed.type === "none") return null;

  const vertical = embed.ratio === "vertical";

  const frame = cn(
    "card-shadow overflow-hidden rounded-2xl border border-border bg-black",
    vertical && "mx-auto w-full max-w-sm",
  );

  if (embed.type === "video") {
    return (
      <div className={cn(frame, "mx-auto w-fit max-w-full")}>
        <video
          src={embed.src}
          controls
          playsInline
          preload="metadata"
          className="block max-h-[70vh] w-auto max-w-full"
        />
      </div>
    );
  }

  return (
    <div className={frame}>
      <div className={vertical ? "aspect-[9/16] w-full" : "aspect-video w-full"}>
        <iframe
          src={embed.src}
          title={title ?? "Vídeo"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
