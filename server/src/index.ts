import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const app = createApp({ config });

app.listen(config.port, () => {
  console.log(
    JSON.stringify({
      service: "surakshit-api",
      port: config.port,
      aiConfigured: Boolean(config.aiApiKey),
      persistence: config.supabaseUrl && config.supabaseServiceRoleKey ? "supabase" : "memory",
    }),
  );
});
