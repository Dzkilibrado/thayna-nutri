-- "Como chegar" sai da barra de navegação e passa a ser um botão da lista da
-- página inicial, na mesma tabela dos outros — assim o painel controla título,
-- subtítulo, ícone, ordem e visibilidade, como em qualquer outro item.
-- Idempotente: não duplica se o item já existir.
INSERT INTO public.content_blocks (page, kind, title, subtitle, url, icon, sort_order, published)
SELECT
  'home',
  'link',
  'Como chegar',
  'Endereço e rotas até o consultório',
  '/como-chegar',
  'map-pin',
  COALESCE((SELECT MAX(sort_order) FROM public.content_blocks WHERE page = 'home'), 0) + 1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.content_blocks WHERE page = 'home' AND url = '/como-chegar'
);
