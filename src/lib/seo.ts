/**
 * Endereço oficial do site. É a base de tudo que precisa de URL absoluta:
 * canonical, og:url e o mapa do site. Se o domínio mudar, muda só aqui.
 */
export const SITE_URL = "https://thaynanpro.com.br";

export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`.replace(/\/$/, "") || SITE_URL;

/**
 * Canonical e og:url de uma página.
 *
 * O canonical diz ao Google qual é o endereço oficial do conteúdo. Sem ele, o
 * mesmo site respondendo em endereços diferentes (com e sem www, domínio do
 * Lovable e domínio próprio) conta como conteúdo duplicado e divide a
 * relevância entre os endereços.
 */
export function pageUrlHead(path: string) {
  const url = absoluteUrl(path);
  return {
    meta: [{ property: "og:url", content: url }],
    links: [{ rel: "canonical", href: url }],
  };
}
