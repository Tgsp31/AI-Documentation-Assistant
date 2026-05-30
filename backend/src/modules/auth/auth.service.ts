import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { query } from "../../db/pool";
import { HttpError } from "../../middleware/error";
import { refreshRepo, userRepo } from "./auth.repository";

type Role = "admin" | "editor" | "viewer";

function signAccess(user: { id: string; email: string; role: Role }) {
  return jwt.sign(user, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as SignOptions);
}
function signRefresh(jti: string, userId: string) {
  return jwt.sign({ sub: userId, jti }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL } as SignOptions);
}
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function refreshExpiry(): Date {
  const m = /^(\d+)([dhm])$/.exec(env.JWT_REFRESH_TTL);
  const now = Date.now();
  if (!m) return new Date(now + 7 * 86400 * 1000);
  const mult = m[2] === "d" ? 86400000 : m[2] === "h" ? 3600000 : 60000;
  return new Date(now + Number(m[1]) * mult);
}

async function setHash(id: string, hash: string) {
  await query("UPDATE refresh_tokens SET token_hash=$2 WHERE id=$1", [id, hash]);
}

async function mintRefresh(userId: string) {
  const expiresAt = refreshExpiry();
  const id = await refreshRepo.save(userId, "pending", expiresAt);
  const token = signRefresh(id, userId);
  await setHash(id, sha(token));
  return { id, token };
}

export const authService = {
  async register(email: string, password: string, fullName: string) {
    if (await userRepo.findByEmail(email)) throw new HttpError(409, "Email already registered");
    const ph = await bcrypt.hash(password, 12);
    const role: Role = (await userRepo.listAll()).length === 0 ? "admin" : "viewer";
    const id = await userRepo.create(email, ph, fullName, role);
    return this.issueTokens({ id, email, role });
  },

  async login(email: string, password: string) {
    const u = await userRepo.findByEmail(email);
    if (!u) throw new HttpError(401, "Invalid credentials");
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) throw new HttpError(401, "Invalid credentials");
    return this.issueTokens({ id: u.id, email: u.email, role: u.role });
  },

  async issueTokens(user: { id: string; email: string; role: Role }) {
    const { token: refreshToken } = await mintRefresh(user.id);
    return { accessToken: signAccess(user), refreshToken, user };
  },

  async refresh(token: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
    } catch {
      throw new HttpError(401, "Invalid refresh token");
    }
    const row = await refreshRepo.findValid(payload.jti);
    if (!row) throw new HttpError(401, "Unknown refresh token");
    if (row.revoked_at) {
      await refreshRepo.revokeAllForUser(payload.sub);
      throw new HttpError(401, "Refresh token reuse detected; please log in again");
    }
    if (row.expires_at < new Date()) throw new HttpError(401, "Refresh token expired");
    if (row.token_hash !== sha(token)) throw new HttpError(401, "Token mismatch");

    const user = await userRepo.findById(payload.sub);
    if (!user) throw new HttpError(401, "User not found");
    const { id: newId, token: newRefresh } = await mintRefresh(user.id);
    await refreshRepo.revoke(payload.jti, newId);
    return {
      accessToken: signAccess({ id: user.id, email: user.email, role: user.role }),
      refreshToken: newRefresh,
      user: { id: user.id, email: user.email, role: user.role },
    };
  },

  async logout(token: string) {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
      await refreshRepo.revoke(payload.jti);
    } catch { /* ignore */ }
  },
};
