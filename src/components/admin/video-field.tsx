import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_MB = 50;

/**
 * Campo de vídeo com três origens: colar o link, enviar um arquivo do
 * computador ou do celular, e links de nuvem (Drive, Dropbox, OneDrive).
 * O arquivo enviado vai para o mesmo repositório das imagens do site.
 */
export function VideoField({
  value,
  onChange,
  folder = "videos",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Selecione um arquivo de vídeo.");
      return;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_MB) {
      toast.error(
        `O vídeo tem ${sizeMb.toFixed(0)} MB e o limite é ${MAX_MB} MB. Para vídeos maiores, publique no YouTube ou no Instagram e cole o link aqui.`,
      );
      return;
    }

    setBusy(true);
    setProgress(`Enviando ${sizeMb.toFixed(1)} MB…`);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      const { data, error: signError } = await supabase.storage
        .from("media")
        .createSignedUrl(path, TEN_YEARS);
      if (signError) throw signError;

      onChange(data.signedUrl);
      toast.success("Vídeo enviado. Não esqueça de salvar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar o vídeo.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={value}
        placeholder="Cole o link do vídeo, ou envie um arquivo abaixo"
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Enviando…" : "Enviar do computador ou celular"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Limpar
          </Button>
        ) : null}
      </div>

      {progress ? <p className="text-[11px] text-muted-foreground">{progress}</p> : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Funciona com YouTube, Instagram, Facebook, Google Drive, Dropbox e OneDrive. Arquivos
        enviados daqui podem ter até {MAX_MB} MB — para vídeos longos, publique no YouTube e cole o
        link, que carrega mais rápido para quem visita o site. No celular, o botão abre a galeria.
      </p>
    </div>
  );
}
