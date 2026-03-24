import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// lovable-tagger is a dev-only plugin — never import in production builds
const getPlugins = async (mode: string) => {
  const plugins = [react()];
  if (mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger() as any);
    } catch {
      // lovable-tagger not available in this environment — skip silently
    }
  }
  return plugins;
};

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: await getPlugins(mode),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
}));

