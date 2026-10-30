// Writes every page as real HTML after `vite build`: the rendered page inside #root (React hydrates
// it), plus its title, description, canonical, Open Graph tags and JSON-LD in <head>. Crawlers and AI
// assistants that never run JavaScript read the site from these files. Also writes 404.html and
// sitemap.xml and llms-full.txt (every page as plain text, for assistants). Runs from the server bundle that `vite build --ssr src/entry-server.jsx` leaves in dist-ssr/.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const dist = new URL("../dist/", import.meta.url);
const ssr = new URL("../dist-ssr/", import.meta.url);
const { render, ROUTES, pageMeta, structuredData, canonical, SITE, OG_IMAGE } = await import(new URL("entry-server.mjs", ssr));

const template = await readFile(new URL("index.html", dist), "utf8");
const attr = (value) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Fail the build rather than ship a page that silently kept the template's tags.
function replaceOnce(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`prerender: ${pattern} not found in dist/index.html`);
  return html.replace(pattern, replacement);
}

// The source files behind each page, for its last-modified date. Research notes carry their own dates.
const SOURCES = {
  "/": ["src/pages/Home.jsx", "src/components"],
  "/about": ["src/pages/About.jsx", "src/content/faq.js"],
  "/blogs": ["src/pages/BlogList.jsx", "src/pages/blogs"],
  "/investors": ["src/pages/Investors.jsx"],
};
const today = new Date().toISOString().slice(0, 10);
const root = fileURLToPath(new URL("../", import.meta.url));
function lastModified(route) {
  const { post } = pageMeta(route);
  if (post) return post.dateModified ?? post.datePublished;
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", ...SOURCES[route]], { cwd: root, encoding: "utf8" }).trim() || today;
  } catch {
    return today; // not a git checkout: the build date is the best we know
  }
}

function pageHtml(url) {
  const meta = pageMeta(url);
  const href = canonical(meta.path);
  const modified = meta.noindex ? null : lastModified(url);
  const head = [
    `<meta name="author" content="Superfloat" />`,
    meta.post ? `<meta property="article:published_time" content="${meta.post.datePublished}" />` : "",
    meta.post ? `<meta property="article:modified_time" content="${modified}" />` : "",
    meta.noindex ? `<meta name="robots" content="noindex" />` : `<link rel="canonical" href="${href}" />`,
    `<meta property="og:type" content="${meta.post ? "article" : "website"}" />`,
    `<meta property="og:site_name" content="Superfloat" />`,
    `<meta property="og:title" content="${attr(meta.title)}" />`,
    `<meta property="og:description" content="${attr(meta.description)}" />`,
    meta.noindex ? "" : `<meta property="og:url" content="${href}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Superfloat: number formats and chips for faster AI" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(meta.title)}" />`,
    `<meta name="twitter:description" content="${attr(meta.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    meta.noindex ? "" : `<script type="application/ld+json">${JSON.stringify(structuredData(url, { dateModified: modified })).replace(/</g, "\\u003c")}</script>`,
  ].filter(Boolean).join("\n    ");

  let html = replaceOnce(template, /<title>[^<]*<\/title>/, `<title>${attr(meta.title)}</title>`);
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${attr(meta.description)}" />`);
  html = replaceOnce(html, /<\/head>/, `    ${head}\n  </head>`);
  return replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${render(url)}</div>`);
}

for (const route of ROUTES) {
  const dir = new URL(route === "/" ? "./" : `.${route}/`, dist);
  await mkdir(dir, { recursive: true });
  await writeFile(new URL("index.html", dir), pageHtml(route));
}
// GitHub Pages serves 404.html for unknown paths; it renders the app's not-found page.
await writeFile(new URL("404.html", dist), pageHtml("/404"));

const urls = ROUTES.map((route) => `  <url><loc>${canonical(route)}</loc><lastmod>${lastModified(route)}</lastmod></url>`);
await writeFile(
  new URL("sitemap.xml", dist),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);

// llms-full.txt: the site's text in reading order, one section per page, after the llms.txt summary.
function toText(html) {
  const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? "";
  return main
    .replace(/<(script|style|svg|canvas|pre)[\s\S]*?<\/\1>/g, (block, tag) => (tag === "pre" ? `\n${block.replace(/<[^>]+>/g, "")}\n` : ""))
    .replace(/<h1[^>]*>/g, "\n# ").replace(/<h2[^>]*>/g, "\n## ").replace(/<h3[^>]*>/g, "\n### ")
    .replace(/<li[^>]*>/g, "\n- ").replace(/<\/(td|th)>/g, " | ").replace(/<tr[^>]*>/g, "\n| ")
    .replace(/<(p|div|section|article|dd|dt|br|aside|figure)[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\n\n(?=\| )/g, "\n").trim();
}
const summary = await readFile(new URL("llms.txt", dist), "utf8");
const sections = ROUTES.map((route) => `\n\n---\n\nSource: ${canonical(route)}\n\n${toText(render(route))}`);
await writeFile(new URL("llms-full.txt", dist), `${summary.trim()}${sections.join("")}\n`);

await rm(ssr, { recursive: true, force: true });
console.log(`prerendered ${ROUTES.length} pages + 404.html, sitemap.xml and llms-full.txt for ${SITE} into ${fileURLToPath(dist)}`);
