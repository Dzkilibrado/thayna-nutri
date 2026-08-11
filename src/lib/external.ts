/**
 * Opens an external URL safely.
 *
 * External services such as WhatsApp refuse to load inside an iframe. Using
 * the browser-native `_top` target keeps the navigation tied to the user's
 * click and guarantees the service opens outside the embedded preview.
 */
export function openExternal(url: string) {
  if (typeof window === "undefined" || !url) return;

  const opened = window.open(url, "_blank");
  if (opened) {
    opened.opener = null;
    return;
  }

}

export function externalLinkProps(url: string) {
  return {
    href: url,
    target: "_blank" as const,
    rel: "noreferrer noopener",
    onClick: (event: { preventDefault: () => void; stopPropagation: () => void }) => {
      event.preventDefault();
      event.stopPropagation();
      openExternal(url);
    },
  };
}
