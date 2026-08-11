export function externalLinkProps(url: string) {
  return {
    href: url,
    target: "_blank" as const,
    rel: "noreferrer noopener",
  };
}
