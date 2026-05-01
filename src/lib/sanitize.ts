/**
 * Minimal server-safe HTML sanitizer for user-generated content (comments).
 *
 * Strict allowlist: only <b>, <i>, <br>, <p> tags are kept (no attributes).
 * Everything else — including <script>, <iframe>, event handlers, and
 * arbitrary attributes — is stripped.
 *
 * This is defense-in-depth for comments. Do NOT use this for rich chapter
 * content; that flows through TipTap + DOMPurify on the client.
 */

const ALLOWED_TAGS = new Set(["b", "i", "br", "p"]);

/**
 * Sanitize a comment string. Returns plain text with only a tiny subset of
 * safe inline formatting tags preserved.
 */
export function sanitizeComment(input: string): string {
  if (typeof input !== "string") return "";

  let output = input;

  // 1. Strip any <script>...</script>, <style>...</style>, <iframe>...</iframe>
  //    blocks including their contents.
  output = output.replace(
    /<(script|style|iframe|object|embed|form|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ""
  );

  // 2. Drop self-closing / orphan versions of the same dangerous tags.
  output = output.replace(
    /<\/?(script|style|iframe|object|embed|form|svg|math)\b[^>]*>/gi,
    ""
  );

  // 3. Walk every remaining tag. Keep only tags in the allowlist, and drop
  //    all attributes on them (so no `onclick=`, `href=javascript:`, etc.).
  output = output.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    const lower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lower)) return "";
    const isClosing = match.startsWith("</");
    if (isClosing) return `</${lower}>`;
    if (lower === "br") return "<br>";
    return `<${lower}>`;
  });

  // 4. Neutralize any stray inline event handlers or javascript: URLs that
  //    might have slipped through via malformed tags.
  output = output.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  output = output.replace(/javascript:/gi, "");

  return output;
}
