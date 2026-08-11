/**
 * Opens an external URL safely.
 *
 * External services such as WhatsApp refuse to load inside an iframe. Using
 * the browser-native `_top` target keeps the navigation tied to the user's
 * click and guarantees the service opens outside the embedded preview.
 */
export function openExternal(url: string) {
  if (typeof window === "undefined" || !url) return;

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) {
    opened.opener = null;
    return;
  }

  try {
    if (window.top) {
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
    onClick: (event: { preventDefault: () => void }) => {
      event.preventDefault();
      openExternal(url);
    },
  };
}
