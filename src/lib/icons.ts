import {
  Building2,
  Calculator,
  Calendar,
  Dumbbell,
  FileText,
  HeartPulse,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareQuote,
  Phone,
  Monitor,
  PlayCircle,
  Salad,
  Stethoscope,
  TrendingUp,
  User,
  Link as LinkIcon,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo de ícones do site.
 *
 * Agrupado por finalidade: quem edita procura pelo que o botão FAZ, não pelo
 * desenho. Cada ícone tem um papel distinto — nada de duas opções para a mesma
 * ideia, que só fazia a pessoa hesitar na hora de escolher.
 */
export type IconOption = { id: string; label: string; Icon: LucideIcon };

export const ICON_GROUPS: { group: string; options: IconOption[] }[] = [
  {
    group: "Contato",
    options: [
      { id: "message-circle", label: "WhatsApp", Icon: MessageCircle },
      { id: "phone", label: "Telefone", Icon: Phone },
      { id: "mail", label: "E-mail", Icon: Mail },
      { id: "instagram", label: "Instagram", Icon: Instagram },
      { id: "youtube", label: "YouTube", Icon: Youtube },
    ],
  },
  {
    group: "Atendimento",
    options: [
      { id: "calendar", label: "Agendar", Icon: Calendar },
      { id: "stethoscope", label: "Consulta presencial", Icon: Stethoscope },
      { id: "monitor", label: "Consulta online", Icon: Monitor },
      { id: "map-pin", label: "Como chegar", Icon: MapPin },
      { id: "building", label: "Consultório", Icon: Building2 },
    ],
  },
  {
    group: "Conteúdo",
    options: [
      { id: "user", label: "Sobre mim", Icon: User },
      { id: "play", label: "Vídeos", Icon: PlayCircle },
      { id: "quote", label: "Depoimentos", Icon: MessageSquareQuote },
      { id: "calculator", label: "Calculadoras", Icon: Calculator },
      { id: "file-text", label: "Documento", Icon: FileText },
    ],
  },
  {
    group: "Nutrição e treino",
    options: [
      { id: "salad", label: "Alimentação", Icon: Salad },
      { id: "dumbbell", label: "Treino", Icon: Dumbbell },
      { id: "heart-pulse", label: "Saúde", Icon: HeartPulse },
      { id: "trending-up", label: "Evolução", Icon: TrendingUp },
      { id: "link", label: "Outro link", Icon: LinkIcon },
    ],
  },
];

export const ICON_OPTIONS: IconOption[] = ICON_GROUPS.flatMap((g) => g.options);

/**
 * Identificadores antigos continuam funcionando: itens já cadastrados no painel
 * guardam esses valores, e trocar o catálogo não pode apagar o ícone deles.
 */
const LEGACY: Record<string, string> = {
  star: "quote", // "Depoimento" era uma estrela — lia-se como avaliação
  apple: "salad", // duplicava "Alimentação"
  video: "monitor", // usado em consulta online; o presencial deve trocar para stethoscope
};

export const ICONS: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.id, o.Icon]),
);

export const DEFAULT_ICON = LinkIcon;

export function iconFor(id: string | null | undefined): LucideIcon {
  const key = id ?? "";
  return ICONS[key] ?? ICONS[LEGACY[key] ?? ""] ?? DEFAULT_ICON;
}
