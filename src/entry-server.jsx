import React from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { StaticRouter } from "react-router-dom";
import App from "./App";

export { ROUTES, pageMeta, structuredData, canonical, SITE, OG_IMAGE } from "./seo";

// Used only at build time, by scripts/prerender.mjs, to write each page's HTML. prerender (unlike
// renderToString) waits for the lazy below-the-fold explainers, so they are written out in full. A
// static page isn't streamed, so no boundary is split off to the end of the document
// (progressiveChunkSize), and every section stays in reading order.
export async function render(url) {
  const { prelude } = await prerenderToNodeStream(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>,
    { progressiveChunkSize: Infinity },
  );
  let html = "";
  for await (const chunk of prelude) html += chunk;
  return html;
}
