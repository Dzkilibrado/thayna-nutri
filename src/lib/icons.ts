import {
  Apple,
  Calendar,
  Dumbbell,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Salad,
  Star,
  User,
  Video,
  Link as LinkIcon,
  Youtube,
  type LucideIcon,
} from "lucide-react";

/**
 * Catálogo único de ícones do site.
 * O `id` é o que fica gravado no banco; o `label` é o que a pessoa vê no painel.
 * Nenhum nome técnico aparece na tela — quem edita escolhe pelo desenho.
 */
export const ICON_OPTIONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "message-circle", label: "Conversa", Icon: MessageCircle },
  { id: "phone", label: "Telefone", Icon: Phone },
  { id: "mail", label: "E-mail", Icon: Mail },
  { id: "map-pin", label: "Endereço", Icon: MapPin },
  { id: "calendar", label: "Agendamento", Icon: Calendar },
  { id: "user", label: "Perfil", Icon: User },
  { id: "instagram", label: "Instagram", Icon: Instagram },
  { id: "youtube", label: "YouTube", Icon: Youtube },
  { id: "video", label: "Vídeo", Icon: Video },
  { id: "play", label: "Assistir", Icon: Play },
  { id: "salad", label: "Alimentação", Icon: Salad },
  { id: "apple", label: "Nutrição", Icon: Apple },
  { id: "dumbbell", label: "Treino", Icon: Dumbbell },
  { id: "star", label: "Depoimento", Icon: Star },
  { id: "link", label: "Outro link", Icon: LinkIcon },
];

export const ICONS: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.id, o.Icon]),
);

export const DEFAULT_ICON = LinkIcon;

export function iconFor(id: string | null | undefined): LucideIcon {
  return ICONS[id ?? ""] ?? DEFAULT_ICON;
}
