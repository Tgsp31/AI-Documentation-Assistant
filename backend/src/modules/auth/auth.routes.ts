import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { authRequired } from "../../middleware/auth";
import { wrap } from "../../utils/wrap";
import { authService } from "./auth.service";
import { loginSchema, refreshSchema, registerSchema } from "./auth.validators";
import { userRepo } from "./auth.repository";

const r = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 */
r.post("/register", authLimiter, wrap(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const result = await authService.register(body.email, body.password, body.fullName);
  res.status(201).json(result);
}));

/**
 * @openapi
 * /auth/login:
 *   post: { tags: [Auth], summary: "Login with email & password" }
 */
r.post("/login", authLimiter, wrap(async (req, res) => {
  const body = loginSchema.parse(req.body);
  res.json(await authService.login(body.email, body.password));
}));

/**
 * @openapi
 * /auth/refresh:
 *   post: { tags: [Auth], summary: "Rotate refresh token" }
 */
r.post("/refresh", authLimiter, wrap(async (req, res) => {
  const body = refreshSchema.parse(req.body);
  res.json(await authService.refresh(body.refreshToken));
}));

/**
 * @openapi
 * /auth/logout:
 *   post: { tags: [Auth], summary: "Revoke refresh token" }
 */
r.post("/logout", wrap(async (req, res) => {
  const body = refreshSchema.parse(req.body);
  await authService.logout(body.refreshToken);
  res.status(204).end();
}));

/**
 * @openapi
 * /auth/me:
 *   get: { tags: [Auth], summary: "Current user profile", security: [{ bearerAuth: [] }] }
 */
r.get("/me", authRequired, wrap(async (req, res) => {
  const u = await userRepo.findById(req.user!.id);
  if (!u) return res.status(404).end();
  res.json({ id: u.id, email: u.email, fullName: u.full_name, role: u.role, createdAt: u.created_at });
}));

export default r;
