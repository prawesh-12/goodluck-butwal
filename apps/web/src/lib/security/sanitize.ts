import sanitizeHtml from "sanitize-html";

// Matches what Tiptap can produce and what the .article styles cover. Anything else is dropped.
const options: sanitizeHtml.IOptions = {
  // h1 is never allowed in a body, the page owns that.
  allowedTags: [
    "p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "a", "blockquote",
    "br", "hr", "table", "thead", "tbody", "tr", "th", "td", "img",
    "figure", "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
    }),
  },
};

export function sanitize(html: string) {
  return sanitizeHtml(html, options);
}
