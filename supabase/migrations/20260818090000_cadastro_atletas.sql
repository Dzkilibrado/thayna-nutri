-- Cadastro de atletas patrocinados/parceiros. Serve de base para o campo
-- "indicado por" da Central de Clientes (etapa seguinte) — por isso é um
-- cadastro próprio em vez de texto livre: só assim o relatório de indicações
-- consegue contar corretamente quantos clientes cada atleta trouxe, sem
-- variações de grafia quebrando a contagem.
CREATE TABLE public.athletes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  sponsored boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "athletes admin all" ON public.athletes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
-- Sem policy para anon: é dado interno de gestão, nunca exposto no site público.

CREATE TRIGGER athletes_updated BEFORE UPDATE ON public.athletes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX athletes_name_idx ON public.athletes (name);
