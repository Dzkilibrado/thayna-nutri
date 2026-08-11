-- roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated can read roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- site settings (singleton)
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  brand_name text NOT NULL DEFAULT 'Thaynan Pablo',
  brand_tagline text NOT NULL DEFAULT 'Nutrição & Performance',
  headline text NOT NULL DEFAULT 'Nutricionista Esportivo',
  bio text NOT NULL DEFAULT '',
  avatar_url text,
  whatsapp text NOT NULL DEFAULT '5527996657309',
  whatsapp_message text NOT NULL DEFAULT 'Olá! Gostaria de agendar uma consulta.',
  email text NOT NULL DEFAULT 'thaynanpro.nutri@gmail.com',
  address text NOT NULL DEFAULT '',
  maps_url text,
  hours text NOT NULL DEFAULT '09:00 - 20:00',
  instagram_url text,
  youtube_url text,
  intro_video_url text,
  color_background text NOT NULL DEFAULT '#0E1216',
  color_surface text NOT NULL DEFAULT '#1A2129',
  color_accent text NOT NULL DEFAULT '#22D3B8',
  color_foreground text NOT NULL DEFAULT '#FFFFFF',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "settings admin update" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "settings admin insert" ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- content blocks
CREATE TABLE public.content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT 'home',
  kind text NOT NULL DEFAULT 'link',
  title text NOT NULL DEFAULT '',
  subtitle text,
  body text,
  url text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_blocks TO authenticated;
GRANT ALL ON public.content_blocks TO service_role;
ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks public read" ON public.content_blocks FOR SELECT USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "blocks admin all" ON public.content_blocks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER content_blocks_updated BEFORE UPDATE ON public.content_blocks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed
INSERT INTO public.site_settings (id, bio, address, maps_url, instagram_url)
VALUES (true,
  'Nutricionista esportivo em Serra/ES. Atendimento presencial na Clínica Overall e acompanhamento integral por aplicativo.',
  'Clínica Overall — Centro Empresarial da Serra, sala 718. Parque Residencial Laranjeiras, Serra/ES, CEP 29.165-612. Em frente ao Shopping Laranjeiras.',
  'https://www.google.com/maps/search/?api=1&query=Centro+Empresarial+da+Serra+Laranjeiras+Serra+ES',
  'https://instagram.com/');

INSERT INTO public.content_blocks (page, kind, title, subtitle, body, url, icon, sort_order) VALUES
('home','link','Agendar consulta','Fale direto no WhatsApp',NULL,'whatsapp','message-circle',1),
('home','link','Consulta presencial','Clínica Overall — Serra/ES',NULL,'/presencial','map-pin',2),
('home','link','Consulta online','Em breve — detalhes',NULL,'/online','video',3),
('home','link','Sobre mim','Minha história e formação',NULL,'/sobre','user',4),
('home','link','Instagram','@thaynan.nutri',NULL,'https://instagram.com/','instagram',5),
('sobre','text','Quem sou eu',NULL,'Sou nutricionista esportivo e atendo pacientes que buscam performance, composição corporal e saúde a longo prazo. Meu trabalho une avaliação criteriosa, protocolo individualizado e acompanhamento próximo.',NULL,NULL,1),
('presencial','text','Atendimento presencial','Clínica Overall — Serra/ES','Atendemos presencialmente na Clínica Overall, localizada no Centro Empresarial da Serra, sala 718. Parque Residencial Laranjeiras. Serra/ES.',NULL,NULL,1),
('presencial','text','O que está incluso',NULL,'• Avaliação física antropométrica;
• Protocolo nutricional individualizado para sua rotina e objetivo no ato da consulta;
• Análise de exames bioquímicos;
• Acompanhamento integral por meio de aplicativo liberado para o paciente, onde você poderá enviar feedbacks com fotos das refeições e tirar dúvidas no chat com o nutricionista.',NULL,NULL,2),
('online','text','Consulta online','Em breve','Os detalhes da consulta online serão publicados em breve. Fale no WhatsApp para saber mais.',NULL,NULL,1);