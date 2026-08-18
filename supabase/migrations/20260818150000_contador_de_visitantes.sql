-- Contador de visitantes, sem terceiros e sem dado que identifique a pessoa.
-- Cada linha é só uma visita: quando aconteceu e qual página. Nenhum IP,
-- nenhum identificador de usuário, nada rastreável entre visitas.
CREATE TABLE public.site_visits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visited_at timestamptz NOT NULL DEFAULT now(),
  path text
);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode registrar a própria visita — não há nada sensível
-- nessa escrita, e não depende de estar logado.
CREATE POLICY "anyone can log a visit" ON public.site_visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Só o administrador consegue ler os registros — evita que a chave pública
-- do site sirva para um concorrente consultar o volume de tráfego.
CREATE POLICY "visits admin read" ON public.site_visits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX site_visits_visited_at_idx ON public.site_visits (visited_at);
