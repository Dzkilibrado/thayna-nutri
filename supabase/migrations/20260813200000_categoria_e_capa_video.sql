-- Organização da galeria de vídeos.
-- category: assunto do vídeo, usado nos filtros da página (Competições,
--   Nutrição, Atendimento — o próprio painel define, não é lista fixa).
-- cover_url: imagem de capa. Vídeos do YouTube têm capa automática; Instagram
--   e arquivos enviados não, então a capa pode ser informada manualmente.
ALTER TABLE public.content_blocks
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS cover_url text;
