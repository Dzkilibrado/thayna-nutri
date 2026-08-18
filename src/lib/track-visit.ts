import { supabase } from "@/integrations/supabase/client";

const SESSION_FLAG = "visit_logged";
const EXCLUDED_PREFIXES = ["/admin", "/auth"];

/**
 * Registra uma visita, uma vez por aba/sessão do navegador — não a cada
 * página vista, só a primeira. Sem isso, alguém navegando por seis páginas
 * do site contaria como seis visitantes.
 *
 * Não roda dentro de iframe (a prévia do editor do Lovable), para não inflar
 * a contagem toda vez que o site é editado. Não roda em /admin nem /auth,
 * que são uso interno, não tráfego do site.
 */
export function trackVisit() {
  if (typeof window === "undefined") return;
  if (window.top !== window.self) return;

  const path = window.location.pathname;
  if (EXCLUDED_PREFIXES.some((p) => path.startsWith(p))) return;

  try {
    if (window.sessionStorage.getItem(SESSION_FLAG)) return;
    window.sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    // Sem sessionStorage (navegação privada restrita, etc.) — segue sem
    // contar, não vale travar a página por isso.
    return;
  }

  void supabase
    .from("site_visits")
    .insert({ path })
    .then(() => {
      // Falha silenciosa de propósito: contador é conveniência, nunca deve
      // aparecer erro para quem só está visitando o site.
    });
}
