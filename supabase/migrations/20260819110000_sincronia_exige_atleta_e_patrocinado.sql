-- Correção da regra: "é atleta" e "patrocinado pelo Thaynan" são coisas
-- distintas. Um cliente pode ser atleta com acompanhamento diferenciado sem
-- ser patrocinado — esse não deve criar registro em Atletas. Só sincroniza
-- quando as duas condições estão marcadas juntas.
CREATE OR REPLACE FUNCTION public.sync_client_athlete()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.message_template_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.is_athlete AND NEW.sponsored THEN
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
    UPDATE public.athletes SET client_link_id = NULL WHERE client_link_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
