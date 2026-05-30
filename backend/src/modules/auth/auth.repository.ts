import { query } from "../../db/pool";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: "admin" | "editor" | "viewer";
  created_at: Date;
}

export const userRepo = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const r = await query(
      `SELECT u.id,u.email,u.password_hash,u.full_name,r.name AS role,u.created_at
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email=$1`,
      [email],
    );
    return r.rows[0] ?? null;
  },
  async findById(id: string): Promise<UserRow | null> {
    const r = await query(
      `SELECT u.id,u.email,u.password_hash,u.full_name,r.name AS role,u.created_at
       FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id=$1`,
      [id],
    );
    return r.rows[0] ?? null;
  },
  async create(email: string, hash: string, fullName: string, role: "admin"|"editor"|"viewer") {
    const r = await query(
      `INSERT INTO users (email,password_hash,full_name,role_id)
       SELECT $1,$2,$3,id FROM roles WHERE name=$4
       RETURNING id`,
      [email, hash, fullName, role],
    );
    return r.rows[0].id as string;
  },
  async listAll() {
    const r = await query(
      `SELECT u.id,u.email,u.full_name,r.name AS role,u.created_at
       FROM users u JOIN roles r ON r.id=u.role_id ORDER BY u.created_at DESC`,
    );
    return r.rows;
  },
};

export const refreshRepo = {
  async save(userId: string, tokenHash: string, expiresAt: Date) {
    const r = await query(
      `INSERT INTO refresh_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,$3) RETURNING id`,
      [userId, tokenHash, expiresAt],
    );
    return r.rows[0].id as string;
  },
  async findValid(id: string) {
    const r = await query(`SELECT * FROM refresh_tokens WHERE id=$1`, [id]);
    return r.rows[0] ?? null;
  },
  async revoke(id: string, replacedBy?: string) {
    await query(`UPDATE refresh_tokens SET revoked_at=NOW(), replaced_by=$2 WHERE id=$1`, [id, replacedBy ?? null]);
  },
  async revokeAllForUser(userId: string) {
    await query(`UPDATE refresh_tokens SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`, [userId]);
  },
};
