export interface CspOptions {
  loadTwitterWidgets?: boolean;
}

export function getCsp({ loadTwitterWidgets = false }: CspOptions = {}): string {
  const scriptSrc = ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"];
  const frameSrc = [
    "'self'",
    "https://*.substack.com",
    "https://substack.com",
    "https://howsystemsscale.substack.com",
  ];

  if (loadTwitterWidgets) {
    scriptSrc.push("https://platform.twitter.com");
    frameSrc.push("https://platform.twitter.com", "https://syndication.twitter.com");
  }

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://howsystemsscale.substack.com"],
    "frame-src": frameSrc,
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": [
      "'self'",
      "https://*.substack.com",
      "https://substack.com",
      "https://howsystemsscale.substack.com",
    ],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}
