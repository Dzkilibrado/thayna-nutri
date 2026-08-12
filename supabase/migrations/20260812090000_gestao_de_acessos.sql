-- Gestão de acessos ao painel.
--
-- Antes: claim_first_admin() dava o painel para o primeiro usuário autenticado
-- que chamasse a função. Com o cadastro aberto, qualquer pessoa assumia.
--
-- Agora: o administrador convida por e-mail. Quem foi convidado se cadastra
-- normalmente, escolhe a própria senha, e recebe o papel de administrador no
-- momento do cadastro. Quem não foi convidado cria uma conta comum, sem acesso
-- ao painel. Nenhuma senha passa pelo painel nem pelo navegador de quem convida.

DROP FUNCTION IF EXISTS public.claim_first_admin();

CREATE TABLE public.admin_invites (
  email text PRIMARY KEY,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_user_id uuid
);

GRANT SELECT ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites admin read" ON public.admin_invites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Papéis: cada um enxerga o próprio; administrador enxerga todos.
DROP POLICY IF EXISTS "authenticated can read roles" ON public.user_roles;
CREATE POLICY "own role read" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin reads roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- No cadastro, quem estiver na lista de convites vira administrador.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  invited boolean;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_invites
    WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL
  ) INTO invited;

  IF invited THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.admin_invites
    SET accepted_at = now(), accepted_user_id = NEW.id
    WHERE lower(email) = lower(NEW.email);
  END IF;

  RETURN NEW;
END;
$$;

-- Lista de quem tem acesso ao painel. O e-mail vem de auth.users, que não é
-- acessível pelo navegador — por isso a leitura acontece aqui dentro.
CREATE OR REPLACE FUNCTION public.admin_users_list()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz, is_self boolean)
LANGUAGE sql SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT u.id, u.email::text, u.created_at, u.id = auth.uid()
  FROM auth.users u
  JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'admin'
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at;
$$;

CREATE OR REPLACE FUNCTION public.admin_invite_create(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem convidar novos acessos.';
  END IF;
  IF _email IS NULL OR position('@' in _email) = 0 THEN
    RAISE EXCEPTION 'Informe um e-mail válido.';
  END IF;
  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(_email)) THEN
    RAISE EXCEPTION 'Já existe uma conta com esse e-mail.';
  END IF;

  INSERT INTO public.admin_invites (email, invited_by)
  VALUES (lower(trim(_email)), auth.uid())
  ON CONFLICT (email) DO UPDATE
    SET created_at = now(), invited_by = auth.uid(), accepted_at = NULL, accepted_user_id = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_invite_revoke(_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem cancelar convites.';
  END IF;
  DELETE FROM public.admin_invites WHERE lower(email) = lower(_email) AND accepted_at IS NULL;
END;
$$;

-- Tira o acesso ao painel. Não remove a conta: a pessoa continua existindo,
-- apenas deixa de ser administradora.
CREATE OR REPLACE FUNCTION public.admin_access_revoke(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores podem remover acessos.';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode remover o seu próprio acesso.';
  END IF;
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
    RAISE EXCEPTION 'É preciso manter pelo menos um administrador.';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_users_list() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_invite_create(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_invite_revoke(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_access_revoke(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_users_list() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_invite_create(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_invite_revoke(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_access_revoke(uuid) TO authenticated;

-- Convite do novo administrador. Ele define a própria senha ao se cadastrar.
INSERT INTO public.admin_invites (email) VALUES ('gilberdefaria@hotmail.com')
ON CONFLICT (email) DO NOTHING;
