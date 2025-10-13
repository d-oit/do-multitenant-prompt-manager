import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        kvNamespaces: ["PROMPT_CACHE"],
        d1Databases: ["DB"],
        bindings: {
          API_TOKEN: ""
        },
        wrangler: {
          configPath: "../wrangler.toml"
        }
      }
    }
  }
});
