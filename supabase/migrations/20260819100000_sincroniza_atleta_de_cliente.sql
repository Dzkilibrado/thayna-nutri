-- Sincronização automática: cliente marcado como atleta passa a manter um
-- registro correspondente em Atletas sozinho, sem duplicar digitação. A
-- ligação é por chave (client_link_id), não por nome/telefone — evita que
-- variação de grafia crie um atleta duplicado.
ALTER TABLE public.athletes
  ADD COLUMN IF NOT EXISTS client_link_id uuid
    REFERENCES public.client_access_links(id) ON DELETE SET NULL;

ALTER TABLE public.athletes
  DROP CONSTRAINT IF EXISTS athletes_client_link_id_key;
ALTER TABLE public.athletes
  ADD CONSTRAINT athletes_client_link_id_key UNIQUE (client_link_id);

CREATE OR REPLACE FUNCTION public.sync_client_athlete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Links gerados para enviar mensagem (message_template_id preenchido) não
  -- são cadastros de cliente de verdade — não entram nessa sincronização.
  IF NEW.message_template_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_athlete THEN
    INSERT INTO public.athletes (name, phone, sponsored, last_appointment_date, client_link_id)
    VALUES (
      COALESCE(NULLIF(NEW.client_name, ''), 'Cliente sem nome'),
      NEW.client_phone,
      NEW.sponsored,
      NEW.last_appointment_date,
      NEW.id
    )
    ON CONFLICT (client_link_id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      sponsored = EXCLUDED.sponsored,
      last_appointment_date = EXCLUDED.last_appointment_date;
  ELSE
    -- Desmarcou "é atleta": desvincula em vez de apagar — o registro pode já
    -- ter sido usado como indicação de outro cliente, e apagar quebraria
    -- esse histórico.
    UPDATE public.athletes SET client_link_id = NULL WHERE client_link_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_client_athlete_trigger ON public.client_access_links;
CREATE TRIGGER sync_client_athlete_trigger
AFTER INSERT OR UPDATE ON public.client_access_links
FOR EACH ROW EXECUTE FUNCTION public.sync_client_athlete();
