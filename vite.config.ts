// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  // GitHub Pages serves project sites below the repository name. Keep Lovable
  // previews and other hosts at the root URL.
  vite: {
    base: isGitHubPagesBuild ? "/AI-Placement-Predict1/" : "/",
  },
  // Lovable's default Nitro target is a Cloudflare Worker. Its output cannot
  // be used by TanStack Start's static-prerender step, so Pages uses Start's
  // native static build while all other targets keep the existing Nitro build.
  nitro: isGitHubPagesBuild ? false : true,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // The app has no runtime server data or server functions. Emit static HTML
    // for its public routes so .output/public can be hosted on GitHub Pages.
    prerender: {
      enabled: isGitHubPagesBuild,
      autoStaticPathsDiscovery: true,
      crawlLinks: true,
      // Serial rendering avoids exhausting the short-lived local preview
      // server that TanStack Start uses during the static build.
      concurrency: 1,
      failOnError: true,
    },
  },
});
