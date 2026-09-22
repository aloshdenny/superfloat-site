import { defineConfig, transformWithOxc } from "vite";
import react from "@vitejs/plugin-react";
import { sites } from "@openai/sites-vite-plugin";

const jsxInJs = {
  name: "jsx-in-js",
  enforce: "pre",
  transform(code, id) {
    if (!id.includes("/src/") || !id.endsWith(".js")) return null;
    return transformWithOxc(code, id, { lang: "jsx" });
  },
};

export default defineConfig({
  plugins: [jsxInJs, react(), sites()],
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-router-dom"],
  },
});
