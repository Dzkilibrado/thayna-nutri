-- Página privada de apresentação para clientes.
--
-- Modelo de segurança: o token na URL é a única credencial. Ele é longo e
-- aleatório (16 caracteres, gerado pelo banco), então não é adivinhável — mas
-- quem tiver o link consegue abrir a página, sem senha nem verificação
-- adicional. Nome e telefone do cliente são só anotação do administrador,
-- para saber para quem cada link foi gerado; não bloqueiam nem liberam nada.
--
-- Nenhuma das tabelas abaixo é legível por anon/authenticated direto —
-- só pelas funções SECURITY DEFINER, que verificam o token antes de
-- devolver qualquer dado. Isso impede alguém de consultar a tabela pela
-- chave pública do site e listar todos os links e telefones de clientes.

CREATE TABLE public.client_access_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text,
  client_phone text,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  duration_hours integer,             -- null = sem validade
  expires_at timestamptz,             -- null = sem validade
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz,
  view_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.client_access_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "access links admin all" ON public.client_access_links
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Sem policy para anon: a tabela é inacessível fora das funções abaixo.

CREATE INDEX client_access_links_token_idx ON public.client_access_links (token);

-- Tabela de valores. Duas seções fixas (presencial/online); os itens dentro
-- de cada uma são livres para criar, editar e excluir.
CREATE TABLE public.pricing_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('presencial', 'online')),
  title text NOT NULL DEFAULT '',
  description text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing admin all" ON public.pricing_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Sem policy para anon aqui também: só sai pela função abaixo.

CREATE TRIGGER pricing_items_updated BEFORE UPDATE ON public.pricing_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX pricing_items_section_idx ON public.pricing_items (section, sort_order);

-- Texto de forma de pagamento, um por seção.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS pricing_note_presencial text,
  ADD COLUMN IF NOT EXISTS pricing_note_online text;

-- A página 'privado' nunca deve sair pela leitura pública geral de
-- content_blocks — só pela função get_private_page(), depois de validar o
-- token. Sem isso, o conteúdo ficaria acessível a quem soubesse o nome da
-- página, mesmo sem o link.
DROP POLICY IF EXISTS "blocks published read" ON public.content_blocks;
CREATE POLICY "blocks published read" ON public.content_blocks
  FOR SELECT USING (published AND page <> 'privado');

-- Função pública única: recebe o token, devolve o conteúdo da página privada
-- e as duas tabelas de valores, tudo em uma consulta. Sem token válido,
-- devolve valid=false e mais nada — nenhuma pista sobre o que existiria.
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

  SELECT jsonb_build_object(
    'valid', true,
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
    'settings', (
      SELECT to_jsonb(s) FROM public.site_settings s LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_private_page(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_private_page(text) TO anon, authenticated;

-- Gera um token novo para um link existente (usado pelo botão "Renovar").
-- SECURITY DEFINER só para poder chamar gen_random_bytes com o mesmo padrão
-- do token original; a checagem de admin é explícita, como nas demais
-- funções administrativas do projeto.
CREATE OR REPLACE FUNCTION public.renew_client_access(_id uuid, _duration_hours integer)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_token text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem renovar acessos.';
  END IF;

  new_token := encode(gen_random_bytes(8), 'hex');

  UPDATE public.client_access_links
  SET
    token = new_token,
    duration_hours = _duration_hours,
    expires_at = CASE WHEN _duration_hours IS NULL THEN NULL
                       ELSE now() + (_duration_hours || ' hours')::interval END,
    revoked = false,
    view_count = 0,
    last_viewed_at = NULL
  WHERE id = _id;

  RETURN new_token;
END;
$$;

REVOKE ALL ON FUNCTION public.renew_client_access(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.renew_client_access(uuid, integer) TO authenticated;
