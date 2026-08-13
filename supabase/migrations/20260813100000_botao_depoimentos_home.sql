-- Botão "Depoimentos" na lista da página inicial.
-- Com ele a lista passa a ter 6 itens, fechando 3 linhas de 2 colunas no
-- tablet e no desktop, sem sobrar um item solto na última linha.
-- Idempotente: não duplica se já existir.
INSERT INTO public.content_blocks (page, kind, title, subtitle, url, icon, sort_order, published)
SELECT
  'home',
  'link',
  'Depoimentos',
  'O que dizem quem já foi atendido',
  '/depoimentos',
  'star',
  COALESCE((SELECT MAX(sort_order) FROM public.content_blocks WHERE page = 'home'), 0) + 1,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.content_blocks WHERE page = 'home' AND url = '/depoimentos'
);
