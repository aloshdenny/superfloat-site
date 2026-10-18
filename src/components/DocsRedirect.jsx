import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DOCS = "https://docs.superfloat.si";

// superfloat.si/docs/<page> moves to docs.superfloat.si/<page>. The bare /docs is a static page in public/docs.
export default function DocsRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = `${DOCS}${pathname.replace(/^\/docs/, "") || "/"}${search}${hash}`;
  useEffect(() => { window.location.replace(target); }, [target]);
  return <section className="max-w-3xl mx-auto px-6 py-20"><p>The docs live at <a href={target}>docs.superfloat.si</a>.</p></section>;
}
