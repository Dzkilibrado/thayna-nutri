import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function ImageUploadField({
  value,
  onChange,
  folder = "uploads",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
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
      toast.success("Imagem enviada. Não esqueça de salvar.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Pré-visualização da imagem"
            className="size-14 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
            —
          </div>
        )}
        <Input
          value={value}
          placeholder="Cole uma URL ou envie um arquivo"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
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
          {busy ? "Enviando…" : "Enviar do computador"}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}
