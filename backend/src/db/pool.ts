import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 10 });

export async function query<T = any>(text: string, params: any[] = []) {
  return pool.query<T>(text, params);
}
