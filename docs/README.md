# Developer docs site

The Mintlify site behind docs.superfloat.si. It is a copy of `website/` from
[superfloat.python](https://github.com/aloshdenny/superfloat.python), where
`python tools/build_site.py` generates it from `README.md`, `docs/*.md`, `NOTES.md`
and `examples/`. Edit the Markdown there, rebuild, and copy `website/` here again;
the `.mdx` files are not edited by hand.

Preview locally: `npm i -g mint && cd docs && mint dev` (http://localhost:3000).

Deploy: the Mintlify dashboard is connected to this repo with the docs directory set
to `docs`; every push to `main` redeploys. The custom domain is `docs.superfloat.si`,
and superfloat.si/docs redirects there.
