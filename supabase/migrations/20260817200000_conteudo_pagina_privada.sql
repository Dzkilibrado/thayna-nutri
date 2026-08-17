-- Conteúdo inicial da página privada, extraído da apresentação em Canva
-- enviada pelo usuário. Tudo aqui é editável depois no painel, em
-- Conteúdo → Página privada — este INSERT só evita começar do zero.
INSERT INTO public.content_blocks (page, kind, title, subtitle, body, sort_order, published)
VALUES
(
  'privado',
  'text',
  'Quem é o Thaynan Nutricionista?',
  NULL,
  '• Nutricionista formado pela Universidade de Vila Velha (UVV)
• Pós-graduado em Emagrecimento e Metabolismo pela UNIGUAÇU
• Pós-graduado em Nutrição Esportiva e Hipertrofia pela UNIGUAÇU

Especializações adicionais:
• Mentorado pelo Coach Manu Martyres
• Preparação de Atletas de fisiculturismo pelo Coach Boás Henrique
• Formação em Recursos Termogênicos pelo Coach Adam Abbas
• Farmacologia de alta performance com Prof. Dr. Gabriel Kaminski',
  1,
  true
),
(
  'privado',
  'text',
  'Como é feita a consulta',
  NULL,
  '• Consulta presencial ou on-line
• Plano alimentar entregue na consulta, elaborado na hora
• Recomendações de suplementação e fórmulas manipuladas, quando necessário
• Avaliação física antropométrica ou por fotografia
• Acesso a um aplicativo exclusivo com plano, avaliações e evolução
• Suporte via WhatsApp
• Análise de exames bioquímicos para segurança e eficiência do processo

Metodologia de resultado:
• Nada de dietas restritivas sem sentido
• Nada de protocolos genéricos
• Tudo é ajustado ao seu metabolismo, rotina e exames',
  2,
  true
),
(
  'privado',
  'text',
  'Etapas da consulta',
  NULL,
  '1. Anamnese
No ato da marcação da consulta é enviado um link contendo um formulário onde você vai descrever seu objetivo, histórico de saúde, preferências alimentares e nível de treinamento. Esse momento é essencial para entender você por completo.

2. Avaliação física
Na consulta presencial é feita avaliação antropométrica; na opção on-line, por fotos — permitindo perceber a evolução a cada retorno.

3. Entrega do plano alimentar
O plano é entregue no ato da consulta, voltado à sua rotina e aos seus objetivos, com recomendações gerais e assistência via WhatsApp em tempo integral para dúvidas e adaptações.',
  3,
  true
),
(
  'privado',
  'text',
  'Consultoria on-line',
  'Sem videochamada. Ideal para quem busca praticidade, economia e acompanhamento profissional à distância.',
  '• Plano alimentar personalizado
• Anamnese imprescindível para conhecer você por completo — não seja sucinto(a), é a única forma de te conhecer
• Entrega do plano em até 2 dias úteis
• Acesso ao aplicativo exclusivo
• Avaliação física por fotos
• Análise de exames
• Acompanhamento via WhatsApp

Para quem é essa consultoria:
• Quem quer melhorar a alimentação sem precisar reservar um horário para consulta
• Quem busca economia e flexibilidade
• Pessoas com rotina corrida
• Quem precisa de orientação mesmo à distância',
  4,
  true
);
