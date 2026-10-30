// Writes every page as real HTML after `vite build`: the rendered page inside #root (React hydrates
// it), plus its title, description, canonical, Open Graph tags and JSON-LD in <head>. Crawlers and AI
// assistants that never run JavaScript read the site from these files. Also writes 404.html and
// sitemap.xml. Runs from the server bundle that `vite build --ssr src/entry-server.jsx` leaves in dist-ssr/.
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

function pageHtml(url) {
  const meta = pageMeta(url);
  const href = canonical(meta.path);
  const head = [
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
    meta.noindex ? "" : `<script type="application/ld+json">${JSON.stringify(structuredData(url)).replace(/</g, "\\u003c")}</script>`,
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

const today = new Date().toISOString().slice(0, 10);
const urls = ROUTES.map((route) => {
  const { post } = pageMeta(route);
  const lastmod = post?.dateModified ?? post?.datePublished ?? today;
  return `  <url><loc>${canonical(route)}</loc><lastmod>${lastmod}</lastmod></url>`;
});
await writeFile(
  new URL("sitemap.xml", dist),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
);

await rm(ssr, { recursive: true, force: true });
console.log(`prerendered ${ROUTES.length} pages + 404.html and sitemap.xml for ${SITE} into ${fileURLToPath(dist)}`);
