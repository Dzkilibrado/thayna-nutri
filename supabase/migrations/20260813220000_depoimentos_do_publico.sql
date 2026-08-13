-- Depoimentos enviados pelo público, com aprovação obrigatória.
--
-- status: 'pending' enquanto aguarda aprovação, 'approved' depois de liberado.
--   Registros que já existiam nascem aprovados, para nada sumir do site.
-- source: quem cadastrou — 'admin' pelo painel, 'public' pelo formulário.
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin';

ALTER TABLE public.testimonials
  DROP CONSTRAINT IF EXISTS testimonials_status_check;
ALTER TABLE public.testimonials
  ADD CONSTRAINT testimonials_status_check CHECK (status IN ('pending', 'approved'));

-- O site só mostra o que foi publicado E aprovado.
DROP POLICY IF EXISTS "testimonials published read" ON public.testimonials;
CREATE POLICY "testimonials published read" ON public.testimonials
  FOR SELECT USING (published AND status = 'approved');

-- Envio pelo formulário do site.
-- As condições abaixo são a proteção real: mesmo que alguém chame o banco
-- diretamente, sem passar pela tela, não consegue publicar nada nem anexar
-- foto ou vídeo — só criar um registro pendente, de texto, dentro dos limites.
GRANT INSERT ON public.testimonials TO anon;

DROP POLICY IF EXISTS "public can submit testimonial" ON public.testimonials;
CREATE POLICY "public can submit testimonial" ON public.testimonials
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND source = 'public'
    AND published = false
    AND featured = false
    AND photo_url IS NULL
    AND video_url IS NULL
    AND char_length(btrim(author_name)) BETWEEN 2 AND 80
    AND char_length(btrim(quote)) BETWEEN 20 AND 600
    AND (author_context IS NULL OR char_length(btrim(author_context)) <= 80)
  );

CREATE INDEX IF NOT EXISTS testimonials_status_idx ON public.testimonials (status, sort_order);
