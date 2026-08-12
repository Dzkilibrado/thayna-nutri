-- Depoimentos de pacientes.
-- Tabela própria em vez de content_blocks: cada depoimento tem autor, texto,
-- mídia e destaque, e misturar isso nos blocos genéricos engessaria o módulo.
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL DEFAULT '',
  author_context text,                 -- "Corrida de rua", "Emagrecimento", etc.
  quote text NOT NULL DEFAULT '',
  photo_url text,                      -- foto do paciente (nunca antes/depois)
  video_url text,                      -- YouTube, Instagram ou arquivo enviado
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,   -- aparece na página inicial
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials published read" ON public.testimonials
  FOR SELECT USING (published);
CREATE POLICY "testimonials admin read" ON public.testimonials
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "testimonials admin all" ON public.testimonials
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER testimonials_updated BEFORE UPDATE ON public.testimonials
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX testimonials_order_idx ON public.testimonials (published, sort_order);
