-- Central de Clientes: campos de acompanhamento sobre cada cliente cadastrado
-- em Cadastros → Clientes, além do link e da validade que já existiam.
ALTER TABLE public.client_access_links
  ADD COLUMN IF NOT EXISTS contact_status text NOT NULL DEFAULT 'contato_inicial',
  ADD COLUMN IF NOT EXISTS attendance_type text,
  ADD COLUMN IF NOT EXISTS last_appointment_date date,
  ADD COLUMN IF NOT EXISTS is_athlete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sponsored boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referred_by_athlete_id uuid REFERENCES public.athletes(id) ON DELETE SET NULL;

ALTER TABLE public.client_access_links
  DROP CONSTRAINT IF EXISTS client_access_links_contact_status_check;
ALTER TABLE public.client_access_links
  ADD CONSTRAINT client_access_links_contact_status_check
  CHECK (contact_status IN ('contato_inicial', 'em_negociacao', 'cliente_ativo', 'cliente_inativo'));

ALTER TABLE public.client_access_links
  DROP CONSTRAINT IF EXISTS client_access_links_attendance_type_check;
ALTER TABLE public.client_access_links
  ADD CONSTRAINT client_access_links_attendance_type_check
  CHECK (attendance_type IS NULL OR attendance_type IN ('presencial', 'online'));

-- Apoia os filtros da tela e, mais à frente, o relatório de indicações.
CREATE INDEX IF NOT EXISTS client_access_links_status_idx
  ON public.client_access_links (contact_status, attendance_type);
CREATE INDEX IF NOT EXISTS client_access_links_referred_idx
  ON public.client_access_links (referred_by_athlete_id);
