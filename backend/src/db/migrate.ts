import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { pool, query } from "./pool";
import { logger } from "../utils/logger";

export async function runMigrations() {
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const dir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    const exists = await query("SELECT 1 FROM schema_migrations WHERE id=$1", [f]);
    if (exists.rowCount) continue;
    const sql = fs.readFileSync(path.join(dir, f), "utf-8");
    logger.info({ migration: f }, "Applying migration");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(id) VALUES ($1)", [f]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
  await seedAdmin();
}

async function seedAdmin() {
  const r = await query("SELECT 1 FROM users WHERE email=$1", ["admin@example.com"]);
  if (r.rowCount) return;
  const role = await query("SELECT id FROM roles WHERE name='admin'");
  const hash = await bcrypt.hash("Admin12345!", 12);
  await query(
    "INSERT INTO users (email,password_hash,full_name,role_id) VALUES ($1,$2,$3,$4)",
    ["admin@example.com", hash, "Default Admin", role.rows[0].id],
  );
  logger.info("Seeded default admin admin@example.com / Admin12345!");
}

if (require.main === module) {
  runMigrations().then(() => process.exit(0)).catch((e) => {
    logger.error(e); process.exit(1);
  });
}
