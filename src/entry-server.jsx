import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import App from "./App";

export { ROUTES, pageMeta, structuredData, canonical, SITE, OG_IMAGE } from "./seo";

// Used only at build time, by scripts/prerender.mjs, to write each page's HTML.
export function render(url) {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>,
  );
}
