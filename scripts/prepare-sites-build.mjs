import { mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const client = join(dist, "client");
const server = join(dist, "server");

await mkdir(client, { recursive: true });

for (const entry of await readdir(dist)) {
  if (entry === ".openai" || entry === "client" || entry === "server") continue;
  await rename(join(dist, entry), join(client, entry));
}

await mkdir(server, { recursive: true });
await writeFile(
  join(server, "index.js"),
  `export default {
  async fetch(request, env) {
    let response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;

    const acceptsHtml = request.headers.get("accept")?.includes("text/html");
    if (!acceptsHtml) return response;

    const fallback = new URL(request.url);
    fallback.pathname = "/index.html";
    return env.ASSETS.fetch(new Request(fallback, request));
  },
};
`,
);
