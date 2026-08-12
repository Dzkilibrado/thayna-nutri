import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const MAX_MB = 20;

/**
 * Anexo genérico: PDF, planilha, documento. Aceita tanto o envio de um arquivo
 * do computador ou do celular quanto um link já existente.
 */
export function FileField({
  value,
  onChange,
  folder = "arquivos",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_MB) {
      toast.error(`O arquivo tem ${sizeMb.toFixed(0)} MB e o limite é ${MAX_MB} MB.`);
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });
      if (error) throw error;

      const { data, error: signError } = await supabase.storage
        .from("media")
        .createSignedUrl(path, TEN_YEARS);
      if (signError) throw signError;

      onChange(data.signedUrl);
      toast.success("Arquivo enviado. Não esqueça de salvar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        value={value}
        placeholder="Cole um link, ou envie um arquivo abaixo"
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
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

      <p className="text-[11px] text-muted-foreground">
        Até {MAX_MB} MB. O título do item vira o nome do botão de download no site.
      </p>
    </div>
  );
}
