import FAQ from "./content/faq";
import { POSTS } from "./pages/blogs";

// Search metadata for every page, in one place: RoutePosition sets the title and description on
// navigation, and scripts/prerender.mjs writes the same tags and structured data into each page's
// static HTML, which is what crawlers and AI assistants read.
export const SITE = "https://superfloat.si";
export const OG_IMAGE = `${SITE}/og.png`;

const ORG = `${SITE}/#organization`;
const FOUNDER = `${SITE}/#alosh-denny`;
const GITHUB = "https://github.com/aloshdenny";
const REPOS = ["superfloat", "superfloat.python", "superfloat.llvm", "superfloat.cuda", "superfloat.arduino"];

const PAGES = {
  "/": {
    title: "Superfloat · Number formats and chips for faster AI",
    description: "Superfloat designs SF4 to SF16 number formats for AI and Atreides, the accelerator chip that computes in them: multiply-adds without the exponent hardware.",
  },
  "/about": {
    title: "About Superfloat · AI number formats and chips",
    description: "The team, story, mission and funding of Superfloat, the AI hardware company behind the SF number formats, the Atreides chip and the OpenSilicon Project.",
  },
  "/blogs": {
    title: "Research notes · Superfloat",
    description: "Research notes from Superfloat on number formats, multiply-accumulate pipelines, systolic arrays and AI hardware at the edge.",
  },
  "/investors": {
    title: "Investors · Superfloat",
    description: "Invest in Superfloat: the pre-seed and seed rounds, the 2 nm test chip and production tape-out they lead to, and how diligence works.",
  },
};

const NOT_FOUND = { title: "Page not found · Superfloat", description: "This address does not match a Superfloat page.", noindex: true };

// "/about/" and "/about" are the same page; GitHub Pages serves both from about/index.html.
export const normalize = (pathname) => pathname.replace(/(.)\/+$/, "$1");
export const canonical = (path) => `${SITE}${path === "/" ? "/" : `${path}/`}`;

export function pageMeta(pathname) {
  const path = normalize(pathname);
  if (PAGES[path]) return { path, ...PAGES[path] };
  const post = POSTS[path.match(/^\/blogs\/([^/]+)$/)?.[1]];
  if (post) return { path, title: `${post.title} · Superfloat`, description: post.description, post };
  return { path, ...NOT_FOUND };
}

// Every indexable page, for prerendering and the sitemap.
export const ROUTES = [...Object.keys(PAGES), ...Object.keys(POSTS).map((slug) => `/blogs/${slug}`)];

const organization = {
  "@type": "Organization",
  "@id": ORG,
  name: "Superfloat",
  alternateName: ["SuperFloat", "Superfloat AI"],
  url: `${SITE}/`,
  logo: { "@type": "ImageObject", url: `${SITE}/logo512.png`, width: 512, height: 512 },
  image: OG_IMAGE,
  description: "Superfloat is an AI hardware company that designs number formats for AI (SF4 to SF16) and the Atreides accelerator chips that compute in them.",
  slogan: "The infrastructure datatype for ultrafast intelligence at scale",
  foundingDate: "2024",
  founder: { "@id": FOUNDER },
  email: "alosh@superfloat.si",
  knowsAbout: ["Number formats", "Quantization", "AI accelerators", "ASIC design", "Systolic arrays", "Edge AI", "Compilers"],
  sameAs: [`${GITHUB}/superfloat`, "https://docs.superfloat.si/"],
};

const founder = {
  "@type": "Person",
  "@id": FOUNDER,
  name: "Alosh Denny",
  jobTitle: "Founder and CEO",
  worksFor: { "@id": ORG },
  sameAs: ["https://www.linkedin.com/in/aloshdenny/", GITHUB],
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE}/#website`,
  name: "Superfloat",
  url: `${SITE}/`,
  publisher: { "@id": ORG },
  inLanguage: "en",
};

const breadcrumbs = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: canonical(path) })),
});

export function structuredData(pathname) {
  const meta = pageMeta(pathname);
  const url = canonical(meta.path);
  const page = { "@id": `${url}#webpage`, url, name: meta.title, description: meta.description, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": ORG }, inLanguage: "en" };
  const graph = [organization, founder, website];

  if (meta.path === "/") graph.push({ "@type": "WebPage", ...page, primaryImageOfPage: OG_IMAGE });
  else if (meta.path === "/about") {
    graph.push(
      { "@type": "AboutPage", ...page, mainEntity: { "@id": ORG } },
      { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      ...REPOS.map((repo) => ({ "@type": "SoftwareSourceCode", name: repo, codeRepository: `${GITHUB}/${repo}`, author: { "@id": ORG } })),
      breadcrumbs([["Superfloat", "/"], ["About", "/about"]]),
    );
  } else if (meta.path === "/blogs") {
    graph.push({ "@type": "CollectionPage", ...page }, breadcrumbs([["Superfloat", "/"], ["Research notes", "/blogs"]]));
  } else if (meta.post) {
    graph.push(
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: meta.post.title,
        description: meta.description,
        url,
        mainEntityOfPage: url,
        image: OG_IMAGE,
        datePublished: meta.post.datePublished,
        dateModified: meta.post.dateModified ?? meta.post.datePublished,
        author: { "@id": ORG },
        publisher: { "@id": ORG },
        inLanguage: "en",
      },
      breadcrumbs([["Superfloat", "/"], ["Research notes", "/blogs"], [meta.post.title, meta.path]]),
    );
  } else if (!meta.noindex) graph.push({ "@type": "WebPage", ...page });

  return { "@context": "https://schema.org", "@graph": graph };
}
