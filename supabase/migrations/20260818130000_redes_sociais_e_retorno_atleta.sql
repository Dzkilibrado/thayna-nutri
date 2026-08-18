-- Acompanhamento de retorno também para atletas (podem ficar "off" e
-- precisar de contato, do mesmo jeito que um cliente comum), e registro de
-- redes sociais em ambos os cadastros — só para consulta, o Thaynan acessa
-- se precisar, não aparece em lugar nenhum do site público.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS last_appointment_date date,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;

ALTER TABLE public.client_access_links
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS youtube_url text;
