-- Biblioteca de mensagens reutilizáveis. Cada mensagem é texto, um vídeo por
-- link (YouTube/Instagram/Facebook) ou um link — nunca arquivo enviado, para
-- não duplicar o que já existe em Conteúdo. Só sai pela função abaixo, nunca
-- por leitura direta — mesmo padrão de content_blocks/pricing_items.
CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  description text,
  kind text NOT NULL CHECK (kind IN ('text', 'video', 'link')),
  body text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages admin all" ON public.message_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER message_templates_updated BEFORE UPDATE ON public.message_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Um link de cliente passa a poder apontar para uma mensagem específica, em
-- vez de sempre para a página fixa de apresentação e valores. Nulo continua
-- significando "página privada", como já funciona hoje — nenhum link
-- existente muda de comportamento.
ALTER TABLE public.client_access_links
  ADD COLUMN IF NOT EXISTS message_template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS client_access_links_message_idx
  ON public.client_access_links (message_template_id);

-- get_private_page() passa a devolver um de dois formatos, marcados pelo
-- campo "type": a página privada de sempre, ou uma mensagem específica —
-- conforme o link consultado tenha ou não uma mensagem associada.
CREATE OR REPLACE FUNCTION public.get_private_page(_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  link record;
  result jsonb;
BEGIN
  SELECT * INTO link FROM public.client_access_links
  WHERE token = _token
    AND revoked = false
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF link IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  UPDATE public.client_access_links
  SET view_count = view_count + 1, last_viewed_at = now()
  WHERE id = link.id;

  IF link.message_template_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'valid', true,
      'type', 'message',
      'message', (
        SELECT jsonb_build_object('title', m.title, 'kind', m.kind, 'body', m.body, 'url', m.url)
        FROM public.message_templates m
        WHERE m.id = link.message_template_id
      ),
      'settings', (SELECT to_jsonb(s) FROM public.site_settings s LIMIT 1)
    ) INTO result;
    RETURN result;
  END IF;

  SELECT jsonb_build_object(
    'valid', true,
    'type', 'private_page',
    'blocks', COALESCE((
      SELECT jsonb_agg(to_jsonb(b) ORDER BY b.sort_order)
      FROM public.content_blocks b
      WHERE b.page = 'privado' AND b.published
    ), '[]'::jsonb),
    'pricing', jsonb_build_object(
      'presencial', jsonb_build_object(
        'items', COALESCE((
          SELECT jsonb_agg(to_jsonb(p) ORDER BY p.sort_order)
          FROM public.pricing_items p
          WHERE p.section = 'presencial' AND p.published
        ), '[]'::jsonb)
      ),
      'online', jsonb_build_object(
        'items', COALESCE((
          SELECT jsonb_agg(to_jsonb(p) ORDER BY p.sort_order)
          FROM public.pricing_items p
          WHERE p.section = 'online' AND p.published
        ), '[]'::jsonb)
      )
    ),
    'settings', (SELECT to_jsonb(s) FROM public.site_settings s LIMIT 1)
  ) INTO result;

  RETURN result;
END;
$$;
