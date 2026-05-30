import { createApp } from "./app";
import { env } from "./config/env";
import { runMigrations } from "./db/migrate";
import { startDocumentWorker } from "./jobs/documentWorker";
import { logger } from "./utils/logger";

async function main() {
  await runMigrations();
  const app = createApp();
  startDocumentWorker();
  app.listen(env.PORT, () => {
    logger.info(`Backend listening on http://localhost:${env.PORT}`);
    logger.info(`Swagger UI: http://localhost:${env.PORT}/api/docs`);
  });
}

main().catch((err) => {
  logger.error(err, "Fatal startup error");
  process.exit(1);
});
