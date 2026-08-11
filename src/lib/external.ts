/**
 * Opens an external URL safely.
 *
 * Inside embedded previews (iframes) a plain `target="_blank"` can be turned
 * into an in-frame navigation, and WhatsApp refuses to be framed
 * (ERR_BLOCKED_BY_RESPONSE). Opening a real new tab — with a top-level
 * navigation fallback — avoids that.
 */
export function openExternal(url: string) {
  if (typeof window === "undefined" || !url) return;
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) return;
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    /* cross-origin top: fall through */
  }
  window.location.href = url;
}

export function externalLinkProps(url: string) {
  return {
    href: url,
    target: "_blank" as const,
    rel: "noreferrer noopener",
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.button !== 0) return;
      event.preventDefault();
      openExternal(url);
    },
  };
}
