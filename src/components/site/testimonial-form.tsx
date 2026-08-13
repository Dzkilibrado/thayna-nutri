import { useState } from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { MAX_TESTIMONIAL_QUOTE, MIN_TESTIMONIAL_QUOTE } from "@/lib/site";

export function TestimonialForm() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [quote, setQuote] = useState("");
  // Campo invisível para pessoas, preenchido por robôs de spam.
  const [trap, setTrap] = useState("");

  const trimmed = quote.trim();
  const canSend =
    name.trim().length >= 2 &&
    trimmed.length >= MIN_TESTIMONIAL_QUOTE &&
    trimmed.length <= MAX_TESTIMONIAL_QUOTE;

  async function submit() {
    if (trap) {
      setSent(true);
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("testimonials").insert({
        author_name: name.trim(),
        author_context: context.trim() || null,
        quote: trimmed,
        status: "pending",
        source: "public",
        published: false,
        featured: false,
      });
      if (error) throw error;
      setSent(true);
      setName("");
      setContext("");
      setQuote("");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente em instantes.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setSent(false);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="secondary">
          <PenLine className="size-4" /> Escrever depoimento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-surface">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle>Obrigado!</DialogTitle>
              <DialogDescription>
                Seu depoimento foi enviado e será lido antes de ir para o site. Assim que for
                aprovado, ele aparece nesta página.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={() => setOpen(false)}>Fechar</Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Escrever depoimento</DialogTitle>
              <DialogDescription>
                Conte como foi o seu acompanhamento. O texto passa por leitura antes de ser
                publicado, então ele não aparece no site na hora.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Seu nome
                </Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como você quer aparecer no site"
                  maxLength={80}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Seu objetivo (opcional)
                </Label>
                <Input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ex.: Corrida de rua, Ganho de massa"
                  maxLength={80}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Seu depoimento
                </Label>
                <Textarea
                  rows={6}
                  value={quote}
                  onChange={(e) => setQuote(e.target.value.slice(0, MAX_TESTIMONIAL_QUOTE))}
                  placeholder="O que mudou no seu dia a dia, o que você achou do acompanhamento…"
                />
                <p className="text-[11px] text-muted-foreground">
                  {trimmed.length} de {MAX_TESTIMONIAL_QUOTE} caracteres
                  {trimmed.length < MIN_TESTIMONIAL_QUOTE
                    ? ` — escreva ao menos ${MIN_TESTIMONIAL_QUOTE}`
                    : ""}
                </p>
              </div>

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
                className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
              />

              <p className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
                Quer que seu depoimento tenha foto ou vídeo? Este formulário aceita apenas texto.
                Envie a foto ou o link do vídeo direto para o Thaynan pelo WhatsApp, que ele anexa
                ao seu depoimento.
              </p>

              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Ao enviar, você autoriza a publicação do seu nome e do texto no site. Não escreva
                dados de saúde, resultados de exames, peso ou medidas.
              </p>

              <Button onClick={() => void submit()} disabled={busy || !canSend} className="w-full">
                {busy ? "Enviando…" : "Enviar depoimento"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
