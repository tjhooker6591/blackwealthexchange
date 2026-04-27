import sanitizeHtml from "sanitize-html";

export function sanitizeRichHtml(input: unknown): string {
  const dirty = typeof input === "string" ? input : "";

  return sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "blockquote",
      "a",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer",
      }),
    },
    disallowedTagsMode: "discard",
  });
}
